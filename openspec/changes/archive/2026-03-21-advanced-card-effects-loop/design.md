## Design

Only non-interactive card families are included in this slice.

Supported families:
- relative move
- nearest railway move
- lose cash to the bank
- repair fee based on built improvement levels
- gain cash per active opponent from the bank

Cards that can cause insufficient cash reuse the existing deficit resolution loop with a `card` reason.
Movement cards continue into normal landing resolution so tax, rent, jail, and property offers remain authoritative.
