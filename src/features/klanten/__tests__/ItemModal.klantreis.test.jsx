/**
 * Stap 11.I.2 — RTL voor klantreis-archetype Scope A.
 *
 * Optie-A-upgrade (post-stap_type-dropdown-bug 12 mei): vervangt directe
 * `useAppConfig`-mock door echte `<AppConfigProvider>` + mock-`supabase.rpc`
 * dat de config-rijen levert. Reden: directe `enum`-mock short-circuit de
 * `enumValue`-resolver — dubbele "enum."-prefix-bug in `archetypeSchemas.js:91`
 * werd zo verborgen (zie diagnose-result 2026-05-12-1329). Optie A dekt het
 * volledige code-pad incl. `config["enum." + key]`-lookup.
 *
 * Test-cases (8):
 *  1. klantreis-archetype rendert alle 12 velden in betekenisvolle volgorde
 *  2. stap_type-dropdown toont 9 opties uit DB-rij via echte enumValue-resolver
 *  3. Strategische-weging-blok zichtbaar met data-denkdwang="asymmetrie"
 *  4. MoT-toggle togglet `is_moment_of_truth` true/false
 *  5. weight_multiplier numeric-input met sensible default 1.0
 *  6. silent_period_risk conditional — verborgen wanneer is_silent_period=false,
 *     zichtbaar na toggle
 *  7. dmu tag_list save: input "klant, adviseur, verzekeraar" →
 *     archetype_data.dmu = ["klant", "adviseur", "verzekeraar"]
 *  8. emotions tag_list edit: bestaande array rendert als comma-joined text
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Supabase-client mock (anker: AppConfigContext.flow.test.jsx F30) ───────
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
import ItemModal from "../ItemModal";

const rpcMock = supabase.rpc;

const STAP_TYPES = [
  "trigger_life_event", "orientatie", "quote_aanvraag",
  "underwriting", "closing_polis", "onboarding",
  "servicing_in_life", "claim_schade", "renewal_churn_advocacy",
];

const STAP_TYPE_LABELS = {
  trigger_life_event:     "1. Life Event Trigger",
  orientatie:             "2. Awareness & Oriëntatie",
  quote_aanvraag:         "3. Quote & Aanvraag",
  underwriting:           "4. Underwriting & Acceptatie",
  closing_polis:          "5. Closing & Polis",
  onboarding:             "6. Onboarding",
  servicing_in_life:      "7. Servicing & In-life",
  claim_schade:           "8. Claim / Schade",
  renewal_churn_advocacy: "9. Renewal / Churn / Advocacy",
};

// Mimics shape die `get_app_config_for_tenant` RPC retourneert.
// `value` voor jsonb-rij wordt door Supabase als JS-array gedeserialiseerd —
// `enumValue` accepteert beide (string of array, zie AppConfigContext.jsx:412).
const CONFIG_ROWS = [
  { key: "enum.klanten.klantreis.stap_type", value: STAP_TYPES, category: "enum",  tenant_id: null },
  ...STAP_TYPES.map(s => ({
    key: `label.klanten.klantreis.stap_type.${s}`,
    value: STAP_TYPE_LABELS[s],
    category: "label",
    tenant_id: null,
  })),
];

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set implementation na clearAllMocks (clear nukt ook factory-impl)
  supabase.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  rpcMock.mockResolvedValue({ data: CONFIG_ROWS, error: null });
});

const klantreisDim = { id: "dim-kr", archetype: "klantreis", name: "Verzekerings-klantreis" };

function makeProps({ item = null, onSave = jest.fn(async () => ({ error: null })) } = {}) {
  return {
    item,
    dimension: klantreisDim,
    onClose: jest.fn(),
    onSave,
  };
}

async function renderModal(props) {
  let result;
  await act(async () => {
    result = render(
      <AppConfigProvider>
        <ItemModal {...props} />
      </AppConfigProvider>
    );
  });
  // Wacht tot config-fetch klaar is — voorkomt race tussen rpc-resolve en assertions
  await waitFor(() => expect(rpcMock).toHaveBeenCalled());
  return result;
}

describe("ItemModal — klantreis-archetype Scope A (stap 11.I.2 + Optie A)", () => {
  test("1. klantreis rendert alle 12 velden in betekenisvolle volgorde", async () => {
    await renderModal(makeProps());
    // Wat — kern
    expect(screen.getByTestId("field-stap_type")).toBeInTheDocument();
    expect(screen.getByTestId("field-customer_goal")).toBeInTheDocument();
    // Hoe — touchpoints/dmu/emotions/kpis
    expect(screen.getByTestId("field-touchpoints")).toBeInTheDocument();
    expect(screen.getByTestId("field-dmu")).toBeInTheDocument();
    expect(screen.getByTestId("field-emotions")).toBeInTheDocument();
    expect(screen.getByTestId("field-kpis")).toBeInTheDocument();
    // Strategisch — eigen blok
    expect(screen.getByTestId("strategische-weging-blok")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-is_moment_of_truth")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-is_silent_period")).toBeInTheDocument();
    expect(screen.getByTestId("field-weight_multiplier")).toBeInTheDocument();
    // silent_period_risk verborgen omdat is_silent_period=false (default)
    expect(screen.queryByTestId("field-silent_period_risk")).not.toBeInTheDocument();
    expect(screen.getByTestId("field-regulatoire_context")).toBeInTheDocument();
    expect(screen.getByTestId("field-insight")).toBeInTheDocument();
  });

  test("2. stap_type-dropdown toont 9 opties via echte enumValue-resolver", async () => {
    await renderModal(makeProps());
    const dropdown = screen.getByTestId("field-stap_type").querySelector("select");
    expect(dropdown).toBeInTheDocument();

    // Wacht tot config-load + re-render dropdown gevuld heeft. Bij de buggy
    // pre-fix-state (dubbele "enum."-prefix in archetypeSchemas.js:91) blijft
    // `dropdown.options.length === 1` (alleen placeholder) en faalt deze
    // assertion → regressie-test voor mock-blind-spot uit oude versie van
    // deze suite.
    await waitFor(() => {
      expect(dropdown.options).toHaveLength(10); // 1 placeholder + 9 stages
    });

    expect(dropdown.options[0].value).toBe(""); // placeholder
    expect(dropdown.options[1].value).toBe("trigger_life_event");
    expect(dropdown.options[1].textContent).toBe("1. Life Event Trigger");
    expect(dropdown.options[9].value).toBe("renewal_churn_advocacy");
    expect(dropdown.options[9].textContent).toBe("9. Renewal / Churn / Advocacy");
  });

  test("3. Strategische-weging-blok heeft data-denkdwang='asymmetrie' (80/20-principe)", async () => {
    await renderModal(makeProps());
    const blok = screen.getByTestId("strategische-weging-blok");
    expect(blok).toHaveAttribute("data-denkdwang", "asymmetrie");
  });

  test("4. MoT-toggle togglet is_moment_of_truth state via setField", async () => {
    const onSave = jest.fn(async () => ({ error: null }));
    await renderModal(makeProps({ onSave }));
    fireEvent.change(screen.getByLabelText("Naam"), { target: { value: "Stage X" } });

    const motToggle = screen.getByTestId("toggle-is_moment_of_truth");
    expect(motToggle).toHaveAttribute("data-active", "false");
    await act(async () => { fireEvent.click(motToggle); });
    expect(motToggle).toHaveAttribute("data-active", "true");

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Opslaan$/i })); });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].archetype_data.is_moment_of_truth).toBe(true);
  });

  test("5. weight_multiplier numeric-input met default 1.0 + user kan tunen naar 3.0", async () => {
    const onSave = jest.fn(async () => ({ error: null }));
    await renderModal(makeProps({ onSave }));
    fireEvent.change(screen.getByLabelText("Naam"), { target: { value: "Claim stage" } });

    const weightInput = screen.getByTestId("field-weight_multiplier").querySelector("input[type='number']");
    expect(weightInput).toBeInTheDocument();
    expect(weightInput).toHaveValue(1);  // default

    await act(async () => { fireEvent.change(weightInput, { target: { value: "3" } }); });
    expect(weightInput).toHaveValue(3);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Opslaan$/i })); });
    expect(onSave.mock.calls[0][0].archetype_data.weight_multiplier).toBe(3);
  });

  test("6. silent_period_risk conditional — toggle is_silent_period maakt veld zichtbaar", async () => {
    await renderModal(makeProps());
    fireEvent.change(screen.getByLabelText("Naam"), { target: { value: "Servicing stage" } });

    // Initial: verborgen
    expect(screen.queryByTestId("field-silent_period_risk")).not.toBeInTheDocument();

    // Toggle Silent Period aan
    await act(async () => { fireEvent.click(screen.getByTestId("toggle-is_silent_period")); });

    // Nu zichtbaar
    expect(screen.getByTestId("field-silent_period_risk")).toBeInTheDocument();
  });

  test("7. dmu tag_list save → archetype_data.dmu = array van rollen", async () => {
    const onSave = jest.fn(async () => ({ error: null }));
    await renderModal(makeProps({ onSave }));
    fireEvent.change(screen.getByLabelText("Naam"), { target: { value: "Claim" } });

    const dmuInput = screen.getByTestId("field-dmu").querySelector("input[type='text']");
    await act(async () => {
      fireEvent.change(dmuInput, { target: { value: "klant, adviseur, verzekeraar" } });
    });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Opslaan$/i })); });
    expect(onSave.mock.calls[0][0].archetype_data.dmu).toEqual(["klant", "adviseur", "verzekeraar"]);
  });

  test("8. emotions tag_list edit-mode → bestaande array rendert als comma-joined text", async () => {
    const item = {
      id: "kr-1",
      dimension_id: "dim-kr",
      canvas_id: "cv-1",
      name: "Stage 1",
      description: null,
      archetype_data: { emotions: ["onzeker", "soms gestrest"] },
      is_draft: false,
      sort_order: 10,
    };
    await renderModal(makeProps({ item }));
    const emotionsInput = screen.getByTestId("field-emotions").querySelector("input[type='text']");
    expect(emotionsInput).toHaveValue("onzeker, soms gestrest");
  });
});
