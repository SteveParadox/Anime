import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

// Environment passed by CI/Railway takes precedence over the local example copy.
const local=resolve(import.meta.dirname,'../../apps/api/.env');
if(existsSync(local))process.loadEnvFile(local);
