"use client";

import { useEffect } from "react";

export type Language = "en" | "zh-Hant" | "zh-Hans";

type PhraseSet = { en: string; "zh-Hant": string; "zh-Hans": string };

const phrases: PhraseSet[] = [
  { en: "HK Property Design", "zh-Hant": "\u9999\u6e2f\u7269\u696d\u8a2d\u8a08", "zh-Hans": "\u9999\u6e2f\u7269\u4e1a\u8bbe\u8ba1" },
  { en: "Find or create", "zh-Hant": "\u641c\u5c0b\u6216\u5efa\u7acb", "zh-Hans": "\u67e5\u627e\u6216\u521b\u5efa" },
  { en: "Review layout", "zh-Hant": "\u6aa2\u8996\u5e73\u9762\u5716", "zh-Hans": "\u68c0\u67e5\u5e73\u9762\u56fe" },
  { en: "Explore in 3D", "zh-Hant": "\u700f\u89bd 3D", "zh-Hans": "\u6d4f\u89c8 3D" },
  { en: "Sign in", "zh-Hant": "\u767b\u5165", "zh-Hans": "\u767b\u5f55" },
  { en: "Save floor plan", "zh-Hant": "\u5132\u5b58\u5e73\u9762\u5716", "zh-Hans": "\u4fdd\u5b58\u5e73\u9762\u56fe" },
  { en: "Save to cloud", "zh-Hant": "\u5132\u5b58\u81f3\u96f2\u7aef", "zh-Hans": "\u4fdd\u5b58\u5230\u4e91\u7aef" },
  { en: "Save as new", "zh-Hant": "\u53e6\u5b58\u65b0\u5e73\u9762\u5716", "zh-Hans": "\u53e6\u5b58\u65b0\u5e73\u9762\u56fe" },
  { en: "Load saved plan...", "zh-Hant": "\u8f09\u5165\u5df2\u5132\u5b58\u5e73\u9762\u5716...", "zh-Hans": "\u52a0\u8f7d\u5df2\u4fdd\u5b58\u5e73\u9762\u56fe..." },
  { en: "Load", "zh-Hant": "\u8f09\u5165", "zh-Hans": "\u52a0\u8f7d" },
  { en: "Del", "zh-Hant": "\u522a\u9664", "zh-Hans": "\u5220\u9664" },
  { en: "Back", "zh-Hant": "\u8fd4\u56de", "zh-Hans": "\u8fd4\u56de" },
  { en: "Dismiss", "zh-Hant": "\u95dc\u9589", "zh-Hans": "\u5173\u95ed" },
  { en: "How would you like to create your floor plan?", "zh-Hant": "\u4f60\u60f3\u5982\u4f55\u5efa\u7acb\u5e73\u9762\u5716\uff1f", "zh-Hans": "\u4f60\u60f3\u5982\u4f55\u521b\u5efa\u5e73\u9762\u56fe\uff1f" },
  { en: "Use an address to look for a public plan, upload a plan you already have, or draw the flat manually.", "zh-Hant": "\u4f7f\u7528\u5730\u5740\u641c\u5c0b\u516c\u958b\u5e73\u9762\u5716\u3001\u4e0a\u50b3\u5df2\u6709\u5e73\u9762\u5716\uff0c\u6216\u624b\u52d5\u756b\u51fa\u55ae\u4f4d\u3002", "zh-Hans": "\u4f7f\u7528\u5730\u5740\u641c\u7d22\u516c\u5f00\u5e73\u9762\u56fe\u3001\u4e0a\u4f20\u5df2\u6709\u5e73\u9762\u56fe\uff0c\u6216\u624b\u52a8\u753b\u51fa\u5355\u4f4d\u3002" },
  { en: "Property details", "zh-Hant": "\u7269\u696d\u8cc7\u6599", "zh-Hans": "\u7269\u4e1a\u8d44\u6599" },
  { en: "Search public sources", "zh-Hant": "\u641c\u5c0b\u516c\u958b\u4f86\u6e90", "zh-Hans": "\u641c\u7d22\u516c\u5f00\u6765\u6e90" },
  { en: "Upload floor plan", "zh-Hant": "\u4e0a\u50b3\u5e73\u9762\u5716", "zh-Hans": "\u4e0a\u4f20\u5e73\u9762\u56fe" },
  { en: "Image or PDF", "zh-Hant": "\u5716\u7247\u6216 PDF", "zh-Hans": "\u56fe\u7247\u6216 PDF" },
  { en: "Draw manually", "zh-Hant": "\u624b\u52d5\u7e6a\u88fd", "zh-Hans": "\u624b\u52a8\u7ed8\u5236" },
  { en: "No plan available", "zh-Hant": "\u6c92\u6709\u5e73\u9762\u5716", "zh-Hans": "\u6ca1\u6709\u5e73\u9762\u56fe" },
  { en: "Locate the exact property", "zh-Hant": "\u6e96\u78ba\u5b9a\u4f4d\u7269\u696d", "zh-Hans": "\u51c6\u786e\u5b9a\u4f4d\u7269\u4e1a" },
  { en: "Estate or address is required for lookup. Tower, block, floor and flat are optional but improve matching.", "zh-Hant": "\u641c\u5c0b\u9700\u8981\u5c4b\u82d1\u6216\u5730\u5740\uff1b\u5ea7\u6578\u3001\u6a13\u5c64\u53ca\u55ae\u4f4d\u53ef\u9078\u586b\uff0c\u4f46\u6709\u52a9\u63d0\u9ad8\u914d\u5c0d\u3002", "zh-Hans": "\u641c\u7d22\u9700\u8981\u5c0f\u533a\u6216\u5730\u5740\uff1b\u697c\u680b\u3001\u697c\u5c42\u53ca\u5355\u5143\u53ef\u9009\u586b\uff0c\u4f46\u6709\u52a9\u63d0\u9ad8\u5339\u914d\u3002" },
  { en: "Estate / development", "zh-Hant": "\u5c4b\u82d1\uff0f\u767c\u5c55\u9805\u76ee", "zh-Hans": "\u5c0f\u533a\uff0f\u53d1\u5c55\u9879\u76ee" },
  { en: "Address", "zh-Hant": "\u5730\u5740", "zh-Hans": "\u5730\u5740" },
  { en: "Tower", "zh-Hant": "\u5ea7\u6578", "zh-Hans": "\u680b\u5ea7" },
  { en: "Block", "zh-Hant": "\u5927\u5ec8\uff0f\u5ea7", "zh-Hans": "\u697c\u680b" },
  { en: "Floor", "zh-Hant": "\u6a13\u5c64", "zh-Hans": "\u697c\u5c42" },
  { en: "Flat / unit", "zh-Hant": "\u55ae\u4f4d", "zh-Hans": "\u5355\u5143" },
  { en: "Traditional Chinese examples", "zh-Hant": "\u7e41\u9ad4\u4e2d\u6587\u641c\u5c0b\u4f8b\u5b50", "zh-Hans": "\u7e41\u4f53\u4e2d\u6587\u641c\u7d22\u793a\u4f8b" },
  { en: "Search and match floor plans", "zh-Hant": "\u641c\u5c0b\u53ca\u914d\u5c0d\u5e73\u9762\u5716", "zh-Hans": "\u641c\u7d22\u53ca\u5339\u914d\u5e73\u9762\u56fe" },
  { en: "Searching public sources...", "zh-Hant": "\u6b63\u5728\u641c\u5c0b\u516c\u958b\u4f86\u6e90...", "zh-Hans": "\u6b63\u5728\u641c\u7d22\u516c\u5f00\u6765\u6e90..." },
  { en: "Automatic source matching", "zh-Hant": "\u81ea\u52d5\u4f86\u6e90\u914d\u5c0d", "zh-Hans": "\u81ea\u52a8\u6765\u6e90\u5339\u914d" },
  { en: "SRPE official database", "zh-Hant": "SRPE \u5b98\u65b9\u8cc7\u6599\u5eab", "zh-Hans": "SRPE \u5b98\u65b9\u6570\u636e\u5e93" },
  { en: "Older buildings: BRAVO", "zh-Hant": "\u820a\u6a13\uff1aBRAVO", "zh-Hans": "\u65e7\u697c\uff1aBRAVO" },
  { en: "Search again", "zh-Hant": "\u91cd\u65b0\u641c\u5c0b", "zh-Hans": "\u91cd\u65b0\u641c\u7d22" },
  { en: "No matching plan found", "zh-Hant": "\u627e\u4e0d\u5230\u914d\u5c0d\u5e73\u9762\u5716", "zh-Hans": "\u672a\u627e\u5230\u5339\u914d\u5e73\u9762\u56fe" },
  { en: "Review this plan", "zh-Hant": "\u6aa2\u8996\u6b64\u5e73\u9762\u5716", "zh-Hans": "\u67e5\u770b\u6b64\u5e73\u9762\u56fe" },
  { en: "Source", "zh-Hant": "\u4f86\u6e90", "zh-Hans": "\u6765\u6e90" },
  { en: "Matched", "zh-Hant": "\u5df2\u914d\u5c0d", "zh-Hans": "\u5df2\u5339\u914d" },
  { en: "Estate", "zh-Hant": "\u5c4b\u82d1", "zh-Hans": "\u5c0f\u533a" },
  { en: "Visual confirmation required.", "zh-Hant": "\u9700\u8981\u76ee\u8996\u78ba\u8a8d\u3002", "zh-Hans": "\u9700\u8981\u76ee\u89c6\u786e\u8ba4\u3002" },
  { en: "None of these match?", "zh-Hant": "\u90fd\u4e0d\u7b26\u5408\uff1f", "zh-Hans": "\u90fd\u4e0d\u5339\u914d\uff1f" },
  { en: "Continue without a public match", "zh-Hant": "\u6c92\u6709\u516c\u958b\u914d\u5c0d\u4e5f\u7e7c\u7e8c", "zh-Hans": "\u6ca1\u6709\u516c\u5f00\u5339\u914d\u4e5f\u7ee7\u7eed" },
  { en: "Upload a plan", "zh-Hant": "\u4e0a\u50b3\u5e73\u9762\u5716", "zh-Hans": "\u4e0a\u4f20\u5e73\u9762\u56fe" },
  { en: "Draw it manually", "zh-Hant": "\u624b\u52d5\u756b\u51fa", "zh-Hans": "\u624b\u52a8\u753b\u51fa" },
  { en: "Confirm before 3D use", "zh-Hant": "\u5efa\u7acb 3D \u524d\u78ba\u8a8d", "zh-Hans": "\u521b\u5efa 3D \u524d\u786e\u8ba4" },
  { en: "Does this plan match your property?", "zh-Hant": "\u6b64\u5e73\u9762\u5716\u662f\u5426\u7b26\u5408\u4f60\u7684\u7269\u696d\uff1f", "zh-Hans": "\u6b64\u5e73\u9762\u56fe\u662f\u5426\u7b26\u5408\u4f60\u7684\u7269\u4e1a\uff1f" },
  { en: "No, choose another", "zh-Hant": "\u4e0d\u7b26\u5408\uff0c\u9078\u64c7\u5176\u4ed6", "zh-Hans": "\u4e0d\u7b26\u5408\uff0c\u9009\u62e9\u5176\u4ed6" },
  { en: "Yes, use this plan", "zh-Hant": "\u7b26\u5408\uff0c\u4f7f\u7528\u6b64\u5e73\u9762\u5716", "zh-Hans": "\u7b26\u5408\uff0c\u4f7f\u7528\u6b64\u5e73\u9762\u56fe" },
  { en: "Upload, crop or trace a floor plan", "zh-Hant": "\u4e0a\u50b3\u3001\u88c1\u526a\u6216\u63cf\u7e6a\u5e73\u9762\u5716", "zh-Hans": "\u4e0a\u4f20\u3001\u88c1\u526a\u6216\u63cf\u7ed8\u5e73\u9762\u56fe" },
  { en: "The file stays in this browser. Image analysis produces an estimate, not construction geometry.", "zh-Hant": "\u6a94\u6848\u53ea\u6703\u7559\u5728\u6b64\u700f\u89bd\u5668\u3002\u5716\u50cf\u5206\u6790\u53ea\u6703\u7522\u751f\u4f30\u7b97\uff0c\u4e26\u975e\u65bd\u5de5\u5716\u3002", "zh-Hans": "\u6587\u4ef6\u53ea\u4f1a\u7559\u5728\u6b64\u6d4f\u89c8\u5668\u3002\u56fe\u50cf\u5206\u6790\u53ea\u4f1a\u4ea7\u751f\u4f30\u7b97\uff0c\u5e76\u975e\u65bd\u5de5\u56fe\u3002" },
  { en: "Choose a floor-plan image or PDF", "zh-Hant": "\u9078\u64c7\u5e73\u9762\u5716\u5716\u7247\u6216 PDF", "zh-Hans": "\u9009\u62e9\u5e73\u9762\u56fe\u56fe\u7247\u6216 PDF" },
  { en: "PNG, JPEG, WEBP or PDF", "zh-Hant": "PNG\u3001JPEG\u3001WEBP \u6216 PDF", "zh-Hans": "PNG\u3001JPEG\u3001WEBP \u6216 PDF" },
  { en: "Loading selected floor plan...", "zh-Hant": "\u6b63\u5728\u8f09\u5165\u5df2\u9078\u5e73\u9762\u5716...", "zh-Hans": "\u6b63\u5728\u52a0\u8f7d\u5df2\u9009\u5e73\u9762\u56fe..." },
  { en: "This public fallback is loaded directly from the agency source. Pan/Crop is available below; if the browser blocks automatic image analysis, upload a saved copy or trace it manually.", "zh-Hant": "\u6b64\u516c\u958b\u5099\u7528\u5716\u76f4\u63a5\u4f86\u81ea\u4ee3\u7406\u4f86\u6e90\u3002\u4e0b\u65b9\u53ef\u4f7f\u7528\u79fb\u52d5\uff0f\u88c1\u526a\uff1b\u5982\u700f\u89bd\u5668\u963b\u64cb\u81ea\u52d5\u5716\u50cf\u5206\u6790\uff0c\u8acb\u4e0a\u50b3\u5df2\u5132\u5b58\u526f\u672c\u6216\u624b\u52d5\u63cf\u7e6a\u3002", "zh-Hans": "\u6b64\u516c\u5f00\u5907\u7528\u56fe\u76f4\u63a5\u6765\u81ea\u4ee3\u7406\u6765\u6e90\u3002\u4e0b\u65b9\u53ef\u4f7f\u7528\u79fb\u52a8\uff0f\u88c1\u526a\uff1b\u5982\u6d4f\u89c8\u5668\u963b\u6321\u81ea\u52a8\u56fe\u50cf\u5206\u6790\uff0c\u8bf7\u4e0a\u4f20\u5df2\u4fdd\u5b58\u526f\u672c\u6216\u624b\u52a8\u63cf\u7ed8\u3002" },
  { en: "or trace rooms manually", "zh-Hant": "\u6216\u624b\u52d5\u63cf\u7e6a\u623f\u9593", "zh-Hans": "\u6216\u624b\u52a8\u63cf\u7ed8\u623f\u95f4" },
  { en: "Move the plan, then crop the unit area", "zh-Hant": "\u5148\u79fb\u52d5\u5e73\u9762\u5716\uff0c\u518d\u88c1\u526a\u55ae\u4f4d\u7bc4\u570d", "zh-Hans": "\u5148\u79fb\u52a8\u5e73\u9762\u56fe\uff0c\u518d\u88c1\u526a\u5355\u4f4d\u8303\u56f4" },
  { en: "Loading floor plan...", "zh-Hant": "\u6b63\u5728\u8f09\u5165\u5e73\u9762\u5716...", "zh-Hans": "\u6b63\u5728\u52a0\u8f7d\u5e73\u9762\u56fe..." },
  { en: "Pan", "zh-Hant": "\u79fb\u52d5", "zh-Hans": "\u79fb\u52a8" },
  { en: "Crop", "zh-Hant": "\u88c1\u526a", "zh-Hans": "\u88c1\u526a" },
  { en: "Create estimated 3D from selected area", "zh-Hant": "\u5f9e\u9078\u53d6\u7bc4\u570d\u5efa\u7acb\u4f30\u7b97 3D", "zh-Hans": "\u4ece\u6240\u9009\u8303\u56f4\u521b\u5efa\u4f30\u7b97 3D" },
  { en: "Creating 3D estimate...", "zh-Hant": "\u6b63\u5728\u5efa\u7acb 3D \u4f30\u7b97...", "zh-Hans": "\u6b63\u5728\u521b\u5efa 3D \u4f30\u7b97..." },
  { en: "Selected cropped floor plan", "zh-Hant": "\u5df2\u9078\u88c1\u526a\u5e73\u9762\u5716", "zh-Hans": "\u5df2\u9009\u88c1\u526a\u5e73\u9762\u56fe" },
  { en: "This shows the cropped or selected plan image used to create the current layout.", "zh-Hant": "\u9019\u88e1\u986f\u793a\u7528\u4f86\u5efa\u7acb\u76ee\u524d\u5e73\u9762\u5716\u7684\u88c1\u526a\u6216\u5df2\u9078\u5716\u7247\u3002", "zh-Hans": "\u8fd9\u91cc\u663e\u793a\u7528\u6765\u521b\u5efa\u5f53\u524d\u5e73\u9762\u56fe\u7684\u88c1\u526a\u6216\u5df2\u9009\u56fe\u7247\u3002" },
  { en: "Confirm the rooms and measurements", "zh-Hant": "\u78ba\u8a8d\u623f\u9593\u53ca\u5c3a\u5bf8", "zh-Hans": "\u786e\u8ba4\u623f\u95f4\u53ca\u5c3a\u5bf8" },
  { en: "Select a room to rename, classify or resize it. The preview updates immediately.", "zh-Hant": "\u9078\u64c7\u623f\u9593\u5f8c\u53ef\u6539\u540d\u3001\u5206\u985e\u6216\u8abf\u6574\u5c3a\u5bf8\uff1b\u9810\u89bd\u6703\u5373\u6642\u66f4\u65b0\u3002", "zh-Hans": "\u9009\u62e9\u623f\u95f4\u540e\u53ef\u6539\u540d\u3001\u5206\u7c7b\u6216\u8c03\u6574\u5c3a\u5bf8\uff1b\u9884\u89c8\u4f1a\u5373\u65f6\u66f4\u65b0\u3002" },
  { en: "Selected room", "zh-Hant": "\u5df2\u9078\u623f\u9593", "zh-Hans": "\u6240\u9009\u623f\u95f4" },
  { en: "Room name", "zh-Hant": "\u623f\u9593\u540d\u7a31", "zh-Hans": "\u623f\u95f4\u540d\u79f0" },
  { en: "Room type", "zh-Hant": "\u623f\u9593\u985e\u578b", "zh-Hans": "\u623f\u95f4\u7c7b\u578b" },
  { en: "Width (m)", "zh-Hant": "\u95ca\u5ea6\uff08\u7c73\uff09", "zh-Hans": "\u5bbd\u5ea6\uff08\u7c73\uff09" },
  { en: "Length (m)", "zh-Hant": "\u9577\u5ea6\uff08\u7c73\uff09", "zh-Hans": "\u957f\u5ea6\uff08\u7c73\uff09" },
  { en: "3D walls, doors & windows", "zh-Hant": "3D \u7246\u8eab\u3001\u9580\u53ca\u7a97", "zh-Hans": "3D \u5899\u4f53\u3001\u95e8\u53ca\u7a97" },
  { en: "Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall.", "zh-Hant": "\u6309\u4e00\u4e0b\u73fe\u6709\u7246\u8eab\u5373\u53ef\u9078\u53d6\u3002\u958b\u555f\u5efa\u7acb\u7246\u8eab\u5f8c\uff0c\u53ef\u5728\u5730\u9762\u62d6\u66f3\u756b\u51fa\u65b0\u7246\u8eab\u3002", "zh-Hans": "\u70b9\u51fb\u73b0\u6709\u5899\u4f53\u5373\u53ef\u9009\u53d6\u3002\u5f00\u542f\u521b\u5efa\u5899\u4f53\u540e\uff0c\u53ef\u5728\u5730\u9762\u62d6\u52a8\u753b\u51fa\u65b0\u5899\u4f53\u3002" },
  { en: "Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall. Selected walls can also be dragged directly.", "zh-Hant": "\u6309\u4e00\u4e0b\u73fe\u6709\u7246\u8eab\u5373\u53ef\u9078\u53d6\u3002\u958b\u555f\u5efa\u7acb\u7246\u8eab\u5f8c\uff0c\u53ef\u5728\u5730\u9762\u62d6\u66f3\u756b\u51fa\u65b0\u7246\u8eab\u3002\u5df2\u9078\u7246\u8eab\u4e5f\u53ef\u76f4\u63a5\u62d6\u52d5\u3002", "zh-Hans": "\u70b9\u51fb\u73b0\u6709\u5899\u4f53\u5373\u53ef\u9009\u53d6\u3002\u5f00\u542f\u521b\u5efa\u5899\u4f53\u540e\uff0c\u53ef\u5728\u5730\u9762\u62d6\u52a8\u753b\u51fa\u65b0\u5899\u4f53\u3002\u5df2\u9009\u5899\u4f53\u4e5f\u53ef\u76f4\u63a5\u62d6\u52a8\u3002" },
  { en: "Create wall", "zh-Hant": "\u5efa\u7acb\u7246\u8eab", "zh-Hans": "\u521b\u5efa\u5899\u4f53" },
  { en: "Cancel wall", "zh-Hant": "\u53d6\u6d88\u7246\u8eab", "zh-Hans": "\u53d6\u6d88\u5899\u4f53" },
  { en: "Click once to start, click again to finish, or drag on the preview floor.", "zh-Hant": "\u6309\u4e00\u4e0b\u958b\u59cb\uff0c\u518d\u6309\u4e00\u4e0b\u5b8c\u6210\uff0c\u6216\u5728\u9810\u89bd\u5730\u9762\u62d6\u66f3\u3002", "zh-Hans": "\u70b9\u51fb\u4e00\u4e0b\u5f00\u59cb\uff0c\u518d\u70b9\u51fb\u4e00\u4e0b\u5b8c\u6210\uff0c\u6216\u5728\u9884\u89c8\u5730\u9762\u62d6\u52a8\u3002" },
  { en: "Click once to start, click again to finish, or drag across any room floor.", "zh-Hant": "\u6309\u4e00\u4e0b\u958b\u59cb\uff0c\u518d\u6309\u4e00\u4e0b\u5b8c\u6210\uff0c\u6216\u5728\u4efb\u4f55\u623f\u9593\u5730\u9762\u62d6\u66f3\u3002", "zh-Hans": "\u70b9\u51fb\u4e00\u4e0b\u5f00\u59cb\uff0c\u518d\u70b9\u51fb\u4e00\u4e0b\u5b8c\u6210\uff0c\u6216\u5728\u4efb\u4f55\u623f\u95f4\u5730\u9762\u62d6\u52a8\u3002" },
  { en: "Select a wall...", "zh-Hant": "\u9078\u64c7\u7246\u8eab...", "zh-Hans": "\u9009\u62e9\u5899\u4f53..." },
  { en: "Add door", "zh-Hant": "\u65b0\u589e\u9580", "zh-Hans": "\u65b0\u589e\u95e8" },
  { en: "Add window", "zh-Hant": "\u65b0\u589e\u7a97", "zh-Hans": "\u65b0\u589e\u7a97" },
  { en: "Door 1", "zh-Hant": "\u9580 1", "zh-Hans": "\u95e8 1" },
  { en: "Door 2", "zh-Hant": "\u9580 2", "zh-Hans": "\u95e8 2" },
  { en: "Door 3", "zh-Hant": "\u9580 3", "zh-Hans": "\u95e8 3" },
  { en: "Window 1", "zh-Hant": "\u7a97 1", "zh-Hans": "\u7a97 1" },
  { en: "Window 2", "zh-Hant": "\u7a97 2", "zh-Hans": "\u7a97 2" },
  { en: "Window 3", "zh-Hant": "\u7a97 3", "zh-Hans": "\u7a97 3" },
  { en: "Remove", "zh-Hant": "\u79fb\u9664", "zh-Hans": "\u79fb\u9664" },
  { en: "Remove selected wall", "zh-Hant": "\u79fb\u9664\u5df2\u9078\u7246\u8eab", "zh-Hans": "\u79fb\u9664\u6240\u9009\u5899\u4f53" },
  { en: "Room size changes, wall selection and openings update the preview immediately.", "zh-Hant": "\u623f\u9593\u5c3a\u5bf8\u3001\u7246\u8eab\u9078\u64c7\u53ca\u958b\u53e3\u6703\u5373\u6642\u66f4\u65b0\u9810\u89bd\u3002", "zh-Hans": "\u623f\u95f4\u5c3a\u5bf8\u3001\u5899\u4f53\u9009\u62e9\u53ca\u5f00\u53e3\u4f1a\u5373\u65f6\u66f4\u65b0\u9884\u89c8\u3002" },
  { en: "Place real-size items", "zh-Hant": "\u64fa\u653e\u5be6\u969b\u5c3a\u5bf8\u7269\u4ef6", "zh-Hans": "\u6446\u653e\u5b9e\u9645\u5c3a\u5bf8\u7269\u4ef6" },
  { en: "Furniture & electronics", "zh-Hant": "\u50a2\u4ff1\u53ca\u96fb\u5668", "zh-Hans": "\u5bb6\u5177\u53ca\u7535\u5668" },
  { en: "Choose an item, then click a room floor to place it. Use Move then click a destination, or drag selected furniture/walls directly in the 3D view.", "zh-Hant": "\u9078\u64c7\u7269\u4ef6\u5f8c\uff0c\u6309\u623f\u9593\u5730\u9762\u64fa\u653e\u3002\u53ef\u5148\u6309\u79fb\u52d5\u518d\u6309\u76ee\u7684\u4f4d\u7f6e\uff0c\u6216\u5728 3D \u8996\u5716\u76f4\u63a5\u62d6\u66f3\u5df2\u9078\u50a2\u4ff1\uff0f\u7246\u8eab\u3002", "zh-Hans": "\u9009\u62e9\u7269\u4ef6\u540e\uff0c\u70b9\u51fb\u623f\u95f4\u5730\u9762\u6446\u653e\u3002\u53ef\u5148\u6309\u79fb\u52a8\u518d\u70b9\u51fb\u76ee\u7684\u4f4d\u7f6e\uff0c\u6216\u5728 3D \u89c6\u56fe\u76f4\u63a5\u62d6\u52a8\u5df2\u9009\u5bb6\u5177\uff0f\u5899\u4f53\u3002" },
  { en: "Decor style", "zh-Hant": "\u88dd\u4fee\u98a8\u683c", "zh-Hans": "\u88c5\u4fee\u98ce\u683c" },
  { en: "Place styled starter set", "zh-Hant": "\u653e\u7f6e\u98a8\u683c\u5165\u9580\u7d44\u5408", "zh-Hans": "\u653e\u7f6e\u98ce\u683c\u5165\u95e8\u7ec4\u5408" },
  { en: "Remove starter set", "zh-Hant": "\u79fb\u9664\u5165\u9580\u7d44\u5408", "zh-Hans": "\u79fb\u9664\u5165\u95e8\u7ec4\u5408" },
  { en: "Adds common prototype items such as sofa, TV, storage, bed, wardrobe, fridge, microwave and washer where matching rooms exist.", "zh-Hant": "\u6703\u5728\u5408\u9069\u623f\u9593\u653e\u5165\u5e38\u898b\u539f\u578b\u7269\u4ef6\uff0c\u4f8b\u5982\u6c99\u767c\u3001\u96fb\u8996\u3001\u6536\u7d0d\u3001\u7761\u5e8a\u3001\u8863\u6ac3\u3001\u96ea\u6ac3\u3001\u5fae\u6ce2\u7210\u53ca\u6d17\u8863\u6a5f\u3002", "zh-Hans": "\u4f1a\u5728\u5408\u9002\u623f\u95f4\u653e\u5165\u5e38\u89c1\u539f\u578b\u7269\u4ef6\uff0c\u4f8b\u5982\u6c99\u53d1\u3001\u7535\u89c6\u3001\u6536\u7eb3\u3001\u7761\u5e8a\u3001\u8863\u67dc\u3001\u51b0\u7bb1\u3001\u5fae\u6ce2\u7089\u53ca\u6d17\u8863\u673a\u3002" },
  { en: "IKEA furniture baselines", "zh-Hant": "IKEA \u50a2\u4ff1\u5c3a\u5bf8\u53c3\u8003", "zh-Hans": "IKEA \u5bb6\u5177\u5c3a\u5bf8\u53c2\u8003" },
  { en: "Common electronics", "zh-Hant": "\u5e38\u7528\u96fb\u5668", "zh-Hans": "\u5e38\u7528\u7535\u5668" },
  { en: "Click the desired position on a room floor.", "zh-Hant": "\u6309\u623f\u9593\u5730\u9762\u7684\u7406\u60f3\u4f4d\u7f6e\u3002", "zh-Hans": "\u70b9\u51fb\u623f\u95f4\u5730\u9762\u7684\u7406\u60f3\u4f4d\u7f6e\u3002" },
  { en: "Move selected item", "zh-Hant": "\u79fb\u52d5\u5df2\u9078\u7269\u4ef6", "zh-Hans": "\u79fb\u52a8\u6240\u9009\u7269\u4ef6" },
  { en: "Move selected wall", "zh-Hant": "\u79fb\u52d5\u5df2\u9078\u7246\u8eab", "zh-Hans": "\u79fb\u52a8\u6240\u9009\u5899\u4f53" },
  { en: "Click the new room-floor position.", "zh-Hant": "\u6309\u65b0\u7684\u623f\u9593\u5730\u9762\u4f4d\u7f6e\u3002", "zh-Hans": "\u70b9\u51fb\u65b0\u7684\u623f\u95f4\u5730\u9762\u4f4d\u7f6e\u3002" },
  { en: "Click the destination for the wall centre.", "zh-Hant": "\u6309\u7246\u8eab\u4e2d\u5fc3\u7684\u65b0\u4f4d\u7f6e\u3002", "zh-Hans": "\u70b9\u51fb\u5899\u4f53\u4e2d\u5fc3\u7684\u65b0\u4f4d\u7f6e\u3002" },
  { en: "Dimension sources", "zh-Hant": "\u5c3a\u5bf8\u8cc7\u6599\u4f86\u6e90", "zh-Hans": "\u5c3a\u5bf8\u8d44\u6599\u6765\u6e90" },
  { en: "Drag to orbit · Scroll to zoom · Click an item or wall to select · Drag selected items/walls to move", "zh-Hant": "\u62d6\u66f3\u65cb\u8f49 \u00b7 \u6efe\u52d5\u7e2e\u653e \u00b7 \u6309\u4e00\u4e0b\u7269\u4ef6\u6216\u7246\u8eab\u9078\u53d6 \u00b7 \u62d6\u66f3\u5df2\u9078\u7269\u4ef6\uff0f\u7246\u8eab\u79fb\u52d5", "zh-Hans": "\u62d6\u52a8\u65cb\u8f6c \u00b7 \u6eda\u52a8\u7f29\u653e \u00b7 \u70b9\u51fb\u7269\u4ef6\u6216\u5899\u4f53\u9009\u53d6 \u00b7 \u62d6\u52a8\u5df2\u9009\u7269\u4ef6\uff0f\u5899\u4f53\u79fb\u52a8" },
  { en: "Move mode · Click the destination on a room floor", "zh-Hant": "\u79fb\u52d5\u6a21\u5f0f \u00b7 \u6309\u623f\u9593\u5730\u9762\u4e0a\u7684\u76ee\u7684\u4f4d\u7f6e", "zh-Hans": "\u79fb\u52a8\u6a21\u5f0f \u00b7 \u70b9\u51fb\u623f\u95f4\u5730\u9762\u4e0a\u7684\u76ee\u7684\u4f4d\u7f6e" },
  { en: "Wall / opening", "zh-Hant": "\u7246\u8eab\uff0f\u958b\u53e3", "zh-Hans": "\u5899\u4f53\uff0f\u5f00\u53e3" },
  { en: "Living / dining", "zh-Hant": "\u5ba2\uff0f\u98ef\u5ef3", "zh-Hans": "\u5ba2\uff0f\u9910\u5385" },
  { en: "Bedroom", "zh-Hant": "\u7761\u623f", "zh-Hans": "\u5367\u5ba4" },
  { en: "Kitchen", "zh-Hant": "\u5eda\u623f", "zh-Hans": "\u53a8\u623f" },
  { en: "Bathroom", "zh-Hant": "\u6d74\u5ba4", "zh-Hans": "\u6d74\u5ba4" },
  { en: "Corridor", "zh-Hant": "\u8d70\u5eca", "zh-Hans": "\u8d70\u5eca" },
  { en: "Balcony", "zh-Hant": "\u9732\u53f0", "zh-Hans": "\u9633\u53f0" },
  { en: "Storage", "zh-Hant": "\u5132\u7269\u5ba4", "zh-Hans": "\u50a8\u7269\u5ba4" },
  { en: "Other", "zh-Hant": "\u5176\u4ed6", "zh-Hans": "\u5176\u4ed6" },
];

