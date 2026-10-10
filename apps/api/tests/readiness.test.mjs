import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseReady} from '../src/lib/readiness.ts';

const withRows=(migrations,tables={users:'users',sessions:'auth_sessions',votes:'squad_submission_votes',verdicts:'battle_results'})=>({
 query:async sql=>String(sql).includes('app_migrations')
  ?{rows:migrations.map(name=>({name}))}:{rows:[tables]}
});

test('readiness rejects missing, incomplete or failed PostgreSQL migrations',async()=>{
 assert.equal(await databaseReady(withRows(['0000_baseline.sql','0001_squad_guards.sql','0002_advanced_challenges.sql','0003_battle_verdicts.sql'])),true);
 assert.equal(await databaseReady(withRows(['0000_baseline.sql','0001_squad_guards.sql','0002_advanced_challenges.sql'])),false);
 assert.equal(await databaseReady(withRows(['0000_baseline.sql','0001_squad_guards.sql'])),false);
 assert.equal(await databaseReady(withRows(['0000_baseline.sql'])),false);
 assert.equal(await databaseReady(withRows([])),false);
 assert.equal(await databaseReady(withRows(['0000_baseline.sql','0001_squad_guards.sql','0002_advanced_challenges.sql','0003_battle_verdicts.sql'],{users:'users',sessions:null,votes:'squad_submission_votes'})),false);
 assert.equal(await databaseReady({query:async()=>{throw new Error('relation app_migrations does not exist')}}),false);
});
