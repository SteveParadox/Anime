import './env.mjs';
import {createReadStream} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import pg from 'pg';

const [dataPath,manifestPath]=process.argv.slice(2);
if(!dataPath||!manifestPath)throw new Error('Usage: node scripts/database/import-d1.mjs DATA.jsonl DATA.manifest.json');
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const digest=createHash('sha256');
for await(const chunk of createReadStream(dataPath))digest.update(chunk);
if(manifest.format!==1||digest.digest('hex')!==manifest.sha256)throw new Error('Export checksum mismatch');
const tables=Object.keys(manifest.counts).sort();
if(tables.length!==35||!tables.includes('users')||!tables.includes('votes'))throw new Error('Unexpected export table inventory');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:5000});
const client=await pool.connect();
const quote=name=>'"'+name.replaceAll('"','""')+'"';
try{
 await client.query('BEGIN');
 const present=new Set((await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.map(row=>row.table_name));
 for(const table of tables){
  if(!present.has(table))throw new Error(`Postgres table ${table} is missing`);
  const {rows:[{n}]}=await client.query(`SELECT COUNT(*)::int AS n FROM ${quote(table)}`);
  if(n!==0)throw new Error(`Refusing to import into nonempty table ${table}. Restore a clean database and retry.`);
 }
 const accepted=new Map();
 for(const table of tables){
  const columns=(await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',table])).rows.map(row=>row.column_name);
  accepted.set(table,new Set(columns));
 }
 const counts=Object.fromEntries(tables.map(table=>[table,0]));
 let previous='';
 for await(const line of createInterface({input:createReadStream(dataPath),crlfDelay:Infinity})){
  const {table,values}=JSON.parse(line);
  if(!accepted.has(table)||table<previous)throw new Error('Export tables are missing or out of order');
  previous=table;
  const columns=Object.keys(values).sort();
  if(columns.some(name=>!accepted.get(table).has(name)))throw new Error(`Unknown ${table} column`);
  await client.query(`INSERT INTO ${quote(table)} (${columns.map(quote).join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(name=>values[name]));
  counts[table]++;
 }
 for(const table of tables){
  if(counts[table]!==manifest.counts[table])throw new Error(`Source count mismatch in ${table}`);
  const {rows:[{n}]}=await client.query(`SELECT COUNT(*)::int AS n FROM ${quote(table)}`);
  if(n!==counts[table])throw new Error(`Imported count mismatch in ${table}`);
 }
 // Check relationships explicitly: the original SQLite schema did not declare
 // foreign keys for every historical relationship, so table counts alone cannot
 // establish that records still point to their owners or parent snapshots.
 const references=[
  ...Object.entries({profiles:['user'],auth_identities:['user_id'],auth_sessions:['user_id'],email_verification_tokens:['user_id'],password_reset_tokens:['user_id'],battles:['owner'],votes:['user'],squads:['owner'],posts:['user'],progress:['user'],comments:['user','argument_user'],reactions:['user'],argument_evidence:['argument_user','contributor'],squad_challenges:['challenger'],challenge_votes:['user'],notifications:['user'],reports:['reporter'],watchlist:['user'],tournament_votes:['user'],squad_submissions:['owner'],squad_submission_votes:['user'],evidence_records:['submitted_by'],argument_evidence_links:['argument_user','linked_by']}).flatMap(([table,columns])=>columns.map(column=>[table,column,'users','id'])),
  ['squad_submission_members','submission_id','squad_submissions','id'],
  ['squad_submission_votes','submission_id','squad_submissions','id'],
  ['squad_submissions','challenge_id','daily_squad_challenges','id'],
  ['daily_squad_challenge_costs','challenge_id','daily_squad_challenges','id'],
  ['version_abilities','version_id','character_versions','id'],
  ['version_abilities','ability_id','abilities','id'],
  ['version_combat_roles','version_id','character_versions','id'],
  ['version_strategic_traits','version_id','character_versions','id'],
  ['evidence_records','version_id','character_versions','id'],
  ['argument_evidence_links','evidence_id','evidence_records','id']
 ];
 for(const [table,column,parent,parentKey] of references){
  const {rows:[{n}]}=await client.query(`SELECT COUNT(*)::int AS n FROM ${quote(table)} r LEFT JOIN ${quote(parent)} p ON p.${quote(parentKey)}=r.${quote(column)} WHERE r.${quote(column)} IS NOT NULL AND p.${quote(parentKey)} IS NULL`);
  if(n)throw new Error(`Unresolved reference: ${table}.${column} -> ${parent}.${parentKey}: ${n}`);
 }
 await client.query("SELECT setval(pg_get_serial_sequence('votes','argument_id'), GREATEST((SELECT COALESCE(MAX(argument_id),0) FROM votes),1), (SELECT COUNT(*)>0 FROM votes))");
 await client.query('COMMIT');
 console.log(JSON.stringify({status:'verified',counts,sha256:manifest.sha256}));
}catch(error){await client.query('ROLLBACK');throw error;}
finally{client.release();await pool.end();}
