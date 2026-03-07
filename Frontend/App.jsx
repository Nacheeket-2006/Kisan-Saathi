import { useState, useEffect, useRef } from "react";

const LANGS = {
  en: {
    appName: "Kisan Saathi",
    tagline: "Crop Intelligence & Community",
    nav: ["Crops", "Community", "Mandi", "Transport", "Chatbot"],
    greeting: "Good morning, Ramesh ji 🌾",
    location: "Vashi, Maharashtra",
    cropLib: "Crop Intelligence Library",
    community: "Community Q&A",
    mandi: "Live Mandi Rates",
    transport: "Transport & Logistics",
    chatbot: "AI Chatbot (Kisan Mitra)",
  },
  hi: {
    appName: "किसान साथी",
    tagline: "फसल जानकारी और समुदाय",
    nav: ["फसल", "समुदाय", "मंडी", "ट्रांसपोर्ट", "चैटबॉट"],
    greeting: "सुप्रभात, रमेश जी 🌾",
    location: "नासिक, महाराष्ट्र",
    cropLib: "फसल ज्ञान भंडार",
    community: "सामुदायिक प्रश्न",
    mandi: "लाइव मंडी भाव",
    transport: "ट्रांसपोर्ट सेवा",
    chatbot: "AI चैटबॉट (किसान मित्र)",
  },
  mr: {
    appName: "किसान साथी",
    tagline: "पीक माहिती आणि समुदाय",
    nav: ["पिके", "समुदाय", "मंडी", "वाहतूक", "चॅटबॉट"],
    greeting: "सुप्रभात, रमेश जी 🌾",
    location: "नाशिक, महाराष्ट्र",
    cropLib: "पीक माहिती केंद्र",
    community: "सामुदायिक प्रश्न",
    mandi: "लाइव मंडी दर",
    transport: "वाहतूक सेवा",
    chatbot: "AI चॅटबॉट (किसान मित्र)",
  },
};

const CROPS_DATA = [
  {
    id: "tomato",
    name: "Tomato",
    nameHi: "टमाटर",
    icon: "🍅",
    season: "Kharif / Rabi",
    soilType: "Loamy, well-drained",
    duration: "70–90 days",
    waterReq: "Medium (450–600mm)",
    regions: ["Maharashtra", "Karnataka", "Andhra Pradesh"],
    stages: [
      { week: "W1–W2", label: "Nursery / Sowing", color: "#8B6914" },
      { week: "W3–W4", label: "Transplanting", color: "#6B8E23" },
      { week: "W5–W8", label: "Vegetative Growth", color: "#3A7D44" },
      { week: "W9–W11", label: "Flowering", color: "#E8A838" },
      { week: "W12–W13", label: "Fruit Set", color: "#D4522A" },
      { week: "W14", label: "Harvest", color: "#B22222" },
    ],
    fertilizer: [
      { timing: "Basal (before planting)", dose: "DAP 50kg/acre + FYM 2 ton" },
      { timing: "3 WAT", dose: "Urea 20kg/acre" },
      { timing: "6 WAT", dose: "Urea 20kg/acre + MOP 15kg/acre" },
      { timing: "9 WAT", dose: "Foliar 00-52-34 @ 5g/L" },
    ],
    pests: [
      { name: "Fruit Borer (Helicoverpa)", action: "Spray Emamectin 0.5g/L" },
      { name: "Leaf Curl Virus", action: "Control whitefly vector, use silver mulch" },
      { name: "Early Blight", action: "Mancozeb 2.5g/L at first symptom" },
    ],
  },
  {
    id: "onion",
    name: "Onion",
    nameHi: "प्याज",
    icon: "🧅",
    season: "Rabi",
    soilType: "Sandy loam, pH 6–7",
    duration: "110–120 days",
    waterReq: "Low–Medium (350–500mm)",
    regions: ["Maharashtra", "Gujarat", "Madhya Pradesh"],
    stages: [
      { week: "W1–W3", label: "Nursery", color: "#8B6914" },
      { week: "W4–W5", label: "Transplanting", color: "#6B8E23" },
      { week: "W6–W9", label: "Bulb Formation", color: "#3A7D44" },
      { week: "W10–W14", label: "Bulb Enlargement", color: "#C8A000" },
      { week: "W15–W16", label: "Maturity / Harvest", color: "#8B4513" },
    ],
    fertilizer: [
      { timing: "Basal", dose: "SSP 150kg/acre + FYM 4 ton" },
      { timing: "30 DAT", dose: "Urea 25kg/acre" },
      { timing: "60 DAT", dose: "Urea 20kg/acre + MOP 20kg/acre" },
    ],
    pests: [
      { name: "Thrips", action: "Imidacloprid 0.5ml/L, avoid water stress" },
      { name: "Purple Blotch", action: "Carbendazim + Mancozeb 3g/L" },
      { name: "Stemphylium Blight", action: "Tebuconazole 1ml/L" },
    ],
  },
  {
    id: "wheat",
    name: "Wheat",
    nameHi: "गेहूं",
    icon: "🌾",
    season: "Rabi",
    soilType: "Clay loam, deep alluvial",
    duration: "120–150 days",
    waterReq: "Medium (400–500mm)",
    regions: ["Punjab", "Haryana", "UP", "MP"],
    stages: [
      { week: "W1–W2", label: "Germination", color: "#8B6914" },
      { week: "W3–W5", label: "Tillering", color: "#6B8E23" },
      { week: "W6–W9", label: "Jointing / Booting", color: "#3A7D44" },
      { week: "W10–W13", label: "Heading / Flowering", color: "#C8A000" },
      { week: "W14–W17", label: "Grain Filling", color: "#E8A838" },
      { week: "W18–W20", label: "Harvest", color: "#8B4513" },
    ],
    fertilizer: [
      { timing: "Basal", dose: "DAP 50kg/acre" },
      { timing: "21 DAS (1st irrigation)", dose: "Urea 33kg/acre" },
      { timing: "45 DAS (2nd irrigation)", dose: "Urea 33kg/acre" },
    ],
    pests: [
      { name: "Aphids", action: "Thiamethoxam 25WG @ 100g/acre" },
      { name: "Yellow Rust", action: "Propiconazole 1ml/L, spray early" },
      { name: "Loose Smut", dose: "Seed treatment: Carboxin 75WP" },
    ],
  },
];

