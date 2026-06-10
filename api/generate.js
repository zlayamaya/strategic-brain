export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY не е конфигуриран. Добави го в Vercel → Settings → Environment Variables.' }
    });
  }

  const { system, messages, max_tokens } = req.body;

  const geminiBody = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    generationConfig: {
      maxOutputTokens: max_tokens || 2000,
      temperature: 0.7
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: { message: data.error?.message || JSON.stringify(data) } });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Празен отговор.';
    return res.json({ content: [{ type: 'text', text }] });

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
