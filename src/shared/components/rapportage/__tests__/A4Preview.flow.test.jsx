/**
 * 11.S-simplify — RTL voor vereenvoudigde A4Preview (flow-mode).
 *
 * Bewijst:
 *  1. A4Preview rendert geen `<A4Page>`-sub-component meer (geen
 *     `data-testid="a4-page-*"` of `data-testid="a4-preview-scaled-wrapper"`
 *     uit retro-1) en heeft `.a4-preview-page-flow`-wrapper.
 *  2. LayoutComponent krijgt GEEN `Page`-prop meer (flow-mode breekt het
 *     Page-slot-pattern uit retro-1).
 *
 * Optie A-pattern: echte AppConfigProvider + mock-supabase.rpc.
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../../../shared/services/supabase.client", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { supabase } from "../../../../shared/services/supabase.client";
import { AppConfigProvider } from "../../../../shared/context/AppConfigContext";
import A4Preview from "../A4Preview";

const rpcMock = supabase.rpc;

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  rpcMock.mockResolvedValue({ data: [], error: null });
});

async function renderPreview(LayoutComponent = null) {
  let result;
  await act(async () => {
    result = render(
      <AppConfigProvider>
        <A4Preview
          vasteBlokken={[]}
          selectedModels={[]}
          withAi={false}
          insights={[]}
          data={{}}
          LayoutComponent={LayoutComponent}
          appLabel={(k, fb) => fb}
        />
      </AppConfigProvider>
    );
  });
  await waitFor(() => expect(rpcMock).toHaveBeenCalled());
  return result;
}

describe("A4Preview — 11.S-simplify flow-mode", () => {
  test("1. Geen A4Page-sub-component (retro-1 weg) + .a4-preview-page-flow-wrapper rendert", async () => {
    await renderPreview();

    // Viewport zelf bestaat nog
    expect(screen.getByTestId("a4-preview-viewport")).toBeInTheDocument();

    // Nieuwe flow-wrapper aanwezig
    expect(screen.getByTestId("a4-preview-page-flow")).toBeInTheDocument();
    expect(screen.getByTestId("a4-preview-page-flow").className).toMatch(/a4-preview-page-flow/);

    // Retro-1 patterns WEG:
    expect(screen.queryByTestId("a4-preview-scaled-wrapper")).not.toBeInTheDocument();
    expect(screen.queryByTestId("a4-preview-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("a4-page-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("a4-page-counter-1")).not.toBeInTheDocument();

    // Geen data-scale-attribuut meer (ResizeObserver weg)
    expect(screen.getByTestId("a4-preview-viewport")).not.toHaveAttribute("data-scale");
  });

  test("2. LayoutComponent ontvangt GEEN Page-prop (flow-mode breekt Page-slot-pattern)", async () => {
    const propsReceived = {};
    function SpyLayout(props) {
      Object.assign(propsReceived, props);
      return <div data-testid="spy-layout-rendered" />;
    }
    await renderPreview(SpyLayout);

    expect(screen.getByTestId("spy-layout-rendered")).toBeInTheDocument();
    // Page-slot is verwijderd uit A4Preview-API
    expect(propsReceived).not.toHaveProperty("Page");
    // De bekende props blijven wel doorgegeven
    expect(propsReceived).toHaveProperty("vasteBlokken");
    expect(propsReceived).toHaveProperty("selectedModels");
    expect(propsReceived).toHaveProperty("withAi");
    expect(propsReceived).toHaveProperty("insights");
    expect(propsReceived).toHaveProperty("data");
    expect(propsReceived).toHaveProperty("appLabel");
  });
});
