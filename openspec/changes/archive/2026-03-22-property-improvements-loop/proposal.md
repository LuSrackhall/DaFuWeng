## Why

The authoritative economy now supports purchase, rent, tax, mortgage, and bankruptcy, but owned streets still behave as flat-rent properties forever. That prevents the classic development loop from existing at all.

This change adds the minimum authoritative property-improvement system: own a full group, build evenly, sell back improvements, and charge upgraded rent.

## What Changes

- Add color-group development metadata to buildable street tiles.
- Add authoritative build and sell commands with even-build validation.
- Persist per-property improvement levels and use them to calculate upgraded rent.
- Block development on mortgaged groups and reuse deficit recovery when upgraded rent cannot be paid.
