import { ensureU2NetpModel, U2NETP_MODEL } from './ai-background.mjs';
import { parseArgs } from './shared.mjs';

const args = parseArgs(process.argv.slice(2));
const modelPath = String(args.get('model') || U2NETP_MODEL.path);
const force = args.has('force');
const absolute = await ensureU2NetpModel({ force, modelPath });

console.log(`[assets] U2NetP ready: ${absolute}`);
console.log(`[assets] SHA-256: ${U2NETP_MODEL.sha256}`);
