## 1. Trade Rejection Recovery Feedback

- [x] 1.1 Emit rejected trade events with the existing trade snapshot fields needed for replay-safe recovery.
- [x] 1.2 Render rejected trades as a dedicated recovery result card that emphasizes no state change and restored turn control.

## 2. Validation

- [x] 2.1 Preserve lint coverage.
- [x] 2.2 Extend backend, projection, and browser coverage for the rejected-trade recovery card.