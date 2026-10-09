import {env} from './config/env';
import {getPool,closePool} from '@anime/database/client';
import {databaseReady} from './lib/readiness';
import {schedulerTick} from './lib/challenge-lifecycle';

let stopped=false;
process.once('SIGTERM',()=>{stopped=true;});
process.once('SIGINT',()=>{stopped=true;});
try{
 if(!await databaseReady(getPool(env.DATABASE_URL,env.DB_POOL_MAX)))throw new Error('Database migrations are required before starting challenge worker.');
 while(!stopped){
  try{console.info('Challenge scheduler tick',await schedulerTick());}
  catch(error){console.error('Challenge scheduler failed',error);}
  await new Promise<void>(resolve=>setTimeout(resolve,60_000));
 }
}catch(error){console.error('Challenge worker startup failed',error);process.exitCode=1;}
finally{await closePool();}