const MANDI_DATA = {
  Nashik: [
    {
      crop: "Tomato",
      icon: "🍅",
      min: 420,
      max: 680,
      modal: 540,
      unit: "₹/quintal",
      trend: [320, 390, 450, 520, 490, 540, 540],
      aiExplanation:
        "Prices have risen 12% this week due to reduced arrivals from Pune belt after unseasonal rain. Expect rates to stabilize next week as Jalgaon supplies increase.",
    },
    {
      crop: "Onion",
      icon: "🧅",
      min: 1100,
      max: 1450,
      modal: 1250,
      unit: "₹/quintal",
      trend: [900, 980, 1050, 1120, 1200, 1250, 1250],
      aiExplanation:
        "Strong export demand to Sri Lanka and Bangladesh is pushing prices up. Storage onion from Lasalgaon entering market may ease prices by 5–8% in next 10 days.",
    },
    {
      crop: "Grapes",
      icon: "🍇",
      min: 3200,
      max: 4800,
      modal: 3800,
      unit: "₹/quintal",
      trend: [3600, 3400, 3200, 3500, 3700, 3800, 3800],
      aiExplanation:
        "Thompson seedless rates at Nashik mandi are recovering after dip mid-week. Export quality grapes fetching premium. Domestic demand steady.",
    },
  ],
};

