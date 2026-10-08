import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';

// TypeScript's parser catches malformed JSX even when a textual contract test
// matches the expected components. This test does not need a running D1 worker.
function* sourceFiles(directory){
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  const file=join(directory,entry.name);
  if(entry.isDirectory())yield* sourceFiles(file);
  else if(entry.isFile()&&/\.tsx?$/.test(entry.name))yield file;
 }
}

test('application TypeScript and JSX files have no syntax errors',()=>{
 const paths=['apps/web/app','apps/web/components','apps/web/hooks','apps/api/src','packages/domain/src','packages/contracts/src','packages/database/src'].flatMap(root=>[...sourceFiles(root)]).sort();
 assert.ok(paths.includes(join('apps/web/components','daily-squad-challenge.tsx')),'Daily squad UI must be covered');
 const errors=[];
 for(const file of paths){
  const syntaxKind=file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS;
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,syntaxKind);
  for(const diagnostic of source.parseDiagnostics){
   const position=source.getLineAndCharacterOfPosition(diagnostic.start??0);
   const message=ts.flattenDiagnosticMessageText(diagnostic.messageText,' ');
   errors.push(`${file}:${position.line+1}:${position.character+1}: ${message}`);
  }
 }
 assert.deepEqual(errors,[],'A malformed JSX expression prevents the applications from starting');
});
