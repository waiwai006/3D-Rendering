"use client";

import { useEffect } from "react";

export type Language = "en" | "zh-Hant" | "zh-Hans";

const translations: Record<string, [string, string]> = {
  "HK Property Design": ["香港物業設計", "香港物业设计"],
  "Find or create": ["搜尋或建立", "查找或创建"],
  "Review layout": ["檢視平面圖", "检查平面图"],
  "Explore in 3D": ["瀏覽 3D", "浏览 3D"],
  "Sign in": ["登入", "登录"],
  "Save floor plan": ["儲存平面圖", "保存平面图"],
  "Save to cloud": ["儲存至雲端", "保存到云端"],
  "Save as new": ["另存新平面圖", "另存新平面图"],
  "Load saved plan...": ["載入已儲存平面圖...", "加载已保存平面图..."],
  "Load": ["載入", "加载"],
  "Del": ["刪除", "删除"],
  "Back": ["返回", "返回"],
  "Dismiss": ["關閉", "关闭"],
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
  "Traditional Chinese examples": ["繁體中文搜尋例子", "繁体中文搜索示例"],
  "Search and match floor plans": ["搜尋及配對平面圖", "搜索及匹配平面图"],
  "Searching public sources...": ["正在搜尋公開來源...", "正在搜索公开来源..."],
  "Automatic source matching": ["自動來源配對", "自动来源匹配"],
  "SRPE official database": ["SRPE 官方資料庫", "SRPE 官方数据库"],
  "Older buildings: BRAVO": ["舊樓：BRAVO", "旧楼：BRAVO"],
  "Search again": ["重新搜尋", "重新搜索"],
  "No matching plan found": ["找不到配對平面圖", "未找到匹配平面图"],
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
  "The file stays in this browser. Image analysis produces an estimate, not construction geometry.": ["檔案只會留在此瀏覽器。圖像分析只會產生估算，並非施工圖。", "文件只会留在此浏览器。图像分析只会产生估算，并非施工图。"],
  "Choose a floor-plan image or PDF": ["選擇平面圖圖片或 PDF", "选择平面图图片或 PDF"],
  "PNG, JPEG, WEBP or PDF": ["PNG、JPEG、WEBP 或 PDF", "PNG、JPEG、WEBP 或 PDF"],
  "Loading selected floor plan...": ["正在載入已選平面圖...", "正在加载已选平面图..."],
  "This public fallback is loaded directly from the agency source. Pan/Crop is available below; if the browser blocks automatic image analysis, upload a saved copy or trace it manually.": ["此公開備用圖直接來自代理來源。下方可使用移動／裁剪；如瀏覽器阻擋自動圖像分析，請上載已儲存副本或手動描繪。", "此公开备用图直接来自代理来源。下方可使用移动／裁剪；如浏览器阻挡自动图像分析，请上传已保存副本或手动描绘。"],
  "or trace rooms manually": ["或手動描繪房間", "或手动描绘房间"],
  "Move the plan, then crop the unit area": ["先移動平面圖，再裁剪單位範圍", "先移动平面图，再裁剪单位范围"],
  "Loading floor plan...": ["正在載入平面圖...", "正在加载平面图..."],
  "Pan": ["移動", "移动"],
  "Crop": ["裁剪", "裁剪"],
  "Create estimated 3D from selected area": ["從選取範圍建立估算 3D", "从所选范围创建估算 3D"],
  "Creating 3D estimate...": ["正在建立 3D 估算...", "正在创建 3D 估算..."],
  "Selected cropped floor plan": ["已選裁剪平面圖", "已选裁剪平面图"],
  "This shows the cropped or selected plan image used to create the current layout.": ["這裡顯示用來建立目前平面圖的裁剪或已選圖片。", "这里显示用来创建当前平面图的裁剪或已选图片。"],
  "Confirm the rooms and measurements": ["確認房間及尺寸", "确认房间及尺寸"],
  "Select a room to rename, classify or resize it. The preview updates immediately.": ["選擇房間後可改名、分類或調整尺寸；預覽會即時更新。", "选择房间后可改名、分类或调整尺寸；预览会即时更新。"],
  "Selected room": ["已選房間", "所选房间"],
  "Room name": ["房間名稱", "房间名称"],
  "Room type": ["房間類型", "房间类型"],
  "Width (m)": ["闊度（米）", "宽度（米）"],
  "Length (m)": ["長度（米）", "长度（米）"],
  "3D walls, doors & windows": ["3D 牆身、門及窗", "3D 墙体、门及窗"],
  "Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall.": ["按一下現有牆身即可選取。開啟建立牆身後，可在地面拖曳畫出新牆身。", "点击现有墙体即可选取。开启创建墙体后，可在地面拖动画出新墙体。"],
  "Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall. Selected walls can also be dragged directly.": ["按一下現有牆身即可選取。開啟建立牆身後，可在地面拖曳畫出新牆身。已選牆身也可直接拖動。", "点击现有墙体即可选取。开启创建墙体后，可在地面拖动画出新墙体。已选墙体也可直接拖动。"],
  "Create wall": ["建立牆身", "创建墙体"],
  "Cancel wall": ["取消牆身", "取消墙体"],
  "Click once to start, click again to finish, or drag on the preview floor.": ["按一下開始，再按一下完成，或在預覽地面拖曳。", "点击一下开始，再点击一下完成，或在预览地面拖动。"],
  "Click once to start, click again to finish, or drag across any room floor.": ["按一下開始，再按一下完成，或在任何房間地面拖曳。", "点击一下开始，再点击一下完成，或在任何房间地面拖动。"],
  "Select a wall...": ["選擇牆身...", "选择墙体..."],
  "Add door": ["新增門", "新增门"],
  "Add window": ["新增窗", "新增窗"],
  "Door 1": ["門 1", "门 1"],
  "Door 2": ["門 2", "门 2"],
  "Door 3": ["門 3", "门 3"],
  "Window 1": ["窗 1", "窗 1"],
  "Window 2": ["窗 2", "窗 2"],
  "Window 3": ["窗 3", "窗 3"],
  "Remove": ["移除", "移除"],
  "Remove selected wall": ["移除已選牆身", "移除所选墙体"],
  "Room size changes, wall selection and openings update the preview immediately.": ["房間尺寸、牆身選擇及開口會即時更新預覽。", "房间尺寸、墙体选择及开口会即时更新预览。"],
  "Place real-size items": ["擺放實際尺寸物件", "摆放实际尺寸物件"],
  "Furniture & electronics": ["傢俬及電器", "家具及电器"],
  "Choose an item, then click a room floor to place it. Use Move then click a destination, or drag selected furniture/walls directly in the 3D view.": ["選擇物件後，按房間地面擺放。可先按移動再按目的位置，或在 3D 視圖直接拖曳已選傢俬／牆身。", "选择物件后，点击房间地面摆放。可先按移动再点击目的位置，或在 3D 视图直接拖动已选家具／墙体。"],
  "Decor style": ["裝修風格", "装修风格"],
  "Place styled starter set": ["放置風格入門組合", "放置风格入门组合"],
  "Remove starter set": ["移除入門組合", "移除入门组合"],
  "Adds common prototype items such as sofa, TV, storage, bed, wardrobe, fridge, microwave and washer where matching rooms exist.": ["會在合適房間放入常見原型物件，例如梳化、電視、收納、睡床、衣櫃、雪櫃、微波爐及洗衣機。", "会在合适房间放入常见原型物件，例如沙发、电视、收纳、睡床、衣柜、冰箱、微波炉及洗衣机。"],
  "IKEA furniture baselines": ["IKEA 傢俬尺寸參考", "IKEA 家具尺寸参考"],
  "Common electronics": ["常用電器", "常用电器"],
  "Click the desired position on a room floor.": ["按房間地面的理想位置。", "点击房间地面的理想位置。"],
  "Move selected item": ["移動已選物件", "移动所选物件"],
  "Move selected wall": ["移動已選牆身", "移动所选墙体"],
  "Click the new room-floor position.": ["按新的房間地面位置。", "点击新的房间地面位置。"],
  "Click the destination for the wall centre.": ["按牆身中心的新位置。", "点击墙体中心的新位置。"],
  "Dimension sources": ["尺寸資料來源", "尺寸资料来源"],
  "Drag to orbit · Scroll to zoom · Click an item or wall to select · Drag selected items/walls to move": ["拖曳旋轉 · 滾動縮放 · 按一下物件或牆身選取 · 拖曳已選物件／牆身移動", "拖动旋转 · 滚动缩放 · 点击物件或墙体选取 · 拖动已选物件／墙体移动"],
  "Move mode · Click the destination on a room floor": ["移動模式 · 按房間地面上的目的位置", "移动模式 · 点击房间地面上的目的位置"],
  "Wall / opening": ["牆身／開口", "墙体／开口"],
  "Living / dining": ["客／飯廳", "客／餐厅"],
  "Bedroom": ["睡房", "卧室"],
  "Kitchen": ["廚房", "厨房"],
  "Bathroom": ["浴室", "浴室"],
  "Corridor": ["走廊", "走廊"],
  "Balcony": ["露台", "阳台"],
  "Storage": ["儲物室", "储物室"],
  "Other": ["其他", "其他"],
};

