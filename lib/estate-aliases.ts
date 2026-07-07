import { normalizeSourceText } from "./source-match";

type EstateAlias = { canonical: string; aliases: string[] };

const ESTATE_ALIASES: EstateAlias[] = [
  { canonical: "Taikoo Shing", aliases: ["\u592a\u53e4\u57ce", "\u592a\u53e4\u57ce taikoo shing"] },
  { canonical: "Mei Foo Sun Chuen", aliases: ["\u7f8e\u5b5a\u65b0\u90a8", "\u7f8e\u5b5a\u65b0\u6751", "\u7f8e\u5b5a"] },
  { canonical: "Whampoa Garden", aliases: ["\u9ec3\u57d4\u82b1\u5712", "\u9ec4\u57d4\u82b1\u56ed", "\u9ec3\u57d4"] },
  { canonical: "Kornhill", aliases: ["\u5eb7\u6021\u82b1\u5712", "\u5eb7\u6021\u82b1\u56ed"] },
  { canonical: "South Horizons", aliases: ["\u6d77\u6021\u534a\u5cf6", "\u6d77\u6021\u534a\u5c9b"] },
  { canonical: "City One Shatin", aliases: ["\u6c99\u7530\u7b2c\u4e00\u57ce", "\u7b2c\u4e00\u57ce"] },
  { canonical: "Kingswood Villas", aliases: ["\u5609\u6e56\u5c71\u838a", "\u5609\u6e56\u5c71\u5e84"] },
  { canonical: "Laguna City", aliases: ["\u9e97\u6e2f\u57ce", "\u4e3d\u6e2f\u57ce"] },
  { canonical: "LOHAS Park", aliases: ["\u65e5\u51fa\u5eb7\u57ce", "\u5eb7\u57ce"] },
  { canonical: "The Belcher's", aliases: ["\u5bf6\u7fe0\u5712", "\u5b9d\u7fe0\u56ed"] },
  { canonical: "The Victoria Towers", aliases: ["\u6e2f\u666f\u5cef", "\u6e2f\u666f\u5cf0"] },
  { canonical: "Sorrento", aliases: ["\u64ce\u5929\u534a\u5cf6", "\u64ce\u5929\u534a\u5c9b"] },
  { canonical: "Park Avenue", aliases: ["\u67cf\u666f\u7063", "\u67cf\u666f\u6e7e"] },
  { canonical: "Island Harbourview", aliases: ["\u7dad\u6e2f\u7063", "\u7ef4\u6e2f\u6e7e"] },
  { canonical: "Caribbean Coast", aliases: ["\u6620\u7063\u5712", "\u6620\u6e7e\u56ed"] },
  { canonical: "Tung Chung Crescent", aliases: ["\u6771\u5824\u7063\u7554", "\u4e1c\u5824\u6e7e\u7554"] },
  { canonical: "Discovery Park", aliases: ["\u6109\u666f\u65b0\u57ce"] },
  { canonical: "Metro City", aliases: ["\u65b0\u90fd\u57ce"] },
  { canonical: "Residence Oasis", aliases: ["\u851a\u85cd\u7063\u7554", "\u851a\u84dd\u6e7e\u7554"] },
  { canonical: "Festival City", aliases: ["\u540d\u57ce"] },
  { canonical: "The Wings", aliases: ["\u5929\u6649", "\u5929\u664b"] },
  { canonical: "Yoho Town", aliases: ["\u65b0\u6642\u4ee3\u5ee3\u5834", "\u65b0\u6642\u4ee3\u5e7f\u573a", "yoho"] },
  { canonical: "Grand Yoho", aliases: ["Grand YOHO", "\u6717\u5c4f8\u865f", "\u6717\u5c4f8\u53f7"] },
  { canonical: "Grand Promenade", aliases: ["\u5609\u4ea8\u7063", "\u5609\u4ea8\u6e7e"] },
  { canonical: "Les Saisons", aliases: ["\u9038\u6fe4\u7063", "\u9038\u6d9b\u6e7e"] },
  { canonical: "The Harbourside", aliases: ["\u541b\u81e8\u5929\u4e0b", "\u541b\u4e34\u5929\u4e0b"] },
  { canonical: "The Arch", aliases: ["\u51f1\u65cb\u9580", "\u51ef\u65cb\u95e8"] },
  { canonical: "Royal Peninsula", aliases: ["\u534a\u5cf6\u8c6a\u5ead", "\u534a\u5c9b\u8c6a\u5ead"] },
  { canonical: "Villa Esplanada", aliases: ["\u705d\u666f\u7063", "\u704f\u666f\u6e7e"] },
  { canonical: "Aegean Coast", aliases: ["\u611b\u7434\u6d77\u5cb8", "\u7231\u7434\u6d77\u5cb8"] },
  { canonical: "Park Island", aliases: ["\u73c0\u9e97\u7063", "\u73c0\u4e3d\u6e7e"] },
  { canonical: "The Merton", aliases: ["\u6cd3\u90fd"] },
  { canonical: "Beverly Hill", aliases: ["\u6bd4\u83ef\u5229\u5c71", "\u6bd4\u534e\u5229\u5c71"] },
  { canonical: "Heng Fa Chuen", aliases: ["\u674f\u82b1\u90a8", "\u674f\u82b1\u6751"] },
  { canonical: "Tai Koo Shing", aliases: ["\u592a\u53e4\u57ce"] },
];

export function expandEstateQueries(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const normalized = normalizeSourceText(trimmed).replace(/\s/g, "");
  const matches = ESTATE_ALIASES.filter((entry) => [entry.canonical, ...entry.aliases].some((name) => normalizeSourceText(name).replace(/\s/g, "") === normalized));
  return [...new Set([trimmed, ...matches.flatMap((entry) => [entry.canonical, ...entry.aliases])])];
}
