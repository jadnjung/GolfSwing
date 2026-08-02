# local-database

A SQLite-backed repository layer (PRD section 7.5) is **deferred** — see `docs/adr/0006-defer-sqlite.md`. Today, swing history is read directly from `analysis-manifest.json` files on the filesystem (`apps/mobile/src/data/swingRepository.ts`), which is adequate at the scale a personal local swing history actually reaches. This package stays empty until a real database is introduced — when PRD section 5.11's sort/filter/search requirements outgrow "read all manifests and filter in memory."
