// Vitest setup: provide an in-memory localStorage before game modules import.
// The store reads `localStorage` at construction time, so this must run
// before `src/game/store.ts` is loaded.
const memory = new Map<string, string>()

const localStorageStub: Storage = {
  get length() {
    return memory.size
  },
  clear() {
    memory.clear()
  },
  getItem(key: string) {
    return memory.has(key) ? memory.get(key)! : null
  },
  key(index: number) {
    return Array.from(memory.keys())[index] ?? null
  },
  removeItem(key: string) {
    memory.delete(key)
  },
  setItem(key: string, value: string) {
    memory.set(key, String(value))
  },
}

;(globalThis as unknown as { localStorage: Storage }).localStorage = localStorageStub