const COMMUNITY_POSTS = [
  {
    id: 1,
    author: "Suresh Patil",
    location: "Ahmednagar, MH",
    avatar: "SP",
    verified: false,
    expertBadge: false,
    lang: "en",
    question:
      "My onion leaves are turning yellow from tips. Soil is normal. What could be the reason? Applied urea 10 days ago.",
    image: null,
    upvotes: 14,
    answers: 3,
    tags: ["onion", "yellowing", "fertilizer"],
    time: "2 hours ago",
    aiSuggestion:
      "Tip yellowing after urea application often indicates nitrogen toxicity or magnesium deficiency. Check if yellowing starts from older leaves (Mg deficiency) or newer ones. If using drip, flush with plain water for 2 days.",
    bestAnswer: {
      author: "Dr. Ramesh Kulkarni",
      badge: "KVK Expert",
      text: "Most likely Thrips damage combined with Stemphylium blight early stage. Check undersides of leaves for tiny insects. Spray Spinosad 45SC @ 0.3ml/L + Tebuconazole 1ml/L. Repeat after 7 days.",
    },
  },
  {
    id: 2,
    author: "Kamla Devi",
    location: "Sikar, Rajasthan",
    avatar: "KD",
    verified: true,
    expertBadge: false,
    lang: "hi",
    question:
      "गेहूं की फसल में पीले जंग के धब्बे आ रहे हैं। क्या स्प्रे करूं? खेत में नमी ज़्यादा है।",
    image: "rust_wheat.jpg",
    upvotes: 29,
    answers: 7,
    tags: ["wheat", "yellow-rust", "disease"],
    time: "5 hours ago",
    aiSuggestion:
      "Yellow rust (Puccinia striiformis) is common in humid conditions above 1000m altitude. Immediate action: Propiconazole 25EC @ 1ml/L spray. Repeat at 15 days if severity persists.",
    bestAnswer: {
      author: "Punjab Agriculture Officer",
      badge: "Govt. Verified",
      text: "Apply Propiconazole + Tebuconazole mix immediately. Avoid irrigation for 5 days. Remove severely affected leaves by hand. Alert neighboring farmers as it spreads via wind.",
    },
  },
];

const TRANSPORT_REQUESTS = [
  {
    id: "TR-2024-1847",
    from: "Nashik (Ozar Village)",
    to: "Navi Mumbai (APMC)",
    crop: "Onion",
    quantity: "5 Tons",
    date: "28 Feb 2025",
    status: "matched",
    driver: "Mukesh Transport Co.",
    vehicle: "Tata 407 (MH15-AB-4421)",
    estimatedCost: "₹6,200",
    eta: "6:00 AM departure",
  },
];

// ── Mini Sparkline Component 
function Sparkline({ data, color = "#3A7D44", width = 120, height = 40 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 6) - 3;
        return i === data.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        ) : null;
      })}
    </svg>
  );
}

// ── Crop Timeline 
function CropTimeline({ stages }) {
  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", gap: 4, minWidth: 480 }}>
        {stages.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: s.color,
              borderRadius: 6,
              padding: "8px 6px",
              textAlign: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              minWidth: 72,
            }}
          >
            <div style={{ fontSize: 9, opacity: 0.85, marginBottom: 2 }}>{s.week}</div>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Expert Badge 
