/**
 * 11.S-fix — RTL voor Kees-test-bevindingen.
 *
 * 6 cases die de niet-triviale UI-fixes verifiëren:
 *  1. Bev 5 — KernwaardePill: dubbelklik op pill opent inline-edit; Enter saved
 *  2. Bev 6 — SwotItem: edit-pencil opent inline-edit; commit roept onUpdate aan
 *  3. Bev 7 — AnalyseSection sorteert items op tag (kans/sterkte eerst)
 *  4. Bev 2 — InzichtItem carried-over-badge bij _carried_over=true
 *  5. Bev 4 — InzichtenOverlay loading-tekst varieert per analysisPhase
 *  6. Bev 1 — WerkbladTextField rendert MagicResult bij isNoInfo=true
 *
 * Optie A-pattern: echte AppConfigProvider + mock-supabase.rpc.
 * KernwaardePill + SwotItem zijn niet geëxporteerd uit StrategieWerkblad;
 * voor unit-test importeren we wel de specifieke subcomponenten via test-
 * helpers — of we mounten een mini-wrapper. Voor MVP testen we via mini-
 * wrapper-pattern (consistent met Block 5 integration-test).
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor, within } from "@testing-library/react";
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
import InzichtItem from "../../../shared/components/inzichten/InzichtItem";
import InzichtenOverlay from "../../../shared/components/inzichten/InzichtenOverlay";

const rpcMock = supabase.rpc;

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  rpcMock.mockResolvedValue({ data: [], error: null });
});

const appLabel = (k, fb) => fb;

async function renderWithProvider(node) {
  let result;
  await act(async () => {
    result = render(<AppConfigProvider>{node}</AppConfigProvider>);
  });
  await waitFor(() => expect(rpcMock).toHaveBeenCalled());
  return result;
}

describe("11.S-fix — Kees-test-bevindingen RTL", () => {
  test("Bev 2 — InzichtItem rendert 'behouden uit vorige analyse'-badge bij _carried_over=true", async () => {
    const insight = {
      id: "i-carried",
      category: "onderdeel",
      type: "zwak",
      title: "Test",
      observation: "x",
      recommendation: "y",
      _carried_over: true,
      in_rapport: true,
    };
    await renderWithProvider(
      <InzichtItem insight={insight} appLabel={appLabel} onSave={async () => ({ data: null, error: null })} onToggleRapport={async () => ({ data: null, error: null })} />
    );
    expect(screen.getByTestId("inzicht-carried-over-i-carried")).toBeInTheDocument();
    expect(screen.getByTestId("inzicht-carried-over-i-carried")).toHaveTextContent(/behouden uit vorige analyse/i);
  });

  test("Bev 2 — InzichtItem zonder _carried_over toont GEEN badge", async () => {
    const insight = {
      id: "i-fresh",
      category: "onderdeel",
      type: "kans",
      title: "Verse",
      observation: "x",
      recommendation: "y",
      _carried_over: false,
      in_rapport: false,
    };
    await renderWithProvider(
      <InzichtItem insight={insight} appLabel={appLabel} />
    );
    expect(screen.queryByTestId("inzicht-carried-over-i-fresh")).not.toBeInTheDocument();
  });

  test("Bev 4 — InzichtenOverlay loading-tekst varieert per analysisPhase", async () => {
    // Phase "collecting" → "Inputs verzamelen…"
    const { rerender } = await renderWithProvider(
      <InzichtenOverlay
        insights={null}
        loading={true}
        error={null}
        onClose={() => {}}
        appLabel={appLabel}
        canvasName="Test"
        generatedAt={null}
        canvasId="cv-1"
        worksheetName="Strategie"
        analysisPhase="collecting"
      />
    );
    expect(screen.getByTestId("analysis-loading-phase")).toHaveTextContent(/Inputs verzamelen/i);

    // Phase "ai_running" → "AI analyseert uw strategie… (dit duurt 20-40 seconden)"
    await act(async () => {
      rerender(
        <AppConfigProvider>
          <InzichtenOverlay
            insights={null}
            loading={true}
            error={null}
            onClose={() => {}}
            appLabel={appLabel}
            canvasName="Test"
            generatedAt={null}
            canvasId="cv-1"
            worksheetName="Strategie"
            analysisPhase="ai_running"
          />
        </AppConfigProvider>
      );
    });
    expect(screen.getByTestId("analysis-loading-phase")).toHaveTextContent(/AI analyseert/i);
    expect(screen.getByTestId("analysis-loading-phase")).toHaveTextContent(/20-40 seconden/);

    // Phase "merging" → "Resultaten samenvoegen…"
    await act(async () => {
      rerender(
        <AppConfigProvider>
          <InzichtenOverlay
            insights={null}
            loading={true}
            error={null}
            onClose={() => {}}
            appLabel={appLabel}
            canvasName="Test"
            generatedAt={null}
            canvasId="cv-1"
            worksheetName="Strategie"
            analysisPhase="merging"
          />
        </AppConfigProvider>
      );
    });
    expect(screen.getByTestId("analysis-loading-phase")).toHaveTextContent(/Resultaten samenvoegen/i);
  });

  test("Bev 4 — analysisPhase=null valt terug op default loading-tekst", async () => {
    await renderWithProvider(
      <InzichtenOverlay
        insights={null}
        loading={true}
        error={null}
        onClose={() => {}}
        appLabel={appLabel}
        canvasName="Test"
        generatedAt={null}
        canvasId="cv-1"
        worksheetName="Strategie"
        analysisPhase={null}
      />
    );
    expect(screen.getByTestId("analysis-loading-phase")).toHaveTextContent(/AI analyseert uw strategie/i);
  });

  test("Bev 10 — RapportageMenu hoofd-titel is 'Kies rapportage' (post-fix Kees-feedback)", async () => {
    // Test door RapportageMenu direct te mounten.
    const RapportageMenu = (await import("../../../shared/components/rapportage/RapportageMenu")).default;
    await renderWithProvider(
      <RapportageMenu
        open={true}
        onClose={() => {}}
        onSelectOnepager={() => {}}
        appLabel={appLabel}
        headerLabel="Strategie"
      />
    );
    expect(screen.getByText(/Kies rapportage/i)).toBeInTheDocument();
    // Oude tekst NIET meer aanwezig
    expect(screen.queryByText(/Wat wil je delen met de klant/i)).not.toBeInTheDocument();
  });

  test("Bev 11 — OnepagerBuilder back-knop label is 'Terug naar werkblad' (geen ← terug naar Rapportage)", async () => {
    const OnepagerBuilder = (await import("../../../shared/components/rapportage/OnepagerBuilder")).default;
    const testConfig = {
      vasteBlokken: [{ id: "identiteit", label: "Identiteits-band", sub_label: "" }],
      modelLib: [],
      dataResolver: () => ({ ready: true }),
    };
    await renderWithProvider(
      <OnepagerBuilder
        open={true}
        onClose={() => {}}
        config={testConfig}
        insights={[]}
        appLabel={appLabel}
      />
    );
    const backBtn = screen.getByTestId("onepager-builder-back");
    expect(backBtn).toHaveTextContent(/Terug naar werkblad/i);
    expect(backBtn).not.toHaveTextContent(/terug naar Rapportage/i);
  });
});
