# Rollback

Keep the original D1 database and its verified backup unchanged. Record the old frontend release, old Worker deployment, exported D1 SQL, export SHA-256/counts, and the PostgreSQL backup/snapshot before cutover.

If the final import or validation fails before reopening writes, leave the old application active and writing to D1; discard the disposable PostgreSQL target after preserving failure logs. Fix and rerun the complete export/import against a clean target.

If a problem appears after activation, freeze writes on the new frontend/API immediately. Restore routing to the previous frontend and Worker that still use D1, verify login and core reads/writes there, then investigate the PostgreSQL release. Writes accepted in PostgreSQL after cutover are **not** automatically mirrored into D1; reconcile those records explicitly before fully restoring old writes. Do not roll back schema migrations in place without a tested down plan. Retain both databases and logs until the reconciliation is signed off.

A simple Railway/Vercel code rollback is safe only when its schema and data expectations are compatible with the already applied PostgreSQL migrations. Otherwise restore a matching PostgreSQL snapshot in staging, rehearse the rollback there, and use a planned maintenance window.
