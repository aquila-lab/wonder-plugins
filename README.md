# Wonder agent plugins

Use [Wonder](https://wonder.so) with your favorite agent harness.
Missing one? [Request it in an issue](https://github.com/aquila-lab/wonder-plugins/issues/new).

## Cursor

```sh
/add-plugin wonder
```

- [View on Cursor Marketplace](https://cursor.com/marketplace/wonder)
- [Read more about installing Cursor plugins](https://cursor.com/docs/plugins#installing-plugins)

## Claude Code

**Add the marketplace**

```sh
/plugin marketplace add aquila-lab/wonder-plugins
```

**Install the plugin**

```sh
/plugin install wonder@wonder
```

## Codex

The plugin is published to the Codex marketplace. Install it from the Codex plugin browser, or add it manually by pointing Codex at this repo.

## What's inside

- `plugins/wonder/` — the Wonder plugin (Cursor, Claude Code, Codex manifests + remote MCP server config).
- `.cursor-plugin/marketplace.json` — Cursor marketplace manifest.
- `.claude-plugin/marketplace.json` — Claude Code marketplace manifest.
- `.agents/plugins/marketplace.json` — Codex marketplace manifest.

The plugin connects your agent to the Wonder MCP server hosted at `https://mcp.wonder.so/mcp`. Authentication uses standard OAuth (PKCE + refresh tokens) — no API keys to manage.

## License

[MIT](./LICENSE)
