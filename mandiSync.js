/**
 * Mandi Rate Sync Job
 *
 * Runs daily at 6 AM IST (after APMC morning arrivals are logged).
 * Fetches from Agmarknet (government portal) and stores in MongoDB.
 * Falls back to previous day's rate + volatility estimate if API fails.
 *
 * Schedule: 0 30 0 * * * (12:30 AM UTC = 6:00 AM IST)
 */

const cron = require("node-cron");
const axios = require("axios");
const { MandiRate } = require("../models");

// Districts to track — expand as needed
const TRACKED_DISTRICTS = [
  { state: "Maharashtra", districts: ["Nashik", "Pune", "Ahmednagar", "Solapur", "Aurangabad", "Jalgaon", "Lasalgaon"] },
  { state: "Punjab", districts: ["Amritsar", "Ludhiana", "Jalandhar", "Bathinda"] },
  { state: "Karnataka", districts: ["Bangalore Rural", "Kolar", "Davanagere", "Hubli"] },
];

// Crops to track per district
const TRACKED_CROPS = [
  { slug: "tomato", agmarknetCode: "TOMATO", name: "Tomato" },
  { slug: "onion", agmarknetCode: "ONION", name: "Onion" },
  { slug: "potato", agmarknetCode: "POTATO", name: "Potato" },
  { slug: "wheat", agmarknetCode: "WHEAT", name: "Wheat" },
  { slug: "rice", agmarknetCode: "PADDY", name: "Paddy/Rice" },
  { slug: "cotton", agmarknetCode: "COTTON", name: "Cotton" },
  { slug: "soybean", agmarknetCode: "SOYABEAN", name: "Soybean" },
  { slug: "maize", agmarknetCode: "MAIZE", name: "Maize" },
];

/**
 * Fetch rates from Agmarknet API
 * Note: Agmarknet has an official data.gov.in API and also a scrape-able portal.
 * In production, use the API key from data.gov.in.
 */
async function fetchAgmarknetRates(state, district, cropCode, date) {
  try {
    // Official data.gov.in endpoint
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`;
    const params = {
      "api-key": process.env.AGMARKNET_API_KEY,
      format: "json",
      limit: 50,
      filters: JSON.stringify({
        state,
        district,
        commodity: cropCode,
        // date: format as DD/MM/YYYY
      }),
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data?.records || [];
  } catch (err) {
    console.error(`Failed to fetch Agmarknet for ${district}/${cropCode}:`, err.message);
    return null; // null = API failure, use fallback
  }
}

/**
 * Estimate rate when API fails:
 * Use last known rate ± small random variance (not ideal, but better than blank data)
 */
async function getFallbackRate(cropSlug, district) {
  const lastRate = await MandiRate.findOne({ cropSlug, "location.district": district })
    .sort({ date: -1 })
    .lean();

  if (!lastRate) return null;

  const variance = 0.03; // 3% variance
  const factor = 1 + (Math.random() - 0.5) * variance;
  return {
    min: Math.round(lastRate.prices.min * factor),
    max: Math.round(lastRate.prices.max * factor),
    modal: Math.round(lastRate.prices.modal * factor),
  };
}

async function syncMandiRates() {
  const today = new Date();
  console.log(`[MandiSync] Starting rate sync for ${today.toDateString()}`);

  let inserted = 0;
  let failed = 0;

  for (const stateData of TRACKED_DISTRICTS) {
    for (const district of stateData.districts) {
      for (const crop of TRACKED_CROPS) {
        try {
          // Check if today's rate already exists
          const existing = await MandiRate.findOne({
            cropSlug: crop.slug,
            "location.district": district,
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lte: new Date(today.setHours(23, 59, 59, 999)),
            },
          });
          if (existing) continue;

          const records = await fetchAgmarknetRates(stateData.state, district, crop.agmarknetCode, today);

          let priceData;
          let source;

          if (records && records.length > 0) {
            // Use actual API data
            const prices = records.map((r) => ({
              min: parseFloat(r.min_price),
              max: parseFloat(r.max_price),
              modal: parseFloat(r.modal_price),
              arrivals: parseFloat(r.arrivals),
              mandiName: r.market,
            }));

            // Average across multiple mandis in same district
            priceData = {
              min: Math.round(prices.reduce((a, b) => a + b.min, 0) / prices.length),
              max: Math.round(prices.reduce((a, b) => a + b.max, 0) / prices.length),
              modal: Math.round(prices.reduce((a, b) => a + b.modal, 0) / prices.length),
            };
            source = "Agmarknet";
          } else {
            // Fallback
            priceData = await getFallbackRate(crop.slug, district);
            source = "Estimated";
            if (!priceData) continue;
          }

          await MandiRate.create({
            date: today,
            cropName: crop.name,
            cropSlug: crop.slug,
            location: { state: stateData.state, district },
            prices: { ...priceData, unit: "quintal", currency: "INR" },
            source,
            isVerified: source === "Agmarknet",
          });

          inserted++;

          // Throttle API calls — Agmarknet rate limits
          await new Promise((r) => setTimeout(r, 200));
        } catch (err) {
          console.error(`[MandiSync] Error for ${district}/${crop.slug}:`, err.message);
          failed++;
        }
      }
    }
  }

  console.log(`[MandiSync] Done. Inserted: ${inserted}, Failed: ${failed}`);
}

// Schedule: 6:00 AM IST daily
// "0 30 0 * * *" in UTC = 6:00 AM IST
cron.schedule("0 30 0 * * *", () => {
  syncMandiRates().catch(console.error);
}, { timezone: "UTC" });

// Also run on startup in development
if (process.env.NODE_ENV === "development") {
  // syncMandiRates(); // Uncomment to test on startup
}

module.exports = { syncMandiRates };
