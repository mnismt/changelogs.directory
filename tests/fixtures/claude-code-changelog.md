# Changelog

All notable changes to this project will be documented in this file.

## 2.0.31

- Windows: native installation uses shift+tab as shortcut for mode switching, instead of alt+m
- Vertex: add support for Web Search on supported models
- VSCode: Adding the respectGitIgnore configuration to include .gitignored files in file searches (defaults to true)
- Fixed a bug with subagents and MCP servers related to "Tool names must be unique" error
- Fixed issue causing '/compact to fail with `prompt_too_long` by making it respect existing compact boundaries
- Fixed plugin uninstall not removing plugins

## 2.0.30

- Fixed a bug where subagents could not access MCP tools
- Improved error handling for network timeouts
- Performance: Optimized changelog parsing for large files

## 2.0.29

- BREAKING: Removed support for custom ripgrep configuration, resolving an issue with conflicting settings
- Added `allowUnsandboxedCommands` sandbox setting to disable the dangerous command warning
- Added `disallowedTools` field to custom agent definitions for explicit tool filtering
- Fixed hooks and plugins not executing when using --dangerously-skip-sandbox flag

