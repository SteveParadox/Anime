import {createApp} from './app';
import {env} from './config/env';
import {closePool,getPool} from '@anime/database/client';
import {databaseReady} from './lib/readiness';

const app=createApp();
const shutdown=async()=>{await app.close();await closePool();};
process.once('SIGINT',()=>{void shutdown();});
process.once('SIGTERM',()=>{void shutdown();});
try{
 if(!await databaseReady(getPool(env.DATABASE_URL,env.DB_POOL_MAX)))throw new Error('PostgreSQL schema is not fully migrated');
 await app.listen({port:env.PORT,host:'0.0.0.0'});
}
catch(error){app.log.error({err:error},'API startup failed');await shutdown();process.exitCode=1;}
