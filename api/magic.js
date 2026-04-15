/**
 * Magic Staff — RAG AI suggestie per BTC-veld
 * Kingfisher & Partners — April 2026
 *
 * Input:  { field, context, existingText, isArray }
 * Output: { suggestion }
 *
 * Vector search gebeurt client-side (Supabase RPC).
 * Dit endpoint doet alleen de Claude-aanroep met de al opgehaalde context.
 */

const SYSTEM = `Je bent een senior strategie-consultant bij Kingfisher & Partners.
Je helpt een consultant het Business Transformatie Canvas (BTC) invullen op basis van klantdocumenten uit het Dossier.

KRITIEKE REGELS:
1. Gebruik UITSLUITEND informatie die letterlijk in de verstrekte documentcontext staat.
2. Als de context leeg is of geen relevante informatie bevat voor het gevraagde veld, antwoord dan ALLEEN met: "Geen relevante informatie gevonden in het Dossier voor dit veld. Upload eerst documenten via Het Dossier."
3. Verzin NOOIT informatie. Gebruik NOOIT algemene kennis over bedrijven, landen of sectoren die niet in de context staat.
4. Schrijf in de taal van de context (NL of EN).
5. Geen preamble, geen uitleg — alleen het voorstel zelf.
6. Bij lijstvelden: geef elk item op een aparte regel, zonder nummering, bullets of streepjes.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { field, context = "", existingText = "", isArray = false } = req.body || {};
  if (!field) return res.status(400).json({ error: "Missing field" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" });

  const userParts = [];
  if (context) userParts.push(`RELEVANTE CONTEXT UIT KLANTDOCUMENTEN:\n${context}`);
  if (existingText) userParts.push(`HUIDIGE TEKST IN HET VELD:\n${existingText}`);
  userParts.push(
    isArray
      ? `Schrijf een beknopte lijst van maximaal 6 items voor het BTC-veld "${field}". Één item per regel.`
      : `Schrijf een krachtig, concreet voorstel (max. 120 woorden) voor het BTC-veld "${field}".`
  );

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: "user", content: userParts.join("\n\n") }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "AI fout" });

    const suggestion = (data.content || []).map(c => c.text || "").join("").trim();
    return res.status(200).json({ suggestion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
