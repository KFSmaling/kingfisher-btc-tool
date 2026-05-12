/**
 * DimensieModal — create + edit voor cd_dimensions.
 *
 * Mode-prop:
 *   - "create" → archetype-dropdown actief, naam + omschrijving leeg
 *   - "edit"   → archetype-dropdown DISABLED (datamodel-impact, zie F3 finding),
 *                naam + omschrijving prefilled, header-titel "Dimensie bewerken"
 *
 * UX-consistency-principe (findings F3): wat via UI-dialoog gemaakt is, moet
 * ook via UI-dialoog gewijzigd kunnen worden — niet via Admin.
 *
 * Props:
 *   - mode: "create" | "edit"
 *   - dimension: bestaand dimension-object (verplicht voor edit)
 *   - onClose()
 *   - onSave({ archetype, name, description }) → async, returnt { error: null|Error }
 *
 * In edit-mode bevat de payload nog steeds archetype (read-only door
 * disabled-input) zodat de save-handler één signature heeft.
 */

import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useAppConfig } from "../../shared/context/AppConfigContext";

// Archetype-opties: alle 9 enabled per stap 11.I.2.
// (Tot 11.I.1: klantsegment/propositie/kanaal enabled, rest minimal-stub disabled.
//  Stap 11.I.1: 5 lichte archetypes uitgewerkt. Stap 11.I.2: klantreis Scope A.)
const ARCHETYPE_OPTIONS = [
  { value: "klantsegment",   label: "Klantsegment",      enabled: true,
    placeholder: "bijv. Klantsegmenten of Doelgroepen of Markten" },
  { value: "propositie",     label: "Propositie",        enabled: true,
    placeholder: "bijv. Proposities of Diensten of Productlijnen" },
  { value: "kanaal",         label: "Kanaal",            enabled: true,
    placeholder: "bijv. Kanalen of Distributie of Touchpoints" },
  { value: "regio",          label: "Regio",             enabled: true,
    placeholder: "bijv. Regio's of Geografische markten" },
  { value: "behoefte",       label: "Behoefte (JTBD)",   enabled: true,
    placeholder: "bijv. Klantbehoeften of Jobs-to-be-done" },
  { value: "merk",           label: "Merk",              enabled: true,
    placeholder: "bijv. Merken of Sub-merken" },
  { value: "gedragspatroon", label: "Gedragspatroon",    enabled: true,
    placeholder: "bijv. Gedragspatronen of Klantgedrag-types" },
  { value: "klantreis",      label: "Klantreis",         enabled: true,
    placeholder: "bijv. Klantreis-stages of Customer journey" },
  { value: "anders",         label: "Anders, namelijk…", enabled: true,
    placeholder: "bijv. Eigen dimensie-categorie" },
];

const NAME_MAX = 100;
const DESC_MAX = 500;

