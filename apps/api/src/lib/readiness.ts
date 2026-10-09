import type {Pool} from 'pg';

/** Readiness requires the deployed schema, not merely an open TCP connection. */
export async function databaseReady(pool:Pick<Pool,'query'>):Promise<boolean>{
 try{
  const migrations=await pool.query(
   'SELECT name FROM app_migrations WHERE name = ANY($1::text[])',
   [['0000_baseline.sql','0001_squad_guards.sql','0002_advanced_challenges.sql','0003_battle_verdicts.sql']]
  );
  const applied=new Set(migrations.rows.map(row=>row.name));
  if(!applied.has('0000_baseline.sql')||!applied.has('0001_squad_guards.sql')||!applied.has('0002_advanced_challenges.sql','0003_battle_verdicts.sql'))return false;
  const schema=await pool.query(
   "SELECT to_regclass('public.users') AS users, to_regclass('public.auth_sessions') AS sessions, to_regclass('public.squad_submission_votes') AS votes, to_regclass('public.battle_results') AS verdicts"
  );
  const row=schema.rows[0];
  return Boolean(row?.users&&row?.sessions&&row?.votes&&row?.verdicts);
 }catch{return false;}
}
