# AGENTS.md

## Purpose
This repository is currently in pre-development. Use this file to stay aligned with the product plan and avoid inventing implementation details.

## Source Of Truth
- Primary spec: [PRD.MD](PRD.MD)
- Product status: pre-development (see PRD header)

If code and PRD conflict during early scaffolding, treat PRD as authoritative unless the user explicitly overrides it.

## Current Repository State
- Present files: [PRD.MD](PRD.MD), [sc.py](sc.py)
- There is no scaffolded contract or frontend project yet.

## What To Build First
Follow the Level 3 then Level 4 rollout in [Scope by Belt Level](PRD.MD#7-scope-by-belt-level):
1. Level 3 MVP: single `StreamVault` contract + minimal dApp
2. Level 4 extensions: `StreamFactory`, Blend integration, `FLOW` token, events, CI/CD, mobile

Do not implement Level 4 features in Level 3 tasks unless explicitly asked.

## Commands And Execution
No runnable build/test commands exist yet because project scaffolding is not present.

After scaffolding is added, preferred commands are documented in:
- [Test Requirements](PRD.MD#14-test-requirements)
- [CI/CD Pipeline](PRD.MD#15-cicd-pipeline)
- [Tech Stack](PRD.MD#17-tech-stack)

When running commands, first verify directories and manifests exist (for example `contracts/`, `package.json`).

## Implementation Conventions
- Keep contract behavior aligned with [Functional Requirements — Level 3](PRD.MD#8-functional-requirements--level-3-green-belt) and [Contract Interface Specification](PRD.MD#13-contract-interface-specification).
- Preserve the product visual constraints in [Design System](PRD.MD#115-design-system).
- Use Conventional Commits from [Appendix A](PRD.MD#appendix-a--commit-convention).
- Keep risk-sensitive work (Blend/testnet assumptions) aligned with [Risk Register](PRD.MD#19-risk-register) and [Open Questions](PRD.MD#20-open-questions).

## Agent Guardrails
- Do not hardcode secrets, private keys, or fake production/testnet addresses.
- Do not claim a feature is implemented unless code and tests exist in this repository.
- Prefer small, verifiable increments and keep docs updated when behavior changes.
- Link to existing documentation instead of copying long requirement blocks.

## Quick Navigation
- Architecture: [Smart Contract Architecture](PRD.MD#10-smart-contract-architecture), [Frontend Architecture](PRD.MD#11-frontend-architecture)
- Data contracts: [Data Model](PRD.MD#12-data-model), [Events Schema](PRD.MD#134-events-schema)
- Quality gates: [Test Requirements](PRD.MD#14-test-requirements), [Non-Functional Requirements](PRD.MD#16-non-functional-requirements)
