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

/*
 * The high-impact capabilities are OFF by default (utils/capabilities.ts). Most tests exercise what they do, so the
 * suite runs with both on; capabilities.test.ts turns them off to check the refusals. ffprobe / ffmpeg run through the
 * add-on, which an installed server loads by name; here it is the in-repo copy.
 */
import { setCapability } from '../../utils/capabilities.js';
import { setFfmpegRunner } from '../../tools/export-file-receipt.js';
import { run as ffmpegAddonRun } from '../../../packages/mcp-ffmpeg/index.js';

setCapability('code', true);
setCapability('localFiles', true);
setFfmpegRunner(ffmpegAddonRun);
