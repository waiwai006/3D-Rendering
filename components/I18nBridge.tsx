"use client";

import { useEffect } from "react";

export type Language = "en" | "zh-Hant" | "zh-Hans";

const translations: Record<string, [string, string]> = {
  "Save as new": ["另存新平面圖", "另存新平面图"],
  "Now click the wall end point.": ["現在按牆身終點。", "现在点击墙体终点。"],
  "Click the wall start point on any room floor.": ["在任何房間地面按牆身起點。", "在任何房间地面点击墙体起点。"],
  "HK Property Design": ["香港物業設計", "香港物业设计"],
  "Find or create": ["搜尋或建立", "查找或创建"],
  "Review layout": ["檢視平面圖", "检查平面图"],
  "Explore in 3D": ["瀏覽 3D", "浏览 3D"],
  "Sign in": ["登入", "登录"],
  "Save floor plan": ["儲存平面圖", "保存平面图"],
  "Save to cloud": ["儲存至雲端", "保存到云端"],
  "Load saved plan...": ["載入已儲存平面圖…", "加载已保存平面图…"],
  "Load": ["載入", "加载"],
  "Back": ["返回", "返回"],
  "Dismiss": ["關閉", "关闭"],

  "Start from the best available evidence": ["從最可靠的資料開始", "从最可靠的资料开始"],
  "How would you like to create your floor plan?": ["你想如何建立平面圖？", "你想如何创建平面图？"],
  "Use an address to look for a public plan, upload a plan you already have, or draw the flat manually.": ["使用地址搜尋公開平面圖、上載已有平面圖，或手動畫出單位。", "使用地址搜索公开平面图、上传已有平面图，或手动画出单位。"],
  "Property details": ["物業資料", "物业资料"],
  "Search public sources": ["搜尋公開來源", "搜索公开来源"],
  "Upload floor plan": ["上載平面圖", "上传平面图"],
  "Image or PDF": ["圖片或 PDF", "图片或 PDF"],
  "Draw manually": ["手動繪製", "手动绘制"],
  "No plan available": ["沒有平面圖", "没有平面图"],
  "Locate the exact property": ["準確定位物業", "准确定位物业"],
  "Estate or address is required for lookup. Tower, block, floor and flat are optional but improve matching.": ["搜尋需要屋苑或地址；座數、樓層及單位可選填，但有助提高配對。", "搜索需要小区或地址；楼栋、楼层及单元可选填，但有助提高匹配。"],
  "Estate / development": ["屋苑／發展項目", "小区／发展项目"],
  "Address": ["地址", "地址"],
  "Tower": ["座數", "栋座"],
  "Block": ["大廈／座", "楼栋"],
  "Floor": ["樓層", "楼层"],
  "Flat / unit": ["單位", "单元"],
  "Saleable area": ["實用面積", "实用面积"],
  "Traditional Chinese examples": ["繁體中文搜尋例子", "繁体中文搜索示例"],
  "Search and match floor plans": ["搜尋及配對平面圖", "搜索及匹配平面图"],
  "Searching public sources...": ["正在搜尋公開來源…", "正在搜索公开来源…"],
  "Automatic source matching": ["自動來源配對", "自动来源匹配"],
  "SRPE official database": ["SRPE 官方資料庫", "SRPE 官方数据库"],
  "Older buildings: BRAVO": ["舊樓：BRAVO", "旧楼：BRAVO"],
  "Search again": ["重新搜尋", "重新搜索"],
  "No matching plan found": ["找不到配對平面圖", "未找到匹配平面图"],
  "Review the image—estate-level results may contain several unit types.": ["請檢視圖片——屋苑級結果可能包含多種單位類型。", "请检查图片——小区级结果可能包含多种户型。"],
  "Review this plan": ["檢視此平面圖", "查看此平面图"],
  "Source": ["來源", "来源"],
  "Matched": ["已配對", "已匹配"],
  "Estate": ["屋苑", "小区"],
  "Visual confirmation required.": ["需要目視確認。", "需要目视确认。"],
  "None of these match?": ["都不符合？", "都不匹配？"],
  "Continue without a public match": ["沒有公開配對也繼續", "没有公开匹配也继续"],
  "Upload a plan": ["上載平面圖", "上传平面图"],
  "Draw it manually": ["手動畫出", "手动画出"],
  "Confirm before 3D use": ["建立 3D 前確認", "创建 3D 前确认"],
  "Does this plan match your property?": ["此平面圖是否符合你的物業？", "此平面图是否符合你的物业？"],
  "No, choose another": ["不符合，選擇其他", "不符合，选择其他"],
  "Yes, use this plan": ["符合，使用此平面圖", "符合，使用此平面图"],

  "Upload, crop or trace a floor plan": ["上載、裁剪或描繪平面圖", "上传、裁剪或描绘平面图"],
  "Choose a floor-plan image or PDF": ["選擇平面圖圖片或 PDF", "选择平面图图片或 PDF"],
  "PNG, JPEG, WEBP or PDF": ["PNG、JPEG、WEBP 或 PDF", "PNG、JPEG、WEBP 或 PDF"],
  "or trace rooms manually": ["或手動描繪房間", "或手动描绘房间"],
  "Draw the floor plan manually": ["手動繪製平面圖", "手动绘制平面图"],
  "Drag to draw your first room": ["拖曳以畫出第一個房間", "拖动以画出第一个房间"],
  "Use this floor plan": ["使用此平面圖", "使用此平面图"],
  "Undo": ["復原", "撤销"],
  "Clear": ["清除", "清除"],
  "Pan": ["移動", "移动"],
  "Crop": ["裁剪", "裁剪"],
  "Create estimated 3D from selected area": ["從選取範圍建立估算 3D", "从所选范围创建估算 3D"],

  "Review before generating": ["生成前檢視", "生成前检查"],
  "Confirm the rooms and measurements": ["確認房間及尺寸", "确认房间及尺寸"],
  "Select a room to rename, classify or resize it. The preview updates immediately.": ["選擇房間後可改名、分類或調整尺寸；預覽會即時更新。", "选择房间后可改名、分类或调整尺寸；预览会即时更新。"],
  "Selected cropped floor plan": ["已選裁剪平面圖", "已选裁剪平面图"],
  "This shows the cropped or selected plan image used to create the current layout.": ["這裡顯示用來建立目前平面圖的裁剪或已選圖片。", "这里显示用来创建当前平面图的裁剪或已选图片。"],
  "Rooms": ["房間", "房间"],
  "Selected room": ["已選房間", "所选房间"],
  "Room name": ["房間名稱", "房间名称"],
  "Room type": ["房間類型", "房间类型"],
  "Width (m)": ["闊度（米）", "宽度（米）"],
  "Length (m)": ["長度（米）", "长度（米）"],
  "Walls": ["牆身", "墙体"],
  "Select a room edge to add a wall, or remove an existing wall.": ["選擇房間邊緣以新增牆身，或移除現有牆身。", "选择房间边缘以新增墙体，或移除现有墙体。"],
  "Top": ["上方", "上方"],
  "Right": ["右方", "右方"],
  "Bottom": ["下方", "下方"],
  "Left": ["左方", "左方"],
  "Select wall to remove...": ["選擇要移除的牆身…", "选择要移除的墙体…"],
  "Remove wall": ["移除牆身", "移除墙体"],
  "Room size changes and wall edits update the preview immediately.": ["房間尺寸及牆身改動會即時反映在預覽。", "房间尺寸及墙体改动会即时反映在预览。"],
  "Generate 3D view": ["生成 3D 視圖", "生成 3D 视图"],
  "Edit layout": ["編輯平面圖", "编辑平面图"],

  "Interactive model": ["互動模型", "互动模型"],
  "Untitled property": ["未命名物業", "未命名物业"],
  "Address not added": ["尚未加入地址", "尚未加入地址"],
  "Area unknown": ["面積未知", "面积未知"],
  "Place real-size items": ["擺放實際尺寸物件", "摆放实际尺寸物件"],
  "Furniture & electronics": ["傢俬及電器", "家具及电器"],
  "Choose an item, then click a room floor to place it.": ["選擇物件後，按房間地面擺放。", "选择物件后，点击房间地面摆放。"],
  "IKEA furniture baselines": ["IKEA 傢俬尺寸參考", "IKEA 家具尺寸参考"],
  "Common electronics": ["常用電器", "常用电器"],
  "Click the desired position on a room floor.": ["按房間地面的理想位置。", "点击房间地面的理想位置。"],
  "Move selected item": ["移動已選物件", "移动所选物件"],
  "Move": ["移動", "移动"],
  "Rotate 45°": ["旋轉 45°", "旋转 45°"],
  "Remove": ["移除", "移除"],
  "3D walls": ["3D 牆身", "3D 墙体"],
  "Click two floor points to create a wall. Click an existing wall to select and remove it.": ["按兩個地面點建立牆身；按現有牆身可選取及移除。", "点击两个地面点创建墙体；点击现有墙体可选取及移除。"],
  "Create wall": ["建立牆身", "创建墙体"],
  "Cancel wall": ["取消牆身", "取消墙体"],
  "Remove selected wall": ["移除已選牆身", "移除所选墙体"],
  "Dimension sources": ["尺寸資料來源", "尺寸资料来源"],
  "Drag to orbit · Scroll to zoom · Click a floor to place an item": ["拖曳旋轉 · 滾動縮放 · 按地面擺放物件", "拖动旋转 · 滚动缩放 · 点击地面摆放物件"],
  "Click two floor points to create a wall": ["按兩個地面點建立牆身", "点击两个地面点创建墙体"],

  "Living / dining": ["客／飯廳", "客／餐厅"],
  "Bedroom": ["睡房", "卧室"],
  "Kitchen": ["廚房", "厨房"],
  "Bathroom": ["浴室", "卫生间"],
  "Corridor": ["走廊", "走廊"],
  "Balcony": ["露台", "阳台"],
  "Storage": ["儲物室", "储物室"],
  "Other": ["其他", "其他"],
};

