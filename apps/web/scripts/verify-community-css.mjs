import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// Run after Next.js production compilation; it is not enough for the source
// stylesheet to exist if the CSS never reaches the emitted client bundle.
const staticDir=join(process.cwd(),'.next','static');
if(!existsSync(staticDir))throw Error('Missing .next/static output: run the production Next.js build first.');

function collectCss(folder){
 const files=[];
 for(const entry of readdirSync(folder,{withFileTypes:true})){
  const filename=join(folder,entry.name);
  if(entry.isDirectory())files.push(...collectCss(filename));
  else if(entry.isFile()&&entry.name.endsWith('.css'))files.push(filename);
 }
 return files;
}

const assets=collectCss(staticDir);
if(!assets.length)throw Error('No emitted Next.js CSS assets found.');
const css=assets.map(file=>readFileSync(file,'utf8')).join('\n');
const requiredSelectors=[
 '.ac-community','.ac-heading','.ac-club-card','.ac-feed','.ac-post',
 '.ac-shield','.ac-fan','.ac-anime-card','.ac-profile-cover','.ac-profile-editor'
];
const missing=requiredSelectors.filter(selector=>!css.includes(selector));
if(missing.length)throw Error('Community styles missing from production CSS: '+missing.join(', '));
if(css.includes('../components/community/community.css'))throw Error('Community stylesheet was left as an unresolved CSS @import.');
console.log('Community CSS verified in '+assets.length+' production stylesheet(s).');
