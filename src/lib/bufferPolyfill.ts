// Some Cosmos libraries (Skip Go widget, cosmjs) expect Node's Buffer global.
// Imported before them so it exists when their modules evaluate.
import { Buffer } from 'buffer';
const g = globalThis as unknown as { Buffer?: typeof Buffer };
if (!g.Buffer) g.Buffer = Buffer;
