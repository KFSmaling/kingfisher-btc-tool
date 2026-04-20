-- ============================================================
-- Sprint 4D — Per-veld Magic Staff prompts
-- Iedere Magic Staff knop in het Strategie Werkblad heeft
-- nu zijn eigen, aanpasbare instructie in app_config.
--
-- {taal_instructie} wordt client-side vervangen door de
-- taalinstelling van de gebruiker (NL / EN).
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES

-- ── Identiteit ────────────────────────────────────────────────────────────────

('prompt.magic.field.missie', 'prompt',
 'Magic Staff — Strategie Werkblad › Missie',
$$Als er een expliciet omschreven missieverklaring in de brondocumenten staat, citeer die dan exact — woord voor woord. Parafraseer NIET. Voeg alleen een bronvermelding toe (Bron: bestandsnaam, p.X).

Als er geen expliciete missie staat: formuleer een beknopte missieverklaring (max. 2 zinnen) op basis van de meest relevante informatie over purpose, bestaansreden of kernactiviteit van de organisatie.

{taal_instructie}$$),

('prompt.magic.field.visie', 'prompt',
 'Magic Staff — Strategie Werkblad › Visie',
$$Als er een expliciet omschreven visie of toekomstbeeld in de brondocumenten staat, citeer die dan exact — woord voor woord. Parafraseer NIET. Voeg alleen een bronvermelding toe (Bron: bestandsnaam, p.X).

Als er geen expliciete visie staat: formuleer een bondige visie (max. 2 zinnen) op basis van de strategische richting, lange-termijn ambitie of gewenst toekomstig marktpositie die uit de documenten blijkt.

{taal_instructie}$$),

('prompt.magic.field.ambitie', 'prompt',
 'Magic Staff — Strategie Werkblad › Ambitie',
$$Zoek naar strategische ambities, groeidoelen, BHAG (Big Hairy Audacious Goal) of lange-termijn doelstellingen. Als deze expliciet vermeld worden, citeer ze dan exact (Bron: bestandsnaam, p.X).

Anders: formuleer een scherpe ambitie (max. 3 zinnen) op basis van de kwantitatieve data, groeicijfers en strategische koers in de documenten. Gebruik concrete getallen waar beschikbaar.

{taal_instructie}$$),

('prompt.magic.field.kernwaarden', 'prompt',
 'Magic Staff — Strategie Werkblad › Kernwaarden (lijst)',
$$Zoek naar expliciet genoemde kernwaarden, leidende principes, organisatiewaarden of culturele ankers. Geef ze terug als een lijst — exact zoals ze in het document staan. Parafraseer NIET.

Max. 6 waarden, één per regel, zonder nummering of bullets. Voeg achter elke waarde een compacte bronvermelding toe (Bron: bestandsnaam).

{taal_instructie}$$),

-- ── Analyse ───────────────────────────────────────────────────────────────────

('prompt.magic.field.extern', 'prompt',
 'Magic Staff — Strategie Werkblad › Externe analyse (SWOT kansen/bedreigingen)',
$$Zoek specifiek naar EXTERNE factoren: markttrends, concurrentieontwikkelingen, regelgeving, technologische verschuivingen, macro-economische omgevingsfactoren, demografische veranderingen, kansen en bedreigingen.

Formuleer max. 8 scherpe, kwantitatief onderbouwde items. Elk item is één concrete observatie met impact voor de organisatie. Gebruik percentages, groeicijfers of marktdata waar beschikbaar. Citeer bronnen inline (Bron: bestandsnaam, p.X). Één item per regel.

{taal_instructie}$$),

('prompt.magic.field.intern', 'prompt',
 'Magic Staff — Strategie Werkblad › Interne analyse (SWOT sterktes/zwaktes)',
$$Zoek specifiek naar INTERNE factoren: sterktes, zwaktes, organisatorische capabilities, proceskwaliteit, financiële prestaties, medewerkerstevredenheid, digitale volwassenheid, merk- en marktpositie, innovatievermogen.

Formuleer max. 8 scherpe, kwantitatief onderbouwde items. Elk item is één concrete observatie. Gebruik percentages, scores of financiële data waar beschikbaar. Citeer bronnen inline (Bron: bestandsnaam, p.X). Één item per regel.

{taal_instructie}$$)

ON CONFLICT (key) DO NOTHING;
