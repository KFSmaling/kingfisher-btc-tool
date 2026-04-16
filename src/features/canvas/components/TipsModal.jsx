import React, { useState } from "react";
import { X, BookOpen, Lightbulb } from "lucide-react";
import { useLang } from "../../../i18n";
import { BLOCKS } from "./BlockCard";

// ── Tips & Tricks data (NL + EN) ─────────────────────────────────────────────
const TIPS_DATA = {
  nl: {
    algemeen: {
      title: "Algemeen", icon: Lightbulb,
      intro: "Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar.",
      tips: [
        { kop: "Gebruik het als kapstok, niet als kookboek", tekst: "Het canvas is een framework om een aanpak op maat te maken, geen rigide stappenplan dat blind gevolgd moet worden." },
        { kop: "Focus op samenhang", tekst: "De kracht van het canvas zit in de verbinding tussen de bouwstenen (horizontale samenhang) en de vertaling van strategie naar uitvoering (verticale samenhang)." },
        { kop: "Time-boxing", tekst: "Ga uit van een iteratief proces. Het is vaak beter om in vier weken een 80%-versie te hebben dan in een half jaar een 100%-versie." },
        { kop: "Het magische getal is 7", tekst: "Beperk uitwerkingen tot de essentie om overzicht te behouden — maximaal zeven strategische thema's of veranderinitiatieven per blok." },
        { kop: "Gebruik wat er al is", tekst: "Het is niet de bedoeling alles opnieuw te bedenken. Vlecht bestaande marketingplannen of IT-architecturen in de structuur van het canvas." },
        { kop: "Begeleid de onderstroom", tekst: "Succes hangt niet alleen af van het harde ontwerp (de bovenstroom), maar vooral van hoe mensen de verandering begrijpen, willen en kunnen toepassen." },
      ],
    },
    strategy: {
      title: "Strategie", icon: null,
      intro: "De strategie vormt het fundament van het hele canvas. Alles wat volgt moet hieruit logisch afleiden.",
      tips: [
        { kop: "Maak het inspirerend", tekst: "Een strategie moet vooral motiveren en de neuzen dezelfde kant op krijgen. Kies krachtige taal boven management-jargon." },
        { kop: "Outside-in & Inside-out", tekst: "Combineer een omgevingsanalyse (kansen/bedreigingen) met een eerlijke blik op de eigen organisatie (sterkten/zwakten). Beide lenzen zijn nodig." },
        { kop: "BCG-matrix", tekst: "Gebruik dit hulpmiddel om scherpe keuzes te maken in welke product/markt-combinaties je investeert of waarvan je afscheid neemt." },
      ],
    },
    principles: {
      title: "Richtlijnen", icon: null,
      intro: "Richtlijnen zijn de spelregels die alle keuzes in de vier pijlers sturen en begrenzen.",
      tips: [
        { kop: "'Tight-loose' karakter", tekst: "Bepaal per principe of het strak (verplichtend voor synergie) of los (vrijheidsgraden voor autonomie) moet zijn." },
        { kop: "Formuleer implicaties", tekst: "Een principe is pas duidelijk als ook de consequenties zijn benoemd: 'wat betekent dit concreet voor ons?'" },
        { kop: "Wisselwerking", tekst: "Gebruik de principes om de keuzevrijheid in de andere pijlers bewust te beperken en zo consistentie te borgen." },
      ],
    },
    customers: {
      title: "Klanten & Diensten", icon: null,
      intro: "Wie bedien je, hoe bereik je ze, en wat lever je hen? Dit blok verbindt de strategie met de dagelijkse klantbeleving.",
      tips: [
        { kop: "Life events als triggers", tekst: "Denk bij klantbehoeften aan gebeurtenissen in het leven van de klant (zoals verhuizen of trouwen) om relevante proposities te ontwerpen." },
        { kop: "Omnichannel-denken", tekst: "Zorg dat de klantervaring naadloos is over alle kanalen heen. De klant ervaart geen kanaalwisseling — de organisatie mag dat ook niet." },
        { kop: "Maak het visueel", tekst: "Vat klantgroepen, klantreizen en distributiekanalen samen op één pagina voor maximale adoptie binnen de organisatie." },
      ],
    },
    processes: {
      title: "Proces & Organisatie", icon: null,
      intro: "Hoe richt je de organisatie en processen in om de klantambities en strategie daadwerkelijk waar te maken?",
      tips: [
        { kop: "Waardestromen als basis", tekst: "Richt de organisatie in langs de weg waarop waarde voor de klant wordt gecreëerd, in plaats van puur functionele afdelingen." },
        { kop: "Vereenvoudig", tekst: "Gebruik de transformatie om ballast uit het verleden weg te snijden. Complexiteit die ooit nuttig was, is dat nu misschien niet meer." },
        { kop: "Standaardiseer waar mogelijk", tekst: "Stop met doen alsof alles uniek is. Gebruik marktstandaarden voor ondersteunende processen en focus maatwerk op de unieke 10–20%." },
      ],
    },
    people: {
      title: "Mensen & Competenties", icon: null,
      intro: "Transformatie staat of valt met mensen. Wat vraagt de nieuwe koers van leiderschap, teams en cultuur?",
      tips: [
        { kop: "Maak de zachte kant 'hard'", tekst: "Benoem expliciet welke kennis, vaardigheden en leiderschapsstijl nodig zijn om de strategie te laten slagen. Maak het concreet en meetbaar." },
        { kop: "Betrek de werkvloer", tekst: "De beste ideeën voor verbetering komen vaak van de mensen die het dichtst bij de klant staan. Organiseer dat structureel." },
        { kop: "Focus op verandervermogen", tekst: "Veranderen is tegenwoordig een kerncompetentie. Investeer in een cultuur van continu leren — niet alleen in dit traject." },
      ],
    },
    technology: {
      title: "Informatie & Technologie", icon: null,
      intro: "Technologie en data als versneller van de transformatie, niet als beperkende factor.",
      tips: [
        { kop: "IT als versneller", tekst: "Zie technologie niet als een kostenpost of 'lastig domein', maar als een inspiratiebron en enabler voor nieuwe businessmodellen." },
        { kop: "Data als asset", tekst: "Geavanceerde analyses zijn noodzakelijk om klantgedrag te begrijpen en gepersonaliseerde diensten te bieden. Data is strategie." },
        { kop: "Cloud-first", tekst: "Infrastructuur moet 'als water uit de kraan' komen, zodat de focus kan liggen op connectiviteit, veiligheid en innovatie." },
      ],
    },
    portfolio: {
      title: "Veranderprogramma", icon: null,
      intro: "Het veranderprogramma vertaalt de ambities naar concrete initiatieven met prioriteit, fasering en eigenaarschap.",
      tips: [
        { kop: "Eet de olifant in stukjes", tekst: "Cluster losse veranderacties tot behapbare initiatieven met een logische fasering. Groot denken, klein beginnen." },
        { kop: "Objectieve prioritering", tekst: "Voorkom dat de manager die het hardst roept altijd voorrang krijgt. Weeg initiatieven af op businesswaarde én haalbaarheid." },
        { kop: "Continu herijken", tekst: "Een roadmap is niet in beton gegoten. Stuur bij op basis van feedback en veranderende externe omstandigheden." },
      ],
    },
  },

  en: {
    algemeen: {
      title: "General", icon: Lightbulb,
      intro: "Based on the book Business Transformation Canvas by Marc Beijen, Ruben Heetebrij and Roos Tigchelaar.",
      tips: [
        { kop: "Use it as a coat rack, not a cookbook", tekst: "The canvas is a framework for crafting a tailored approach — not a rigid step-by-step plan to follow blindly." },
        { kop: "Focus on coherence", tekst: "The power of the canvas lies in the connections between building blocks (horizontal coherence) and the translation from strategy to execution (vertical coherence)." },
        { kop: "Time-boxing", tekst: "Work iteratively. It is often better to have an 80% version in four weeks than a 100% version in six months." },
        { kop: "The magic number is 7", tekst: "Keep each block concise to maintain overview — no more than seven strategic themes or change initiatives per block." },
        { kop: "Use what already exists", tekst: "The goal is not to reinvent everything. Weave existing marketing plans or IT architectures into the structure of the canvas." },
        { kop: "Guide the undercurrent", tekst: "Success depends not only on the hard design (the formal plan) but especially on how people understand, embrace, and apply the change." },
      ],
    },
    strategy: {
      title: "Strategy", icon: null,
      intro: "The strategy forms the foundation of the entire canvas. Everything that follows must logically derive from it.",
      tips: [
        { kop: "Make it inspiring", tekst: "A strategy must motivate and align people. Choose powerful language over management jargon." },
        { kop: "Outside-in & Inside-out", tekst: "Combine an environmental analysis (opportunities/threats) with an honest look at the organisation itself (strengths/weaknesses). Both lenses are necessary." },
        { kop: "BCG matrix", tekst: "Use this tool to make sharp choices about which product/market combinations to invest in and which to exit." },
      ],
    },
    principles: {
      title: "Guiding Principles", icon: null,
      intro: "Guiding principles are the design rules that steer and constrain all choices across the four pillars.",
      tips: [
        { kop: "'Tight-loose' character", tekst: "Determine per principle whether it should be tight (mandatory for synergy) or loose (degrees of freedom for autonomy)." },
        { kop: "Formulate implications", tekst: "A principle only becomes clear when its consequences are also named: 'what does this mean concretely for us?'" },
        { kop: "Interplay", tekst: "Use the principles to deliberately constrain freedom of choice in the other pillars and ensure consistency." },
      ],
    },
    customers: {
      title: "Customers & Services", icon: null,
      intro: "Who do you serve, how do you reach them, and what do you deliver? This block connects strategy to everyday customer experience.",
      tips: [
        { kop: "Life events as triggers", tekst: "Think of customer needs in terms of life events (such as moving house or getting married) to design relevant propositions." },
        { kop: "Omnichannel thinking", tekst: "Ensure the customer experience is seamless across all channels. The customer experiences no channel switching — the organisation should not either." },
        { kop: "Make it visual", tekst: "Summarise customer groups, journeys, and distribution channels on a single page for maximum adoption across the organisation." },
      ],
    },
    processes: {
      title: "Processes & Organisation", icon: null,
      intro: "How do you organise processes and structure to genuinely deliver on customer ambitions and strategy?",
      tips: [
        { kop: "Value streams as the basis", tekst: "Organise around the path through which value is created for the customer, rather than purely functional departments." },
        { kop: "Simplify", tekst: "Use the transformation to cut away baggage from the past. Complexity that was once useful may no longer be." },
        { kop: "Standardise where possible", tekst: "Stop pretending everything is unique. Use market standards for supporting processes and focus customisation on the distinctive 10–20%." },
      ],
    },
    people: {
      title: "People & Competencies", icon: null,
      intro: "Transformation stands or falls with people. What does the new direction demand of leadership, teams, and culture?",
      tips: [
        { kop: "Make the soft side 'hard'", tekst: "Explicitly name what knowledge, skills, and leadership style are needed to make the strategy succeed. Make it concrete and measurable." },
        { kop: "Involve the frontline", tekst: "The best ideas for improvement often come from the people closest to the customer. Organise this structurally." },
        { kop: "Focus on change capability", tekst: "Adapting to change is now a core competency. Invest in a culture of continuous learning — not just for this programme." },
      ],
    },
    technology: {
      title: "Information & Technology", icon: null,
      intro: "Technology and data as an accelerator of transformation, not a limiting factor.",
      tips: [
        { kop: "IT as accelerator", tekst: "See technology not as a cost item or 'difficult domain', but as a source of inspiration and an enabler of new business models." },
        { kop: "Data as an asset", tekst: "Advanced analytics are essential for understanding customer behaviour and delivering personalised services. Data is strategy." },
        { kop: "Cloud-first", tekst: "Infrastructure should be available 'like water from a tap', so focus can be placed on connectivity, security, and innovation." },
      ],
    },
    portfolio: {
      title: "Change Portfolio", icon: null,
      intro: "The change portfolio translates ambitions into concrete initiatives with priority, phasing, and ownership.",
      tips: [
        { kop: "Eat the elephant in pieces", tekst: "Cluster individual change actions into manageable initiatives with a logical phasing. Think big, start small." },
        { kop: "Objective prioritisation", tekst: "Prevent the loudest manager always getting priority. Weigh initiatives on business value and feasibility." },
        { kop: "Continuously recalibrate", tekst: "A roadmap is not set in stone. Adjust based on feedback and changing external circumstances." },
      ],
    },
  },
};

