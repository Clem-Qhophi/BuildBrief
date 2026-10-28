# Privacy statement (hackathon scope)

Build Brief is local-first. The ledger (`.buildbrief/`), reports, and quizzes
live on the operator's machine and are git-ignored by default; nothing leaves
the machine except explicit Meta API calls.

- **Model calls**: Standard mode only — per Meta's docs, content sent via the
  Standard API is not used for training. Only allowlisted, size-capped,
  secret-scanned excerpts are transmitted, and only when the operator selects
  `--provider meta` with a key present. Default operation is fully offline.
- **Secrets**: `.env*`, `*.pem`, `*.key` are hard-excluded from evidence;
  secret-shaped content anywhere is cited by path with content withheld, and
  never enters model payloads. API keys live in environment variables only
  (`BB_META_API_KEY` preferred) and are never written to the ledger, logs,
  reports, or tracked files.
- **Prompts**: captured prompts stay in the local ledger. Export/sharing is an
  explicit operator action (not yet implemented; see roadmap).
- **Third parties**: none besides Meta's Model API when explicitly enabled.
  No analytics, no telemetry in this build.

This statement covers the hackathon submission. Multi-user and cloud operation
would require per-tenant isolation and data-retention terms (see roadmap, P2).