Object.assign(translations, {
  "Back": ["返回", "返回"],
  "Save floor plan": ["儲存平面圖", "保存平面图"],
  "Save as new": ["另存新平面圖", "另存新平面图"],
  "Load saved plan...": ["載入已儲存平面圖…", "加载已保存平面图…"],
  "Load": ["載入", "加载"],
  "Select a room to rename, classify or resize it. The preview updates immediately.": ["選擇房間以重新命名、分類或調整尺寸，預覽會即時更新。", "选择房间以重新命名、分类或调整尺寸，预览会即时更新。"],
  "Walls": ["牆身", "墙体"],
  "3D walls": ["3D 牆身", "3D 墙体"],
  "Create wall": ["建立牆身", "创建墙体"],
  "Cancel wall": ["取消建立牆身", "取消创建墙体"],
  "Remove wall": ["移除牆身", "移除墙体"],
  "Remove selected wall": ["移除已選牆身", "移除所选墙体"],
  "Click two floor points to create a wall": ["按兩個地面位置建立牆身", "点击两个地面位置创建墙体"],
  "Click two floor points to create a wall. Click an existing wall to select and remove it.": ["按兩個地面位置建立牆身；按現有牆身可選取並移除。", "点击两个地面位置创建墙体；点击现有墙体可选择并移除。"],
  "Click the wall start point on any room floor.": ["在任何房間地面按牆身起點。", "在任何房间地面点击墙体起点。"],
  "Now click the wall end point.": ["現在按牆身終點。", "现在点击墙体终点。"],
} satisfies Record<string, [string, string]>);

