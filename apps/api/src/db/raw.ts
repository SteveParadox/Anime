import {getPool} from '@anime/database/client';
import {env} from '@/config/env';
import type {PoolClient,QueryResult} from 'pg';

// Temporary query boundary for the existing route/service code. SQL is
// parameterized and batch() uses an actual PostgreSQL transaction. The only
// SQLite syntax accepted here is the small, tested legacy subset below.
// The old D1 handlers used double quotes for *literal values*. Convert only
// known legacy values. Preserve real PostgreSQL quoted identifiers untouched.
const LEGACY_DOUBLE_QUOTED_VALUES=new Set([
 'a','b','draw','open','tournament','[removed]','[removed by moderator]'
]);
export function translateSql(input:string){
 const ignore=/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(input);
 const source=ignore?input.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i,'INSERT INTO'):input;
 let output='',parameter=0,mode:'code'|'single'='code';
 for(let i=0;i<source.length;){
  const ch=source[i];
  if(mode==='single'){
   output+=ch;i++;
   if(ch==="'"&&source[i]==="'"){output+=source[i++];continue;}
   if(ch==="'")mode='code';
   continue;
  }
  if(ch==="'"){mode='single';output+=ch;i++;continue;}
  if(ch==='"'){
   const initial=i;
   i++;
   let value='',closed=false;
   while(i<source.length){
    if(source[i]==='"'){
     if(source[i+1]==='"'){value+='"';i+=2;continue;}
     i++;closed=true;break;
    }
    value+=source[i++];
   }
   if(!closed)throw new Error('Unterminated quoted SQL identifier');
   output+=LEGACY_DOUBLE_QUOTED_VALUES.has(value)
    ?"'"+value.replace(/'/g,"''")+"'"
    :source.slice(initial,i);
   continue;
  }
  if(ch==='?'){output+='$'+(++parameter);i++;continue;}
  const word=source.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)?.[0];
  if(word){
   if(word.toUpperCase()==='AS'){
    const alias=source.slice(i+word.length).match(/^([ \t\r\n]+)([a-z]+[A-Z][A-Za-z0-9]*)\b/);
    if(alias){
     output+=word+alias[1]+'"'+alias[2]+'"';
     i+=word.length+alias[0].length;continue;
    }
   }
   if(word.toLowerCase()==='rowid')output+='argument_id';
   else if(word.toLowerCase()==='user')output+='"user"';
   else output+=word;
   i+=word.length;continue;
  }
  output+=ch;i++;
 }
 if(mode!=='code')throw new Error('Unterminated SQL literal');
 // CamelCase aliases are quoted only while scanning SQL code, not string literals.
 if(ignore)output+=' ON CONFLICT DO NOTHING';
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
