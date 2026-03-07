/**
 * MongoDB Schemas — Kisan Saathi
 *
 * Design principles:
 * - Denormalize frequently read data (e.g., author name on posts) to avoid joins
 * - Store multilingual text as { en, hi, mr, pa, te } objects
 * - Keep farmer profile minimal — many users share phones within family
 * - Use compound indexes for region+crop queries (core use case)
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ── User / Farmer Profile ─────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Stored as +91XXXXXXXXXX
      match: /^\+91[6-9]\d{9}$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    preferredLang: {
      type: String,
      enum: ["en", "hi", "mr", "pa", "te", "kn", "gu"],
      default: "hi",
    },
    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      village: { type: String },
      // GeoJSON for distance-based features (e.g., nearest transport)
      coordinates: {
        type: { type: String, default: "Point" },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    crops: [
      {
        cropId: { type: Schema.Types.ObjectId, ref: "Crop" },
        cropName: String, // denormalized for quick display
        landAcres: Number,
        season: { type: String, enum: ["Kharif", "Rabi", "Zaid", "Perennial"] },
      },
    ],
    farmSizeAcres: { type: Number, min: 0.1, max: 10000 },
    soilType: {
      type: String,
      enum: ["Sandy", "Loamy", "Clay", "Sandy-Loam", "Clay-Loam", "Black Cotton", "Red Laterite"],
    },
    irrigationSource: {
      type: String,
      enum: ["Borewell", "Canal", "Drip", "Sprinkler", "Rainfed", "River"],
    },
    expertVerified: { type: Boolean, default: false },
    expertRole: String, // "KVK Scientist", "Agriculture Officer", etc.
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },

    // Lightweight profile — no email/password dependency
    otp: { code: String, expiresAt: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ "location.district": 1, "crops.cropName": 1 });

// ── Crop Master Data ──────────────────────────────────────────────────────────
const cropSchema = new Schema(
  {
    slug: { type: String, unique: true, lowercase: true }, // "tomato", "onion"
    name: {
      en: String,
      hi: String,
      mr: String,
      pa: String,
      te: String,
    },
    icon: String, // emoji
    category: {
      type: String,
      enum: ["Vegetable", "Cereal", "Pulse", "Oilseed", "Fruit", "Spice", "Cash Crop"],
    },
    seasons: [{ type: String, enum: ["Kharif", "Rabi", "Zaid", "Perennial"] }],
    regions: [String], // ["Maharashtra", "Karnataka"]
    soilTypes: [String],

    // Duration object for different varieties
    durationDays: {
      min: Number,
      max: Number,
      note: String, // "Shorter for hybrid varieties"
    },

    waterRequirementMM: { min: Number, max: Number },

    growthStages: [
      {
        order: Number,
        weekRange: String, // "W3-W5"
        labelEn: String,
        labelHi: String,
        color: String, // hex for timeline UI
        criticalActions: [String],
      },
    ],

    fertilizerSchedule: [
      {
        timing: String,
        daysAfterSowing: Number,
        dose: String, // "DAP 50kg/acre + FYM 2 ton"
        nutrientFocus: String, // "Nitrogen", "Phosphorus"
        method: { type: String, enum: ["Basal", "Top-dress", "Foliar", "Fertigation"] },
      },
    ],

    pestManagement: [
      {
        pestName: String,
        pestNameHi: String,
        type: { type: String, enum: ["Insect", "Fungal", "Bacterial", "Viral", "Nematode", "Weed"] },
        symptoms: String,
        symptomsHi: String,
        // Array of control measures (chemical + organic options)
        controlMeasures: [
          {
            method: { type: String, enum: ["Chemical", "Biological", "Cultural", "Mechanical"] },
            product: String,
            dose: String,
            timing: String,
          },
        ],
        severity: { type: String, enum: ["Low", "Medium", "High", "Critical"] },
        season: [String],
      },
    ],

    irrigationSchedule: [
      {
        stage: String,
        intervalDays: Number,
        depthMM: Number,
        method: String,
      },
    ],

    // Average market price range for reference
    priceRangePerQuintal: { min: Number, max: Number },

    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String, // "KVK Nashik", "ICAR"
  },
  { timestamps: true }
);

cropSchema.index({ slug: 1 });
cropSchema.index({ regions: 1, seasons: 1 });

// ── Mandi (Market) Rate ────────────────────────────────────────────────────────
const mandiRateSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    crop: { type: Schema.Types.ObjectId, ref: "Crop", required: true },
    cropName: String, // denormalized
    cropSlug: String,

    location: {
      state: String,
      district: { type: String, required: true },
      mandiName: String, // "Nashik APMC", "Lasalgaon"
      apmc_code: String, // Agmarknet APMC code
    },

    prices: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      modal: { type: Number, required: true }, // Most common price
      unit: { type: String, default: "quintal" },
      currency: { type: String, default: "INR" },
    },

    arrivals: {
      quantity: Number,
      unit: { type: String, default: "tonnes" },
    },

    // AI-generated explanation (cached, refreshed daily)
    aiPriceExplanation: String,
    aiExplanationGeneratedAt: Date,

    // Data source tracking
    source: {
      type: String,
      enum: ["Agmarknet", "APMC-Direct", "Manual-Entry", "Estimated"],
      default: "Agmarknet",
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mandiRateSchema.index({ date: -1, "location.district": 1, cropSlug: 1 });
mandiRateSchema.index({ cropSlug: 1, date: -1 });

// ── Community Post ────────────────────────────────────────────────────────────
const communityPostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Denormalized for display without join on every list fetch
    authorName: String,
    authorLocation: String, // "Nashik, MH"
    authorIsExpert: { type: Boolean, default: false },
    authorExpertRole: String,

    content: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 2000,
    },
    language: {
      type: String,
      enum: ["en", "hi", "mr", "pa", "te", "kn", "gu"],
      default: "hi",
    },

    // Image stored as Cloudinary URL (or local path in dev)
    images: [
      {
        url: String,
        thumbnailUrl: String,
        altText: String,
      },
    ],

    tags: [String], // ["tomato", "yellowing", "pest"]
    cropId: { type: Schema.Types.ObjectId, ref: "Crop" },
    cropSlug: String,

    // AI suggestion generated before/after posting
    aiSuggestion: {
      text: String,
      generatedAt: Date,
      confidence: { type: String, enum: ["High", "Medium", "Low"] },
    },

    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],

    answers: [
      {
        author: { type: Schema.Types.ObjectId, ref: "User" },
        authorName: String,
        authorIsExpert: Boolean,
        authorExpertRole: String,
        content: String,
        language: String,
        upvotes: { type: Number, default: 0 },
        upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        isBestAnswer: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    location: {
      state: String,
      district: String,
    },

    status: {
      type: String,
      enum: ["active", "resolved", "flagged", "deleted"],
      default: "active",
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

communityPostSchema.index({ cropSlug: 1, createdAt: -1 });
communityPostSchema.index({ "location.district": 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ "$**": "text" }); // Full text search

// ── Transport Request ─────────────────────────────────────────────────────────
const transportRequestSchema = new Schema(
  {
    requestId: { type: String, unique: true }, // "TR-2024-XXXX"
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    farmerName: String,
    farmerPhone: String,

    cargo: {
      cropId: { type: Schema.Types.ObjectId, ref: "Crop" },
      cropName: String,
      quantityTons: { type: Number, required: true, min: 0.1 },
      packagingType: {
        type: String,
        enum: ["Loose", "Bags-50kg", "Bags-25kg", "Crates", "Cartons"],
        default: "Bags-50kg",
      },
      specialHandling: String, // "Keep dry", "Refrigeration needed"
    },

    pickup: {
      address: String,
      village: String,
      district: String,
      state: String,
      coordinates: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
      },
      scheduledAt: { type: Date, required: true },
      timePreference: {
        type: String,
        enum: ["Early Morning (4-6 AM)", "Morning (6-10 AM)", "Afternoon", "Evening", "Flexible"],
        default: "Early Morning (4-6 AM)",
      },
    },

    delivery: {
      address: String,
      marketName: String, // "Navi Mumbai APMC"
      district: String,
      state: String,
      coordinates: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
      },
    },

    estimatedDistanceKm: Number,
    estimatedCostRange: { min: Number, max: Number },
    agreedCost: Number,

    status: {
      type: String,
      enum: [
        "pending",      // Farmer submitted, finding transporter
        "matched",      // Transporter found
        "confirmed",    // Both parties confirmed
        "in-transit",   // Driver picked up
        "delivered",    // Reached market
        "cancelled",
        "disputed",
      ],
      default: "pending",
    },

    transporter: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      companyName: String,
      driverName: String,
      phone: String,
      vehicleNumber: String,
      vehicleType: {
        type: String,
        enum: ["Tata-207", "Tata-407", "Mahindra-Pickup", "Mini-Truck-1T", "Truck-5T", "Truck-10T"],
      },
    },

    // Simple tracking: array of status updates with timestamp
    trackingHistory: [
      {
        status: String,
        message: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    paymentStatus: {
      type: String,
      enum: ["pending", "paid-cash", "paid-upi", "disputed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

transportRequestSchema.index({ farmer: 1, createdAt: -1 });
transportRequestSchema.index({ status: 1, "pickup.scheduledAt": 1 });
transportRequestSchema.index({ "pickup.coordinates": "2dsphere" });

// ── Chatbot Conversation ──────────────────────────────────────────────────────
// Stores conversation history for context continuity across sessions
const chatSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, unique: true },

    // Farmer context injected into every LLM prompt
    context: {
      location: String,
      crops: [String],
      season: String,
      month: Number,
      soilType: String,
      irrigationSource: String,
      lang: String,
    },

    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
        // Track what type of answer was given for analytics
        answerCategory: {
          type: String,
          enum: ["crop-advice", "pest-diagnosis", "market-insight", "transport", "weather", "general"],
        },
        tokensUsed: Number,
      },
    ],

    // For offline/low-bandwidth: cache last bot response
    lastBotResponse: String,
    lastInteractionAt: { type: Date, default: Date.now },

    // Total tokens used this session (for cost tracking)
    totalTokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, lastInteractionAt: -1 });

// ── Exports ────────────────────────────────────────────────────────────────────
const User = mongoose.model("User", userSchema);
const Crop = mongoose.model("Crop", cropSchema);
const MandiRate = mongoose.model("MandiRate", mandiRateSchema);
const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
const TransportRequest = mongoose.model("TransportRequest", transportRequestSchema);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = { User, Crop, MandiRate, CommunityPost, TransportRequest, ChatSession };