export default function DimensieModal({
  mode = "create",
  dimension = null,
  onClose,
  onSave,
  // Stap 11.K.2 F21 — cascade-delete (alleen actief in edit-mode).
  // Caller (KlantenWerkblad) berekent counts uit items+couplings-arrays.
  onDelete = null,
  itemCount = 0,
  couplingCount = 0,
}) {
  const { label: appLabel } = useAppConfig();
  const isEdit = mode === "edit";

  const [archetype, setArchetype]     = useState(dimension?.archetype ?? "");
  const [name, setName]               = useState(dimension?.name ?? "");
  const [description, setDescription] = useState(dimension?.description ?? "");
  const [saving, setSaving]           = useState(false);
  const [errMsg, setErrMsg]           = useState(null);
  // F21 — confirm-state-machine (anker F16 PijnpuntModal/ItemModal).
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!isEdit || !onDelete || !dimension?.id || deleting) return;
    setDeleting(true);
    setErrMsg(null);
    const { error } = await onDelete(dimension.id);
    setDeleting(false);
    if (error) {
      setErrMsg(error.message || "Verwijderen mislukt");
      setConfirmingDelete(false);
      return;
    }
    onClose();
  }

  const cascadeTekst = appLabel(
    "klanten.dimensie.delete.bevestig.tekst",
    "Deze dimensie bevat {N} items en {M} pijnpunt-koppelingen. Bij verwijderen worden items en koppelingen ook weggehaald. Doorgaan?"
  ).replace("{N}", String(itemCount)).replace("{M}", String(couplingCount));

  const selectedOption = useMemo(
    () => ARCHETYPE_OPTIONS.find(o => o.value === archetype),
    [archetype]
  );

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX;
  const archetypeValid = archetype && selectedOption?.enabled;
  const canSubmit = nameValid && archetypeValid && !saving;

  const disabledTooltip = appLabel("klanten.archetype.disabled.tooltip", "komt in latere sprint");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setErrMsg(null);
    const { error } = await onSave({
      archetype,
      name: trimmedName,
      description: description.trim() || null,
    });
    setSaving(false);
    if (error) {
      setErrMsg(error.message || "Opslaan mislukt");
      return;
    }
    onClose();
  }

  const headerLabel = isEdit
    ? appLabel("klanten.dimensie.edit.titel", "Dimensie bewerken")
    : appLabel("klanten.dimensie.create.titel", "Nieuwe dimensie");

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-md shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-[var(--color-primary)]">{headerLabel}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-5 space-y-4">
          <div>
            <label
              htmlFor="dim-create-archetype"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.dimensie.create.archetype.label", "Archetype")}
              {isEdit && (
                <span className="ml-2 text-[9px] font-normal text-slate-400 italic normal-case">
                  {appLabel("klanten.dimensie.edit.archetype.locked", "(niet wijzigbaar — datamodel-impact)")}
                </span>
              )}
            </label>
            <select
              id="dim-create-archetype"
              value={archetype}
              onChange={e => setArchetype(e.target.value)}
              disabled={isEdit}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-accent)] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              autoFocus={!isEdit}
            >
              <option value="">{appLabel("klanten.dimensie.create.archetype.placeholder", "Kies een archetype…")}</option>
              {ARCHETYPE_OPTIONS.map(opt => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={!opt.enabled}
                  title={opt.enabled ? undefined : disabledTooltip}
                >
                  {opt.label}{opt.enabled ? "" : " (komt in latere sprint)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="dim-create-naam"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.dimensie.create.naam.label", "Naam")}
            </label>
            <input
              id="dim-create-naam"
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, NAME_MAX))}
              placeholder={selectedOption?.placeholder || appLabel("klanten.dimensie.create.naam.placeholder", "bijv. Klantsegmenten of Doelgroepen")}
              name="dimensie-naam"
              autoComplete="off"
              data-1p-ignore=""
              data-form-type="other"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              maxLength={NAME_MAX}
              autoFocus={isEdit}
            />
            {!nameValid && name.length > 0 && (
              <p className="text-[10px] text-red-600 mt-1">{appLabel("klanten.dimensie.create.error.naam_leeg", "Naam is verplicht")}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="dim-create-omschrijving"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.dimensie.create.omschrijving.label", "Omschrijving (optioneel)")}
            </label>
            <textarea
              id="dim-create-omschrijving"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, DESC_MAX))}
              placeholder={appLabel("klanten.dimensie.create.omschrijving.placeholder", "korte tenant-beschrijving van deze dimensie")}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              maxLength={DESC_MAX}
            />
          </div>

          {errMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {errMsg}
            </div>
          )}
        </form>

        {/* Footer — F21 cascade-confirm vervangt knoppen-rij wanneer confirmingDelete=true */}
        {confirmingDelete ? (
          <div
            data-testid="dimensie-modal-delete-confirm"
            className="flex items-start gap-3 px-6 py-3 border-t border-red-200 bg-red-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-800">
                {appLabel("klanten.dimensie.delete.bevestig.titel", "Dimensie verwijderen?")}
              </p>
              <p className="text-[11px] text-red-700">{cascadeTekst}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              data-testid="dimensie-modal-delete-confirm-nee"
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              {appLabel("klanten.dimensie.delete.bevestig.annuleren", "Annuleren")}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              data-testid="dimensie-modal-delete-confirm-ja"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50"
            >
              {deleting ? "Bezig…" : appLabel("klanten.dimensie.delete.bevestig.actie", "Ja, verwijder")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={saving}
                data-testid="dimensie-modal-delete"
                className="mr-auto px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {appLabel("klanten.dimensie.actie.verwijderen", "Verwijderen")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              {appLabel("klanten.knop.item.annuleren", "Annuleren")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Opslaan…" : appLabel("klanten.knop.item.opslaan", "Opslaan")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
