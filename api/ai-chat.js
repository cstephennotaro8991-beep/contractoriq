// api/ai-chat.js
// Proxies requests to the Anthropic Claude API server-side.
// Keeps the API key out of the browser bundle.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  const { system, messages, max_tokens = 1000 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(anthropicRes.status).json({ error: data.error?.message || 'Anthropic API error', details: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('ai-chat proxy error:', err.message);
    return res.status(500).json({ error: 'Failed to reach Anthropic API' });
  }
}
