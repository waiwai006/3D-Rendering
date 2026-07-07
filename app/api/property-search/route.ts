import { NextResponse } from "next/server";
import { expandEstateQueries } from "@/lib/estate-aliases";
import type { FloorPlanCandidate, PropertySearchRequest, PropertySearchResponse } from "@/lib/property-search";
import { estateMatchScore, estateNameFromSourceUrl, extractCentalineFloorPlanImages, normalizeSourceText } from "@/lib/source-match";
import type { SourceCoverage } from "@/lib/property-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CENTALINE_SITEMAPS = {
  en: "https://hk.centanet.com/sitemap-index/estate/sitemap_estate_en_us.xml",
  zh: "https://hk.centanet.com/sitemap-index/estate/sitemap_estate_zh_hk.xml",
  cn: "https://hk.centanet.com/sitemap-index/estate/sitemap_estate_zh_cn.xml",
};

const sitemapCache = new Map<"en" | "zh" | "cn", { expires: number; urls: string[] }>();

const SOURCE_COVERAGE: SourceCoverage[] = [
  { name: "Centaline", url: "https://hk.centanet.com/findproperty/en/list/buy", status: "searched", note: "Automatic estate-name matching and floor-plan image extraction." },
  { name: "SRPE", url: "https://www.srpe.gov.hk/opip/", status: "manual", note: "Highest-authority first-hand brochures; interactive terms/search currently require user review." },
  { name: "Squarefoot", url: "https://www.squarefoot.com.hk/", status: "limited", note: "Estate floor-plan galleries found; public discovery uses opaque estate IDs." },
  { name: "28Hse", url: "https://www.28hse.com/", status: "limited", note: "Floor plans found in listings; sitemap exposes property IDs rather than estate names." },
  { name: "Spacious", url: "https://www.spacious.hk/en/hong-kong/for-sale", status: "limited", note: "Has a floor-plan filter and brochure PDFs; no stable public name resolver verified." },
  { name: "Midland", url: "https://www.midland.com.hk/", status: "limited", note: "Estate pages and brochure PDFs found; automated requests may be blocked by its CDN." },
  { name: "Hong Kong Property", url: "https://www.hkp.com.hk/en/map/buy", status: "limited", note: "Precise listing metadata found; reusable floor-plan image index not verified." },
  { name: "Property.hk", url: "https://www.property.hk/", status: "manual", note: "No stable public floor-plan index identified." },
  { name: "Habitat Property", url: "https://www.habitat-property.com/", status: "manual", note: "Listing photography available; no estate floor-plan index identified." },
  { name: "Hong Kong Homes", url: "https://hongkonghomes.com/", status: "manual", note: "No stable public floor-plan index identified." },
  { name: "Hong Kong Housing Authority", url: "https://www.housingauthority.gov.hk/en/global-elements/estate-locator/standard-block-typical-floor-plans/", status: "limited", note: "Official typical block and estate floor plans for public housing; block type and unit must be confirmed." },
  { name: "Ricacorp", url: "https://www.ricacorp.com/en-hk/", status: "limited", note: "Estate and transaction pages expose floor-plan tabs; a stable public estate resolver is not yet available." },
  { name: "House730", url: "https://www.house730.com/en-us/buy/t1/", status: "limited", note: "Searchable listings may include floor plans and VR plans; availability varies by listing." },
  { name: "OKAY.com", url: "https://www.okay.com/", status: "limited", note: "Building pages and sales brochures provide additional coverage, especially for luxury properties." },
];

async function getEstateUrls(language: "en" | "zh" | "cn") {
  const cached = sitemapCache.get(language);
  if (cached && cached.expires > Date.now()) return cached.urls;
  const response = await fetch(CENTALINE_SITEMAPS[language], {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HKPropertyDesign/0.2; property planning)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Centaline estate index returned ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(https:\/\/hk\.centanet\.com\/estate\/[^<]+)<\/loc>/gi)].map((match) => match[1].replace(/&amp;/g, "&"));
  sitemapCache.set(language, { urls, expires: Date.now() + 60 * 60 * 1000 });
  return urls;
}

