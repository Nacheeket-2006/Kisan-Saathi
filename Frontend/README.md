# 🌾 Kisan Saathi — Farmer Crop Intelligence & Community Platform

A production-minded, rural-first agricultural platform for Indian farmers.
Built for low-bandwidth, multilingual, mobile use with practical AI integration.

---

## Project Structure

```
farmerci/
├── frontend/                   # React app (mobile-first, earthy UI)
│   ├── src/
│   │   ├── App.jsx             # ★ Main app — all 5 modules
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom hooks (useAuth, useLocation, useMandi)
│   │   ├── utils/              # API helpers, formatters
│   │   └── styles/             # Global CSS variables, base styles
│   └── package.json
│
├── backend/                    # Node.js/Express API
│   ├── server.js               # ★ Entry point, middleware setup
│   ├── models/
│   │   └── index.js            # ★ All MongoDB schemas (Mongoose)
│   ├── routes/
│   │   └── index.js            # ★ All API route handlers
│   ├── services/
│   │   ├── chatbot.js          # ★ AI chatbot + LLM integration
│   │   └── mandiSync.js        # Cron job — daily mandi rate sync
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── scripts/
│   │   └── seed.js             # Seed DB with crop data
│   ├── .env.example            # ★ Environment variables template
│   └── package.json
│
└── README.md                   # This file
```

---

## Architecture Decisions

### Frontend

**Why React over Next.js?**
Farmers often use the app as an installed PWA (home screen shortcut).
React SPA is simpler to deploy as a PWA with offline capability via Service Workers.
Next.js SSR adds latency on server-side and complexity for PWA setup.

**Why mobile-first (390px base)?**
85%+ of Indian farmers access internet via smartphone.
Jio/BSNL rural connections are 2G–4G variable.
Layout uses `overflowX: auto` for tables/timelines instead of hiding data.

**Why Mukta font?**
Mukta is one of the few typefaces that renders both Latin (English) and
Devanagari (Hindi/Marathi) script cleanly in the same font family.
Avoids font switching artifacts when language changes mid-sentence.

**Language switching:**
UI lang toggle (EN/हि/मर) switches interface text immediately.
Chatbot language follows `user.preferredLang` from profile.
Community posts store `language` field — app shows posts in user's language first.

### Backend

**Why MongoDB over PostgreSQL?**
Crop data schema varies significantly across crops (wheat has no "fruit set" stage;
tomato has no "tillering" stage). JSON documents handle this naturally.
Pest management arrays, fertilizer schedules, growth stages — all highly variable.
Geospatial queries (2dsphere index) work natively in MongoDB.

**Why phone-only auth (no email/password)?**
Rural farmers often don't have email accounts.
Phone OTP is the standard auth method they're familiar with (UPI, banking apps).
30-day JWT sessions reduce login friction on shared family phones.

**Why denormalize author fields in CommunityPost?**
Community feed is the most read endpoint. Populating User on every post fetch
is expensive. Author name, location, verified status change rarely.
Trade-off: slight staleness acceptable vs. N+1 query problem at scale.

### Chatbot (USP)

**Context injection approach:**
Every LLM request receives a fresh system prompt with:
- Farmer's name, location, crops, soil type, irrigation
- Current season (derived from month)
- Latest mandi rates for their district (fetched from DB)
- Language preference

This makes the chatbot feel deeply personalized without fine-tuning.

**Why not fine-tune a model?**
Fine-tuning requires curated agricultural Q&A dataset (expensive to create).
Agricultural advice changes with seasons, new pesticide regulations, price volatility.
System prompt approach stays current; fine-tuned models go stale.

**Session compression:**
After 30 messages, old turns are summarized into a system message.
Keeps context window manageable and costs predictable.

**Voice integration:**
Web Speech API (browser-native) handles STT on-device — no API cost.
Works in Chrome, Samsung Browser (dominant mobile browsers in India).
Voice input normalized as text → same message handler.

### Mandi Rate System

**Data source: Agmarknet (data.gov.in)**
Government APMC data. Free, official, covers 3000+ markets.
API key from: https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
Limitation: Updated once daily (morning arrivals). Not truly "live."

