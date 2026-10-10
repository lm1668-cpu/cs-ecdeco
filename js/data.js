/**
 * 迪高售後服務 — 示範資料
 * ------------------------------------------------------------
 * 日後接正式後端時：
 * 1. 將本檔改為從 API 讀取（例如 GET /api/me、GET /api/projects）
 * 2. 登入改為真實 OTP（SMS／WhatsApp）；唔好再寫死 DEMO_OTP
 * 3. 聯絡電話／電郵改由後台或環境設定注入，唔寫喺前端死碼
 * 4. Kelvin 必須填入真實迪高對外聯絡號碼（WhatsApp／電話），
 *    切勿使用大本營 6179 1102
 *
 * Demo 登入：
 * - 手機：91234567 或 98765432（8 位香港手機，唔包區號）
 * - 驗證碼：123456（固定，僅預覽用）
 */
window.ECDECO_DATA = {
  demoOtp: "123456",

  /**
   * PLACEHOLDER — Kelvin 必須替換為真實迪高對外聯絡方式
   * 唔好用大本營號碼 6179 1102
   */
  contact: {
    // 格式：852 + 8 位；暫時用清晰 placeholder，正式上線前必須改
    whatsapp: "852XXXXXXXX", // TODO(Kelvin): 填真實迪高 WhatsApp，例 85291234567
    phone: "+852 XXXX XXXX", // TODO(Kelvin): 填真實迪高售後電話
    phoneTel: "+852XXXXXXXX", // TODO(Kelvin): tel: 連結用，無空格
    email: "cs@ecdeco.com.hk", // TODO(Kelvin): 確認售後電郵；暫用合理 placeholder
    website: "https://ecdeco.com.hk",
  },

  about: {
    oneLiner: "迪高室內設計——有溫度的設計感、落地的工程執行力。",
    website: "https://ecdeco.com.hk",
  },

  /** phone（8 位）→ customer 資料 */
  customers: {
    "91234567": {
      id: "cust-001",
      name: "陳生",
      phone: "91234567",
      projectIds: ["proj-001", "proj-002"],
    },
    "98765432": {
      id: "cust-002",
      name: "李太",
      phone: "98765432",
      projectIds: ["proj-002"],
    },
  },

  projects: {
    "proj-001": {
      id: "proj-001",
      code: "EC Job 128",
      name: "西半山嘉輝台單位翻新",
      addressShort: "西半山 · 嘉輝台",
      address: "西半山嘉輝台",
      completedAt: "2025-11-18",
      status: "completed",
      statusLabel: "已完工",
      warrantyScopes: [
        {
          id: "w1",
          title: "泥水工程",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w2",
          title: "油漆工程",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w3",
          title: "木工／訂造櫃",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w4",
          title: "水電工程",
          period: "2025-11-18 至 2026-05-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
      ],
      nonWarranty: [
        {
          id: "nw1",
          category: "冷氣",
          brand: "Daikin",
          model: "FTXM25",
          phone: "2853 6333",
          email: "",
          url: "https://www.daikin.com.hk",
          note: "保養證編號示範：DK-2025-8812（以實物為準）",
        },
        {
          id: "nw2",
          category: "煮食爐",
          brand: "Siemens",
          model: "ER3A6BB70",
          phone: "2191 2388",
          email: "hk.service@siemens-home.bsh-group.com",
          url: "https://www.siemens-home.bsh-group.com/hk",
          note: "客戶自購；非迪高保養範圍",
        },
      ],
    },
    "proj-002": {
      id: "proj-002",
      code: "EC Job 141",
      name: "尖沙咀寫字樓局部翻新",
      addressShort: "尖沙咀 · 寫字樓",
      address: "尖沙咀寫字樓",
      completedAt: "2026-03-02",
      status: "completed",
      statusLabel: "已完工",
      warrantyScopes: [
        {
          id: "w5",
          title: "油漆工程",
          period: "2026-03-02 至 2027-03-01",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w6",
          title: "木工／間隔",
          period: "2026-03-02 至 2027-03-01",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w7",
          title: "電氣工程",
          period: "2026-03-02 至 2026-09-01",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
      ],
      nonWarranty: [
        {
          id: "nw3",
          category: "地毡",
          brand: "Interface",
          model: "Carpet Tile（現場批次）",
          phone: "2808 0333",
          email: "",
          url: "",
          note: "保養證／發票請保留；問題可直接聯絡供應商",
        },
        {
          id: "nw4",
          category: "照明燈具",
          brand: "客戶指定供應商",
          model: "—",
          phone: "請向項目負責人查詢",
          email: "",
          url: "",
          note: "客戶自購燈具；非迪高保養範圍",
        },
      ],
    },
  },
};
