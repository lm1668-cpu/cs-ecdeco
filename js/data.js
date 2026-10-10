/**
 * 迪高售後服務 — 示範資料
 * ------------------------------------------------------------
 * 正式登入（Kelvin 11/10）：手機號＝帳號、客人自設密碼、電郵啟動／重設；唔用 SMS OTP。
 * 日後接正式後端時：
 * 1. 將本檔改為從 API 讀取（例如 GET /api/me、GET /api/projects）
 * 2. 登入改為電郵啟動＋密碼（唔好再寫死 DEMO_OTP）
 * 3. 聯絡電話／電郵改由後台或環境設定注入
 *
 * 預覽 Demo 登入（暫用）：
 * - 手機：91234567 或 98765432（8 位香港手機，唔包區號）
 * - 驗證碼：123456（固定，僅預覽；正式版會改為密碼＋電郵）
 *
 * Admin 可經 admin.html 寫入 localStorage 覆寫本檔示範資料
 *（客人端 app.js 會優先讀取覆寫）。
 */
window.ECDECO_DATA = {
  demoOtp: "123456",

  contact: {
    whatsapp: "85268262764",
    phone: "+852 6826 2764",
    phoneTel: "+85268262764",
    email: "info@ecdeco.com.hk",
    website: "https://ecdeco.com.hk",
  },

  about: {
    headline: "關於迪高",
    paragraphs: [
      "迪高室內設計專注豪宅、住宅及訂造空間，以有溫度的設計感，配以落地的工程執行力，陪客人由構思走到完工交收。",
      "本售後服務應用程式專為已合作客人而設，方便你查閱自己項目的保養範圍、非保養供應商聯絡方式，以及一鍵聯絡迪高跟進售後事宜。",
      "如保養期內需要報修、查閱完工資料，或對保養範圍有疑問，歡迎隨時透過本應用程式內的聯絡渠道與我們聯繫。實際保養條款以個別項目合約為準。",
    ],
    invite: "歡迎瀏覽我們的官網，了解更多迪高的設計與工程服務。",
    website: "https://ecdeco.com.hk",
    oneLiner: "迪高室內設計——有溫度的設計感、落地的工程執行力。",
  },

  /**
   * 保養範圍詳情說明（書面語繁中）
   * key 可對應 warrantyScopes 的 detailKey，或由 title 推斷
   */
  warrantyDetails: {
    masonry: {
      id: "masonry",
      title: "泥水工程",
      summary: "涵蓋由迪高承造或統籌之泥水相關工序，於約定保養期內因施工質素引起之問題。",
      covered: [
        "地台、牆身批盪、磁磚／石材鋪貼等泥水工序之明顯空鼓、嚴重開裂（非結構性、非正常收水紋）",
        "防水層於保養期內因施工因素導致之滲漏（以合約指定範圍為準）",
        "由迪高安排之修補跟進（需預約及視乎現場情況）",
      ],
      exclusions: [
        "業主或第三方擅自改動、鑽鑿、拆除或加建導致之損壞",
        "正常使用磨損、撞擊、重物壓損、化學清潔劑侵蝕",
        "大廈結構、外牆、公共設施、原有舊有部分之問題",
        "天災、滲水來自上游單位／外牆／喉管老化等非本工程責任因素",
        "非迪高指定物料或客人自購物料之品質問題",
      ],
      howToReport:
        "請於本應用程式「聯絡迪高」以 WhatsApp、電話或電郵報修，註明項目名稱、地址、問題位置及照片（如有）。我們會核對保養期及合約範圍後安排跟進。",
      contractNote:
        "以上為一般說明，實際保養範圍、期限及責任以個別項目合約及完工文件為準；如有歧義，以合約為準。",
    },
    painting: {
      id: "painting",
      title: "油漆工程",
      summary: "涵蓋由迪高承造之室內油漆／乳膠漆工序，於保養期內因施工質素引起之問題。",
      covered: [
        "明顯起泡、嚴重剝落、不正常大面積變色（非日曬自然老化）",
        "因底漆／面漆施工不當導致之明顯缺陷",
        "保養期內經核實後由迪高安排之補油／修補",
      ],
      exclusions: [
        "傢俬搬運、裝修改動、撞擊刮花造成之損壞",
        "潮濕、滲水、冷凝水引致之發霉（需先處理水源問題）",
        "客人自選特殊漆料、藝術漆或不按說明書保養之情況",
        "煙燻、油煙、化學品濺染及日常污漬清潔責任",
        "非迪高施工範圍或交收後第三方重髹部分",
      ],
      howToReport:
        "請透過「聯絡迪高」報修，說明問題位置、發現時間，並盡量附上清晰照片。我們會確認是否屬保養範圍後與你安排視察或修補。",
      contractNote:
        "實際保養條款以合約為準；本頁內容僅供參考，並不取代合約或法律文件。",
    },
    carpentry: {
      id: "carpentry",
      title: "木工／訂造傢俬",
      summary: "涵蓋由迪高訂造或安裝之木工傢俬、櫃體、門扇、間隔等，於保養期內因製作或安裝質素引起之問題。",
      covered: [
        "櫃門、趟門、鉸鏈、路軌等因安裝或製作因素導致之明顯運作異常",
        "明顯變形、開裂（非正常木材濕脹乾縮之輕微情況）",
        "迪高訂造部分之結構性鬆脫或安裝不穩",
      ],
      exclusions: [
        "超重擺放、不當使用、暴力開關導致之損壞",
        "濕度／空調急劇變化造成之正常木材伸縮",
        "客人自購五金、燈具、電器嵌入後自行改動",
        "水浸、滲漏、寵物咬損、蟲害（非施工引起）",
        "表面日常刮花、污漬及非結構性美觀問題（視合約而定）",
      ],
      howToReport:
        "報修時請註明櫃體／位置名稱、問題現象，並附照片或短片。屬保養範圍者，迪高會安排師傅跟進；非保養或五金供應商責任則會協助指引聯絡方式。",
      contractNote:
        "訂造傢俬之保養細節、五金品牌保養及除外條款，一律以合約及相關保養文件為準。",
    },
    mep: {
      id: "mep",
      title: "水電工程",
      summary: "涵蓋由迪高承造之給排水、電氣線路及相關裝置安裝，於保養期內因施工質素引起之問題。",
      covered: [
        "迪高新做喉管接駁因施工因素導致之滲漏",
        "新做電路、插座、開關因安裝不當導致之故障（非電器本身）",
        "經核實後由迪高安排之修補或重做（限合約範圍）",
      ],
      exclusions: [
        "客人自購燈具、電器、熱水爐、濾水器等產品本身故障（請聯絡供應商）",
        "大廈總掣、電錶、公共喉管、原有舊有系統問題",
        "電力公司供應、水壓不足、水質等外在因素",
        "擅自改線、加裝、鑽牆損及線路／喉管",
        "天災、火災、水浸及不可抗力",
      ],
      howToReport:
        "涉及滲水或電力安全請盡快聯絡迪高，並視乎情況先採取緊急措施（關水掣／總掣）。報修時請說明位置及情況，切勿自行拆開牆身或電箱。",
      contractNote:
        "水電保養範圍及期限以合約為準；產品保養證請保留，以便非迪高責任時直接聯絡供應商。",
    },
    electrical: {
      id: "electrical",
      title: "電氣工程",
      summary: "涵蓋由迪高承造之電氣線路及裝置安裝，於保養期內因施工質素引起之問題。",
      covered: [
        "新做線路、掣位、插座因安裝不當導致之故障",
        "經核實後由迪高安排之檢查及修補（限合約範圍）",
      ],
      exclusions: [
        "燈具、電器產品本身故障（請聯絡供應商或品牌售後）",
        "大廈供電、電錶、原有線路問題",
        "擅自改動線路或超負荷使用",
      ],
      howToReport:
        "請經「聯絡迪高」報修並描述現象；如有焦味、跳掣頻繁等安全疑慮，請先關掉相關電掣並盡快聯絡我們。",
      contractNote:
        "實際條款以合約為準。",
    },
    other: {
      id: "other",
      title: "其他工程項目",
      summary: "個別項目中由迪高承造、並於合約列明享有保養之其他工種或特殊工序。",
      covered: [
        "合約明文列為迪高保養範圍之工序",
        "因該工序施工質素引起、並於保養期內提出之合理跟進",
      ],
      exclusions: [
        "合約未列明或註明除外之項目",
        "客人自購、其他承建商或供應商責任範圍",
        "正常耗損、不當使用及外力損壞",
      ],
      howToReport:
        "請聯絡迪高並提供項目編號、問題描述及照片，我們會對照合約確認是否屬保養範圍。",
      contractNote:
        "一切以個別項目合約為準；如有疑問，歡迎向迪高查詢。",
    },
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
          detailKey: "masonry",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w2",
          title: "油漆工程",
          detailKey: "painting",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w3",
          title: "木工／訂造櫃",
          detailKey: "carpentry",
          period: "2025-11-18 至 2026-11-17",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w4",
          title: "水電工程",
          detailKey: "mep",
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
          detailKey: "painting",
          period: "2026-03-02 至 2027-03-01",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w6",
          title: "木工／間隔",
          detailKey: "carpentry",
          period: "2026-03-02 至 2027-03-01",
          note: "保養期內發現問題，可聯絡迪高安排跟進。",
        },
        {
          id: "w7",
          title: "電氣工程",
          detailKey: "electrical",
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

  /** 可供 admin 選用之供應商範本（非保養項目） */
  supplierCatalog: [
    {
      id: "sup-daikin",
      category: "冷氣",
      brand: "Daikin",
      model: "",
      phone: "2853 6333",
      email: "",
      url: "https://www.daikin.com.hk",
      note: "",
    },
    {
      id: "sup-siemens",
      category: "煮食爐",
      brand: "Siemens",
      model: "",
      phone: "2191 2388",
      email: "hk.service@siemens-home.bsh-group.com",
      url: "https://www.siemens-home.bsh-group.com/hk",
      note: "",
    },
    {
      id: "sup-interface",
      category: "地毡",
      brand: "Interface",
      model: "",
      phone: "2808 0333",
      email: "",
      url: "",
      note: "",
    },
  ],
};
