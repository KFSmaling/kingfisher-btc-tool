/**
 * 11.S-retro-2 — RTL voor volledige input-rendering + content-aware multi-page distribution.
 *
 * Anker: nieuw platform-principe (Kees 18 mei): "OnePager moet alle structurele
 * input-items uit het werkblad tonen". Geen `slice(0, N)`-truncation op
 * structurele data (thema's / KSFs / KPIs / SWOT-items / AI-insights).
 *
 * 5 nieuwe cases (instructie §5):
 *  1. 5 thema's: alle 5 zichtbaar (Fix 1 — bug "5e thema niet zichtbaar")
 *  2. 7 thema's: alle 7 zichtbaar
 *  3. SWOT met 10+ items per quadrant: alle items renderen (Fix 2 — geen slice)
 *  4. AI-insights 8 in_rapport=true: alle 8 verdeeld over multi-page (Fix 3)
 *  5. ≥3-pagina distribution bij maximale data (computePages-helper)
 *
 * Optie A-pattern: echte AppConfigProvider + mock-supabase.rpc (consistent met
 * Block 1+2+3+4 + retro-1).
 */

import React from "react";
import { render, screen, act, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../../shared/services/supabase.client", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { supabase } from "../../../shared/services/supabase.client";
import { AppConfigProvider } from "../../../shared/context/AppConfigContext";
import StrategyOnePager, { computePages } from "../StrategyOnePager";
import { buildStrategieRapportageConfig } from "../strategieRapportageConfig";

const rpcMock = supabase.rpc;

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  rpcMock.mockResolvedValue({ data: [], error: null });
});

function buildData(config, ids) {
  const data = {};
  ids.forEach(id => { data[id] = config.dataResolver(id); });
  return data;
}

const appLabel = (k, fb) => fb;

const baseCore = {
  missie: "M", visie: "V", ambitie: "A 10x",
  kernwaarden: ["K1", "K2"], samenvatting: "S",
};

async function renderV2({ data, selectedModels = [], withAi = true, insights = [] }) {
  let result;
  await act(async () => {
    result = render(
      <AppConfigProvider>
        <StrategyOnePager
          data={data}
          selectedModels={selectedModels}
          withAi={withAi}
          insights={insights}
          appLabel={appLabel}
        />
      </AppConfigProvider>
    );
  });
  await waitFor(() => expect(rpcMock).toHaveBeenCalled());
  return result;
}

