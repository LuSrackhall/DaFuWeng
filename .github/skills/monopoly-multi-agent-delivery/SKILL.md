---
name: monopoly-multi-agent-delivery
description: 'Coordinate product, UX, architecture, implementation, QA, playtest, and release readiness for Monopoly, 大富翁, features using OpenSpec and the custom agent roster in this repository.'
argument-hint: 'Describe the feature, subsystem, or milestone to deliver'
user-invocable: true
---

# Monopoly Multi-Agent Delivery

Use this skill when a feature or milestone needs coordinated execution with minimal user involvement.

## When To Use

- A new gameplay feature needs to move from idea to implementation.
- A subsystem touches both frontend and backend.
- A release candidate needs structured review across product, UX, engineering, QA, and playtesting.

## Procedure

1. Frame the request in product terms.
   - Call the `Monopoly Product Manager` agent when scope, user value, or rules clarity are weak.
2. Clarify the experience.
   - Call the `Monopoly UI UX Director` agent when board readability, interaction flow, motion, or shell ergonomics matter.
3. Lock the technical shape.
   - Call the `Monopoly Tech Lead` agent to define architecture slices, state boundaries, and automation impact.
4. Route through OpenSpec.
   - Create or continue an OpenSpec change before substantial implementation.
   - Ensure proposal, design, and tasks are present before code-heavy work begins.
5. Implement in thin slices.
   - Use the `Monopoly Senior Implementer` agent for code changes and validation.
6. Build the quality gate.
   - Use the `Monopoly QA Lead` agent to define or review unit, integration, and Playwright coverage.
7. Simulate the player experience.
   - Use the `Monopoly Simulated Player` agent before tagging or declaring a milestone ready.

## Output

- A recommended agent sequence
- The OpenSpec change to create or continue
- The next implementation slice
- The required validation and playtest gate