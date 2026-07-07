export function normalizeSourceText(value = "") {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Plain page text can contain literal percent signs. */ }
  const chineseVariants: Record<string, string> = {
    "臺": "台", "灣": "湾", "園": "园", "麗": "丽", "寶": "宝", "華": "华", "龍": "龙",
    "廣": "广", "樂": "乐", "馬": "马", "門": "门", "東": "东", "興": "兴", "薈": "荟",
    "瓏": "珑", "匯": "汇", "滙": "汇", "邨": "村", "峯": "峰", "號": "号", "樓": "楼",
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
    const queryPairs = new Set([...compactQuery].slice(0, -1).map((character, index) => character + [...compactQuery][index + 1]));
    const namePairs = new Set([...compactName].slice(0, -1).map((character, index) => character + [...compactName][index + 1]));
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
