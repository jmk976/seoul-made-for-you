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

const SYSTEM = `You are a Seoul travel planner for foreign visitors.
The user gives their Saju element, MBTI, travel style, interests and weather.

RULES
- Recommend ONLY places from the PLACE LIST below. Never invent a place.
- If nothing in the list fits, say so instead of making one up.
- Exactly 5 stops, in a sensible walking or subway order.
- One line per stop: place name - why it fits this person (mention their element or MBTI).
- On rainy days, prefer indoor places.
- English only, friendly tone, no prices or opening hours.
- If the user asks for a place not in the list, politely say it's not in our guide and suggest the closest place from the list.

PLACE LIST
Bukchon Hanok Village, Changdeokgung Palace, Insadong, Ikseon-dong, Naksan Park,
Gyeongui Line Forest Park, Mangwon Market, Hongdae, Yeonnam-dong, Mangwon Hangang Park,
Gyeongbokgung Palace, National Folk Museum of Korea, Seochon, Gwangjang Market, Cheonggyecheon Stream,
Dongdaemun Design Plaza (DDP), Seongsu-dong, Seoul Forest, Starfield Library (COEX),
Yeouido Hangang Park, Seonyudo Park, The Hyundai Seoul, Banpo Hangang Park, N Seoul Tower, Myeongdong`;

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
