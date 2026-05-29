/**
 * Barrel export — maintains 100% backward compatibility with all existing imports.
 * All consumers using `import { ... } from "@/lib/nutrilen"` continue to work unchanged.
 *
 * Pattern: Facade — this index is the single entry point to the nutrilen domain.
 */
export * from "./nutrilen.types";
export * from "./nutrilen.storage";
export * from "./nutrilen.seed";
