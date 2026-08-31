/*
 * 内容维护入口
 * 1. 在 categories 中管理首页分类卡片。
 * 2. 在 entries 中添加记录；category 必须对应一个分类 id。
 * 3. 这是公开仓库，请勿写入私人日程、联系方式或敏感信息。
 */
window.GARDEN_CONTENT = {
  categories: [
    { id: "knowledge", name: "技术知识", english: "Knowledge", icon: "⌁", description: "控制、嵌入式、工程实践，以及所有值得反复查阅的笔记。", accent: "mint" },
    { id: "moments", name: "图片与台词", english: "Moments", icon: "◫", description: "喜欢的画面、电影台词、书摘，以及偶然击中我的片段。", accent: "amber" },
    { id: "links", name: "网站收藏", english: "Bookmarks", icon: "↗", description: "工具、资料、灵感来源和那些不想再次弄丢的互联网角落。", accent: "blue" },
    { id: "plans", name: "公开计划", english: "Plans", icon: "✓", description: "阶段目标、想做清单和可以公开分享的进度记录。", accent: "rose" }
  ],
  entries: [
    { title: "数字花园，从这里开始", category: "knowledge", date: "2026-08-28", summary: "这里不是一次写完的成品库。每条记录都可以先种下，再持续补充、连接与修订。", tags: ["说明", "数字花园"], url: "#about" },
    { title: "技术笔记区", category: "knowledge", date: "2026-08-28", summary: "用于整理控制、嵌入式与工程实践。后续内容会从真实问题出发，而不是按教程模板堆叠。", tags: ["工程", "笔记"], url: "#garden" },
    { title: "白厅留声：是，大臣", category: "moments", date: "2026-08-31", summary: "吉姆·哈克、汉弗莱爵士与伯纳德在权力、程序和语言之间的经典交锋，中英双语整理。", tags: ["是大臣", "英剧", "经典台词"], url: "moments/yes-minister.html#quotes" },
    { title: "白厅留声：是，首相", category: "moments", date: "2026-08-31", summary: "从大臣办公室到唐宁街十号：精选高清剧照与白厅式政治幽默。", tags: ["是首相", "剧照", "白厅"], url: "moments/yes-minister.html#stills" },
    { title: "有用网站收藏夹", category: "links", date: "2026-08-28", summary: "不只保存链接，还记录它为什么有用、适合什么场景，以及再次找到它的关键词。", tags: ["工具", "资源"], url: "#garden" },
    { title: "下一步：种下第一批真实内容", category: "plans", date: "2026-08-28", summary: "用真实笔记替换示例记录，选择一张长期背景，并逐步建立内容之间的连接。", tags: ["待办", "公开计划"], url: "#garden" }
  ],
  backgrounds: [
    { id: "forest", name: "苔原", description: "深绿与晨雾", color: "#263f35" },
    { id: "dusk", name: "暮色", description: "靛蓝与余晖", color: "#30334f" },
    { id: "paper", name: "纸上", description: "温暖与安静", color: "#a77e59" },
    { id: "classic", name: "旧日", description: "保留原站照片", color: "#59646d" }
  ]
};


