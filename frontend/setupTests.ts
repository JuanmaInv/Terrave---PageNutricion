import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

const localStorageMock = createStorageMock();

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });

  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverMock,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

