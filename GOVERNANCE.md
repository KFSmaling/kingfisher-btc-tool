# GOVERNANCE.md — Inventaris .md-bestanden

> Gegenereerd: 2026-05-04. Scope: alle `.md` in repo-root en `docs/` (eerste sublaag).
> Doel: zien wat we hebben, wat het werkelijk is, en wanneer het bijgewerkt zou moeten worden.
> Bijgewerkt door: peer reviewer (Cowork) — 2026-05-04

---

## Root

| Pad | Werkelijk doel (op basis van inhoud) | Laatst aangepast | Status | Wanneer bijwerken |
|---|---|---|---|---|
| [CLAUDE.md](CLAUDE.md) | Verplichte werk-instructies voor Claude Code: deploy, labels, DB, multi-tenancy, AI-affordances, state-management (sectie 4 + compliance status 4.6), checklist. Levend hoofddocument. | 2026-04-26 | Actief | Bij elke architectuur- of patroon-wijziging; sectie 4.6 bij elke compliance-fix; sectie 10 als TECH_DEBT-state verandert. |
| [DATABASE.md](DATABASE.md) | Volledig schema-overzicht (tabellen, kolommen, indexes, RLS) gegenereerd uit `supabase/migrations/`. Operationele referentie. | 2026-04-22 | Actief — maar achterstallig (multi-tenancy migraties 2026-04-24 mogelijk niet verwerkt) | Bij elke nieuwe migration. **Nu**: verifiëren tegen `supabase/migrations/20260424*` en multi-tenancy-tabellen toevoegen indien ontbrekend. |
| [README.md](README.md) | Standaard Create-React-App boilerplate. Geen project-context, geen onboarding, geen prod-URL. | 2026-04-09 (init commit) | Verouderd / leeg-van-betekenis | Bij eerstvolgende docs-pass: vervangen door minimale projectintro (wat is dit platform, prod-URL, hoe runnen, link naar CLAUDE.md). |
| [WORKFLOW.md](WORKFLOW.md) | Drie-kanalen-model (Jam / Issues / TECH_DEBT). Beslisboom + sprint-regels. | 2026-04-22 | Actief | Wanneer kanaal-rollen veranderen of sprint-regels worden bijgesteld. |
| [tech_debt.md](tech_debt.md) | Levend register van technische schuld met P1–P4-prioriteit, gekoppeld aan CLAUDE.md §4.6 + §10. | 2026-04-26 | Actief | Bij elke fix (status updaten) en bij elk nieuw signaleerd architectuur-item. |

## docs/

