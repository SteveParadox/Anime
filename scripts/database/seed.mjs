import './env.mjs';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import pg from 'pg';

if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const source=new URL('../../packages/database/seeds/catalog.jsonl',import.meta.url);
const allowed=new Set(['character_versions','abilities','version_abilities','squad_version_costs','version_combat_roles','version_strategic_traits']);
const quote=value=>'"'+value.replaceAll('"','""')+'"';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:5000});
const client=await pool.connect();
let count=0;
try{
 await client.query('BEGIN');
 for await(const line of createInterface({input:createReadStream(source),crlfDelay:Infinity})){
  const {table,values}=JSON.parse(line);
  if(!allowed.has(table))throw new Error(`Unexpected catalog seed table: ${table}`);
  const columns=Object.keys(values);
  await client.query(`INSERT INTO ${quote(table)} (${columns.map(quote).join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT DO NOTHING`,columns.map(column=>values[column]));
  count++;
 }
 await client.query('COMMIT');
 console.log(`Checked ${count} catalog seed rows`);
}catch(error){await client.query('ROLLBACK');throw error;}
finally{client.release();await pool.end();}
