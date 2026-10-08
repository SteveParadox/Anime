import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const db=await PGlite.create();
const server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});
function run(args,cwd=root,env={}){
 return new Promise((resolveRun,reject)=>{
  const child=spawn(process.execPath,args,{cwd,env:{...process.env,...env},stdio:'inherit'});
  child.once('error',reject);
  child.once('exit',code=>code===0?resolveRun():reject(new Error(`${args.join(' ')} exited ${code}`)));
 });
}
try{
 await server.start();
 const connection=`postgresql://postgres@${server.getServerConn()}/postgres?sslmode=disable`;
 const env={DATABASE_URL:connection,TEST_DATABASE_URL:connection,APP_BASE_URL:'http://localhost:3000',DB_POOL_MAX:'1'};
 await run(['scripts/database/migrate.mjs','--through=0000_baseline.sql'],root,env);
 await run(['scripts/database/seed.mjs'],root,env);
 await run(['scripts/database/migrate.mjs'],root,env);
 await run(['--import','tsx','--test','tests/integration.pg.test.mjs'],resolve(root,'apps/api'),env);
}finally{await server.stop();await db.close();}
