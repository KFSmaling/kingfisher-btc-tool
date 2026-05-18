/**
 * 11.U Block 3a — F-retro-1 + F-retro-2 + MotivatieInput + Addressed-reopen.
 *
 * Cases (8):
 *  1. SuggestedLensHint render onder ChoiceCards bij open-status met aanbevolen lens-naam
 *  2. SuggestedLensHint-klik → opent LensPicker met PAST-pill op aanbevolen lens
 *  3. F-retro-2: DismissedBody toont "Volgende open pijnpunt"-knop (enabled wanneer open-pijnpunt beschikbaar)
 *  4. F-retro-2: AddressedBody toont "Volgende open pijnpunt"-knop
 *  5. F-retro-2: "Alle pijnpunten geadresseerd" wanneer geen open pijnpunten meer
 *  6. MotivatieInput-modal: char-counter rood bij <20, primary-knop disabled bij <20
 *  7. MotivatieInput-modal: confirm → dismissPainPoint aangeroepen + modal sluit
 *  8. Addressed-reopen: ≥2 links → reopen-confirm-dialog opent
 *  9. Addressed-reopen: confirm-bevestig → deleteIntentPainPointLink voor elke link
 * 10. lensSuggestion heuristic: paradox-keyword detect ('maar', 'tegelijkertijd')
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../services/klanten.service", () => ({
  listDimensions:                  jest.fn(),
  listItemsForCanvas:              jest.fn(),
  listPainPoints:                  jest.fn(),
  listCouplingsForCanvas:          jest.fn(),
  listPatternSuggestions:          jest.fn(),
  generatePatternSuggestions:      jest.fn(),
  createPatternSuggestion:         jest.fn(),
  updatePatternSuggestion:         jest.fn(),
  acceptPatternSuggestion:         jest.fn(),
  rejectPatternSuggestion:         jest.fn(),
  promotePatternSuggestionToIntent: jest.fn(),
  unmarkPatternSuggestion:         jest.fn(),
  restorePatternSuggestion:        jest.fn(),
  listIntents:                     jest.fn(),
  listIntentsWithLinks:            jest.fn(),
  createIntent:                    jest.fn(),
  updateIntent:                    jest.fn(),
  deleteIntent:                    jest.fn(),
  handoverIntentToRoadmap:         jest.fn(),
  unsendIntent:                    jest.fn(),
  createIntentPainPointLink:       jest.fn(),
  deleteIntentPainPointLink:       jest.fn(),
  restorePainPoint:                jest.fn(),
  dismissPainPoint:                jest.fn(),
  fetchUploadsStatus:              jest.fn(),
  createDimension:                 jest.fn(),
  updateDimension:                 jest.fn(),
  deleteDimension:                 jest.fn(),
  createItem:                      jest.fn(),
  updateItem:                      jest.fn(),
  deleteItem:                      jest.fn(),
  createPainPoint:                 jest.fn(),
  updatePainPoint:                 jest.fn(),
  deletePainPoint:                 jest.fn(),
  createCoupling:                  jest.fn(),
  deleteCoupling:                  jest.fn(),
}));
import * as klantenService from "../services/klanten.service";

jest.mock("../../../shared/context/AppConfigContext", () => ({
  useAppConfig: () => ({
    label: (key, fallback) => fallback ?? key,
    prompt: () => null,
    setting: (k, d) => d,
  }),
}));
jest.mock("../../../shared/hooks/useTheme", () => ({
  useTheme: () => ({ brandName: "Platform" }),
}));
jest.mock("../../../shared/components/AiIcon", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../shared/components/AiIconButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled, label, "data-testid": tid }) => (
    <button onClick={onClick} disabled={disabled} data-testid={tid}>{label}</button>
  ),
}));
jest.mock("../../../shared/services/auth.service", () => ({
  useAuth: () => ({ user: { email: "test@example.com" }, signOut: jest.fn() }),
}));
jest.mock("../../../i18n", () => ({
  useLang: () => ({ t: (k) => k, lang: "nl", setLang: jest.fn() }),
}));

import KlantenWerkblad from "../KlantenWerkblad";
import { suggestLens } from "../components/lensSuggestion";

const TEST_CANVAS_ID = "test-canvas-block3a";

function pp(id, text, coverage = "open", motivation = null, dimensionId = null, createdAt = "2026-05-18T08:00:00Z") {
  return {
    id, canvas_id: TEST_CANVAS_ID,
    text_md: text,
    coverage_status: coverage,
    dismissal_motivation: motivation,
    dimension_id: dimensionId,
    created_at: createdAt,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  klantenService.listDimensions.mockResolvedValue({ data: [], error: null });
  klantenService.listItemsForCanvas.mockResolvedValue({ data: [], error: null });
  klantenService.listCouplingsForCanvas.mockResolvedValue({ data: [], error: null });
  klantenService.listPatternSuggestions.mockResolvedValue({ data: [], error: null });
  klantenService.listIntents.mockResolvedValue({ data: [], links: [], error: null });
  klantenService.listIntentsWithLinks.mockResolvedValue({ data: [], links: [], error: null });
  klantenService.fetchUploadsStatus.mockResolvedValue({
    data: { hasUploads: false, hasIndexedChunks: false, uploadCount: 0, indexedChunkCount: 0 },
    error: null,
  });
});

async function renderAndOpenFase3() {
  let result;
  await act(async () => {
    result = render(<KlantenWerkblad canvasId={TEST_CANVAS_ID} onClose={() => {}} />);
  });
  await waitFor(() => expect(klantenService.listDimensions).toHaveBeenCalled());
  const tab = await screen.findByTestId("werkblad-header-tab-3");
  await act(async () => { fireEvent.click(tab); });
  await screen.findByTestId("verbeteracties-view");
  return result;
}

describe("11.U Block 3a — DoorloopView completering + MotivatieInput", () => {
  test("1. SuggestedLensHint render onder ChoiceCards bij open-status", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Pijnpunt zonder specifieke dimensie-binding")],
      error: null,
    });
    await renderAndOpenFase3();
    const hint = await screen.findByTestId("doorloop-lens-hint");
    expect(hint).toBeInTheDocument();
    // Geen dimensie-binding → 'overstijgend' aanbevolen door heuristic
    expect(hint).toHaveAttribute("data-recommended-lens", "overstijgend");
  });

  test("2. SuggestedLensHint-klik → opent LensPicker met PAST-pill op aanbevolen lens", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Pijnpunt overstijgend")],
      error: null,
    });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-lens-hint")); });
    expect(screen.getByTestId("doorloop-lens-picker")).toBeInTheDocument();
    // PAST-pill op overstijgend-lens
    expect(screen.getByTestId("doorloop-lens-past-overstijgend")).toBeInTheDocument();
    expect(screen.getByTestId("doorloop-lens-overstijgend")).toHaveAttribute("data-recommended", "true");
  });

  test("3. DismissedBody toont 'Volgende open pijnpunt'-knop", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Open pijn", "open"), pp("p2", "Dismissed pijn", "dismissed", "Niet relevant — buiten kwartaal-scope")],
      error: null,
    });
    await renderAndOpenFase3();
    // Wissel naar p2 (dismissed)
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-rail-row-p2")); });
    const jumpBtn = screen.getByTestId("doorloop-jump-next-open");
    expect(jumpBtn).toBeInTheDocument();
    expect(jumpBtn).not.toBeDisabled();
    expect(jumpBtn).toHaveTextContent(/Volgende open pijnpunt/i);
  });

  test("4. AddressedBody toont 'Volgende open pijnpunt'-knop", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Open pijn", "open"), pp("p2", "Addressed pijn", "addressed")],
      error: null,
    });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-rail-row-p2")); });
    expect(screen.getByTestId("doorloop-jump-next-open")).toBeInTheDocument();
    expect(screen.getByTestId("doorloop-jump-next-open")).not.toBeDisabled();
  });

  test("5. 'Alle pijnpunten geadresseerd' label wanneer geen open meer", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Pijn 1", "addressed"), pp("p2", "Pijn 2", "dismissed", "Reason A reason A reason A")],
      error: null,
    });
    await renderAndOpenFase3();
    const jumpBtn = screen.getByTestId("doorloop-jump-next-open");
    expect(jumpBtn).toBeDisabled();
    expect(jumpBtn).toHaveTextContent(/Alle pijnpunten geadresseerd/i);
  });

  test("6. MotivatieInput modal — counter rood bij <20, confirm-knop disabled bij <20", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Pijn 1")],
      error: null,
    });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-choice-dismiss")); });
    expect(screen.getByTestId("dismiss-motivatie-modal")).toBeInTheDocument();
    const textarea = screen.getByTestId("dismiss-motivatie-textarea");
    const confirm = screen.getByTestId("dismiss-motivatie-confirm");
    expect(confirm).toBeDisabled();
    // Type 19 chars
    await act(async () => { fireEvent.change(textarea, { target: { value: "te kort op te slaan" } }); });
    expect(screen.getByTestId("dismiss-motivatie-counter").className).toMatch(/text-red-600/);
    expect(confirm).toBeDisabled();
    // Type 25 chars
    await act(async () => { fireEvent.change(textarea, { target: { value: "Niet relevant in dit kwartaal omdat we focus op IT" } }); });
    expect(screen.getByTestId("dismiss-motivatie-counter").className).not.toMatch(/text-red-600/);
    expect(confirm).not.toBeDisabled();
  });

  test("7. MotivatieInput confirm → dismissPainPoint + modal sluit", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Pijn 1")],
      error: null,
    });
    klantenService.dismissPainPoint.mockResolvedValue({ data: { id: "p1" }, error: null });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-choice-dismiss")); });
    const textarea = screen.getByTestId("dismiss-motivatie-textarea");
    await act(async () => { fireEvent.change(textarea, { target: { value: "Niet relevant in dit kwartaal omdat we focus op IT" } }); });
    await act(async () => { fireEvent.click(screen.getByTestId("dismiss-motivatie-confirm")); });
    expect(klantenService.dismissPainPoint).toHaveBeenCalledWith("p1", expect.stringContaining("Niet relevant"));
    expect(screen.queryByTestId("dismiss-motivatie-modal")).not.toBeInTheDocument();
  });

  test("8. Addressed-reopen met ≥2 links → confirm-dialog opent", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Addressed pijn", "addressed")],
      error: null,
    });
    klantenService.listIntents.mockResolvedValue({
      data: [
        { id: "i1", canvas_id: TEST_CANVAS_ID, title: "Intent 1", intent_md: "body 1", status: "concept" },
        { id: "i2", canvas_id: TEST_CANVAS_ID, title: "Intent 2", intent_md: "body 2", status: "concept" },
      ],
      links: [
        { id: "l1", intent_id: "i1", pain_point_id: "p1" },
        { id: "l2", intent_id: "i2", pain_point_id: "p1" },
      ],
      error: null,
    });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-reopen-pain")); });
    expect(screen.getByTestId("reopen-confirm-modal")).toBeInTheDocument();
    expect(screen.getByText(/2 gekoppelde/i)).toBeInTheDocument();
  });

  test("9. Addressed-reopen confirm-bevestig → deleteIntentPainPointLink voor elke link", async () => {
    klantenService.listPainPoints.mockResolvedValue({
      data: [pp("p1", "Addressed pijn", "addressed")],
      error: null,
    });
    klantenService.listIntents.mockResolvedValue({
      data: [
        { id: "i1", canvas_id: TEST_CANVAS_ID, title: "Intent 1", intent_md: "body 1", status: "concept" },
        { id: "i2", canvas_id: TEST_CANVAS_ID, title: "Intent 2", intent_md: "body 2", status: "concept" },
      ],
      links: [
        { id: "l1", intent_id: "i1", pain_point_id: "p1" },
        { id: "l2", intent_id: "i2", pain_point_id: "p1" },
      ],
      error: null,
    });
    klantenService.deleteIntentPainPointLink.mockResolvedValue({ data: null, error: null });
    await renderAndOpenFase3();
    await act(async () => { fireEvent.click(screen.getByTestId("doorloop-reopen-pain")); });
    await act(async () => { fireEvent.click(screen.getByTestId("reopen-confirm-bevestig")); });
    expect(klantenService.deleteIntentPainPointLink).toHaveBeenCalledWith("i1", "p1");
    expect(klantenService.deleteIntentPainPointLink).toHaveBeenCalledWith("i2", "p1");
    expect(klantenService.deleteIntentPainPointLink).toHaveBeenCalledTimes(2);
  });

  test("10. lensSuggestion heuristic — paradox-keyword detect", () => {
    const result = suggestLens({
      painPoint: { id: "p1", text_md: "Klanten willen snelheid maar ook menselijk contact" },
      intents: [],
      dimensions: [],
    });
    expect(result).toBe("paradox");

    const overstijgend = suggestLens({
      painPoint: { id: "p2", text_md: "Algemene pijn zonder keywords" },
      intents: [],
      dimensions: [],
    });
    expect(overstijgend).toBe("overstijgend");

    const positionering = suggestLens({
      painPoint: { id: "p3", text_md: "Stage 1 onboarding", dimension_id: "d-kr" },
      intents: [],
      dimensions: [{ id: "d-kr", archetype: "klantreis" }],
    });
    expect(positionering).toBe("positionering");
  });
});
