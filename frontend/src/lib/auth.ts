const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

const isPlaceholderClerkKey =
  CLERK_PUBLISHABLE_KEY.length === 0 ||
  CLERK_PUBLISHABLE_KEY === "pk_test_xxxxxxxxxxxxxxxxx" ||
  CLERK_PUBLISHABLE_KEY.includes("xxxxxxxx");

export const AUTH_ENABLED = !TEST_AUTH_MODE && !isPlaceholderClerkKey;
export const AUTH_DISABLED_REASON = AUTH_ENABLED
  ? null
  : TEST_AUTH_MODE
    ? "test-mode"
    : "missing-clerk-key";
