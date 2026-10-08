import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema';

pg.types.setTypeParser(20,value=>Number(value)); // All application BIGINT values are within JS safe integer range.
let pool:pg.Pool|undefined;
export function getPool(databaseUrl:string,max=10){
 pool??=new pg.Pool({connectionString:databaseUrl,max,idleTimeoutMillis:30_000,connectionTimeoutMillis:5_000});
 return pool;
}
export function getDb(databaseUrl:string){return drizzle(getPool(databaseUrl),{schema});}
export async function closePool(){await pool?.end();pool=undefined;}
