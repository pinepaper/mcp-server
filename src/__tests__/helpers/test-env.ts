/**
 * Loaded before every test file (bunfig.toml [test] preload). Exports default to
 * ~/Downloads/PinePaper (utils/export-dir.ts), so a test that saves one without
 * choosing a folder would write into the developer's real Downloads. Every run
 * gets its own temp folder instead; a test of the default deletes this itself.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (!process.env.PINEPAPER_EXPORT_DIR) process.env.PINEPAPER_EXPORT_DIR = mkdtempSync(join(tmpdir(), 'pp-test-exports-'));
