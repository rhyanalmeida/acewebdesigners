/// <reference types="vite/client" />

// Global type declarations
declare global {
  interface Window {
    Elfsight?: unknown;
    // `fbq` is declared (properly typed) in src/types/facebook.d.ts — don't
    // redeclare it here or the two conflict (modifiers + loose `any`).
  }

  // Vite client env vars (see .env / Netlify build env). Only VITE_-prefixed
  // vars are exposed to the browser bundle.
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
