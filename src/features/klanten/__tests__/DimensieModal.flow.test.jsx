/**
 * Bundle 3 F21 — RTL voor DimensieModal cascade-delete.
 *
 * Geïsoleerde tests: DimensieModal direct gerenderd met mock-props.
 * Anker-pattern: ItemModal.flow.test.jsx (F16 canonical-delete).
 *
 * Test-cases:
 *  1. edit-mode toont Verwijder-knop links in footer
 *  2. create-mode toont GEEN Verwijder-knop (alleen edit)
 *  3. Klik Verwijder → cascade-confirm-dialog met counts {N}/{M} ingevuld
 *  4. Confirm-dialog → annuleer → terug naar normale footer, geen onDelete-call
 *  5. Confirm-dialog → Ja, verwijder → onDelete aangeroepen + modal sluit
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import DimensieModal from "../DimensieModal";

jest.mock("../../../shared/context/AppConfigContext", () => ({
  useAppConfig: () => ({
    label: (key, fallback) => fallback ?? key,
    prompt: () => null,
    setting: (k, d) => d,
  }),
}));

const baseDimensie = {
  id: "dim-1",
  archetype: "klantsegment",
  name: "Klantsegmenten",
  description: "Doelgroep-segmentering",
  sort_order: 10,
};

function makeProps(overrides = {}) {
  return {
    mode: "edit",
    dimension: baseDimensie,
    onClose: jest.fn(),
    onSave: jest.fn(async () => ({ error: null })),
    onDelete: jest.fn(async () => ({ error: null })),
    itemCount: 3,
    couplingCount: 2,
    ...overrides,
  };
}

describe("DimensieModal — F21 cascade-delete", () => {
  test("1. edit-mode toont Verwijder-knop links in footer", () => {
    render(<DimensieModal {...makeProps()} />);
    const delBtn = screen.getByTestId("dimensie-modal-delete");
    expect(delBtn).toBeInTheDocument();
    expect(delBtn).toHaveTextContent(/Verwijderen/i);
    // mr-auto klasse zorgt voor links-uitlijning
    expect(delBtn.className).toMatch(/mr-auto/);
  });

  test("2. create-mode toont GEEN Verwijder-knop", () => {
    render(<DimensieModal {...makeProps({ mode: "create", dimension: null })} />);
    expect(screen.queryByTestId("dimensie-modal-delete")).not.toBeInTheDocument();
  });

  test("3. Klik Verwijder → cascade-confirm met counts {N}/{M} ingevuld", () => {
    render(<DimensieModal {...makeProps({ itemCount: 5, couplingCount: 7 })} />);
    fireEvent.click(screen.getByTestId("dimensie-modal-delete"));
    const confirm = screen.getByTestId("dimensie-modal-delete-confirm");
    expect(confirm).toBeInTheDocument();
    expect(confirm).toHaveTextContent(/5 items/);
    expect(confirm).toHaveTextContent(/7 pijnpunt-koppelingen/);
  });

  test("4. Confirm-annuleer → terug naar normale footer, geen onDelete-call", () => {
    const props = makeProps();
    render(<DimensieModal {...props} />);
    fireEvent.click(screen.getByTestId("dimensie-modal-delete"));
    expect(screen.getByTestId("dimensie-modal-delete-confirm")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("dimensie-modal-delete-confirm-nee"));
    expect(screen.queryByTestId("dimensie-modal-delete-confirm")).not.toBeInTheDocument();
    expect(screen.getByTestId("dimensie-modal-delete")).toBeInTheDocument(); // terug
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  test("5. Confirm-ja → onDelete aangeroepen met dimension.id + modal sluit", async () => {
    const props = makeProps();
    render(<DimensieModal {...props} />);
    fireEvent.click(screen.getByTestId("dimensie-modal-delete"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("dimensie-modal-delete-confirm-ja"));
    });

    expect(props.onDelete).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledWith("dim-1");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
