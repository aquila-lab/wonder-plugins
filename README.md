# Wonder plugins

Create and edit designs with your coding agent on a canvas where every design is real code. Wonder plugins are available for Cursor, Claude Code, and Codex.

## Install

### Cursor

1. Open **Customize** in the Cursor sidebar.
2. Search for **Wonder**, select **Install**, and choose a user or project scope.

3. Open the [Wonder](https://wonder.design) app and open any canvas file you want the generations drawn to. Then, back in Cursor, type a prompt like:

   ```
   Generate a purple button in Wonder
   ```

4. On first use, Cursor will say the Wonder MCP needs authentication and show a URL. Open it in your browser to authorize, then come back to Cursor and re-send the same prompt. Watch it draw onto your canvas in real time.

### Claude Code

1. Open your terminal and run `claude` to start Claude Code.
2. Add the marketplace:

   ```sh
   /plugin marketplace add aquila-lab/wonder-plugins
   ```

3. Install the plugin:

   ```sh
   /plugin install wonder@wonder
   ```

4. Reload to activate it:

   ```sh
   /reload-plugins
   ```

5. Open the [Wonder](https://wonder.design) app and open any canvas file you want the generations drawn to. Then, back in Claude Code, type a prompt like:

   ```
   Generate a purple button in Wonder
   ```

6. On first use, Claude will say the Wonder MCP needs authentication and print a URL. Open that link in your browser to authorize, then come back to Claude Code and re-send the same prompt. Watch it draw onto your canvas in real time.

![Wonder running in Claude Code](./assets/claude-code-walkthrough.png)

### Codex

1. Add the Wonder marketplace from your terminal:

   ```sh
   codex plugin marketplace add aquila-lab/wonder-plugins
   ```

2. Install the plugin:

   ```sh
   codex plugin add wonder@wonder
   ```

3. Open the [Wonder](https://wonder.design) app and open any canvas file you want the generations drawn to. Then, back in Codex, type a prompt like:

   ```
   Generate a purple button in Wonder
   ```

4. On first use, Codex will say the Wonder MCP needs authentication and show a URL. Open it in your browser to authorize, then come back to Codex and re-send the same prompt. Watch it draw onto your canvas in real time.

## How it works

The plugin connects your agent directly to your Wonder canvas. It can inspect existing designs, components, variables, and documentation, create new screens and flows, and edit designs in place. Because every Wonder design is real HTML and CSS, your agent works with the actual structure and styling instead of screenshots or handoff specs.

Wonder MCP uses OAuth, requires no API keys, and is free on every Wonder plan.

## Missing your agent?

[Open an issue](https://github.com/aquila-lab/wonder-plugins/issues/new) and we'll add it.

## License

[MIT](./LICENSE)
