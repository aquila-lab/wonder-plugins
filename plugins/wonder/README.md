# Wonder

## Description

Wonder is an AI-native design tool built on a live canvas. With this plugin, your agent can read your designs — artboards, element trees, computed styles, screenshots, and text — and write back to the canvas in real time. Use it to turn designs into production code, generate new UI from your codebase, keep designs and components in sync, and ship faster.

## Features

- **Read designs**: Inspect artboards, element trees, computed styles, JSX output, screenshots, and text content directly from the user's active branch.
- **Write to the canvas**: Create artboards, add or replace elements, update styles, set text, and duplicate elements — all from a prompt.
- **Design-to-code**: Turn Wonder designs into production code by reading the canvas structure and generating components in your framework of choice.
- **Code-to-design**: Use your codebase (tokens, styles, components) as context to generate new designs on the canvas.
- **Cross-tool workflows**: Combine with other MCP servers (Figma, Notion, Linear, etc.) to sync tokens, pull real content, or translate designs across tools.

## Prerequisites

- A [Wonder](https://wonder.design) account.
- A spec-compliant MCP client with OAuth support: Cursor 2.5+, Claude Code 2.1.63+, Codex, or any other MCP client that supports remote HTTP servers and the OAuth `refresh_token` grant.

On first use, the plugin will trigger an OAuth sign-in flow in your IDE. After that, your agent stays signed in and tokens refresh automatically.

## Examples

### Example 1: Design from your codebase

**User prompt:** "Use the Tailwind tokens from my repo and design a pricing page in Wonder"

**Expected behavior:**

- The agent reads your project's stylesheets, tokens, or theme files to understand your existing design language.
- Creates a new artboard in Wonder and builds a pricing page that matches your codebase's visual style.
- Uses your actual colors, typography, spacing, and component patterns — not generic defaults.

### Example 2: Turn a design into code

**User prompt:** "Implement my Wonder design in this codebase, using my code conventions"

**Expected behavior:**

- The agent reads the selected artboard in Wonder — structure, styles, text content, and images.
- Generates production-ready components in your project's framework and coding style.
- Matches the design's layout, spacing, typography, and colors using your existing conventions (e.g. Tailwind classes, CSS modules, styled-components).

### Example 3: Match a design to existing components

**User prompt:** "Match this Wonder artboard's style to the components in src/components/"

**Expected behavior:**

- The agent reads the artboard in Wonder and the components in `src/components/`.
- Updates the artboard so spacing, color, and typography match the codebase's component library.
- Leaves unrelated artboards on the canvas untouched.

## Privacy Policy

See: [Wonder Privacy Policy](https://app.termly.io/policy-viewer/policy.html?policyUUID=3517f5bb-87fb-480f-b404-2c237177e94d)

## Support

- Documentation: [wonderdesign.featurebase.app/en/help/articles/5547236-get-started-with-wonder-mcp](https://wonderdesign.featurebase.app/en/help/articles/5547236-get-started-with-wonder-mcp)
- For issues or questions: team@wonder.so