const placeholders: Record<string, [string, string]> = {
  "e.g. Mei Foo Sun Chuen / 美孚新邨": ["例如：美孚新邨", "例如：美孚新邨"],
  "Street name and number": ["街道名稱及門牌號碼", "街道名称及门牌号码"],
  "Optional": ["選填", "选填"],
};

export function I18nBridge({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : language === "zh-Hant" ? "zh-HK" : "zh-CN";
    let applying = false;
    const apply = () => {
      if (applying) return;
      applying = true;
      const table = language === "en" ? 0 : language === "zh-Hant" ? 1 : 2;
      const all = Object.entries(translations).map(([en, zh]) => [en, zh[0], zh[1]] as const);
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.nodeValue ?? "";
          const trimmed = text.trim();
          if (!trimmed) continue;
          const row = all.find((entry) => entry.includes(trimmed));
          if (!row) continue;
          const next = text.replace(trimmed, row[table]);
          if (next !== text) node.nodeValue = next;
        }
        document.querySelectorAll<HTMLInputElement>("input[placeholder]").forEach((input) => {
          const row = Object.entries(placeholders).map(([en, zh]) => [en, zh[0], zh[1]]).find((entry) => entry.includes(input.placeholder));
          if (row && input.placeholder !== row[table]) input.placeholder = row[table];
        });
        document.querySelectorAll<HTMLOptionElement>("option").forEach((option) => {
          const row = all.find((entry) => entry.includes(option.textContent?.trim() ?? ""));
          if (row && option.textContent !== row[table]) option.textContent = row[table];
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
