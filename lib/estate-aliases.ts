import { normalizeSourceText } from "./source-match";

type EstateAlias = { canonical: string; aliases: string[] };

const ESTATE_ALIASES: EstateAlias[] = [
  { canonical: "Taikoo Shing", aliases: ["太古城", "太古城 taikoo shing"] },
  { canonical: "Mei Foo Sun Chuen", aliases: ["美孚新邨", "美孚新村", "美孚"] },
  { canonical: "Whampoa Garden", aliases: ["黃埔花園", "黄埔花园", "黃埔"] },
  { canonical: "Kornhill", aliases: ["康怡花園", "康怡花园"] },
  { canonical: "South Horizons", aliases: ["海怡半島", "海怡半岛"] },
  { canonical: "City One Shatin", aliases: ["沙田第一城", "第一城"] },
  { canonical: "Kingswood Villas", aliases: ["嘉湖山莊", "嘉湖山庄"] },
  { canonical: "Laguna City", aliases: ["麗港城", "丽港城"] },
  { canonical: "LOHAS Park", aliases: ["日出康城", "康城"] },
  { canonical: "The Belcher's", aliases: ["寶翠園", "宝翠园"] },
  { canonical: "The Victoria Towers", aliases: ["港景峯", "港景峰"] },
  { canonical: "Sorrento", aliases: ["擎天半島", "擎天半岛"] },
  { canonical: "Park Avenue", aliases: ["柏景灣", "柏景湾"] },
  { canonical: "Island Harbourview", aliases: ["維港灣", "维港湾"] },
  { canonical: "Caribbean Coast", aliases: ["映灣園", "映湾园"] },
  { canonical: "Tung Chung Crescent", aliases: ["東堤灣畔", "东堤湾畔"] },
  { canonical: "Discovery Park", aliases: ["愉景新城"] },
  { canonical: "Metro City", aliases: ["新都城"] },
  { canonical: "Residence Oasis", aliases: ["蔚藍灣畔", "蔚蓝湾畔"] },
  { canonical: "Festival City", aliases: ["名城"] },
  { canonical: "The Wings", aliases: ["天晉", "天晋"] },
  { canonical: "Yoho Town", aliases: ["新時代廣場", "新時代广场", "yoho"] },
  { canonical: "Grand Yoho", aliases: ["Grand YOHO", "朗屏8號", "朗屏8号"] },
  { canonical: "Grand Promenade", aliases: ["嘉亨灣", "嘉亨湾"] },
  { canonical: "Les Saisons", aliases: ["逸濤灣", "逸涛湾"] },
  { canonical: "The Harbourside", aliases: ["君臨天下", "君临天下"] },
  { canonical: "The Arch", aliases: ["凱旋門", "凯旋门"] },
  { canonical: "Royal Peninsula", aliases: ["半島豪庭", "半岛豪庭"] },
  { canonical: "Villa Esplanada", aliases: ["灝景灣", "灏景湾"] },
  { canonical: "Aegean Coast", aliases: ["愛琴海岸", "爱琴海岸"] },
  { canonical: "Park Island", aliases: ["珀麗灣", "珀丽湾"] },
  { canonical: "The Merton", aliases: ["泓都"] },
  { canonical: "Beverly Hill", aliases: ["比華利山", "比华利山"] },
  { canonical: "Heng Fa Chuen", aliases: ["杏花邨", "杏花村"] },
  { canonical: "Tai Koo Shing", aliases: ["太古城"] },
];

export function expandEstateQueries(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const normalized = normalizeSourceText(trimmed).replace(/\s/g, "");
  const matches = ESTATE_ALIASES.filter((entry) => [entry.canonical, ...entry.aliases].some((name) => normalizeSourceText(name).replace(/\s/g, "") === normalized));
  return [...new Set([trimmed, ...matches.flatMap((entry) => [entry.canonical, ...entry.aliases])])];
}
