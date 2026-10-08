import * as handler0 from './routes/auth/complete-profile/route';
import * as handler1 from './routes/auth/forgot-password/route';
import * as handler2 from './routes/auth/google/callback/route';
import * as handler3 from './routes/auth/google/route';
import * as handler4 from './routes/auth/login/route';
import * as handler5 from './routes/auth/logout/route';
import * as handler6 from './routes/auth/me/route';
import * as handler7 from './routes/auth/providers/route';
import * as handler8 from './routes/auth/register/route';
import * as handler9 from './routes/auth/resend-verification/route';
import * as handler10 from './routes/auth/reset-password/route';
import * as handler11 from './routes/auth/set-password/route';
import * as handler12 from './routes/auth/verify-email/route';
import * as handler13 from './routes/characters/route';
import * as handler14 from './routes/community/route';
import * as handler15 from './routes/evidence/route';
import * as handler16 from './routes/squad-challenges/route';
import * as handler17 from './routes/squad-submissions/route';
import * as handler18 from './routes/squad-submissions/vote/route';

export const routeHandlers=[
 {path:'/api/auth/complete-profile',handlers:handler0},
 {path:'/api/auth/forgot-password',handlers:handler1},
 {path:'/api/auth/google/callback',handlers:handler2},
 {path:'/api/auth/google',handlers:handler3},
 {path:'/api/auth/login',handlers:handler4},
 {path:'/api/auth/logout',handlers:handler5},
 {path:'/api/auth/me',handlers:handler6},
 {path:'/api/auth/providers',handlers:handler7},
 {path:'/api/auth/register',handlers:handler8},
 {path:'/api/auth/resend-verification',handlers:handler9},
 {path:'/api/auth/reset-password',handlers:handler10},
 {path:'/api/auth/set-password',handlers:handler11},
 {path:'/api/auth/verify-email',handlers:handler12},
 {path:'/api/characters',handlers:handler13},
 {path:'/api/community',handlers:handler14},
 {path:'/api/evidence',handlers:handler15},
 {path:'/api/squad-challenges',handlers:handler16},
 {path:'/api/squad-submissions',handlers:handler17},
 {path:'/api/squad-submissions/vote',handlers:handler18}
] as const;
