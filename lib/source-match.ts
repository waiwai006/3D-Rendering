export function normalizeSourceText(value = "") {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Plain page text can contain literal percent signs. */ }
  return decoded.toLocaleLowerCase().replace(/\band\b/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function estateNameFromSourceUrl(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[2] ?? "").replace(/-/g, " ");
  } catch {
    return "";
  }
}

export function estateMatchScore(query: string, name: string) {
  const q = normalizeSourceText(query);
  const n = normalizeSourceText(name);
  if (!q || !n) return 0;
  if (q === n) return 1;
  if (n.includes(q) || q.includes(n)) return .88;
  const queryTokens = new Set(q.split(" ").filter((token) => token.length > 1));
  const nameTokens = new Set(n.split(" ").filter((token) => token.length > 1));
  const overlap = [...queryTokens].filter((token) => nameTokens.has(token)).length;
  return overlap / Math.max(queryTokens.size, nameTokens.size, 1);
}

export function extractCentalineFloorPlanImages(html: string) {
  const found = new Set<string>();
  for (const match of html.matchAll(/thumbnail\s*:\s*"(https:[^"]*floorplan[^"]+)"/gi)) {
    const image = match[1].replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/\\\\/g, "/");
    if (/^https:\/\//i.test(image)) found.add(image);
  }
  return [...found];
}
