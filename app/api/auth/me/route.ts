import {publicAuthState} from '@/lib/auth';
import {authJson} from '@/lib/auth-request';
export async function GET(){return authJson(await publicAuthState())}