describe("11.S-retro-2 — Volledige input + multi-page distribution", () => {
  test("1. 5 thema's: ALLE 5 zichtbaar (Fix 1 root-cause: max 4 cols + min-w-0 → wrap naar 2e rij)", async () => {
    const themas = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i + 1}`, title: `Thema ${i + 1}`, sort_order: i + 1,
      ksf_kpi: [{ id: `k${i}`, type: "kpi", description: `KPI ${i + 1}`, target_value: "10", sort_order: 1 }],
    }));
    const config = buildStrategieRapportageConfig({ strategyCore: baseCore, themas, analysisItems: [], appLabel });
    const data = buildData(config, ["identiteit", "kpi-strip", "themas", "samenvatting"]);
    await renderV2({ data, withAi: false });

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`strategie-onepager-thema-T${i}`)).toBeInTheDocument();
    }
  });

  test("2. 7 thema's: alle 7 zichtbaar (DB-CHECK max bovengrens, geen weggevallen kaart)", async () => {
    const themas = Array.from({ length: 7 }, (_, i) => ({
      id: `t${i + 1}`, title: `Thema ${i + 1}`, sort_order: i + 1,
      ksf_kpi: [{ id: `k${i}`, type: "ksf", description: `KSF ${i + 1}`, sort_order: 1 }],
    }));
    const config = buildStrategieRapportageConfig({ strategyCore: baseCore, themas, analysisItems: [], appLabel });
    const data = buildData(config, ["identiteit", "kpi-strip", "themas", "samenvatting"]);
    await renderV2({ data, withAi: false });

    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`strategie-onepager-thema-T${i}`)).toBeInTheDocument();
    }
  });

  test("3. SWOT met 10 items per quadrant: ALLE items renderen (Fix 2 — geen slice(0,4))", async () => {
    // 10 sterkten, 10 zwakten, 10 kansen, 10 bedreigingen
    const manyAnalysisItems = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, type: "intern", tag: "sterkte",    content: `Sterk-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `z${i}`, type: "intern", tag: "zwakte",     content: `Zwak-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `k${i}`, type: "extern", tag: "kans",       content: `Kans-${i}` })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, type: "extern", tag: "bedreiging", content: `Bedr-${i}` })),
    ];
    const config = buildStrategieRapportageConfig({ strategyCore: baseCore, themas: [], analysisItems: manyAnalysisItems, appLabel });
    const data = buildData(config, ["identiteit", "kpi-strip", "themas", "swot", "samenvatting"]);
    await renderV2({ data, selectedModels: [{ id: "swot", label: "SWOT" }], withAi: false, insights: [] });

    const sterkten = screen.getByTestId("strategie-onepager-swot-sterkten");
    // Tel <li>-elementen — moet 10 zijn (geen slice meer)
    expect(within(sterkten).getAllByRole("listitem").length).toBe(10);
    expect(within(sterkten).getByText(/Sterk-9/)).toBeInTheDocument(); // 10e item

    const zwakten = screen.getByTestId("strategie-onepager-swot-zwakten");
    expect(within(zwakten).getAllByRole("listitem").length).toBe(10);

    const kansen = screen.getByTestId("strategie-onepager-swot-kansen");
    expect(within(kansen).getAllByRole("listitem").length).toBe(10);

    const bedreigingen = screen.getByTestId("strategie-onepager-swot-bedreigingen");
    expect(within(bedreigingen).getAllByRole("listitem").length).toBe(10);
  });

  test("4. AI-insights 8 in_rapport=true: ALLE 8 verdeeld over 2 AI-chunks (multi-page distribution)", async () => {
    const eightInsights = Array.from({ length: 8 }, (_, i) => ({
      id: `i${i + 1}`,
      in_rapport: true,
      category: "onderdeel",
      type: i % 2 === 0 ? "zwak" : "kans",
      observation: `Bevinding ${i + 1}`,
      recommendation: `Aanbeveling ${i + 1}`,
    }));
    const config = buildStrategieRapportageConfig({ strategyCore: baseCore, themas: [], analysisItems: [], appLabel });
    const data = buildData(config, ["identiteit", "kpi-strip", "themas", "samenvatting"]);
    await renderV2({ data, selectedModels: [], withAi: true, insights: eightInsights });

    // computePages: 1 main + 1 body (chunk 0 = 6 insights) + 1 ai-only (chunk 1 = 2 insights) = 3 pagina's
    expect(screen.getByTestId("strategie-onepager-v2")).toHaveAttribute("data-total-pages", "3");

    // Alle 8 insights renderen (zoek per id in DOM)
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByTestId(`strategie-onepager-ai-insight-i${i}`)).toBeInTheDocument();
    }

    // 2 AI-blokken met chunk-attributen
    const aiBlocks = screen.getAllByTestId("strategie-onepager-ai-block");
    expect(aiBlocks.length).toBe(2);
    expect(aiBlocks[0]).toHaveAttribute("data-chunk-idx", "0");
    expect(aiBlocks[0]).toHaveAttribute("data-total-chunks", "2");
    expect(aiBlocks[1]).toHaveAttribute("data-chunk-idx", "1");
    expect(aiBlocks[1]).toHaveAttribute("data-total-chunks", "2");
  });

  test("5. computePages helper — ≥3 pagina-distribution bij maximale data", () => {
    // Pure-function test van de helper. Maximale data: 2 selectedModels + 15 in_rapport-insights.
    // Verwacht: 1 main + 1 body (modellen + chunk 0..6) + 2 ai-only (chunks 1..2 voor 6+3 insights) = 4 pages
    const insights = Array.from({ length: 15 }, (_, i) => ({ id: `i${i}`, in_rapport: true }));
    const pages = computePages({
      selectedModels: [{ id: "swot", label: "SWOT" }, { id: "kernwaarden", label: "KW" }],
      withAi: true,
      insights,
      MAX_AI_PER_PAGE: 6,
    });

    expect(pages.length).toBe(4);
    expect(pages[0].type).toBe("main");
    expect(pages[1].type).toBe("body");
    expect(pages[1].mode).toBe("models-with-ai");
    expect(pages[1].aiChunk.length).toBe(6);
    expect(pages[1].chunkIdx).toBe(0);
    expect(pages[1].totalChunks).toBe(3); // ceil(15/6) = 3
    expect(pages[2].type).toBe("ai-only");
    expect(pages[2].aiChunk.length).toBe(6);
    expect(pages[2].chunkIdx).toBe(1);
    expect(pages[3].type).toBe("ai-only");
    expect(pages[3].aiChunk.length).toBe(3); // resterende 15 - 12 = 3
    expect(pages[3].chunkIdx).toBe(2);
  });
});
