export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are a professional form designer. A freelancer has described their work below. Generate a detailed client brief/discovery form schema for them.

Freelancer description: "${description}"

Respond ONLY with a valid JSON object in exactly this structure (no markdown, no extra text):
{
  "title": "Short title of the brief form (e.g. Wedding Photography Brief)",
  "subtitle": "One line subtitle (e.g. Client Discovery & Project Requirements)",
  "intro": "A warm 2-3 sentence intro paragraph for the client explaining what this form is for",
  "sections": [
    {
      "number": 1,
      "title": "Section Title",
      "fields": [
        {
          "id": "unique_field_id",
          "label": "Field Label",
          "type": "text|email|tel|textarea|select|checkbox-list|radio",
          "placeholder": "Placeholder text (for text/textarea fields)",
          "hint": "Optional helper text shown below the label",
          "options": ["Option 1", "Option 2"] 
        }
      ]
    }
  ],
  "nextSteps": [
    "Step 1 description",
    "Step 2 description",
    "Step 3 description"
  ]
}

Rules:
- Create 4-6 sections relevant to the freelancer's specific work
- Each section should have 3-6 fields
- Use "options" array only for select, checkbox-list, and radio types
- Use "placeholder" only for text, email, tel, textarea types
- Field IDs must be unique snake_case strings
- Make questions highly specific to the described role
- nextSteps should have 3-4 items describing what happens after form submission`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://briefgen.vercel.app',
        'X-Title': 'BriefGen'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errData);
      return res.status(500).json({ error: errData.error?.message || 'AI service error' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let schema;
    try {
      schema = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse error:', e, '\nRaw:', raw);
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    return res.status(200).json({ schema });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Failed to connect to AI service.' });
  }
}
