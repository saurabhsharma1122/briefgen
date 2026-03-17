export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;

  if (!description || description.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a description' });
  }

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_KEY) {
    return res.status(500).json({ error: 'Server not configured. Add OPENROUTER_API_KEY to Vercel env vars.' });
  }

  const prompt = `You are a professional business consultant who creates client project brief forms. Generate a comprehensive brief form for the following use case:

"${description.trim()}"

Return ONLY a valid JSON object — no markdown, no backticks, no explanation before or after. Follow this EXACT structure:
{
  "title": "FORM TITLE IN CAPS (e.g. WEB DEVELOPMENT PROJECT BRIEF)",
  "subtitle": "Human-friendly subtitle (e.g. Client Discovery & Requirements Form)",
  "intro": "2-3 sentence intro explaining what this form is and how the client should use it",
  "sections": [
    {
      "number": 1,
      "title": "Section Title",
      "fields": [
        {
          "id": "unique_snake_case_id",
          "label": "Field Label",
          "type": "text",
          "placeholder": "helpful example",
          "hint": ""
        }
      ]
    }
  ],
  "nextSteps": ["Step 1 description", "Step 2 description", "Step 3 description"]
}

FIELD TYPES available:
- "text" → single line
- "email" → email address
- "tel" → phone number
- "textarea" → multi-line (use for descriptions, addresses, long answers)
- "select" → dropdown, must include "options": ["A", "B", "C"]
- "checkbox-list" → multiple choice, must include "options": ["A", "B", "C"]
- "radio" → single choice, must include "options": ["Yes", "No"]

RULES:
- 5 to 7 sections total
- 3 to 6 fields per section
- Mix field types — do NOT make everything "text"
- All fields must be specific and relevant to the use case
- Last section must be "Additional Notes / Special Requests" with one textarea field
- Return ONLY the raw JSON object, nothing else`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://briefgen.vercel.app',
        'X-Title': 'BriefGen'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-12b-it:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errData);
      return res.status(502).json({ 
        error: errData.error?.message || `OpenRouter error: ${response.status}` 
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Validate it's parseable JSON before sending
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ schema: parsed });

  } catch (err) {
    console.error('Generate error:', err.message);

    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'AI returned invalid data. Please try again.' });
    }

    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