const placeholders: Record<string, [string, string]> = {
  "e.g. Mei Foo Sun Chuen / 美孚新邨": ["例如：美孚新邨", "例如：美孚新邨"],
  "Street name and number": ["街道名稱及門牌號碼", "街道名称及门牌号码"],
  "Optional": ["選填", "选填"],
  "Name this floor plan": ["為此平面圖命名", "为此平面图命名"],
};

export function I18nBridge({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : language === "zh-Hant" ? "zh-HK" : "zh-CN";
    const index = language === "en" ? -1 : language === "zh-Hant" ? 0 : 1;
    if (index === -1) return;

    let applying = false;
    const apply = () => {
      if (applying) return;
      applying = true;
      try {
        const textRows = Object.entries(translations);
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.nodeValue ?? "";
          const trimmed = text.trim();
          if (!trimmed) continue;
          const row = textRows.find(([en]) => en === trimmed);
          if (!row) continue;
          const next = text.replace(trimmed, row[1][index]);
          if (next !== text) node.nodeValue = next;
        }
        document.querySelectorAll<HTMLInputElement>("input[placeholder]").forEach((input) => {
          const row = Object.entries(placeholders).find(([en]) => en === input.placeholder);
          if (row) input.placeholder = row[1][index];
        });
        document.querySelectorAll<HTMLElement>("[title]").forEach((element) => {
          const title = element.getAttribute("title")?.trim();
          if (!title) return;
          const row = textRows.find(([en]) => en === title);
          if (row) element.setAttribute("title", row[1][index]);
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
