## ADDED Requirements

### Requirement: Card spaces draw from authoritative finite decks
The system MUST resolve chance and community spaces by drawing the next card from the corresponding room deck.

#### Scenario: Player lands on a chance space
- **WHEN** the acting player lands on a chance space
- **THEN** the backend SHALL draw the next authoritative chance card, apply its effect, and update the deck state in the room snapshot

#### Scenario: Draw pile is empty
- **WHEN** a player needs to draw from an empty draw pile and the deck has discarded cards
- **THEN** the backend SHALL recycle the discard pile back into the draw pile before drawing again