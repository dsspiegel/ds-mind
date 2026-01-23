---
description: How to commit code changes with proper author attribution
---

# Git Commit Workflow

This project uses git with author attribution to track who made changes (human or AI agent).

## Author Identification

Use `--author` flag with the appropriate identity:

| Author | Email Format |
|--------|--------------|
| Dave (human) | `Dave <dave@local>` |
| Claude/Opus | `Opus <opus@ai>` |
| GPT | `GPT <gpt@ai>` |
| Gemini | `Gemini <gemini@ai>` |

## Commit Message Format

Use conventional commit style:
```
<type>(<scope>): <description>

[optional body]

Author: <agent-name>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

## Example Commands

// turbo
```bash
# Stage changes
git add -A
```

// turbo
```bash
# Commit as Opus
git commit --author="Opus <opus@ai>" -m "feat(backend): add claims extraction with Gemini"
```

// turbo
```bash
# Check status
git status
```

## When to Commit

Commit after:
1. Completing a feature or fix
2. Before switching to a different task
3. At natural breakpoints in development
4. Before ending a session

## Quick Reference

```bash
# As Opus (Claude)
git commit --author="Opus <opus@ai>" -m "message"

# As GPT
git commit --author="GPT <gpt@ai>" -m "message"

# As Gemini
git commit --author="Gemini <gemini@ai>" -m "message"

# As Dave
git commit --author="Dave <dave@local>" -m "message"
```
