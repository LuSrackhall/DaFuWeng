## Context

Once mortgage and bankruptcy exist, the next missing Monopoly loop is property development. The implementation should stay config-driven and deterministic rather than scattering special cases across UI code.

## Decisions

### 1. Improvements are stored per owned property
Each player snapshot carries improvement levels for their owned properties.

### 2. Development uses group metadata
Street tiles define a color group, build cost, and rent ladder so backend rent calculation does not need hardcoded per-tile branches.

### 3. Improved rent reuses deficit recovery
If a player cannot afford upgraded rent, the room enters the same authoritative deficit resolution flow instead of letting cash silently go negative.
