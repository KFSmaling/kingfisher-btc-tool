/**
 * Magic Staff — RAG AI suggestie per BTC-veld
 * Kingfisher & Partners — April 2026
 *
 * Input:  { field, chunks, existingText, isArray, heavy }
 *   chunks: [{ content, file_name, page_number }]  (van Supabase RPC)
 *   heavy:  true voor SWOT/synthesis velden → Sonnet + meer tokens
 * Output: { suggestion }
 *
 * Vector search gebeurt client-side (Supabase RPC).
 * Dit endpoint doet de Claude-aanroep met gestructureerde broncontext.
 */

const SYSTEM_STANDARD = `Je bent een Senior Strategie Consultant bij Kingfisher & Partners, gespecialiseerd in business transformatie.

WERKWIJZE:
1. Analyseer de BRONDOCUMENTEN hieronder grondig voordat je een antwoord formuleert.
2. Gebruik UITSLUITEND informatie die in de brondocumenten staat — citeer altijd het brondocument en paginanummer.
3. Als er geen BRONDOCUMENTEN aanwezig zijn of de sectie leeg is: antwoord EXACT met "Geen relevante informatie gevonden in het Dossier voor dit veld."
4. Als brondocumenten aanwezig zijn maar geen relevante informatie bevatten voor het gevraagde veld: antwoord EXACT met "Onvoldoende relevante informatie gevonden voor dit veld."
5. Schrijf in de taal van de brondocumenten (NL of EN).
6. Geen preamble of uitleg — alleen het voorstel zelf.
7. Bij lijstvelden: één item per regel, zonder nummering, bullets of streepjes.`;

const SYSTEM_HEAVY = `Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau, gespecialiseerd in business transformatie voor de financiële en verzekeringssector bij Kingfisher & Partners.

WERKWIJZE — SYNTHESIS ANALYSE:

Stap 1 — INTERNE REDENERING (niet tonen in output):
Lees alle brondocumenten. Identificeer: (a) expliciete feiten, (b) kwantitatieve data (marktaandelen, groeicijfers, percentages), (c) impliciete strategische implicaties.

Stap 2 — SYNTHESE:
Combineer bevindingen tot een scherpe, consultant-waardige analyse. Interpreteer implicaties — niet alleen wat er staat, maar wat het betekent voor de organisatie.

Stap 3 — OUTPUT (wat je teruggeeft):
Schrijf het eindvoorstel. Gebruik waar mogelijk cijfers en feiten uit de documenten. Citeer bronnen inline als (Bron: bestandsnaam, p.X).

HARDE REGELS:
- Gebruik UITSLUITEND informatie uit de brondocumenten hieronder.
- Als er geen brondocumenten zijn: antwoord EXACT met "Geen relevante informatie gevonden in het Dossier voor dit veld."
- Verzin NOOIT data. Speculeer NOOIT over sectoren of markten die niet in de context staan.
- Schrijf in de taal van de brondocumenten (NL of EN).
- Geen preamble of uitleg — alleen het eindvoorstel zelf.
- Bij lijstvelden: één item per regel, zonder nummering, bullets of streepjes.`;

/** Bouw gestructureerde context op met bronverwijzingen per chunk.
 *  Filtert chunks met lege/null content om valse "context leeg" triggers te voorkomen.
 */
function buildContext(chunks) {
  if (!chunks || chunks.length === 0) return "";
  const valid = chunks.filter(c => c.content && String(c.content).trim().length > 0);
  if (valid.length === 0) return "";
  console.log(`[magic] buildContext: ${chunks.length} chunks ontvangen, ${valid.length} met content`);
  return valid.map(c => {
    const bron = c.file_name
      ? `[Bron: ${c.file_name}${c.page_number ? ` | Pagina ${c.page_number}` : ""}]`
      : "[Bron: onbekend]";
    return `${bron}\n${String(c.content)}`;
  }).join("\n\n---\n\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { field, chunks = [], existingText = "", isArray = false, heavy = false } = req.body || {};
  if (!field) return res.status(400).json({ error: "Missing field" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" });

  const context = buildContext(chunks);
  const systemPrompt = heavy ? SYSTEM_HEAVY : SYSTEM_STANDARD;
  const model = heavy ? "claude-sonnet-4-5" : "claude-haiku-4-5-20251001";
  const maxTokens = heavy ? 1500 : 600;

  const userParts = [];
  if (context) {
    userParts.push(`BRONDOCUMENTEN (${chunks.length} fragmenten):\n\n${context}`);
  } else {
    userParts.push("BRONDOCUMENTEN: [geen context ontvangen — context was leeg]");
  }
  if (existingText) userParts.push(`HUIDIGE TEKST IN HET VELD:\n${existingText}`);

  if (heavy) {
    userParts.push(
      isArray
        ? `Zoek in de brondocumenten specifiek naar SWOT-analyse content, sterke/zwakke punten, kansen, bedreigingen, strategische factoren en capabilities — ook als deze in het Engels staan of verspreid zijn over meerdere slides. Schrijf een scherpe lijst van maximaal 8 items voor het BTC-veld "${field}". Schrijf ALTIJD in het Nederlands, ook als de brondocumenten in het Engels zijn. Gebruik kwantitatieve data waar beschikbaar. Citeer bronnen inline. Één item per regel.`
        : `Zoek in de brondocumenten specifiek naar SWOT-analyse content, strategische factoren en capabilities — ook als deze in het Engels staan of verspreid zijn over meerdere slides. Schrijf een vlijmscherp, concreet voorstel (max. 200 woorden) voor het BTC-veld "${field}". Schrijf ALTIJD in het Nederlands, ook als de brondocumenten in het Engels zijn. Gebruik kwantitatieve data waar beschikbaar. Citeer bronnen inline als (Bron: bestandsnaam, p.X).`
    );
  } else {
    userParts.push(
      isArray
        ? `Schrijf een beknopte lijst van maximaal 6 items voor het BTC-veld "${field}". Schrijf ALTIJD in het Nederlands. Citeer de bron inline. Één item per regel.`
        : `Schrijf een krachtig, concreet voorstel (max. 120 woorden) voor het BTC-veld "${field}". Schrijf ALTIJD in het Nederlands. Citeer de bron inline.`
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
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
