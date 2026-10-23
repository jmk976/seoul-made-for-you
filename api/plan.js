import Anthropic from "@anthropic-ai/sdk";

const ELEMENTS = {
  wood: "Wood 木 (growth, tradition, calm)",
  fire: "Fire 火 (passion, energy, crowds)",
  earth: "Earth 土 (history, stability, comfort)",
  metal: "Metal 金 (design, precision, style)",
  water: "Water 水 (flow, reflection, the river)"
};
const STYLES = ["solo", "couple", "friends"];
const INTERESTS = ["cafes", "shopping", "nature", "food", "nightlife"];
const WEATHER = ["sunny", "rainy"];

const SYSTEM = `You are a Seoul local guide who plans one-day trips for foreign visitors.

Rules:
- Recommend only real, well-known places that exist in Seoul today. Never invent a place, shop or restaurant name. If you are not sure a place exists, choose a famous one you are sure about.
- Plan exactly 5 places in a sensible order for one day, close enough to travel between by subway or on foot.
- Give each place a time, its English name, its Korean name (used for Naver/Kakao Map search), and one short line on why it fits this traveler.
- Reflect the traveler's Saju element and MBTI: E likes lively spots, I likes quiet ones; S likes must-see classics, N likes hidden gems; J gets a tight schedule, P gets a relaxed one.
- Match the travel style and interests. If it is rainy, choose mostly indoor places.
- Write in simple, friendly English.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    places: {
      type: "array",
      items: {
        type: "object",
        properties: {
          time: { type: "string" },
          name: { type: "string" },
          name_ko: { type: "string" },
          why: { type: "string" }
        },
        required: ["time", "name", "name_ko", "why"],
        additionalProperties: false
      }
    }
  },
  required: ["title", "places"],
  additionalProperties: false
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  // Only accept known values, so nothing free-form reaches the prompt
  const { element, mbti, style, interests, weather } = req.body || {};
  const picked = Array.isArray(interests) ? interests.filter(i => INTERESTS.includes(i)) : [];
  if (!ELEMENTS[element] || !/^[EI][SN][TF][JP]$/.test(mbti || "") || !STYLES.includes(style) ||
      !WEATHER.includes(weather) || picked.length === 0) {
    return res.status(400).json({ error: "Please pick a travel style, at least one interest and the weather." });
  }

  const prompt = `Plan my day in Seoul.
- Saju element: ${ELEMENTS[element]}
- MBTI: ${mbti}
- Traveling: ${style}
- Interests: ${picked.join(", ")}
- Weather: ${weather}`;

  try {
    // Reads ANTHROPIC_API_KEY from the environment (set it in Vercel → Settings → Environment Variables)
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 1000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }]
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return res.status(502).json({ error: "Claude couldn't finish this plan. Please try again." });
    }
    const text = response.content.find(b => b.type === "text")?.text;
    const plan = JSON.parse(text);
    return res.status(200).json({ title: plan.title, places: plan.places.slice(0, 5) });
  } catch (err) {
    console.error(err);
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Lots of travelers right now! Please try again in a minute." });
    }
    return res.status(500).json({ error: "Our AI guide is taking a break. Please try again." });
  }
}
