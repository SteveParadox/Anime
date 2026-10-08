import {defineConfig} from 'tsup';

export default defineConfig({
 entry:['src/server.ts','src/app.ts'],format:['esm'],platform:'node',target:'node22',
 outDir:'dist',clean:true,noExternal:[/^@anime\//]
});
