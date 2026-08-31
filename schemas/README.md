# Manifest schemas

- `plugin.schema.json` and `marketplace.schema.json` cover the current fields Wonder uses from the [Cursor plugin reference](https://cursor.com/docs/reference/plugins).
- Claude manifests link directly to Anthropic's current SchemaStore schemas and are checked with `claude plugin validate --strict` in CI.
- `codex-plugin.schema.json` and `codex-marketplace.schema.json` cover the current fields Wonder uses from the [OpenAI plugin packaging contract](https://developers.openai.com/plugins/build/plugins).

The local validator also checks provider-specific path rules, shared versions, MCP configuration, and referenced assets that JSON Schema cannot verify on its own.
