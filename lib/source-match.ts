export function normalizeSourceText(value = "") {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Plain page text can contain literal percent signs. */ }
  const chineseVariants: Record<string, string> = {
    "\u81fa": "\u53f0", "\u7063": "\u6e7e", "\u5712": "\u56ed", "\u9e97": "\u4e3d", "\u5bf6": "\u5b9d", "\u83ef": "\u534e", "\u9f8d": "\u9f99",
    "\u5ee3": "\u5e7f", "\u6a02": "\u4e50", "\u99ac": "\u9a6c", "\u9580": "\u95e8", "\u6771": "\u4e1c", "\u8208": "\u5174", "\u8588": "\u835f",
    "\u74cf": "\u73d1", "\u532f": "\u6c47", "\u6ed9": "\u6c47", "\u90a8": "\u6751", "\u5cf0": "\u5cf0", "\u865f": "\u53f7", "\u6a13": "\u697c",
    "\u9ad4": "\u4f53", "\u6ff1": "\u6ee8", "\u58f9": "\u4e00", "\u8c9d": "\u8d1d", "\u85cd": "\u84dd", "\u6607": "\u5347", "\u79a6": "\u79a6",
  };
  return [...decoded.toLocaleLowerCase()].map((character) => chineseVariants[character] ?? character).join("")
    .replace(/\band\b/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function estateNameFromSourceUrl(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const estateIndex = parts.findIndex((part) => part.toLocaleLowerCase() === "estate");
    if (estateIndex < 0) return "";
    const first = parts[estateIndex + 1] ?? "";
    const languageSegment = /^(en|zh|zh-hk|zh-cn|en-us)$/i.test(first);
    return decodeURIComponent(parts[estateIndex + (languageSegment ? 2 : 1)] ?? "").replace(/[-+]/g, " ");
  } catch {
    return "";
  }
}

export function estateMatchScore(query: string, name: string) {
  const q = normalizeSourceText(query);
  const n = normalizeSourceText(name);
  if (!q || !n) return 0;
  if (q === n) return 1;
  const hasChinese = /[\u3400-\u9fff]/u.test(q);
  if (hasChinese) {
    const compactQuery = q.replace(/\s/g, "");
    const compactName = n.replace(/\s/g, "");
    if (compactQuery === compactName) return 1;
    if (compactName.startsWith(compactQuery) || compactQuery.startsWith(compactName)) return .84;
    if (compactQuery.length < 3 || compactName.length < 3) return 0;
    const queryCharacters = [...compactQuery];
    const nameCharacters = [...compactName];
    const queryPairs = new Set(queryCharacters.slice(0, -1).map((character, index) => character + queryCharacters[index + 1]));
    const namePairs = new Set(nameCharacters.slice(0, -1).map((character, index) => character + nameCharacters[index + 1]));
    const overlap = [...queryPairs].filter((pair) => namePairs.has(pair)).length;
    const similarity = (2 * overlap) / Math.max(1, queryPairs.size + namePairs.size);
    return similarity >= .66 ? similarity * .78 : 0;
  }
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
