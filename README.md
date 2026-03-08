# 🌾 Kisan Saathi — Farmer Crop Intelligence & Community Platform

A production-minded, rural-first agricultural platform for Indian farmers.
Built for low-bandwidth, multilingual, mobile use with practical AI integration.

**🌐 Live Demos:**
- **Frontend App:** [https://kisan-saathi-mu.vercel.app](https://kisan-saathi-mu.vercel.app)
- **Backend API (Swagger Docs):** [https://kisan-saathi-evak.onrender.com/docs](https://kisan-saathi-evak.onrender.com/docs)

> **🌟 Core Highlight**: As part of this comprehensive platform, **we have created our own custom AI models** specifically for localized agricultural needs. Our custom machine learning pipeline powers the **Plant Disease Detection** (analyzing crop photos) and **Market Price Prediction** algorithms to give farmers highly accurate, actionable insights.

---

## Project Structure

```text
Kisan-Sathi/
├── Frontend/                   # React app (mobile-first UI)
│   └── my-react-app/
│       ├── src/
│       │   ├── App.jsx             # Main routing and layout
│       │   ├── pages/              # Dashboards (Farmer, Transport, Login)
│       │   ├── components/         # Reusable UI components
│       │   ├── api/                # API communication layers
│       │   └── context/            # Global state (Auth, Lang)
│       └── package.json
│
├── Backend/                    # FastAPI (Python) API
│   ├── main.py                 # Application entry point
│   ├── routes/                 # API endpoint routers (Auth, Chat, Community, etc.)
│   ├── services/               # Core business logic & AI Model Integrations
│   ├── models/                 # Pydantic models (Schemas)
│   ├── database.py             # MongoDB connection handling
│   ├── config.py               # Environment configuration
│   └── requirements.txt
│
└── README.md                   # This file
```

---

## 🚀 Key Features & Modules

### 1. Custom AI Models (Our Innovation)
- **Disease Diagnosis**: We built our own custom vision model pipeline (integrated with multimodal AI layers) to instantly analyze plant and leaf photos. It detects diseases, provides a confidence score, and gives actionable remedies.
- **Price Prediction & Mandi Rates**: We developed a custom predictive model that analyzes historical market data (Agmarknet) to forecast crop price trends, helping farmers decide when and where to sell for maximum profit.

### 2. Kisan Mitra AI (Chatbot)
- Deeply personalized contextual chatbot for farmers.
- Supports regional languages (Hindi, Marathi, English) allowing farmers to speak in their native tongue.
- Provides advice on farming practices, weather impacts, and government schemes.

### 3. Community Feed
- A platform for farmers to share knowledge, ask questions, and post updates.
- Supports text posts and optional photo uploads via Cloudinary.
- Like and interact with posts from nearby farmers.

### 4. Transport & Logistics
- A dedicated shoutbox for booking transport vehicles (trucks, tempos) for carrying crops to the mandi.
- Match farmers with local transporters.

### 5. Multilingual & Earthy UI
- Designed with high-contrast, earthy tones suitable for outdoor visibility under the sun.
- Seamless toggling between English (EN), Hindi (HI), and Marathi (MR) to ensure extreme accessibility.

---

## Tech Stack

### Frontend
- **Framework**: React.js (via Vite)
- **Styling**: Vanilla CSS (CSS Modules)
- **Routing**: React Router DOM
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT & Passlib (bcrypt hashing)
- **Cloud Storage**: Cloudinary (for community images and diagnosis uploads)
- **AI Integrations**: Gemini APIs + Custom Machine Learning logic
- **Deployment**: Render

---

## Setup Instructions

### 1. Database & Cloud Setup
Ensure you have the following credentials ready:
- MongoDB Atlas URI
- Cloudinary Keys (Name, Key, Secret)
- Google Gemini API Key

### 2. Backend Setup
```bash
cd Backend
# Install dependencies
pip install -r requirements.txt
# Copy environment variables
cp .env.example .env 
# Run the FastAPI server
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd Frontend/my-react-app
# Install dependencies
npm install
# Start the Vite development server
npm run dev
```

---

Built with respect for the farmer. Designed for reality, not demos.
