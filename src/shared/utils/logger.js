/**
 * Centrale logger utility
 *
 * - In development (npm start): alle logs zichtbaar
 * - In productie (npm build / Vercel): alleen errors
 *
 * Gebruik:
 *   import { log, warn, err } from '../shared/utils/logger';
 *   log("[init] canvas geladen:", data);   // alleen in dev
 *   err("[autosave] mislukt:", error);     // altijd zichtbaar
 */

const isDev = process.env.NODE_ENV === "development";

export const log  = (...args) => { if (isDev) console.log(...args); };
export const warn = (...args) => { if (isDev) console.warn(...args); };
export const err  = (...args) => console.error(...args); // altijd aan
