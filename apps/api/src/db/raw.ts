import {getPool} from '@anime/database/client';
import {env} from '@/config/env';
import type {PoolClient,QueryResult} from 'pg';

// Temporary query boundary for the existing route/service code. SQL is
// parameterized and batch() uses an actual PostgreSQL transaction. The only
// SQLite syntax accepted here is the small, tested legacy subset below.
export function translateSql(input:string){
 const sql=input.replace(/\browid\b/gi,'argument_id').replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi,'INSERT INTO');
 let output='',mode:'code'|'single'|'double'='code',parameter=0;
 for(let i=0;i<sql.length;i++){
  const char=sql[i];
  if(mode==='single'){
   output+=char;
   if(char==="'"&&sql[i+1]==="'"){output+=sql[++i];continue;}
   if(char==="'")mode='code';
  }else if(mode==='double'){
   output+=char==='"'?"'":char;
   if(char==='"')mode='code';
  }else if(char==="'"){output+=char;mode='single';}
  else if(char==='"'){output+="'";mode='double';}
  else if(char==='?')output+='$'+(++parameter);
  else output+=char;
 }
 if(mode!=='code')throw new Error('Unterminated SQL literal');
 // PostgreSQL folds bare camelCase aliases. Preserve the existing API keys.
 output=output.replace(/\bAS\s+([a-z]+[A-Z][A-Za-z0-9]*)\b/g,(_all,alias)=>`AS "${alias}"`);
 // SQLite permitted the legacy `user` column unquoted; PostgreSQL reserves it.
 let escaped='',state:'code'|'literal'|'identifier'='code';
 for(let i=0;i<output.length;){
  const character=output[i];
  if(state==='code'&&character==="'"){escaped+=character;state='literal';i++;continue;}
  if(state==='code'&&character==='"'){escaped+=character;state='identifier';i++;continue;}
  if(state!=='code'){
   escaped+=character;i++;
   if(state==='literal'&&character==="'"&&output[i]==="'"){escaped+=output[i++];continue;}
   if(state==='literal'&&character==="'"||state==='identifier'&&character==='"')state='code';
   continue;
  }
  if(output.slice(i,i+4).toLowerCase()==='user'&&!/[\w]/.test(output[i-1]||'')&&!/[\w]/.test(output[i+4]||'')){
   escaped+='"user"';i+=4;continue;
  }
  escaped+=character;i++;
 }
 output=escaped;
 if(/INSERT\s+OR\s+IGNORE\s+INTO/i.test(input))output+=' ON CONFLICT DO NOTHING';
 return {sql:output,parameters:parameter};
}

export class PreparedStatement{
 constructor(readonly source:string,readonly values:unknown[]=[],readonly client?:PoolClient){}
 bind(...values:unknown[]){return new PreparedStatement(this.source,values,this.client);}
 async query(client?:PoolClient):Promise<QueryResult>{
  const converted=translateSql(this.source);
  if(converted.parameters!==this.values.length)throw new Error('SQL binding count mismatch');
  return (client||this.client||getPool(env.DATABASE_URL,env.DB_POOL_MAX)).query(converted.sql,this.values);
 }
 async first<T=Record<string,unknown>>(){return (await this.query()).rows[0] as T|undefined;}
 async all<T=Record<string,unknown>>(){return {results:(await this.query()).rows as T[]};}
 async run(){const result=await this.query();return {success:true,meta:{changes:result.rowCount||0}};}
}
export type DatabaseClient={
 prepare:(sql:string)=>PreparedStatement;
 batch:(statements:PreparedStatement[])=>Promise<QueryResult[]>;
 transaction:<T>(work:(tx:DatabaseClient)=>Promise<T>)=>Promise<T>;
};
const createDatabase=(activeClient?:PoolClient):DatabaseClient=>({
 prepare:(sql:string)=>new PreparedStatement(sql,[],activeClient),
 async batch(statements:PreparedStatement[]){
  const client=activeClient||await getPool(env.DATABASE_URL,env.DB_POOL_MAX).connect();
  try{
   if(!activeClient)await client.query('BEGIN');
   const results=[];
   for(const statement of statements)results.push(await statement.query(client));
   if(!activeClient)await client.query('COMMIT');
   return results;
  }catch(error){if(!activeClient)await client.query('ROLLBACK');throw error;}
  finally{if(!activeClient)client.release();}
 },
 async transaction<T>(work:(tx:DatabaseClient)=>Promise<T>){
  if(activeClient)throw new Error('Nested transactions are not supported');
  const client=await getPool(env.DATABASE_URL,env.DB_POOL_MAX).connect();
  try{
   await client.query('BEGIN');
   const result=await work(createDatabase(client));
   await client.query('COMMIT');
   return result;
  }catch(error){await client.query('ROLLBACK');throw error;}
  finally{client.release();}
 }
});
export const database=()=>createDatabase();