async function candidatesFromEstatePage(url: string, estateName: string, request: PropertySearchRequest, baseScore: number) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HKPropertyDesign/0.2; property planning)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return [];
  const html = await response.text();
  const pageText = normalizeSourceText(html.replace(/<[^>]+>/g, " "));
  const detailFields: Array<[string, string | undefined]> = [["tower", request.tower], ["block", request.block], ["floor", request.floor], ["flat", request.flat]];
  const matchedFields = ["estate", ...detailFields.filter(([, value]) => value && pageText.includes(normalizeSourceText(value))).map(([key]) => key)];
  const detailBonus = Math.min(.1, (matchedFields.length - 1) * .025);
  const confidence = Math.min(.86, .58 + baseScore * .18 + detailBonus);
  return extractCentalineFloorPlanImages(html).slice(0, 8).map((imageUrl, index): FloorPlanCandidate => ({
    id: `centaline-${Buffer.from(`${url}-${index}`).toString("base64url").slice(0, 18)}`,
    estateName,
    title: `${estateName} floor-plan candidate ${index + 1}`,
    source: "Centaline",
    sourceType: "secondary",
    sourceUrl: url,
    imageUrl,
    confidence: Number(confidence.toFixed(2)),
    matchedFields,
    requiresVisualConfirmation: true,
  }));
}

export async function POST(request: Request) {
  const warnings: string[] = [];
  try {
    const body = await request.json() as PropertySearchRequest;
    if (!body.estate?.trim() && !body.address?.trim()) return NextResponse.json({ error: "Estate or address is required." }, { status: 400 });
    if (!body.estate?.trim()) return NextResponse.json({ candidates: [], searchedSources: ["Centaline"], warnings: ["Automatic matching currently requires an estate/development name. Add one, or upload/draw the plan."], sourceCoverage: SOURCE_COVERAGE } satisfies PropertySearchResponse);

    const estateQueries = expandEstateQueries(body.estate);
    const chineseQuery = estateQueries.some((query) => /[\u3400-\u9fff]/.test(query));
    const languages: Array<"en" | "zh" | "cn"> = chineseQuery ? ["zh", "cn", "en"] : ["en", "zh", "cn"];
    const urls = [...new Set((await Promise.all(languages.map(getEstateUrls))).flat())];
    const ranked = urls.map((url) => {
      const name = estateNameFromSourceUrl(url);
      const score = Math.max(...estateQueries.map((query) => estateMatchScore(query, name)));
      return { url, name, score };
    })
      .filter((item) => item.score >= (chineseQuery ? .72 : .55))
      .sort((a, b) => b.score - a.score || Number(b.url.includes("/3-")) - Number(a.url.includes("/3-")));

    // An exact Chinese estate match is substantially safer than similarly named phases or districts.
    const exactMatches = ranked.filter((item) => item.score === 1);
    const rankedPool = exactMatches.length ? exactMatches : ranked;

    const unique: typeof ranked = [];
    for (const item of rankedPool) {
      if (!unique.some((entry) => normalizeSourceText(entry.name) === normalizeSourceText(item.name))) unique.push(item);
      if (unique.length === 3) break;
    }
    const batches = await Promise.all(unique.map((item) => candidatesFromEstatePage(item.url, item.name, body, item.score).catch((error) => {
      warnings.push(`${item.name}: ${error instanceof Error ? error.message : "candidate extraction failed"}`);
      return [];
    })));
    const candidates = batches.flat().sort((a, b) => b.confidence - a.confidence).slice(0, 12);
    if (!candidates.length) warnings.push("No plan image was found in the accessible Centaline estate pages. Try another spelling, then upload or draw the plan.");
    warnings.push("Agency plans are secondary references. Confirm the tower, flat, orientation and dimensions visually before use.");
    return NextResponse.json({ candidates, searchedSources: ["Centaline public estate index"], warnings, sourceCoverage: SOURCE_COVERAGE } satisfies PropertySearchResponse);
  } catch (error) {
    return NextResponse.json({ candidates: [], searchedSources: ["Centaline public estate index"], warnings: [`Search source unavailable: ${error instanceof Error ? error.message : "unknown error"}`], sourceCoverage: SOURCE_COVERAGE } satisfies PropertySearchResponse, { status: 200 });
  }
}
