import {defineConfig} from 'drizzle-kit';

export default defineConfig({
 schema:'./src/schema.ts',
 out:'./generated',
 dialect:'postgresql',
 ...(process.env.DATABASE_URL?{dbCredentials:{url:process.env.DATABASE_URL}}:{})
});
