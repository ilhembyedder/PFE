import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // next-intl and use-intl are ESM-only with no CJS entry point. Tests
    // resolve messages through src/test/i18n-mock instead, which reads the
    // real catalogues, so a missing key or wrong placeholder still fails.
    "^next-intl$": "<rootDir>/src/test/i18n-mock.tsx",
    "^next-intl/server$": "<rootDir>/src/test/i18n-mock.tsx",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/components/ui/**",
    "!src/test/**",
  ],
};

export default createJestConfig(config);
