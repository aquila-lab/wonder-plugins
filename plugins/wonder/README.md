# Wonder

## Description

Wonder connects your coding agent to a canvas where every design is real code. Your agent can inspect existing designs, components, variables, and documentation, create new screens and flows, and edit designs in place.

Because Wonder is built on real HTML and CSS, your agent works with the actual design structure and styling instead of screenshots or handoff specs. Use it to bring your product context onto the canvas, explore and refine UI, and move approved designs back into production without rebuilding them.

Wonder MCP uses OAuth, requires no API keys, and is free on every Wonder plan.

## Features

- **Read designs**: Inspect artboards, element trees, computed styles, JSX output, screenshots, and text content in any Wonder file you can reach.
- **Write to the canvas**: Create artboards, add or replace elements, update styles, set text, and duplicate elements — all from a prompt.
- **Design-to-code**: Turn Wonder designs into production code by reading the canvas structure and generating components in your framework of choice.
- **Code-to-design**: Use your codebase (tokens, styles, components) as context to generate new designs on the canvas.
- **Cross-tool workflows**: Combine with other MCP servers (Figma, Notion, Linear, etc.) to sync tokens, pull real content, or translate designs across tools.

## Prerequisites

- A [Wonder](https://wonder.design) account.
- Cursor, Claude Code, Codex, or another MCP client with remote HTTP and OAuth support.

The Wonder app doesn't need to be open. Wonder's server runs the canvas tools, so your agent works on any file you can reach in the background, and the changes appear live in any editor that has the file open.

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

## Data handling

This plugin has no hooks, scripts, or local commands. Its only network connection is the Wonder MCP server at `https://mcp.wonder.so/mcp`, which you sign in to with OAuth. When your agent calls a Wonder tool, it sends that tool's inputs to Wonder, such as design instructions, text, styles, and any code context the agent includes, and receives canvas data back. Wonder handles that data under its [privacy policy](https://wonder.design/privacy-policy).

## Privacy Policy

See: [Wonder Privacy Policy](https://wonder.design/privacy-policy)

## Support

- Documentation: [wonderdesign.featurebase.app/en/help/articles/5547236-get-started-with-wonder-mcp](https://wonderdesign.featurebase.app/en/help/articles/5547236-get-started-with-wonder-mcp)
- Help center: [wonder.design/docs/support](https://wonder.design/docs/support)
- For issues or questions: [team@wonder.so](mailto:team@wonder.so)