**Fallback strategy:**
If Agmarknet API fails → use previous day's rate ± 3% variance.
Clearly marked as "Estimated" in UI.

**AI price explanation:**
Generated once per day per crop+district using LLM.
Stored in DB (aiPriceExplanation field) and reused for 24 hours.
Not called on every rate fetch — controls LLM costs.

### Transport Module

**Simple matching algorithm (current):**
- Farmer posts pickup request with coordinates
- Transporters in 50km radius notified (SMS/push)
- First to confirm gets the booking
- Not a marketplace — just a matching layer

**Production upgrade path:**
- Integrate with Loconav/Vahak transporter network APIs
- Real-time GPS tracking via transporter phone app
- Dynamic pricing based on live diesel rates

---

## API Reference

### Auth
```
POST   /api/auth/request-otp          Send OTP to phone
POST   /api/auth/verify-otp           Verify OTP, get JWT token
PATCH  /api/auth/profile              Update farmer profile
```

### Crops
```
GET    /api/crops                     List crops (filter: region, season)
GET    /api/crops/:slug               Full crop detail
GET    /api/crops/:slug/timeline      Growth stage timeline data
```

### Mandi Rates
```
GET    /api/mandi/rates               Today's rates by district
GET    /api/mandi/trends/:cropSlug    7-day price trend
GET    /api/mandi/compare             Compare multiple crops
```

### Community
```
GET    /api/community/posts           List posts (filter: district, crop, tag)
POST   /api/community/posts           Create question (auth required)
POST   /api/community/posts/:id/answer   Add answer (auth required)
POST   /api/community/posts/:id/upvote   Toggle upvote (auth required)
```

### Transport
```
POST   /api/transport/request         Submit pickup request (auth)
GET    /api/transport/my-requests     My transport history (auth)
GET    /api/transport/request/:id     Request detail + tracking (auth)
GET    /api/transport/estimate        Pre-request cost estimation
```

### Chatbot
```
POST   /api/chatbot/message           Send message, get AI response (auth)
GET    /api/chatbot/history/:id       Conversation history (auth)
POST   /api/chatbot/ai-suggestion     Pre-post AI suggestion for community
POST   /api/chatbot/voice-transcript  Voice input handler (auth)
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- SMS provider account (MSG91 recommended for India)
- LLM API key (Anthropic/OpenAI/Gemini)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run seed    # Seeds crop data (tomato, onion, wheat, rice, etc.)
npm run dev     # Development server with nodemon
```

### Frontend
```bash
cd frontend
npm install
npm start       # Opens http://localhost:3000
```

### Production Deployment
- Backend: Deploy to Railway / Render / EC2 (t3.small sufficient for 1k daily users)
- Frontend: Vercel / Netlify (static build)
- MongoDB: Atlas M10 cluster (Mumbai region for low latency)
- CDN: Cloudflare in front of both (critical for rural users — edge caching)
- SMS: MSG91 (₹0.18/SMS vs Twilio ₹1.2/SMS)

---

## Multilingual Support

| Language  | Script      | Coverage              |
|-----------|-------------|-----------------------|
| English   | Latin       | Full UI + Chatbot     |
| Hindi     | Devanagari  | Full UI + Chatbot     |
| Marathi   | Devanagari  | Full UI + Chatbot     |
| Punjabi   | Gurmukhi    | Chatbot only (v1)     |
| Telugu    | Telugu      | Chatbot only (v1)     |

Community posts can be written in any language.
Chatbot auto-detects language from user input.

---

## Data Sources
- **Crop advisory**: ICAR, KVK publications (curated into crop schema)
- **Mandi rates**: Agmarknet / data.gov.in (daily sync)
- **Weather**: IMD District Forecast API (optional integration)
- **Pest data**: National Centre for Integrated Pest Management (NCIPM)

---

## Planned Features (v2)
- [ ] Soil health card integration (government API)
- [ ] PM-KISAN scheme eligibility checker
- [ ] Satellite crop health monitoring (ISRO Bhuvan API)
- [ ] Insurance (PMFBY) claim assistance
- [ ] Input dealer directory with verified ratings
- [ ] WhatsApp bot integration (Business API)

---

Built with respect for the farmer. Designed for reality, not demos.
