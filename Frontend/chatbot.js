/**
 * Chatbot Service — Kisan Saathi AI (Kisan Mitra)
 *
 * Architecture: Context-aware wrapper around an LLM API (OpenAI/Anthropic/Gemini).
 * The chatbot is the platform's USP — it personalizes every response using:
 *   - Farmer's location, crops, soil type, irrigation source
 *   - Current season and month (determines relevant advice)
 *   - Previous conversation history (maintains context)
 *   - Real-time mandi data (pulled from DB before responding)
 *   - Language preference (responds in farmer's language)
 *
 * Language handling:
 *   - Detection: lingua library (lightweight, works offline)
 *   - Response: LLM instructed to respond in user's preferred language
 *   - Transliteration: Devanagari input supported natively
 *
 * Cost control:
 *   - Max 20 messages per session
 *   - Summarize conversation every 10 turns to compress context
 *   - Cache common crop+pest+season combos (Redis/in-memory)
 */

const express = require("express");
const chatbotRouter = express.Router();
const { User, ChatSession, MandiRate } = require("../models");
const { v4: uuidv4 } = require("uuid");

// ── LLM Provider Configuration ────────────────────────────────────────────────
// Swap provider here — all use same interface pattern below
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai"; // "openai" | "anthropic" | "gemini"

async function callLLM({ systemPrompt, messages, maxTokens = 600 }) {
  /**
   * PLACEHOLDER — Replace with actual LLM SDK call.
   *
   * Example for OpenAI:
   *   const { OpenAI } = require("openai");
   *   const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   *   const response = await client.chat.completions.create({
   *     model: "gpt-4o-mini", // cheap, fast, good for farming advice
   *     messages: [{ role: "system", content: systemPrompt }, ...messages],
   *     max_tokens: maxTokens,
   *     temperature: 0.4, // Lower = more consistent farming advice
   *   });
   *   return {
   *     content: response.choices[0].message.content,
   *     tokensUsed: response.usage.total_tokens,
   *   };
   *
   * Example for Anthropic Claude:
   *   const Anthropic = require("@anthropic-ai/sdk");
   *   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   *   const response = await client.messages.create({
   *     model: "claude-haiku-4-5",
   *     system: systemPrompt,
   *     messages,
   *     max_tokens: maxTokens,
   *   });
   *   return {
   *     content: response.content[0].text,
   *     tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
   *   };
   *
   * Example for Google Gemini:
   *   const { GoogleGenerativeAI } = require("@google/generative-ai");
   *   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
   *   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   *   const chat = model.startChat({ history: ... });
   *   const result = await chat.sendMessage(messages[messages.length - 1].content);
   *   return { content: result.response.text(), tokensUsed: 0 };
   */

  // Development stub — returns realistic farming advice placeholder
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
  return {
    content: `[LLM API not connected — Stub Response]

आपका सवाल मिला: "${lastUserMessage}"

प्रोडक्शन में यहाँ LLM से असली जवाब आएगा, जिसमें आपकी फसल, मौसम और मंडी की जानकारी शामिल होगी।

LLM_PROVIDER: ${LLM_PROVIDER}
Configure: .env → OPENAI_API_KEY या ANTHROPIC_API_KEY`,
    tokensUsed: 50,
  };
}

// ── System Prompt Builder ─────────────────────────────────────────────────────
/**
 * Builds a highly specific system prompt using farmer's profile data.
 * This is the core of the chatbot's personalization.
 * Injected fresh on every request (not stored — keeps context up to date).
 */
