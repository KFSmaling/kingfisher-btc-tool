/**
 * _template.js — lichtgewicht prompt-template-engine voor tenant-content.
 *
 * Mustache-style {{var}}-tokens worden vervangen door waarden uit een
 * vars-object. Onbekende tokens worden vervangen door lege string
 * (geen crash). Geen conditionals, geen partials, geen externe deps.
 *
 * ADR-002 niveau 1 (zie platform/architecture/decisions/...).
 *
 * Gebruik:
 *   const { renderPrompt, getTenantVars } = require('./_template');
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
 *                     { global: { headers: { Authorization: `Bearer ${token}` } } });
 *   const vars = await getTenantVars(supabase, tenantId);
 *   const rendered = renderPrompt(rawPromptTemplate, vars);
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const TEMPLATE_TOKEN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Render een template door {{var_name}}-tokens te vervangen door vars[var_name].
 * Onbekende of null/undefined tokens → lege string (geen crash, geen "undefined" in output).
 */
function renderPrompt(template, vars = {}) {
  if (typeof template !== "string") return template;
  return template.replace(TEMPLATE_TOKEN, (_match, name) => {
    const value = vars?.[name];
    return value != null ? String(value) : "";
  });
}

/**
 * Bouw een client die de gebruikers-JWT meestuurt zodat RLS van toepassing is.
 * De user kan via de RLS-policy "Tenant leesbaar voor eigen leden" alleen zijn
 * eigen tenant-rij selecten — geen service-role nodig.
 */
function userScopedClient(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const authHeader = req?.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Lees tenant-content + theme_config-fallbacks voor de tenant van de huidige user.
 * Levert merged vars-object voor renderPrompt(template, vars).
 *
 * Werkt met user-scoped client (Path 2 uit V3 pre-flight): RLS op tenants
 * laat alleen de eigen tenant-rij zien, dus geen tenant_id-parameter nodig.
 *
 * Defaults voor Platform-tenant of bij ontbrekende waarden:
 *   - brand_name: "Platform"
 *   - framework_name: "het strategische raamwerk"
 *   - industry_context: "" (lege string — prompt mag dat ofwel weglaten ofwel
 *     met een default-zin invullen via fallback elders)
 */
async function getTenantVars(supabaseClient) {
  if (!supabaseClient) return defaultVars();
  const { data, error } = await supabaseClient
    .from("tenants")
    .select("tenant_content, theme_config")
    .maybeSingle();
  if (error || !data) return defaultVars();

  const tc = data.tenant_content || {};
  const th = data.theme_config || {};

  return {
    brand_name:       tc.brand_name       ?? th.brand_name       ?? "Platform",
    framework_name:   tc.framework_name   ?? "het strategische raamwerk",
    industry_context: tc.industry_context ?? "",
    example_segments: tc.example_segments ?? "",
    ...tc, // alle overige custom vars uit tenant_content
  };
}

function defaultVars() {
  return {
    brand_name:       "Platform",
    framework_name:   "het strategische raamwerk",
    industry_context: "",
    example_segments: "",
  };
}

module.exports = { renderPrompt, getTenantVars, userScopedClient };
