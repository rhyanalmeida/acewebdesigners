/// <reference types="vite/client" />

// Global type declarations
declare global {
  interface Window {
    Elfsight?: any;
    fbq?: (...args: any[]) => void;
    Calendly?: any;
  }
}

export {};
