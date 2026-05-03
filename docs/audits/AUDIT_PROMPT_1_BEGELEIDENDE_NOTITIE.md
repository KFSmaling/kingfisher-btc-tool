# Begeleidende notitie bij audit-opdracht 1

Vier kleine aanvullingen op de prompt — geen wijzigingen aan de prompt zelf, alleen verduidelijkingen om misverstand te voorkomen.

---

**1. Output-folder datum**

In de prompt staat `docs/audit/2026-XX-XX/`. Vervang `XX-XX` door de datum van uitvoering, formaat `2026-04-26`. Niet letterlijk `2026-XX-XX` als folder-naam aanmaken.

---

**2. Aanvullende termen-categorie: persoonsnamen breder**

In Document C staat Marc Beijen al genoemd. Voeg expliciet toe als zoekcategorie:

> Persoonsnamen — alle voorkomens, ook in commit-author-metadata, code-comments, test-data, seed-data en environment-variabelen. Niet alleen Marc; ook Kees Smaling zelf, eventuele klant-contactpersonen, ex-collega's, of namen die in voorbeelddata zijn beland.

Niet alles is IP-relevant maar wel privacy-relevant.

---

**3. Werkbladen die niet of nauwelijks bestaan**

Voor Document A (functioneel): als een werkblad alleen een placeholder of stub is (bijv. Klanten, Organisatie, IT, Roadmap):

> Rapporteer als "ontbreekt" met locatie van de stub. Niet uitgebreid documenteren wat er nog niet is — alleen vaststellen wat er is en waar de stub eindigt.

---

**4. Document D mag lang worden**

Voor Document D (AI-prompts): volledige prompt-tekst integraal opnemen, niet samenvatten. Sommige prompts zijn 2000+ tokens. Bij 10-15 prompts wordt het document mogelijk fors.

> Dat is acceptabel. Beknoptheid niet ten koste van volledigheid. Liever een lang document met alle prompt-teksten dan een kort document met samenvattingen die later opnieuw moeten worden opgezocht.

---

Verder geen wijzigingen aan de prompt. Bovenstaande als context bij uitvoering.
