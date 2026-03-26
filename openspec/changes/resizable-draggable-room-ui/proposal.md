# Proposal: Resizable and Draggable Room UI

## Goal

Provide a flexible, customizable, and user-centric HUD layout by allowing players to freely drag and resize key UI components: the "牌局记事" (Event Feed) and the Board Stage (棋盘).

## Context

Currently, the event feed and the board stage are statically positioned with predefined CSS breakpoints. The event feed trims historically visible events based on setting constraints. Players require a richer desktop/tablet experience where they can arrange these HUD surfaces to match their viewing habits—treating them more like arbitrary GUI windows with advanced internal dynamic layouts.

## Scope

- **Event Feed (牌局记事)**:
  - Supports completely free spatial dragging.
  - Supports resizing (via 4 edges and 4 corners).
  - Retains and displays the *entirety* of room history (no pagination or culling).
  - Replaces "visible record limit" with a "minimum visible items in viewport" rule.
  - The minimum height of the dialog is geometrically constrained: it cannot shrink beyond what is needed to display the "minimum visible items."
  - Event items adapt stylistically in steps (small -> medium -> large layout) depending on the live container height/width and the minimum items setting.
  - Matrix configuration for sorting: (Ascending/Descending Sequence Number) x (Ascending/Descending Event Time).
  - Always auto-scrolls to focus on the latest event independently on the client side whenever dice are rolled.
  - Core settings and introductory text sections can be cleanly collapsed to maximize event real estate.

- **Board Stage (棋盘)**:
  - Supports resizing via edges and corners, with internal content (PixiJS canvas) automatically adopting the container aspect or letterboxing correctly.

## Out of Scope

- Persisting dragging coordinates in centralized backend states (local cache / transient component state is acceptable for UI testing).
- Drag/resize refactoring for other full panels like the main user rail.