// TIPS_NAV wordt dynamisch gebouwd in de TipsModal via useLang()

// ── Tips Modal ────────────────────────────────────────────────────────────────
function TipsModal({ onClose, initialSection }) {
  const { t, lang } = useLang();
  const [activeSection, setActiveSection] = useState(initialSection || "algemeen");
  const TIPS = TIPS_DATA[lang] || TIPS_DATA.nl;
  const section = TIPS[activeSection] || TIPS.algemeen;
  const TIPS_NAV = [
    { key: "algemeen", label: t("tips.general") },
    ...BLOCKS.map(b => ({ key: b.id, label: t(b.titleKey) })),
  ];

  return (
    <div className="fixed inset-0 bg-[#001f33]/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#1a365d] flex overflow-hidden" style={{ height: "80vh" }}>

        {/* Left nav */}
        <div className="w-52 bg-[#001f33] flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen size={14} className="text-[#1a365d]" />
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{t("tips.title")}</span>
            </div>
            <p className="text-[9px] text-white/30 leading-snug mt-1">{t("tips.subtitle")}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {TIPS_NAV.map((item, idx) => {
              const isActive = activeSection === item.key;
              const isFirst = idx === 0;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full text-left px-5 py-2.5 text-xs transition-all flex items-center gap-2
                    ${isActive
                      ? "bg-[#00AEEF]/20 text-white font-bold border-l-2 border-[#1a365d]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"}
                    ${isFirst ? "mb-1" : ""}`}
                >
                  {isFirst && <Lightbulb size={12} className={isActive ? "text-[#1a365d]" : "text-white/30"} />}
                  {!isFirst && <div className={`w-1.5 h-1.5 rotate-45 shrink-0 ${isActive ? "bg-orange-400" : "bg-white/20"}`} />}
                  <span className={isFirst ? "text-[10px] uppercase tracking-wider" : ""}>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-[8px] text-white/20 leading-relaxed">{t("tips.footer")}</p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-[#001f33] font-black text-xl uppercase tracking-tight">{section.title}</h2>
              {section.intro && (
                <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-lg">{section.intro}</p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors ml-4 shrink-0 mt-1">
              <X size={22} />
            </button>
          </div>

          {/* Tips list */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {section.tips.map((tip, i) => (
              <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-sm hover:border-[#1a365d]/30 transition-colors">
                <div className="shrink-0 mt-1">
                  <div className="w-2 h-2 bg-orange-500 rotate-45" />
                </div>
                <div>
                  <h3 className="text-[#001f33] font-black text-sm mb-1">{tip.kop}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{tip.tekst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <button
              onClick={() => {
                const idx = TIPS_NAV.findIndex(t => t.key === activeSection);
                if (idx > 0) setActiveSection(TIPS_NAV[idx - 1].key);
              }}
              disabled={TIPS_NAV.findIndex(t => t.key === activeSection) === 0}
              className="text-[10px] font-bold text-slate-400 hover:text-[#001f33] uppercase tracking-wider disabled:opacity-20 transition-colors"
            >
              {t("tips.prev")}
            </button>
            <span className="text-[9px] text-slate-300 uppercase tracking-widest">
              {TIPS_NAV.findIndex(t => t.key === activeSection) + 1} / {TIPS_NAV.length}
            </span>
            <button
              onClick={() => {
                const idx = TIPS_NAV.findIndex(t => t.key === activeSection);
                if (idx < TIPS_NAV.length - 1) setActiveSection(TIPS_NAV[idx + 1].key);
              }}
              disabled={TIPS_NAV.findIndex(t => t.key === activeSection) === TIPS_NAV.length - 1}
              className="text-[10px] font-bold text-slate-400 hover:text-[#001f33] uppercase tracking-wider disabled:opacity-20 transition-colors"
            >
              {t("tips.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TIPS_DATA };
export default TipsModal;
