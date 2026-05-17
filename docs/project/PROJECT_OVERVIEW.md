# KitchenHub Project Overview

Use this file as the durable high-level project context for fresh LLM sessions.

## What KitchenHub is

KitchenHub is a household-management application with:
- a **React Native mobile app**
- a **NestJS backend**

The product brings together three main household workflows in one place:
- **shopping lists**
- **recipes**
- **chores**

The core idea is to give a household one shared system for kitchen and home coordination. A key product concept is having a **tablet in the kitchen** that people can interact with while cooking, checking chores, or reviewing grocery information, while also supporting **phone usage on the go**, especially when someone is at the grocery store.

KitchenHub also supports important cross-feature workflows, especially:
- sharing household data across members
- connecting recipes and shopping lists
- adding recipe ingredients to the shopping list in one click

---

## Primary users

KitchenHub is mainly for:
- households
- couples
- families
- shared-home situations where multiple people collaborate

This is not primarily a solo productivity app. The collaboration and shared-household experience matter.

---

## Main usage contexts

There are two especially important usage modes:

### 1. Shared kitchen-tablet usage
- A tablet can stay in the kitchen as a shared household surface.
- People should be able to consult recipes, view chores, and interact with grocery-related flows easily.
- The experience should feel smooth, glanceable, and easy to interact with while doing real-world kitchen tasks.

### 2. Personal phone usage on the go
- Users should also be able to use the app from their phones.
- A particularly important case is reading and updating shopping lists while at the grocery store.
- The app must work well on both phones and tablets, not just one or the other.

---

## Product priorities

Current module priority is:

1. **Shopping lists**
2. **Recipes**
3. **Chores**
4. **Dashboard / home**

### Notes on the dashboard
The dashboard/home area is useful, but it is **not the core of the product**.
Its role is mostly to support:
- quick access
- quick add flows
- lightweight entry into the main parts of the app

It should not overshadow the core shopping / recipe / chore workflows.

---

## Current product phase

KitchenHub is currently in a **production stabilization** phase.

The focus right now is on:
- fine-tuning the experience
- fixing bugs found in QA
- improving polish
- making the app production-ready

This means that stabilization and reliability should usually be prioritized over speculative new feature expansion.

---

## Product direction / vision

The high-level direction is to make KitchenHub extremely easy to use in everyday life.

Longer-term, the product should support more natural interaction patterns, including integration with mobile or voice assistant ecosystems such as:
- phone assistant flows
- Google-related assistant flows
- Siri-style interactions

Examples of desired future convenience:
- adding shopping items without typing everything manually
- creating chores quickly through assistant-driven flows
- reading recipe ingredients more naturally while cooking

Even before those integrations exist, the app should already feel:
- smooth
- low-friction
- quick to interact with
- natural on both iOS and Android

---

## Critical constraints

### UX / platform constraints
Always remember:
- the UI must feel **smooth and optimized**
- the app must work well on **phones and tablets**
- the experience must feel **native on iOS and Android**
- changes should not reduce animation quality, smoothness, or perceived stability

### Collaboration constraints
- Household sharing and collaboration are important.
- Adding members to a household is part of the product direction.
- Shared usage matters more than single-user assumptions.

### Product-scope constraints
- Guest mode is **not a product priority**.
- Dashboard/home is lower priority than shopping, recipes, and chores.
- The app should stay focused on the core household workflows rather than drifting into unnecessary complexity.

---

## Recurring risks / mistakes an LLM should avoid

### 1. Destabilizing the app while trying to improve it
A major risk is making changes that reduce production readiness.

Avoid:
- introducing regressions during polish work
- changing behavior without verifying persistence and state restoration
- prioritizing novelty over reliability

### 2. Breaking persistence or continuity
State should be saved reliably across sessions and app restarts.
This includes:
- app state persistence
- user choices/settings persistence
- shopping/recipe/chore data persistence
- reliable continuity when the user leaves and comes back

### 3. Breaking UI behavior while editing components
Changes to elements can accidentally break:
- animation smoothness
- presentation quality
- interaction behavior
- functional correctness

When touching UI, verify not just appearance but also:
- smoothness
- native feel
- functionality
- state continuity

### 4. Overweighting the dashboard
Do not treat the dashboard/home area as the main product just because it is visually prominent.
Shopping is the most important flow, then recipes, then chores.

### 5. Underestimating tablet support
Do not optimize only for phones.
The kitchen-tablet use case is important to the product concept.

---

## How to use this file with AGENTS.md

For a fresh LLM session:
1. Read `AGENTS.md`
2. Read `docs/project/DOCUMENTATION_MAP.md`
3. Read this file
4. Read `docs/project/RECENT_CHANGES.md`
5. Read `docs/project/ARCHITECTURE.md`
6. For UI work, read `docs/features/mobile-ui-map.md` before feature-specific docs
7. For backend/API work, read `docs/api/backend-endpoints.md` before detailed API docs
8. Read any task-specific plan under `.hermes/plans/`
9. Then inspect code and propose changes

---

## When to update this file

Update this file when any of these change materially:
- the core product concept
- module priorities
- primary usage contexts
- platform/UX constraints
- collaboration assumptions
- major product-direction decisions
