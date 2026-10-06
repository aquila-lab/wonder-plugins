---
name: wonder-design
description: Create, inspect, or edit Wonder canvas designs through Wonder MCP. Use when a request names Wonder or links a Wonder canvas and asks to work with designs, artboards, elements, components, tokens, or design-to-code and code-to-design workflows.
---

# Wonder design

Use Wonder MCP for canvas reads, edits, and screenshots. Use computer use to interact with Wonder only when the user explicitly requests desktop or browser automation. Naming Wonder or mentioning the plugin does not by itself request computer use.

## Connect to Wonder

1. Discover the Wonder MCP tools available in the session. If tools are deferred, use the host's tool discovery before concluding that Wonder is unavailable.
2. If the tools are missing, stop canvas work and explain that the Wonder plugin must be installed and enabled, or its MCP server connected. In Codex, select the installed Wonder plugin; the “Wonder · Computer use” entry starts desktop automation. After installing the plugin, start a new chat.
3. If authentication is required, complete the host's Wonder sign-in flow and retry the MCP request. If it fails, report the actual error and the next connection step. Do not silently switch to computer use.

## Work on the canvas

- Before design work, call Wonder's `get_skills` tool to load the matching workflow from its current catalog. Follow that workflow for design procedures and tool selection.
- Wonder does not need to be open. When the file the user means isn't open in Wonder, find it with `list_files` and `open_file`, which returns its page without opening anything on the user's screen. Don't ask the user to open Wonder first.
- Inspect the target canvas through MCP before editing. Keep changes within the user's requested scope.
- Use Wonder MCP for canvas operations, including visual checks through its screenshot tools. Continue using local repository tools for codebase reads and implementation.
- If a required operation is unavailable through MCP, explain the limitation. Use computer use only after an explicit user request for it.
