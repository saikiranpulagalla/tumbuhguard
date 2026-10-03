import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Node's BroadcastChannel dispatches Node Event instances, while jsdom owns the
// global Event constructor. Persistence tests do not exercise cross-tab UI
// messaging, so disable this incompatible host channel in the jsdom harness.
Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: undefined, writable: true });
