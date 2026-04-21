/**
 * BTC Validator Service — Client
 * Kingfisher & Partners — April 2026
 */

import { apiFetch } from "../shared/services/apiClient";

export async function validateDocument(text) {
  const response = await apiFetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText: text.slice(0, 6000) }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Validator error ${response.status}`);
  }

  return response.json();
}
