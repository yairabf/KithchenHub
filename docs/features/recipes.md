# Recipes Feature

**Feature area:** `mobile/src/features/recipes/`

## Purpose

The recipes feature helps users manage their **household recipes**.

This is not primarily about browsing generic web recipes. It is about giving the household a place to keep the recipes they actually use, so they can come back to them later when cooking.

The recipes feature should also make it easy to buy missing ingredients by connecting recipes directly to the shopping feature.

Core value:
- store household recipes in one place
- read recipes clearly while cooking
- quickly add recipe ingredients into the shopping list

---

## Why recipes are the second-highest priority

KitchenHub was fundamentally built around grocery/shopping-list management, which is why shopping is the top priority.

Recipes are the second-highest priority because:
- they are a major household workflow
- they are strongly integrated with shopping
- they make the shopping feature more useful
- they support the kitchen use case directly

Recipes are important, but they still serve the larger day-to-day household workflow rather than replacing shopping as the center of the product.

---

## Main product model

The recipes feature is meant to give users a clear and organized place for the recipes they use at home.

A recipe should be something users can:
- create
- edit
- open later
- follow while cooking
- use to add needed ingredients into the shopping list

The feature should support both recipe management and practical in-kitchen usage.

---

## Most important user flows

The most important flows in recipes are:

1. **browse recipes**
2. **open recipe details**
3. **create recipe**
4. **edit recipe**
5. **add ingredients to the shopping list**
6. **follow the recipe steps while cooking**
7. **search recipes**

In practical terms, the highest-value behavior is:
- reading recipes easily
- quickly turning ingredients into shopping actions

---

## Shared behavior with other features

The recipes feature shares important functionality with shopping.

### Shared with shopping
- ingredient search uses the same item database concepts as shopping
- recipe ingredient flows connect directly to shopping-list actions
- users can add ingredients from recipes into the shopping list
- recipe ingredient actions depend on the shopping feature being reliable

### Shared components / interaction concepts
- the search bar behavior is an important shared dependency
- ingredient-to-shopping integration is one of the most important cross-feature connections in the app

Because of this, changes in recipes can affect shopping behavior, and vice versa.

---

## UX style

Recipes should feel:
- **easy to read**
- **low-friction**
- **clear while cooking**
- **tablet-friendly**
- **good for quick ingredient actions**

The recipe experience should help someone cook without fighting the UI.

### Platform/use bias
Recipes are likely to be used more in **tablet mode** than on mobile, because following a recipe while cooking fits the kitchen-tablet use case well.

However, mobile behavior still needs to stay correct and usable.

---

## What recipes should not become

Recipes should **not** become:
- too complex
- overloaded with unnecessary fields
- hard to edit
- slow to use while cooking
- cluttered with an overcomplicated editing flow

The editing and reading experience should stay clear and practical.

A recipe may naturally contain many steps, but the UI should still keep the flow understandable and easy to manage.

---

## Fragile / easy-to-break areas

A fresh LLM should be especially careful with:

### 1. Ingredient search behavior
The search bar is one of the most fragile parts of the recipes flow.
Problems here can make recipe creation and ingredient management much worse.

### 2. Shopping integration
The connection between recipe ingredients and the shopping list is one of the most important and most fragile parts of the feature.
This includes:
- adding single ingredients
- adding ingredients through recipe flows
- keeping the behavior reliable and predictable

### 3. Recipe editing flow
Recipe editing needs to stay clear and easy to use.
It is easy to make this flow too heavy or confusing.

### 4. Mobile vs tablet layout behavior
Recipes may be more tablet-oriented in practice, but the mobile experience still matters.
The feature can break if layouts are changed without checking:
- tablet layouts
- mobile tabbing / stacked behavior
- detail/readability flows on smaller screens

---

## Current / recent workstreams

An important recent area of work has been around **recipe deletion / allowing recipes to be deleted reliably**.

This means a fresh LLM should be aware that recipe lifecycle behavior (including deleting recipes correctly) is part of the active reliability surface for this feature.

---

## Future directions

A fresh LLM should know about these future directions:

### AI-assisted recipe import / export
A meaningful future direction is making it easier to bring recipes into the system using AI-driven help.
Examples include:
- taking a picture of a recipe
- importing recipe text from notes or similar sources
- using AI in the background to convert outside recipe content into KitchenHub’s recipe format

### Stronger shopping integration
Recipes should continue becoming better integrated with shopping so missing ingredients can be handled with minimal friction.

### Better kitchen usability
The feature should continue improving as a practical cooking companion, especially in tablet/kitchen contexts.

---

## What must be verified after changing recipes

Before finishing recipe work, verify that:

- recipe browsing still works
- recipe detail screens still read clearly
- recipe creation and editing still work
- ingredient search still works correctly
- ingredient-to-shopping integration is not broken
- recipe deletion behavior still works when relevant
- mobile behavior still works correctly
- tablet behavior still works correctly
- changes do not break the mobile-vs-tablet presentation differences

Important note:
On mobile, the UI may rely more on tabbing/stacked behavior rather than large two-panel layouts, so this must be verified explicitly.

---

## Suggested reading before editing this feature

1. `AGENTS.md`
2. `docs/project/PROJECT_OVERVIEW.md`
3. `docs/project/RECENT_CHANGES.md`
4. `docs/features/shopping.md`
5. recipes source files under `mobile/src/features/recipes/`

---

## Guidance for future LLMs

When changing recipes:
- keep recipe reading easy while cooking
- protect ingredient-to-shopping-list integration carefully
- do not overcomplicate the editing flow
- verify both mobile and tablet behavior before finishing
- remember that recipes are strongly tied to shopping and should support that workflow naturally