function buildSystemPrompt(context, latestMandiRates) {
  const {
    farmerName,
    location,
    crops,
    season,
    month,
    soilType,
    irrigationSource,
    lang,
  } = context;

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const mandiContext = latestMandiRates?.length
    ? `\nCurrent mandi rates in ${location?.district}:\n` +
      latestMandiRates.map((r) => `  - ${r.cropName}: ₹${r.prices?.modal}/quintal (modal)`).join("\n")
    : "";

  return `You are Kisan Mitra, an expert agricultural AI assistant for Indian farmers. You work for the Kisan Saathi platform.

FARMER PROFILE:
- Name: ${farmerName || "the farmer"}
- Location: ${location?.village ? location.village + ", " : ""}${location?.district || "Unknown"}, ${location?.state || "India"}
- Crops: ${crops?.join(", ") || "Not specified"}
- Current Season: ${season || "Unknown"} (Month: ${monthNames[month] || "Unknown"})
- Soil Type: ${soilType || "Not specified"}
- Irrigation: ${irrigationSource || "Not specified"}
${mandiContext}

RESPONSE LANGUAGE: ${lang === "hi" ? "Respond in simple Hindi (Devanagari script). Use common farming terms farmers understand." : lang === "mr" ? "Respond in Marathi (Devanagari script)." : "Respond in simple English."}

YOUR ROLE AND STYLE:
1. Give practical, actionable advice specific to THIS farmer's crops, location, and season
2. When discussing pests/diseases: mention specific chemical names, doses, and timing
3. When discussing prices: reference current mandi data above; give buying/selling advice
4. Be warm and respectful — use "aap" (you respectful form) in Hindi
5. Keep responses concise — farmers read on small screens with poor internet
6. If asked about weather: remind them to check local IMD district forecast
7. DO NOT give generic advice — always tailor to the specific crop, location, and season
8. For serious plant disease questions: recommend they send a photo to local KVK
9. Never recommend illegal pesticides or excessive chemical use
10. Acknowledge uncertainty honestly — say "consult your local agriculture officer" when unsure

AVOID: Long explanations, technical jargon, city-centric advice, unrealistic solutions.`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/chatbot/message
 * Main chat endpoint — handles new message and returns AI response
 * Body: { message, sessionId? }
 */
chatbotRouter.post("/message", requireAuth, async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Message too long. Max 1000 characters." });
    }

    // Load farmer profile
    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get or create chat session
    let session = sessionId
      ? await ChatSession.findOne({ sessionId, user: user._id })
      : null;

    if (!session) {
      const newSessionId = uuidv4();
      session = await ChatSession.create({
        user: user._id,
        sessionId: newSessionId,
        context: buildFarmerContext(user),
        messages: [
          {
            role: "system",
            content: "Session started",
            timestamp: new Date(),
          },
        ],
      });
    }

    // Enforce session message limit (cost + performance control)
    const userMessages = session.messages.filter((m) => m.role === "user");
    if (userMessages.length >= 30) {
      // Summarize old messages to compress context
      await summarizeSession(session);
    }

    // Add user message to history
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Fetch latest mandi rates for context (only if crop-related query)
    let latestMandiRates = [];
    if (isCropOrMarketQuery(message) && user.location?.district) {
      latestMandiRates = await MandiRate.find({
        "location.district": user.location.district,
        date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .select("cropName prices")
        .limit(5)
        .lean();
    }

    // Build conversation history for LLM (last 10 exchanges)
    const recentMessages = session.messages
      .filter((m) => m.role !== "system")
      .slice(-20)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    // Call LLM
    const systemPrompt = buildSystemPrompt(session.context, latestMandiRates);
    const { content: botResponse, tokensUsed } = await callLLM({
      systemPrompt,
      messages: recentMessages,
      maxTokens: 500,
    });

    // Detect answer category for analytics
    const category = detectAnswerCategory(message, botResponse);

    // Save bot response to session
    session.messages.push({
      role: "assistant",
      content: botResponse,
      timestamp: new Date(),
      answerCategory: category,
      tokensUsed,
    });

    session.lastBotResponse = botResponse;
    session.lastInteractionAt = new Date();
    session.totalTokensUsed = (session.totalTokensUsed || 0) + tokensUsed;
    await session.save();

    res.json({
      success: true,
      sessionId: session.sessionId,
      response: botResponse,
      category,
      // Return minimal context for client display
      farmerContext: {
        name: user.name,
        location: `${user.location?.district}, ${user.location?.state}`,
        crops: user.crops?.map((c) => c.cropName) || [],
        season: session.context.season,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/history/:sessionId
 * Returns conversation history for a session
 */
chatbotRouter.get("/history/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      user: req.user.userId,
    })
      .select("messages context lastInteractionAt")
      .lean();

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      success: true,
      data: {
        ...session,
        messages: session.messages.filter((m) => m.role !== "system"),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/ai-suggestion
 * Get AI suggestion BEFORE posting a community question (non-session, one-shot)
 * Used in Community Q&A module to pre-answer before posting
 * Body: { question, cropSlug, lang }
 */
chatbotRouter.post("/ai-suggestion", requireAuth, async (req, res, next) => {
  try {
    const { question, cropSlug, lang = "en" } = req.body;

    const user = await User.findById(req.user.userId).lean();
    const context = buildFarmerContext(user);

    const systemPrompt = `You are an agricultural expert. A farmer is about to post a question to a community forum.
Provide a brief, helpful pre-answer (3-5 sentences) to their question.
If you can solve it directly, do so. If not, suggest what additional info they should include in their post.
Respond in ${lang === "hi" ? "Hindi" : lang === "mr" ? "Marathi" : "English"}.
Be concise — this is a quick pre-check, not a full consultation.`;

    const { content } = await callLLM({
      systemPrompt,
      messages: [{ role: "user", content: question }],
      maxTokens: 200,
    });

    res.json({ success: true, suggestion: content });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/voice-transcript
 * Accepts voice transcript from Web Speech API and routes to chat
 * Body: { transcript, sessionId, lang }
 */
chatbotRouter.post("/voice-transcript", requireAuth, async (req, res, next) => {
  try {
    const { transcript, sessionId, lang } = req.body;
    if (!transcript) return res.status(400).json({ error: "No transcript received" });

    // Reuse text message handler with transcript as message
    req.body.message = transcript;
    // Defer to message handler
    return chatbotRouter.handle(
      Object.assign(req, { url: "/message", method: "POST" }),
      res,
      next
    );
  } catch (err) {
    next(err);
  }
});

// ── Helper Functions ──────────────────────────────────────────────────────────

function buildFarmerContext(user) {
  const now = new Date();
  const month = now.getMonth() + 1;
  // Rough season detection by month (India)
  const season = month >= 6 && month <= 10 ? "Kharif" : month >= 11 || month <= 3 ? "Rabi" : "Zaid";

  return {
    farmerName: user.name,
    location: user.location,
    crops: user.crops?.map((c) => c.cropName) || [],
    season,
    month,
    soilType: user.soilType,
    irrigationSource: user.irrigationSource,
    lang: user.preferredLang || "hi",
  };
}

function isCropOrMarketQuery(message) {
  const keywords = ["rate", "bhav", "price", "mandi", "becha", "sell", "kharida", "bazaar", "₹", "rupee"];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

function detectAnswerCategory(userMsg, botResponse) {
  const msg = (userMsg + " " + botResponse).toLowerCase();
  if (/rate|price|mandi|bhav|sell|market/.test(msg)) return "market-insight";
  if (/pest|disease|fungal|spray|insect|kida|rog/.test(msg)) return "pest-diagnosis";
  if (/transport|truck|vehicle|logistics/.test(msg)) return "transport";
  if (/weather|rain|rainfall/.test(msg)) return "weather";
  if (/fertilizer|urea|dap|soil|water|irrigation/.test(msg)) return "crop-advice";
  return "general";
}

async function summarizeSession(session) {
  // Compress old messages into a summary to save tokens
  // In production: call LLM to summarize, store as system message
  const summaryMsg = {
    role: "system",
    content: `[Earlier conversation summarized — ${session.messages.length} messages condensed]`,
    timestamp: new Date(),
  };
  // Keep only last 10 messages + add summary
  session.messages = [summaryMsg, ...session.messages.slice(-10)];
}

async function generateAISuggestionForPost(postId, content, cropSlug) {
  // Called async after post creation — generates and saves AI suggestion
  const { content: suggestion } = await callLLM({
    systemPrompt: "You are an agricultural expert. Provide a brief helpful suggestion for this farming question. Be concise (2-3 sentences). Focus on most likely cause and immediate action.",
    messages: [{ role: "user", content }],
    maxTokens: 150,
  });

  await CommunityPost.findByIdAndUpdate(postId, {
    aiSuggestion: {
      text: suggestion,
      generatedAt: new Date(),
      confidence: "Medium",
    },
  });
}

// JWT middleware (inline for this file)
const jwt = require("jsonwebtoken");
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = chatbotRouter;