| Pad | Werkelijk doel (op basis van inhoud) | Laatst aangepast | Status | Wanneer bijwerken |
|---|---|---|---|---|
| [docs/architecture-spec.md](docs/architecture-spec.md) | Strategische/technische canon: bedrijfsstrategie, ambitie-fasen, multi-tenant SaaS-richting, content packs, billing. Toekomstgericht. | 2026-04-24 | Actief (richting), deels nog niet geïmplementeerd | Bij wijziging van strategische principes of fase-doelen; niet bij codebase-veranderingen. |
| [docs/INZICHTEN_DESIGN.md](docs/INZICHTEN_DESIGN.md) | Design-notitie Inzichten-patroon (analyse-overlay) — concept van 2026-04-23, generieke vorm voor alle werkbladen. | 2026-04-25 | Onduidelijk — Sprint A/B (#67/#68) zijn afgerond; status zegt "concept — nog niet geïmplementeerd" maar implementatie is gebeurd | Status-regel updaten naar "geïmplementeerd in #67/#68"; of mergen met de inzichten-68-*-docs en archiveren. |
| [docs/fase-1-voltooid.md](docs/fase-1-voltooid.md) | Verslag voltooiing fase 1 multi-tenant theming (24-04-2026). | 2026-04-24 | Verouderd / archief-document | Niet meer bijwerken — historisch. Bij volgende fase-afronding: gelijksoortig `fase-N-voltooid.md` of consolideren in changelog. |
| [docs/frontend-tenant-plan.md](docs/frontend-tenant-plan.md) | Pre-implementatie analyse + plan voor `tenant_id`-integratie in frontend. Geen code-wijziging. | 2026-04-24 | Verouderd — plan is uitgevoerd (zie `fase-1-voltooid.md`) | Niet bijwerken — kandidaat om te archiveren of mergen in `architecture-spec.md` als referentie. |
| [docs/inzichten-67-plan.md](docs/inzichten-67-plan.md) | Sprint A plan + retrospectief Issue #67 (data-model + prompt). Status ✅ DONE. | 2026-04-25 | Verouderd / archief | Niet bijwerken; archiveren of mergen met andere inzichten-docs. |
| [docs/inzichten-67-storage-fix.md](docs/inzichten-67-storage-fix.md) | Onderzoek naar `strategy_core.analysis`-mismatch tijdens Sprint A migratie. | 2026-04-25 | Verouderd / archief (issue opgelost) | Niet bijwerken; bewaren als post-mortem of archiveren. |
| [docs/inzichten-68-color-mapping.md](docs/inzichten-68-color-mapping.md) | Mapping prototype-hex → CSS-variabelen voor Inzichten v2 rebuild. | 2026-04-25 | Verouderd / archief | Niet meer bijwerken — relevant tijdens Sprint B; nu na implementatie historisch. |
| [docs/inzichten-68-plan.md](docs/inzichten-68-plan.md) | Plan + besluiten voor Sprint B UI-rebuild Inzichten-overlay (Issue #68). | 2026-04-25 | Verouderd / archief | Idem. |
| [docs/inzichten-68-rebuild-plan.md](docs/inzichten-68-rebuild-plan.md) | Visuele rebuild-plan Sprint B (afwijkend t.o.v. plan). | 2026-04-25 | Verouderd / archief | Idem. |
| [docs/migration-plan-multitenant.md](docs/migration-plan-multitenant.md) | Migratie-plan introductie multi-tenancy (genomen besluiten 2026-04-24). | 2026-04-24 | Verouderd — uitgevoerd | Niet bijwerken; archiveren of als historische context laten staan. |
| [docs/migration-review.md](docs/migration-review.md) | Review van zeven multi-tenant migratie-bestanden. | 2026-04-24 | Verouderd — review afgerond | Niet bijwerken. |
| [docs/parking-lot.md](docs/parking-lot.md) | Bewust uitgestelde technische items (lager dan TECH_DEBT-prio). | 2026-04-25 | Actief | Bij beslissing om iets uit te stellen of op te pakken. |
| [docs/schema-inventory.md](docs/schema-inventory.md) | Inventaris pre-multi-tenancy: tabellen met `user_id` etc. Snapshot 2026-04-24. | 2026-04-24 | Verouderd — gemaakt vóór tenants-laag | Niet bijwerken; vervangen door verwijzing naar `DATABASE.md`. |
| [docs/spec-vs-claudemd.md](docs/spec-vs-claudemd.md) | Diagnose-document: waar `architecture-spec.md` en `CLAUDE.md` elkaar tegenspreken (Vite vs CRA, TS vs JS, etc.). | 2026-04-24 | Actief — maar deels achterhaald sinds CLAUDE.md scope-sectie is toegevoegd | Bij conflict-resolutie of grotere refactor (bv. CRA→Vite). Anders: opruimen tot kortere "bekende afwijkingen"-lijst. |
| [docs/theming-inventory.md](docs/theming-inventory.md) | Pre-implementatie analyse van hardcoded branding (hex, logo's, tekst). | 2026-04-24 | Verouderd — voorstel is gerealiseerd in fase 1 multi-tenant theming | Niet bijwerken; archiveren. |

---

## Overlap en tegenstrijdigheden (expliciet)

1. **`TECH_DEBT.md` vs `tech_debt.md` — naamgeving-inconsistentie.** `CLAUDE.md` (§4.6, §7, §10), `WORKFLOW.md`, `tech_debt.md` zelf en meerdere `docs/*.md` verwijzen naar `TECH_DEBT.md` (hoofdletters), maar het bestand heet `tech_debt.md` (lowercase). Op case-sensitive filesystems (CI/Linux) breken die links. Bestand of alle verwijzingen aanpassen.
2. **Schema-overzicht — twee bronnen.** [DATABASE.md](DATABASE.md) en [docs/schema-inventory.md](docs/schema-inventory.md) overlappen. DATABASE.md is bedoeld als levend, schema-inventory als snapshot. Schema-inventory dateert van 2026-04-24 (pre-multi-tenancy). Aanbeveling: schema-inventory archiveren, DATABASE.md als enige bron.
3. **Architectuur — twee documenten met scope-overlap.** [docs/architecture-spec.md](docs/architecture-spec.md) (toekomstgericht, multi-tenant SaaS) vs [CLAUDE.md](CLAUDE.md) (huidige codebase). De scope-sectie bovenaan CLAUDE.md regelt het conflict ("wijziging volgt CLAUDE.md, nieuw werk volgt spec"), maar [docs/spec-vs-claudemd.md](docs/spec-vs-claudemd.md) somt nog steeds onopgeloste tegenstrijdigheden op (Vite vs CRA, TypeScript vs JS). Niet in productie aangepakt; de drie docs blijven uit elkaar lopen.
4. **Inzichten — vier docs, één feature.** `docs/INZICHTEN_DESIGN.md`, `docs/inzichten-67-plan.md`, `docs/inzichten-68-plan.md`, `docs/inzichten-68-rebuild-plan.md`, `docs/inzichten-68-color-mapping.md`, `docs/inzichten-67-storage-fix.md` overlappen sterk en zijn allemaal Sprint-specifiek. `INZICHTEN_DESIGN.md` zegt "concept — niet geïmplementeerd", terwijl Sprint A+B afgerond zijn — directe tegenspraak met de andere vier docs.
5. **Multi-tenancy — drie pre-implementatie docs zijn nu archief.** `docs/frontend-tenant-plan.md`, `docs/migration-plan-multitenant.md`, `docs/migration-review.md`, `docs/theming-inventory.md`, `docs/fase-1-voltooid.md` beschrijven samen de invoering. Plan+review+inventory→implementatie→fase-voltooid. Alleen `fase-1-voltooid.md` heeft retrospectieve waarde; de rest is duplicaat-met-tijdsverschil.
6. **TECH_DEBT vs parking-lot.** [tech_debt.md](tech_debt.md) en [docs/parking-lot.md](docs/parking-lot.md) zijn beide "lijst met open items". Parking-lot positioneert zichzelf als lager-prio dan TECH_DEBT, maar de scheidslijn staat nergens vastgelegd in [WORKFLOW.md](WORKFLOW.md) — die noemt parking-lot helemaal niet. Risico: items vallen tussen wal en schip.
7. **README.md is geen project-readme.** Pure CRA-boilerplate. Een nieuwe ontwikkelaar leest `README.md` en mist alle context (prod-URL, deploy-script, multi-tenancy, CLAUDE.md). Dit is een gat, geen overlap.

## Patroon-observatie

Plannings- en analyse-docs blijven na implementatie staan zonder `Status: gearchiveerd`-markering. Tien van de vijftien `docs/*.md`-bestanden zijn pre-implementatie-analyses van inmiddels gemerged werk. Geen mechanisme om "actief" van "archief" te onderscheiden behalve de inhoud lezen. Aanbeveling: `docs/archive/` map of expliciete frontmatter `status: archived` op afgeronde plannen.
