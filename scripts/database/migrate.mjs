import './env.mjs';
import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import pg from 'pg';

const {Pool}=pg;
const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL is required');
const pool=new Pool({connectionString:databaseUrl,max:2,connectionTimeoutMillis:5000});
const root=resolve(import.meta.dirname,'../../packages/database/migrations');
const client=await pool.connect();
try{
 await client.query('SELECT pg_advisory_lock(472913812)');
 await client.query('CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 const through=process.argv.find(arg=>arg.startsWith('--through='))?.slice('--through='.length);
 const files=(await readdir(root)).filter(file=>/^\d+_.*\.sql$/.test(file)).sort().filter(file=>!through||file<=through);
 if(through&&!files.includes(through))throw new Error(`Unknown migration: ${through}`);
 for(const name of files){
  if((await client.query('SELECT 1 FROM app_migrations WHERE name=$1',[name])).rowCount)continue;
  await client.query('BEGIN');
  try{
   await client.query(await readFile(resolve(root,name),'utf8'));
   await client.query('INSERT INTO app_migrations(name) VALUES ($1)',[name]);
   await client.query('COMMIT');
   console.log(`Applied ${name}`);
  }catch(error){await client.query('ROLLBACK');throw error;}
 }
 await client.query('SELECT pg_advisory_unlock(472913812)');
}finally{client.release();await pool.end();}
