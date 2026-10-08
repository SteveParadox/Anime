import {z} from 'zod';

const schema=z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(4000),
 APP_BASE_URL:z.string().url().default('http://localhost:3000'),
 DATABASE_URL:z.string().url().refine(value=>value.startsWith('postgres://')||value.startsWith('postgresql://'),'Use a PostgreSQL URL'),
 DB_POOL_MAX:z.coerce.number().int().min(1).max(30).default(10),
 GOOGLE_CLIENT_ID:z.string().optional(),
 GOOGLE_CLIENT_SECRET:z.string().optional(),
 GOOGLE_REDIRECT_URI:z.string().optional(),
 RESEND_API_KEY:z.string().optional(),
 EMAIL_FROM:z.string().optional(),
 ANIME_CLASH_ADMIN_USER_ID:z.string().optional(),
 AUTH_DEV_EMAIL_LOG:z.string().optional(),
 LOG_LEVEL:z.enum(['fatal','error','warn','info','debug','trace']).default('info')
});
const parsed=schema.safeParse(process.env);
if(!parsed.success)throw new Error('Invalid API environment: '+parsed.error.issues.map(issue=>issue.path.join('.')+': '+issue.message).join('; '));
export const env=parsed.data;
const base=new URL(env.APP_BASE_URL);
if(base.pathname!=='/'||base.search||base.hash||base.username||base.password||env.NODE_ENV==='production'&&base.protocol!=='https:')
 throw new Error('APP_BASE_URL must be a bare HTTPS origin in production');
