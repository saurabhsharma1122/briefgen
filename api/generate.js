// Free models to try in order of preference
const FREE_MODELS = [
  "stepfun/step-3.5-flash:free",
  "arcee-ai/trinity-large-preview:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "arcee-ai/trinity-mini:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "z-ai/glm-4.5-air:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "openrouter/free",
];

const buildPrompt = (description) => `You are a professional form designer. A freelancer has described their work below. Generate a detailed client brief/discovery form schema for them.

Freelancer description: "${description}"

Respond ONLY with a valid JSON object in exactly this structure (no markdown, no extra text, no code fences):
{
  "title": "Short title of the brief form",
  "subtitle": "One line subtitle",
  "intro": "A warm 2-3 sentence intro paragraph for the client",
  "sections": [
    {
      "number": 1,
      "title": "Section Title",
      "fields": [
        {
          "id": "unique_field_id",
          "label": "Field Label",
          "type": "text|email|tel|textarea|select|checkbox-list|radio",
          "placeholder": "Placeholder text (for text/textarea fields only)",
          "hint": "Optional helper text",
          "options": ["Option 1", "Option 2"]
        }
      ]
    }
  ],
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}
Rules: 4-6 sections, 3-6 fields each, options only for select/checkbox-list/radio, placeholder only for text/email/tel/textarea, unique snake_case field IDs, questions specific to the role.`;

async function callModel(model, description, apiKey) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://briefgen.vercel.app",
      "X-Title": "BriefGen",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(description) }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning || "";
  if (!raw) throw new Error("Empty response");

  const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  const schema = JSON.parse(jsonMatch[0]);
  if (!schema.title || !schema.sections?.length) throw new Error("Invalid schema structure");
  return schema;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { description, userApiKey } = req.body;
  if (!description?.trim()) return res.status(400).json({ error: "Description is required" });

  const apiKey = userApiKey?.trim() || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: "NO_API_KEY" });
  }

  const errors = [];

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying: ${model}`);
      const schema = await callModel(model, description, apiKey);
      console.log(`Success: ${model}`);
      return res.status(200).json({ schema, model });
    } catch (err) {
      console.log(`Failed ${model}: ${err.message}`);
      errors.push({ model, error: err.message });
    }
  }

  // All models failed
  if (!userApiKey) {
    return res.status(503).json({ error: "ALL_MODELS_FAILED" });
  }

  return res.status(503).json({
    error: "USER_KEY_FAILED",
    message: "All models failed. Please try again later.",
    details: errors,
  });
}
