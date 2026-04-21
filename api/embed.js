/**
 * OpenAI Embedding Proxy — Sprint 3B
 * Kingfisher & Partners — April 2026
 *
 * Accepteert een batch teksten, retourneert embeddings via OpenAI text-embedding-3-small.
 * Model: text-embedding-3-small (1536 dimensies) — goedkoop, snel, geschikt voor RAG.
 * Max per request: 100 teksten (client-side batching doet de rest).
 */

const { requireAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireAuth(req, res);
  if (!user) return;

  const { texts } = req.body || {};
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "Missing or empty texts array" });
  }
  if (texts.length > 100) {
    return res.status(400).json({ error: "Max 100 teksten per request" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY niet geconfigureerd" });

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[embed] OpenAI fout:", data.error?.message);
      return res.status(response.status).json({ error: data.error?.message || "OpenAI API fout" });
    }

    // Sorteer op index (OpenAI geeft altijd gesorteerd terug, maar voor zekerheid)
    const embeddings = data.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);

    return res.status(200).json({ embeddings, model: data.model, usage: data.usage });
  } catch (err) {
    console.error("[embed] fout:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
