import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";
import { webcrypto } from "node:crypto";

// jsdom ships neither the text encoders nor WebCrypto, both of which the
// cookie sealing layer depends on. Node's implementations are the same ones
// the Edge and Node runtimes use in production, so this is a faithful
// substitute rather than a mock.
Object.assign(globalThis, {
  TextEncoder: globalThis.TextEncoder ?? TextEncoder,
  TextDecoder: globalThis.TextDecoder ?? TextDecoder,
});

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

// The rest is jsdom-only. Route-handler tests opt into the node
// environment via a docblock, where `window` does not exist.
if (typeof window !== "undefined") {
  // Base UI and next-themes both touch these. Shared here rather than
  // duplicated per test file, which the previous suite did four times over.
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
}
