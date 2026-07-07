"use client";

import { useEffect } from "react";

export type Language = "en" | "zh-Hant" | "zh-Hans";

const translations: Record<string, [string, string]> = {
  "Save project": ["儲存項目", "保存项目"], "MVP prototype": ["MVP 原型", "MVP 原型"],
  "Find or create": ["搜尋或建立", "查找或创建"], "Review layout": ["檢視平面圖", "检查平面图"], "Explore in 3D": ["瀏覽 3D", "浏览 3D"],
  "Start from the best available evidence": ["從最可靠的資料開始", "从最可靠的资料开始"],
  "How would you like to create your floor plan?": ["你想如何建立平面圖？", "你想如何创建平面图？"],
  "Use an address to look for a public plan, upload a plan you already have, or draw the flat manually.": ["使用地址搜尋公開平面圖、上載已有平面圖，或手動畫出單位。", "使用地址搜索公开平面图、上传已有平面图，或手动画出单位。"],
  "Property details": ["物業資料", "物业资料"], "Search public sources": ["搜尋公開來源", "搜索公开来源"], "Upload floor plan": ["上載平面圖", "上传平面图"], "Image or PDF": ["圖片或 PDF", "图片或 PDF"], "Draw manually": ["手動繪製", "手动绘制"], "No plan available": ["沒有平面圖", "没有平面图"],
  "Locate the exact property": ["準確定位物業", "准确定位物业"], "Estate / development": ["屋苑／發展項目", "小区／发展项目"], "Address": ["地址", "地址"], "Tower": ["座數", "栋座"], "Block": ["大廈／座", "楼栋"], "Floor": ["樓層", "楼层"], "Flat / unit": ["單位", "单元"], "Saleable area": ["實用面積", "实用面积"],
  "Traditional Chinese examples": ["繁體中文搜尋例子", "繁体中文搜索示例"],
  "Search and match floor plans": ["搜尋及配對平面圖", "搜索及匹配平面图"], "Searching public sources...": ["正在搜尋公開來源…", "正在搜索公开来源…"], "Automatic source matching": ["自動來源配對", "自动来源匹配"],
  "Search again": ["重新搜尋", "重新搜索"], "No matching plan found": ["找不到配對平面圖", "未找到匹配平面图"], "Review this plan": ["檢視此平面圖", "查看此平面图"], "Source": ["來源", "来源"], "Matched": ["已配對", "已匹配"], "Estate": ["屋苑", "小区"],
  "Confirm before 3D use": ["建立 3D 前確認", "创建 3D 前确认"], "Does this plan match your property?": ["此平面圖是否符合你的物業？", "此平面图是否符合你的物业？"], "No, choose another": ["不符合，選擇其他", "不符合，选择其他"], "Yes, use this plan": ["符合，使用此平面圖", "符合，使用此平面图"],
  "Upload, crop or trace a floor plan": ["上載、裁剪或描繪平面圖", "上传、裁剪或描绘平面图"], "Choose a floor-plan image or PDF": ["選擇平面圖圖片或 PDF", "选择平面图图片或 PDF"], "or trace rooms manually": ["或手動描繪房間", "或手动描绘房间"],
  "Drag to select the unit area": ["拖曳以選取單位範圍", "拖动以选择单元范围"], "Move the plan, then crop the unit area": ["先移動平面圖，再裁剪單位範圍", "先移动平面图，再裁剪单元范围"], "Pan": ["移動", "移动"], "Crop": ["裁剪", "裁剪"], "Create estimated 3D from selected area": ["從選取範圍建立估算 3D", "从所选范围创建估算 3D"],
  "Draw the floor plan manually": ["手動繪製平面圖", "手动绘制平面图"], "Draw room rectangles": ["繪製房間矩形", "绘制房间矩形"], "Undo": ["復原", "撤销"], "Clear": ["清除", "清除"], "Use this floor plan": ["使用此平面圖", "使用此平面图"],
  "Review before generating": ["生成前檢視", "生成前检查"], "Confirm the rooms and measurements": ["確認房間及尺寸", "确认房间及尺寸"], "Original source floor plan": ["原始來源平面圖", "原始来源平面图"], "Redraw": ["重新繪製", "重新绘制"], "Use demo": ["使用示範", "使用示例"], "Selected room": ["已選房間", "所选房间"], "Room name": ["房間名稱", "房间名称"], "Room type": ["房間類型", "房间类型"], "Width (m)": ["闊度（米）", "宽度（米）"], "Length (m)": ["長度（米）", "长度（米）"], "Generate 3D view": ["生成 3D 視圖", "生成 3D 视图"], "Edit layout": ["編輯平面圖", "编辑平面图"],
  "Manual approximation": ["手動近似平面圖", "手动近似平面图"], "Planning-only approximation": ["僅供規劃參考", "仅供规划参考"], "Dismiss": ["關閉", "关闭"],
  "Place real-size items": ["擺放實際尺寸物件", "摆放实际尺寸物件"], "Furniture & electronics": ["傢俬及電器", "家具及电器"], "Choose an item, then click a room floor to place it.": ["選擇物件後，按房間地面擺放。", "选择物件后，点击房间地面摆放。"], "IKEA furniture baselines": ["IKEA 傢俬尺寸參考", "IKEA 家具尺寸参考"], "Common electronics": ["常用電器", "常用电器"], "Click the desired position on a room floor.": ["按房間地面的理想位置。", "点击房间地面的理想位置。"], "Dimension sources": ["尺寸資料來源", "尺寸资料来源"], "Move": ["移動", "移动"], "Move selected item": ["移動已選物件", "移动所选物件"], "Rotate 45°": ["旋轉 45°", "旋转 45°"], "Remove": ["移除", "移除"], "Sign in": ["登入", "登录"], "Save to cloud": ["儲存至雲端", "保存到云端"],
  "Living / dining": ["客／飯廳", "客／餐厅"], "Bedroom": ["睡房", "卧室"], "Kitchen": ["廚房", "厨房"], "Bathroom": ["浴室", "卫生间"], "Corridor": ["走廊", "走廊"], "Balcony": ["露台", "阳台"], "Storage": ["儲物室", "储物室"], "Other": ["其他", "其他"],
};

const placeholders: Record<string, [string, string]> = {
  "e.g. Mei Foo Sun Chuen / 美孚新邨": ["例如：美孚新邨", "例如：美孚新邨"], "Street name and number": ["街道名稱及門牌號碼", "街道名称及门牌号码"], "Optional": ["選填", "选填"],
};

export function I18nBridge({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : language === "zh-Hant" ? "zh-HK" : "zh-CN";
    const apply = () => {
      const table = language === "en" ? 0 : language === "zh-Hant" ? 1 : 2;
      const all = Object.entries(translations).map(([en, zh]) => [en, zh[0], zh[1]] as const);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue ?? ""; const trimmed = text.trim(); if (!trimmed) continue;
        const row = all.find((entry) => entry.includes(trimmed)); if (!row) continue;
        const target = row[table]; node.nodeValue = text.replace(trimmed, target);
      }
      document.querySelectorAll<HTMLInputElement>("input[placeholder]").forEach((input) => {
        const current = input.placeholder; const row = Object.entries(placeholders).map(([en, zh]) => [en, zh[0], zh[1]]).find((entry) => entry.includes(current)); if (row) input.placeholder = row[table];
      });
    };
    apply();
    const observer = new MutationObserver(() => apply()); observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return null;
}
