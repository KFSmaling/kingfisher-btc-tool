/**
 * api/klanten/pattern_suggestion_events.js — read-only audit-trail
 * (RFC-001 §2.6).
 *
 * 11.U Block 2 refactor (RFC-007-rev2 §B):
 * cd_pattern_suggestion_events is opgegaan in cd_improvement_intent_events.
 * Dit endpoint behoudt zijn URL en query-params (?suggestion_id, ?canvas_id)
 * voor frontend backwards-compat, maar leest onder de motorkap nu de nieuwe
 * tabel. `suggestion_id` mapt 1:1 op `intent_id`.
 *
 * GET ?suggestion_id=...   → events van één intent (chronologisch)
 * GET ?canvas_id=...       → alle events in canvas (voor admin/debug, beperkt 200)
 *
 * Mutaties (INSERT) gebeuren elders:
 *   - _pattern_generate.js (created bij bulk-AI-call)
 *   - pattern_suggestions.js (consultant-acties via action-handlers)
 *
 * RLS: cd_iie SELECT-policy doet tenant + canvas-eigenaar-check; geen
 * UPDATE/DELETE-policies → append-only via RLS afgedwongen.
 */

const { requireAuth } = require("../_auth");
const { userScopedClient } = require("../_template");

const MAX_LIMIT = 200;

// Geconsolideerd in pattern_suggestions.js via Vercel rewrite (?_subpath=events)
// — zie comment in _pattern_generate.js. Frontend-URL onveranderd.
async function handleEvents(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = userScopedClient(req);
  if (!supabase) {
    return res.status(500).json({ error: "Supabase niet geconfigureerd" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: `Method ${req.method} niet toegestaan` });
  }

  const { suggestion_id, canvas_id } = req.query;
  if (!suggestion_id && !canvas_id) {
    return res.status(400).json({ error: "suggestion_id of canvas_id is verplicht" });
  }

  try {
    let q = supabase
      .from("cd_improvement_intent_events")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(MAX_LIMIT);

    if (suggestion_id) q = q.eq("intent_id", suggestion_id);
    if (canvas_id)     q = q.eq("canvas_id", canvas_id);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    // Backwards-compat: spiegelen `intent_id` als `suggestion_id` voor oude clients.
    const mapped = (data || []).map(ev => ({ ...ev, suggestion_id: ev.intent_id }));
    return res.status(200).json({ events: mapped });
  } catch (err) {
    console.error("[api/klanten/pattern_suggestion_events] onverwachte fout:", err);
    return res.status(500).json({ error: err.message || "interne fout" });
  }
}

module.exports = { handleEvents };