function Badge({ label, color = "#2E7D32" }) {
  return (
    <span
      style={{
        background: color + "20",
        color: color,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      ✓ {label}
    </span>
  );
}

// ── Tab Bar
function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid #E8DCC8",
        background: "#FDFAF4",
        overflowX: "auto",
        gap: 0,
      }}
    >
      {tabs.map((t, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            flex: "0 0 auto",
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: active === i ? 700 : 500,
            color: active === i ? "#5C3A1E" : "#8B7355",
            background: "none",
            border: "none",
            borderBottom: active === i ? "3px solid #8B6914" : "3px solid transparent",
            cursor: "pointer",
            marginBottom: -2,
            whiteSpace: "nowrap",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: "1px solid #E8DCC8",
        padding: 16,
        marginBottom: 14,
        boxShadow: "0 1px 4px rgba(92,58,30,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Module 1: Crop Intelligence Library ──────────────────────────────────────
function CropLibrary({ lang }) {
  const [selected, setSelected] = useState(CROPS_DATA[0]);
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState("All");

  const regions = ["All", "Maharashtra", "Punjab", "Karnataka", "Gujarat", "UP"];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: regionFilter === r ? "none" : "1px solid #D4B896",
              background: regionFilter === r ? "#8B6914" : "#FFF8EE",
              color: regionFilter === r ? "#fff" : "#6B4226",
              cursor: "pointer",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, overflowX: "auto" }}>
        {CROPS_DATA.filter(
          (c) => regionFilter === "All" || c.regions.includes(regionFilter)
        ).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              borderRadius: 10,
              border: selected.id === c.id ? "2px solid #8B6914" : "2px solid #E8DCC8",
              background: selected.id === c.id ? "#FFF8EE" : "#fff",
              cursor: "pointer",
              textAlign: "center",
              minWidth: 72,
            }}
          >
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5C3A1E", marginTop: 2 }}>
              {lang === "hi" ? c.nameHi : c.name}
            </div>
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 36 }}>{selected.icon}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#3A2010" }}>
              {lang === "hi" ? selected.nameHi : selected.name}
            </div>
            <div style={{ fontSize: 12, color: "#7A5C3A" }}>
              {selected.season} · {selected.duration}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
            background: "#FFF8EE",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {[
            ["🌱 Soil", selected.soilType],
            ["💧 Water", selected.waterReq],
            ["📅 Season", selected.season],
            ["📍 Regions", selected.regions.slice(0, 2).join(", ")],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: "#9B8060", fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 13, color: "#3A2010", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        <TabBar
          tabs={["Growth Timeline", "Fertilizer", "Pest Management"]}
          active={tab}
          onChange={setTab}
        />

        <div style={{ marginTop: 14 }}>
          {tab === 0 && (
            <>
              <div style={{ fontSize: 12, color: "#7A5C3A", marginBottom: 8, fontWeight: 600 }}>
                Visual Crop Timeline
              </div>
              <CropTimeline stages={selected.stages} />
            </>
          )}
          {tab === 1 && (
            <div>
              {selected.fertilizer.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < selected.fertilizer.length - 1 ? "1px solid #F0E8D8" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#8B6914",
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3A1E" }}>{f.timing}</div>
                    <div style={{ fontSize: 13, color: "#3A2010", marginTop: 2 }}>{f.dose}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 2 && (
            <div>
              {selected.pests.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: "#FFF5F0",
                    border: "1px solid #E8C8B8",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#8B2500",
                      marginBottom: 4,
                    }}
                  >
                    ⚠ {p.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#3A2010" }}>
                    <b>Action:</b> {p.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Module 2: Community Q&A ───────────────────────────────────────────────────
function Community({ lang }) {
  const [expanded, setExpanded] = useState(null);
  const [newQ, setNewQ] = useState("");
  const [aiPreview, setAiPreview] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAICheck = () => {
    if (newQ.length > 10) {
      setAiPreview(
        "AI Suggestion: Based on your question, check if your soil moisture is adequate and whether you've recently applied any chemical spray. Common causes include overwatering, fungal infection, or nutrient imbalance. You may get faster answers by adding your crop stage and soil type."
      );
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: "100%",
          padding: "14px",
          background: "#3A7D44",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        + Post a Question
      </button>

      {showForm && (
        <Card style={{ background: "#F8FFF8", border: "1px solid #A8D8A8" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", marginBottom: 10 }}>
            Ask the Community
          </div>
          <textarea
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="Describe your problem clearly. Mention crop, location, symptoms..."
            style={{
              width: "100%",
              minHeight: 90,
              borderRadius: 8,
              border: "1px solid #C8E6C9",
              padding: 10,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 12 }}>
            <div
              style={{
                flex: 1,
                border: "2px dashed #C8E6C9",
                borderRadius: 8,
                padding: "10px",
                textAlign: "center",
                fontSize: 12,
                color: "#558B2F",
                cursor: "pointer",
              }}
            >
              📷 Add Photo
            </div>
            <select
              style={{
                flex: 1,
                borderRadius: 8,
                border: "1px solid #C8E6C9",
                padding: "8px",
                fontSize: 12,
                color: "#3A2010",
              }}
            >
              <option>English</option>
              <option>हिन्दी</option>
              <option>मराठी</option>
              <option>ਪੰਜਾਬੀ</option>
              <option>తెలుగు</option>
            </select>
          </div>
          {aiPreview && (
            <div
              style={{
                background: "#E8F5E9",
                border: "1px solid #A5D6A7",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                fontSize: 12,
                color: "#1B5E20",
              }}
            >
              🤖 <b>AI Pre-check:</b> {aiPreview}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAICheck}
              style={{
                flex: 1,
                padding: "10px",
                background: "#FFF8EE",
                border: "1px solid #D4B896",
                borderRadius: 8,
                fontSize: 13,
                color: "#6B4226",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🤖 Check with AI First
            </button>
            <button
              style={{
                flex: 1,
                padding: "10px",
                background: "#3A7D44",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Post to Community
            </button>
          </div>
        </Card>
      )}

      {COMMUNITY_POSTS.map((post) => (
        <Card key={post.id}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#D4A574",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {post.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#3A2010" }}>{post.author}</span>
                {post.verified && <Badge label="Verified Farmer" color="#2E7D32" />}
              </div>
              <div style={{ fontSize: 11, color: "#9B8060" }}>
                📍 {post.location} · {post.time}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: "#2A1800", lineHeight: 1.55, marginBottom: 10 }}>
            {post.question}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {post.tags.map((t) => (
              <span
                key={t}
                style={{
                  background: "#F0E8D8",
                  color: "#6B4226",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                #{t}
              </span>
            ))}
          </div>

          <div
            style={{
              background: "#E8F5E9",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              fontSize: 12,
              color: "#1B5E20",
            }}
          >
            🤖 <b>AI Suggestion:</b> {post.aiSuggestion}
          </div>

          <div
            style={{
              background: "#FFF8EE",
              border: "1px solid #E8C090",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5C3A1E" }}>
                {post.bestAnswer.author}
              </span>
              <Badge label={post.bestAnswer.badge} color="#8B6914" />
            </div>
            <div style={{ fontSize: 13, color: "#2A1800", lineHeight: 1.5 }}>
              {post.bestAnswer.text}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid #F0E8D8",
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "1px solid #D4B896",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                color: "#6B4226",
              }}
            >
              👍 {post.upvotes} Helpful
            </button>
            <button
              onClick={() => setExpanded(expanded === post.id ? null : post.id)}
              style={{
                background: "none",
                border: "1px solid #D4B896",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                color: "#6B4226",
              }}
            >
              💬 {post.answers} Answers
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Module 3: Mandi Rates ─────────────────────────────────────────────────────
function MandiRates({ lang }) {
  const [district, setDistrict] = useState("Nashik");
  const [expanded, setExpanded] = useState(null);
  const rates = MANDI_DATA[district] || MANDI_DATA["Nashik"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #D4B896",
            fontSize: 13,
            color: "#3A2010",
            background: "#FFF8EE",
          }}
        >
          {["Nashik", "Pune", "Aurangabad", "Solapur", "Latur"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#E8F5E9",
            fontSize: 12,
            color: "#2E7D32",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
          }}
        >
          🟢 Live
        </div>
      </div>

      <div
        style={{
          background: "#F0E8D8",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: 12,
          color: "#5C3A1E",
        }}
      >
        📅 Last updated: Today 11:30 AM · Source: Agmarknet + State APMC
      </div>

      {rates.map((r) => (
        <Card key={r.crop}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === r.crop ? null : r.crop)}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 32 }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#3A2010" }}>{r.crop}</div>
                <div style={{ fontSize: 12, color: "#7A5C3A" }}>{district} APMC</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2E7D32" }}>
                ₹{r.modal.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#9B8060" }}>Modal · {r.unit}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 12,
              background: "#FFF8EE",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#9B8060" }}>Min Price</div>
              <div style={{ fontWeight: 700, color: "#D4522A", fontSize: 14 }}>₹{r.min}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9B8060" }}>Max Price</div>
              <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: 14 }}>₹{r.max}</div>
            </div>
          </div>

          {expanded === r.crop && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#5C3A1E", marginBottom: 8 }}>
                7-Day Price Trend
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
                <div>
                  {days.map((d, i) => (
                    <div key={d} style={{ display: "inline-block", textAlign: "center", width: 32, fontSize: 10, color: "#9B8060" }}>
                      {d}
                    </div>
                  ))}
                  <div>
                    {r.trend.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          display: "inline-block",
                          width: 32,
                          textAlign: "center",
                          fontSize: 10,
                          fontWeight: i === 6 ? 700 : 400,
                          color: i === 6 ? "#2E7D32" : "#5C3A1E",
                        }}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
                <Sparkline data={r.trend} color="#3A7D44" width={120} height={40} />
              </div>
              <div
                style={{
                  background: "#E8F5E9",
                  border: "1px solid #A5D6A7",
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 12,
                  fontSize: 12,
                  color: "#1B5E20",
                  lineHeight: 1.6,
                }}
              >
                🤖 <b>Price Insight:</b> {r.aiExplanation}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── Module 4: Transport ───────────────────────────────────────────────────────
function Transport({ lang }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    from: "",
    to: "",
    crop: "",
    quantity: "",
    date: "",
  });

  return (
    <div>
      {TRANSPORT_REQUESTS.map((req) => (
        <Card key={req.id} style={{ border: "1px solid #A5D6A7", background: "#F8FFF8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>
              Active Booking: {req.id}
            </div>
            <Badge label="Driver Matched" color="#2E7D32" />
          </div>
          <div style={{ fontSize: 13, color: "#2A1800", marginBottom: 8 }}>
            📦 {req.crop} · {req.quantity}
            <br />
            📍 {req.from}
            <br />
            🏪 → {req.to}
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #C8E6C9",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1B5E20" }}>🚛 {req.driver}</div>
            <div style={{ fontSize: 12, color: "#558B2F" }}>{req.vehicle}</div>
            <div style={{ fontSize: 12, color: "#558B2F" }}>{req.eta}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3A7D44" }}>{req.estimatedCost}</div>
            <button
              style={{
                padding: "8px 16px",
                background: "#2E7D32",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Call Driver
            </button>
          </div>
        </Card>
      ))}

      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#3A2010", marginBottom: 14 }}>
          Request New Pickup
        </div>

        {[
          ["📍 From (Village/Town)", "from", "e.g. Ozar Village, Nashik"],
          ["🏪 To (Market/APMC)", "to", "e.g. Navi Mumbai APMC"],
          ["🌾 Crop Type", "crop", "e.g. Onion, Tomato"],
          ["⚖️ Quantity", "quantity", "e.g. 3 tons"],
          ["📅 Pickup Date", "date", ""],
        ].map(([label, field, placeholder]) => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5C3A1E", marginBottom: 4 }}>
              {label}
            </label>
            <input
              type={field === "date" ? "date" : "text"}
              placeholder={placeholder}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #D4B896",
                fontSize: 13,
                color: "#3A2010",
                background: "#FFF8EE",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <div
          style={{
            background: "#FFF8EE",
            border: "1px solid #E8C090",
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8B6914", marginBottom: 4 }}>
            📊 Estimated Cost (AI)
          </div>
          <div style={{ fontSize: 14, color: "#3A2010" }}>
            Based on distance & load: <b>₹5,500–7,000</b>
          </div>
          <div style={{ fontSize: 11, color: "#9B8060", marginTop: 2 }}>
            Diesel rate ₹92/L · ~180km · Tata 407
          </div>
        </div>

        <button
          style={{
            width: "100%",
            padding: "14px",
            background: "#8B6914",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Find Available Transporters
        </button>
      </Card>
    </div>
  );
}

// ── Module 5: AI Chatbot ──────────────────────────────────────────────────────
const SAMPLE_CONVERSATION = [
  {
    role: "bot",
    text: "Namaskar Ramesh ji 🙏\n\nMujhe pata hai aap Nashik mein tomato aur onion ugaate hain. Abhi February mein Rabi season chal raha hai. Aaj kisi baat ki madad chahiye? Mandi rates, pest problem, ya kuch aur?",
  },
  {
    role: "user",
    text: "Mere tomato ke patte mein curl ho raha hai. Kya spray karna chahiye?",
  },
  {
    role: "bot",
    text: "🌿 Tomato Leaf Curl — Nashik Region (Feb)\n\nLeaf curl usually means:\n1. Tomato Leaf Curl Virus (TLCV) — spread by whitefly\n2. Water stress or root problem\n\n✅ Recommended Action:\n• Check underside of leaves for tiny white flies\n• If whitefly found: Imidacloprid 17.8SL @ 0.5ml/L spray\n• Use silver/reflective mulch to repel whitefly\n• Avoid wetting foliage during spray\n\n⚠️ No chemical can cure virus — remove infected plants early to stop spread.\n\nKya aapke khet mein seedlings ka transplant kitne din pehle hua?",
  },
];

function Chatbot({ lang }) {
  const [messages, setMessages] = useState(SAMPLE_CONVERSATION);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const chatRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "🔄 Aapke sawal ka jawab dhundh raha hoon...\n\n[This response would come from the LLM API with farmer context: location=Nashik, crops=[tomato, onion], season=Rabi, month=February]\n\nKripya thoda wait karein ya apna sawal aur detail mein batayein.",
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const contextChips = ["🍅 Tomato issue", "🧅 Onion price", "🌧️ Weather impact", "🚛 Transport help"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 400 }}>
      <div
        style={{
          background: "#F0F7F0",
          border: "1px solid #A5D6A7",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 12,
          color: "#1B5E20",
        }}
      >
        🌍 <b>Context Active:</b> Nashik, MH · Tomato + Onion · Rabi Season · Feb 2025
        <span
          style={{
            marginLeft: 8,
            background: "#2E7D32",
            color: "#fff",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
          }}
        >
          Personalized
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#FDF8F0",
          borderRadius: 10,
          border: "1px solid #E8DCC8",
          padding: 12,
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            {m.role === "bot" && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#3A7D44",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  marginRight: 8,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                🌱
              </div>
            )}
            <div
              style={{
                maxWidth: "82%",
                background: m.role === "user" ? "#8B6914" : "#fff",
                color: m.role === "user" ? "#fff" : "#2A1800",
                borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "10px 13px",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                border: m.role === "bot" ? "1px solid #E8DCC8" : "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#3A7D44",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              🌱
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8DCC8",
                borderRadius: "12px 12px 12px 2px",
                padding: "10px 16px",
                fontSize: 16,
                letterSpacing: 4,
              }}
            >
              ···
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto" }}>
        {contextChips.map((c) => (
          <button
            key={c}
            onClick={() => setInput(c.replace(/^[^\s]+ /, ""))}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: 16,
              fontSize: 12,
              background: "#FFF8EE",
              border: "1px solid #D4B896",
              color: "#6B4226",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setVoiceMode(!voiceMode)}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: voiceMode ? "#D4522A" : "#F0E8D8",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={lang === "hi" ? "अपना सवाल लिखें..." : "Type your question..."}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 22,
            border: "1px solid #D4B896",
            fontSize: 13,
            background: "#FFF8EE",
            color: "#3A2010",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#3A7D44",
            border: "none",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </div>
      {voiceMode && (
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 12,
            color: "#D4522A",
            fontWeight: 600,
          }}
        >
          🔴 Listening... (Web Speech API — browser permission required)
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [lang, setLang] = useState("en");
  const t = LANGS[lang];

  const modules = [
    { label: t.nav[0], icon: "🌱", component: <CropLibrary lang={lang} /> },
    { label: t.nav[1], icon: "👥", component: <Community lang={lang} /> },
    { label: t.nav[2], icon: "📊", component: <MandiRates lang={lang} /> },
    { label: t.nav[3], icon: "🚛", component: <Transport lang={lang} /> },
    { label: t.nav[4], icon: "🤖", component: <Chatbot lang={lang} /> },
  ];

  return (
    <div
      style={{
        fontFamily: "'Mukta', 'Noto Sans Devanagari', -apple-system, sans-serif",
        background: "#F5EDD8",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F5EDD8; }
        ::-webkit-scrollbar-thumb { background: #C8A870; border-radius: 4px; }
        button { font-family: inherit; }
        input, textarea, select { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "#3A2010",
          color: "#F5EDD8",
          padding: "14px 16px 10px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              {t.appName}
            </div>
            <div style={{ fontSize: 11, color: "#C8A870", fontWeight: 500 }}>{t.tagline}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["en", "hi", "mr"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 6,
                  border: "none",
                  background: lang === l ? "#C8A870" : "#5C3A1E",
                  color: lang === l ? "#3A2010" : "#C8A870",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {l === "en" ? "EN" : l === "hi" ? "हि" : "मर"}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            background: "#5C3A1E",
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#F5EDD8" }}>{t.greeting}</div>
            <div style={{ fontSize: 11, color: "#C8A870" }}>📍 {t.location}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#C8A870" }}>Season</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C870" }}>Rabi 2025</div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          position: "sticky",
          top: 108,
          zIndex: 99,
          background: "#2A1800",
          display: "flex",
          overflowX: "auto",
          paddingBottom: 1,
        }}
      >
        {modules.map((m, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              flex: "0 0 auto",
              minWidth: 76,
              padding: "10px 8px 8px",
              background: "none",
              border: "none",
              borderBottom: activeTab === i ? "3px solid #C8A870" : "3px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? "#C8A870" : "#9B8060",
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 14px", paddingBottom: 40 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#3A2010", marginBottom: 14 }}>
          {[t.cropLib, t.community, t.mandi, t.transport, t.chatbot][activeTab]}
        </div>
        {modules[activeTab].component}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "12px 16px",
          fontSize: 11,
          color: "#9B8060",
          borderTop: "1px solid #E8DCC8",
        }}
      >
        Kisan Saathi · Built for Indian Farmers · Data: Agmarknet, IMD, KVK
      </div>
    </div>
  );
}