const placeholders: PhraseSet[] = [
  { en: "e.g. Mei Foo Sun Chuen / 美孚新邨", "zh-Hant": "\u4f8b\u5982\uff1a\u7f8e\u5b5a\u65b0\u90a8", "zh-Hans": "\u4f8b\u5982\uff1a\u7f8e\u5b5a\u65b0\u90a8" },
  { en: "Street name and number", "zh-Hant": "\u8857\u9053\u540d\u7a31\u53ca\u9580\u724c\u865f\u78bc", "zh-Hans": "\u8857\u9053\u540d\u79f0\u53ca\u95e8\u724c\u53f7\u7801" },
  { en: "Optional", "zh-Hant": "\u9078\u586b", "zh-Hans": "\u9009\u586b" },
  { en: "Name this floor plan", "zh-Hant": "\u70ba\u6b64\u5e73\u9762\u5716\u547d\u540d", "zh-Hans": "\u4e3a\u6b64\u5e73\u9762\u56fe\u547d\u540d" },
];

function buildLookup(items: PhraseSet[], language: Language) {
  const lookup = new Map<string, string>();
  for (const item of items) {
    lookup.set(item.en, item[language]);
    lookup.set(item["zh-Hant"], item[language]);
    lookup.set(item["zh-Hans"], item[language]);
  }
  return lookup;
}

export function I18nBridge({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : language === "zh-Hant" ? "zh-HK" : "zh-CN";

    const textLookup = buildLookup(phrases, language);
    const placeholderLookup = buildLookup(placeholders, language);

    let applying = false;
    const apply = () => {
      if (applying) return;
      applying = true;
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.nodeValue ?? "";
          const trimmed = text.trim();
          if (!trimmed) continue;
          const replacement = textLookup.get(trimmed);
          if (!replacement) continue;
          const next = text.replace(trimmed, replacement);
          if (next !== text) node.nodeValue = next;
        }

        document.querySelectorAll<HTMLInputElement>("input[placeholder]").forEach((input) => {
          const replacement = placeholderLookup.get(input.placeholder.trim());
          if (replacement && replacement !== input.placeholder) input.placeholder = replacement;
        });

        document.querySelectorAll<HTMLElement>("[title]").forEach((element) => {
          const title = element.getAttribute("title")?.trim();
          if (!title) return;
          const replacement = textLookup.get(title);
          if (replacement && replacement !== title) element.setAttribute("title", replacement);
        });
      } finally {
        applying = false;
      }
    };

    apply();
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
