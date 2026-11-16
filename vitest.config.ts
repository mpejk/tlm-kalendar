import { defineConfig } from 'vitest/config';
// Only the project's own tests: not those of dependencies, of agent worktrees or of a handover test clone.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], exclude: ['node_modules/**', '.claude/**', '.handover-test/**'], testTimeout: 120000 } });
