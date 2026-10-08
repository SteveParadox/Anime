"""Export a local SQLite copy of D1 to deterministic JSONL and a manifest.

First obtain a *remote* D1 SQL export using Wrangler, then restore that export
into a local SQLite file. This script never opens the production D1 database.
"""
import hashlib
import json
import pathlib
import sqlite3
import sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: python scripts/database/export-d1.py SOURCE.sqlite OUTPUT_PREFIX")
source, prefix = map(pathlib.Path, sys.argv[1:])
db = sqlite3.connect(f"file:{source.resolve()}?mode=ro", uri=True)
db.row_factory = sqlite3.Row
tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
if len(tables) != 35 or 'users' not in tables or 'votes' not in tables:
    raise SystemExit("Unexpected source schema; apply all D1 migrations to the exported database first")
issues = list(db.execute('PRAGMA foreign_key_check'))
if issues:
    raise SystemExit(f"D1 source has {len(issues)} foreign-key violations")
counts = {}
data_path = prefix.with_suffix('.jsonl')
with data_path.open('w', encoding='utf-8') as output:
    for table in tables:
        count = 0
        columns = [r['name'] for r in db.execute(f'PRAGMA table_info("{table}")')]
        if table == 'votes':
            columns += ['argument_id']
            query = 'SELECT *, rowid AS argument_id FROM "votes" ORDER BY rowid'
        else:
            key = ', '.join('"' + r['name'] + '"' for r in db.execute(f'PRAGMA table_info("{table}")') if r['pk'])
            query = f'SELECT * FROM "{table}" ORDER BY {key}'
        for row in db.execute(query):
            payload = {'table': table, 'values': {column: row[column] for column in columns}}
            output.write(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n')
            count += 1
        counts[table] = count
digest = hashlib.sha256(data_path.read_bytes()).hexdigest()
manifest_path = prefix.with_suffix('.manifest.json')
manifest_path.write_text(json.dumps({'format': 1, 'sha256': digest, 'counts': counts}, indent=2, sort_keys=True) + '\n')
print(json.dumps({'data': str(data_path), 'manifest': str(manifest_path), 'sha256': digest, 'counts': counts}, sort_keys=True))
