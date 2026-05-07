/**
 * useCanvasDimensions — load dimensies + items voor een canvas, met
 * race-guards en reset-vooraf per CLAUDE.md sectie 4.3.
 *
 * Returns:
 *   { loading, error, dimensions, items, reload }
 *
 * dimensions = [{ id, archetype, name, ... }, ...]
 * items      = [{ id, dimension_id, name, archetype_data, ... }, ...]
 *
 * Re-fetcht bij canvasId-wijziging. Reload-callback voor expliciete
 * her-fetch na mutatie.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as klantenService from "../services/klanten.service";

export function useCanvasDimensions(canvasId) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [items, setItems]           = useState(null);
  const [reloadKey, setReloadKey]   = useState(0);

  // canvasIdRef voor stale-closure protectie (CLAUDE.md sectie 4.4)
  const canvasIdRef = useRef(canvasId);
  useEffect(() => { canvasIdRef.current = canvasId; }, [canvasId]);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!canvasId) {
      setLoading(false);
      setDimensions([]);
      setItems([]);
      return;
    }

    const activeCanvasId = canvasId;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDimensions(null);
    setItems(null);

    (async () => {
      const [dimRes, itemRes] = await Promise.all([
        klantenService.listDimensions(activeCanvasId),
        klantenService.listItemsForCanvas(activeCanvasId),
      ]);

      // Race-guards: cleanup-flag + canvas-id-vergelijking
      if (cancelled) return;
      if (activeCanvasId !== canvasIdRef.current) return;

      if (dimRes.error) {
        setError(dimRes.error);
        setLoading(false);
        return;
      }
      if (itemRes.error) {
        setError(itemRes.error);
        setLoading(false);
        return;
      }

      setDimensions(dimRes.data);
      setItems(itemRes.data);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [canvasId, reloadKey]);

  return { loading, error, dimensions, items, reload };
}
