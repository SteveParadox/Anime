import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

test('D1 copy export keeps primary keys, vote rowids, and nullable historical snapshots',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'anime-d1-export-'));
 try{
  const source=join(directory,'source.sqlite'),target=join(directory,'backup');
  const initialize=spawnSync('python',['-c',`
import sqlite3,glob,sys
c=sqlite3.connect(sys.argv[1])
for f in sorted(glob.glob('drizzle/[0-9]*.sql')):
 for s in open(f, encoding='utf-8').read().split('--> statement-breakpoint'):
  if s.strip():c.executescript(s)
c.execute("INSERT INTO users (id,email,email_normalized,created,updated) VALUES ('old-user','test@example.com','test@example.com',1,1)")
c.execute("INSERT INTO battles (id,owner,payload,created) VALUES ('old-battle','old-user','{}',1)")
c.execute("INSERT INTO votes (rowid,battle,user,side,reason,evidence,created) VALUES (789,'old-battle','old-user','a','An argument','A source',1)")
c.commit()
`,source],{encoding:'utf8'});
  assert.equal(initialize.status,0,initialize.stderr);
  const before=createHash('sha256').update(await readFile(source)).digest('hex');
  const result=spawnSync('python',['scripts/database/export-d1.py',source,target],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const after=createHash('sha256').update(await readFile(source)).digest('hex');
  assert.equal(after,before,'export must leave the source database untouched');
  const data=await readFile(target+'.jsonl'),manifest=JSON.parse(await readFile(target+'.manifest.json','utf8'));
  assert.equal(createHash('sha256').update(data).digest('hex'),manifest.sha256);
  assert.equal(Object.keys(manifest.counts).length,35);
  assert.equal(manifest.counts.votes,1);
  const vote=data.toString().split('\n').filter(Boolean).map(JSON.parse).find(row=>row.table==='votes');
  assert.equal(vote.values.argument_id,789);
  assert.equal(vote.values.user,'old-user');
 }finally{await rm(directory,{recursive:true,force:true});}
});
