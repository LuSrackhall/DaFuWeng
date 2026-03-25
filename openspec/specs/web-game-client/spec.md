# Purpose

Define the web-first authoritative multiplayer client experience and presentation boundaries.

# Requirements

### Requirement: The web client presents an authoritative multiplayer game view
The system SHALL provide a web client that renders room flows, the board scene, player state, action prompts, and event feedback using authoritative backend state as its input.

#### Scenario: Player enters an active room
- **WHEN** a player opens or rejoins an active room in the web client
- **THEN** the client SHALL render the current room and match state from the latest authoritative snapshot and event stream, plus the player's joined-seat state when a valid room-scoped player session is present

#### Scenario: Turn feedback is shown during gameplay
- **WHEN** gameplay state changes on the backend
- **THEN** the client SHALL update visible turn indicators, board state, player finances, and recent event feedback so players can understand what happened

### Requirement: Presentation state is separate from gameplay truth
The system MUST separate local UI or animation state from authoritative gameplay state so that reconnects, refreshes, and cross-platform reuse do not corrupt business logic.

#### Scenario: Client refreshes during a match
- **WHEN** the web client reloads during an in-progress game
- **THEN** the client SHALL reconstruct the visible game state from authoritative backend data rather than from stale local component state

#### Scenario: Animation runs after a resolved action
- **WHEN** the client receives an authoritative action result such as movement or rent payment
- **THEN** the client MAY animate that result locally without changing the underlying authoritative values

### Requirement: Formal room flows never silently fall back to local demo gameplay
The system MUST distinguish between a real authoritative room, a reconnectable joined room, and an unavailable room state.

#### Scenario: Backend room is unavailable
- **WHEN** the web client fails to load a requested room from the backend
- **THEN** the client SHALL show an explicit loading or failure state instead of substituting local sample gameplay

#### Scenario: Viewer opens a room without a joined-seat session
- **WHEN** the web client loads a real room but does not hold a valid room-scoped player session for that room
- **THEN** the client SHALL render the room in a read-only state and SHALL NOT default command privileges to the current turn player

### Requirement: The room page presents stage-oriented guidance
The system SHALL render waiting-room, active turn, and forced-resolution states using explicit stage summaries instead of mostly raw state labels.

#### Scenario: Waiting room is rendered
- **WHEN** the client loads a room that has not started
- **THEN** it SHALL show a dedicated waiting-room summary that explains room identity, host authority, seat presence, and the next step to start

#### Scenario: Forced resolution pauses the room
- **WHEN** the client renders a pending deficit or bankruptcy-capable state
- **THEN** it SHALL explain who owes whom, why the room is paused, what the acting player can do next, and what outcome ends the pause

### Requirement: The room page gives auction a dominant stage surface
The system SHALL elevate auction into the room page's primary stage surface while it is active.

#### Scenario: Auction is active
- **WHEN** the room is waiting on bids or passes for a pending auction
- **THEN** the room page SHALL prioritize auction state, controls, and outcomes above secondary status panels

#### Scenario: Auction settles
- **WHEN** the auction ends with a winning bidder or no sale
- **THEN** the room page SHALL explain the settlement outcome and transition cleanly back to the next authoritative room step

### Requirement: The room page gives trade a dominant stage surface
The system SHALL elevate pending trade into the room page's primary stage surface while a response is outstanding.

#### Scenario: Pending trade is active
- **WHEN** the room is waiting on a trade response
- **THEN** the room page SHALL prioritize the trade summary, response controls, and outcome guidance above secondary panels

#### Scenario: Trade resolves
- **WHEN** the pending trade is accepted or rejected
- **THEN** the room page SHALL explain the result and transition cleanly back to the next authoritative room step

### Requirement: Technical room state is available through a diagnostics drawer
The system SHALL keep technical room information accessible without letting it dominate the main player-facing surface.

#### Scenario: Player opens diagnostics
- **WHEN** a user expands the diagnostics drawer
- **THEN** the room page SHALL reveal snapshot version, event sequence, deck state, recent events, and current technical room context

#### Scenario: Diagnostics are collapsed
- **WHEN** the diagnostics drawer is closed
- **THEN** the main room surface SHALL continue to emphasize player-facing guidance instead of technical metadata

### Requirement: The trade proposal surface exposes real asset pools
The system SHALL present visible asset pools for both sides of a proposed trade while a proposer is composing an offer.

#### Scenario: Proposer prepares a trade offer
- **WHEN** the current turn player opens the trade proposal surface
- **THEN** the room page SHALL show who the offer targets, what assets the proposer can offer, what assets the target can be asked to give up, and how the current draft changes the bilateral trade summary

#### Scenario: Trade draft updates
- **WHEN** the proposer selects or deselects a property or card in the trade proposal surface
- **THEN** the room page SHALL update the visible trade summary without requiring manual asset identifier entry

### Requirement: The room page explains an unsold auction outcome
The system SHALL surface a clear recent result when an auction ends without a winner.

#### Scenario: Auction ends unsold
- **WHEN** the room receives an authoritative `auction-ended-unsold` outcome
- **THEN** the room page SHALL explain that the lot remained unsold, ownership did not change, and the room has already advanced to the next authoritative step

### Requirement: The room page presents a readable deficit recovery panel
The system SHALL present a recovery-oriented room stage when a player is resolving a forced payment deficit.

#### Scenario: Deficit recovery is active
- **WHEN** the room is waiting on the deficit player to mortgage assets or declare bankruptcy
- **THEN** the room page SHALL explain the debt, show who may act, present visible recovery assets with readable action consequences, and keep non-acting viewers in a clear read-only state

### Requirement: The mobile room page prioritizes the current stage
The system SHALL emphasize the current authoritative room stage above supporting overview detail on narrow screens.

#### Scenario: Player opens the room page on mobile
- **WHEN** the room page is rendered in a narrow mobile viewport
- **THEN** the current stage card SHALL appear before the overview card in the main reading flow and SHALL remain the dominant decision surface

### Requirement: Mobile room-stage actions remain readable without horizontal pressure
The system SHALL keep stage actions and asset groups readable on narrow screens.

#### Scenario: Mobile player reviews a dense stage
- **WHEN** the room page renders auction, trade, or deficit recovery content on a mobile viewport
- **THEN** the client SHALL present stage details, actions, and asset selections in a single readable column without requiring horizontal scrolling

### Requirement: The mobile room page presents the current stage before the board
The system SHALL prioritize the current authoritative room stage above the board on narrow screens.

#### Scenario: Player opens a mobile room with an active decision
- **WHEN** the room page is rendered in a narrow mobile viewport and the room has a current stage to explain
- **THEN** the room-state panel SHALL appear before the board panel in the page reading flow so the player reaches the active decision surface first

### Requirement: The room page presents contextual actions for routine turn states
The system SHALL present only the actions that are relevant to the current authoritative turn step when no dedicated stage surface already owns the interaction.

#### Scenario: Player can roll normally
- **WHEN** the room is waiting on the current player to roll and no auction, trade response, or deficit recovery stage is active
- **THEN** the room page SHALL present a roll-focused action surface instead of a generic stack of unrelated disabled buttons

#### Scenario: Player decides how to leave jail
- **WHEN** the room is waiting on the current player to resolve a jail decision
- **THEN** the room page SHALL present only the jail-resolution actions and SHALL NOT show unrelated generic turn actions in the same action surface

#### Scenario: Player decides whether to buy a property
- **WHEN** the room is waiting on the current player to accept or decline a property purchase
- **THEN** the room page SHALL present the property label, price, and the purchase-or-decline decision in one contextual action surface

### Requirement: Optional normal-turn tools stay behind a collapsible shelf
The system SHALL keep optional normal-turn tools behind a secondary collapsible shelf when no dedicated stage surface is active.

#### Scenario: Player enters a normal roll state
- **WHEN** the room is waiting on the current player to roll and optional tools such as trade drafting or property development are available
- **THEN** the room page SHALL keep those tools collapsed by default while still indicating that they are available

#### Scenario: Player opens the tools shelf
- **WHEN** the acting player expands the turn-tools shelf during a normal roll state
- **THEN** the room page SHALL reveal the optional trade drafting and property development surfaces without replacing the main action surface

### Requirement: The normal-turn trade draft uses a stepwise composer
The system SHALL guide the acting player through a stepwise trade-drafting flow when they open the optional trade tool during a normal roll state.

#### Scenario: Player starts a trade draft
- **WHEN** the acting player opens the trade drafting tool during a normal roll state
- **THEN** the room page SHALL guide the player through selecting a counterparty, choosing offered assets, choosing requested assets, and reviewing the final draft before submission

#### Scenario: Player confirms a drafted trade
- **WHEN** the acting player reaches the final review step and confirms the draft
- **THEN** the room page SHALL send the existing trade proposal command and transition all clients into the current pending trade response stage

### Requirement: The final trade step acts as a review card
The system SHALL present the final step of the normal-turn trade composer as a dedicated review card before a proposal is submitted.

#### Scenario: Player reviews a non-empty draft
- **WHEN** the acting player reaches the final step with a non-empty trade draft
- **THEN** the room page SHALL show grouped exchange details for both sides, a readable net cash-flow summary, and a clear reminder that the player can return to edit without losing the draft

#### Scenario: Player tries to review an empty draft
- **WHEN** the acting player has not added any cash, property, or card to either side of the trade draft
- **THEN** the room page SHALL block entry into the final review step and explain that there is no trade content to confirm yet

### Requirement: The final trade confirmation surface highlights risk and consequence
The system SHALL present the final normal-turn trade confirmation step as a consequence-oriented review surface before a proposal is sent.

#### Scenario: Player reviews a risky trade draft
- **WHEN** the acting player reaches the final confirmation step with traded properties, cards, or cash
- **THEN** the room page SHALL show the traded asset state details, post-trade cash landing points, and the main consequences of sending the offer

#### Scenario: Player returns to edit the draft
- **WHEN** the acting player returns from the final confirmation surface back to the earlier trade steps
- **THEN** the room page SHALL preserve the current draft selections so the player can continue editing without rebuilding the proposal

### Requirement: The final trade confirmation surface prioritizes consequence-first reading
The system SHALL present the final normal-turn trade confirmation surface in a hierarchy that emphasizes consequences before detailed exchange review.

#### Scenario: Player reviews the final confirmation surface
- **WHEN** the acting player reaches the final normal-turn trade confirmation step
- **THEN** the room page SHALL emphasize the irreversible submission consequence and high-priority risk summary before the bilateral exchange detail list

#### Scenario: Player scans the exchange details after consequences
- **WHEN** the acting player continues reviewing the final confirmation surface
- **THEN** the room page SHALL still present the detailed "you give" and "you receive" breakdown in a clearly secondary review section

### Requirement: The pending trade stage adapts to the viewer's role
The system SHALL present the pending trade stage with role-specific guidance while the room is waiting on a trade response.

#### Scenario: Proposer waits on a response
- **WHEN** the room is waiting on the counterparty to answer a pending trade and the current viewer is the proposer
- **THEN** the room page SHALL emphasize that the offer has already been sent, that the proposer is now waiting, and what room outcome follows acceptance or rejection

#### Scenario: Counterparty reviews the pending trade
- **WHEN** the room is waiting on the counterparty to answer a pending trade and the current viewer is that counterparty
- **THEN** the room page SHALL emphasize that it is their turn to decide and SHALL present the response consequences before the accept or reject controls

#### Scenario: Read-only viewer sees the pending trade
- **WHEN** the room is waiting on a pending trade response and the current viewer is neither proposer nor counterparty
- **THEN** the room page SHALL make clear that the room is paused on a trade response and that the current viewer can only observe

### Requirement: Accepted trades render as a bilateral settlement card
The system SHALL present an accepted trade as a dedicated bilateral settlement card after the trade resolves.

#### Scenario: Accepted trade settles
- **WHEN** a pending trade is accepted and the room returns to its next authoritative step
- **THEN** the room page SHALL show who exchanged what, how the cash landed for both trade parties, and what room step comes next

#### Scenario: Other players review the accepted result
- **WHEN** a player or read-only viewer sees the accepted trade result after settlement
- **THEN** the room page SHALL present the same bilateral settlement summary consistently across clients

### Requirement: Rejected trades render as a recovery-oriented result card
The system SHALL present a rejected trade as a dedicated recovery result card after the room exits the waiting-for-response state.

#### Scenario: Rejected trade restores the proposer's turn
- **WHEN** a pending trade is rejected and the room returns to its next authoritative step
- **THEN** the room page SHALL explain who rejected whose offer, that no cash or assets changed hands, and that the proposer has resumed the room flow

#### Scenario: Rejected trade result survives replay and recovery
- **WHEN** a client reconstructs room state after a rejected trade through refresh, reconnect, or event catch-up
- **THEN** the room page SHALL still render the rejected offer summary without depending on a separately retained proposal event

### Requirement: Core trade-loop copy uses a player-facing tone
The system SHALL present the core trade loop with player-facing guidance rather than backend-style status language.

#### Scenario: Player reads a waiting or result trade state
- **WHEN** the room page presents a trade waiting state or a trade result card
- **THEN** the copy SHALL explain who acts, what changed or did not change, and what happens next without using backend-oriented terms such as authority, atomic, or process

#### Scenario: Player reviews a trade before submission
- **WHEN** the acting player reviews a trade entry or pre-submit confirmation surface
- **THEN** the copy SHALL describe the choice and consequence in direct player language rather than system-status language

### Requirement: Mobile trade result cards remain readable without horizontal pressure
The system SHALL keep accepted and rejected trade result cards readable on narrow mobile screens.

#### Scenario: Accepted trade result is shown on mobile
- **WHEN** the room page renders an accepted trade result on a narrow mobile viewport
- **THEN** the result card SHALL present the settlement content in a single readable column without horizontal scrolling and SHALL keep the next-step guidance visible

#### Scenario: Rejected trade result is shown on mobile
- **WHEN** the room page renders a rejected trade result on a narrow mobile viewport
- **THEN** the result card SHALL present the recovery content in a single readable column without horizontal scrolling and SHALL keep the next-step guidance visible

### Requirement: Trade result cards survive browser reload for joined players
The system SHALL recover accepted and rejected trade result cards after a joined player reloads the room page.

#### Scenario: Accepted trade result survives reload
- **WHEN** a joined player reloads the browser after a trade has been accepted and the result card is visible
- **THEN** the room page SHALL still show the accepted trade result and the resumed next-step room state

#### Scenario: Rejected trade result survives reload
- **WHEN** a joined player reloads the browser after a trade has been rejected and the result card is visible
- **THEN** the room page SHALL still show the rejected trade result and the resumed next-step room state

### Requirement: Trade result cards survive browser reload across viewer roles
The system SHALL recover accepted and rejected trade result cards consistently after responder or spectator views reload the room page.

#### Scenario: Responder reloads an accepted or rejected result
- **WHEN** the trade responder reloads the browser after an accepted or rejected trade result is visible
- **THEN** the room page SHALL still show the correct result card and the resumed room state from the responder's perspective

#### Scenario: Spectator reloads an accepted or rejected result
- **WHEN** a read-only spectator reloads the browser after an accepted or rejected trade result is visible
- **THEN** the room page SHALL still show the correct result card and remain clearly read-only without returning to a pending trade stage

### Requirement: Trade result cards prioritize concise summaries over empty categories
The system SHALL present accepted and rejected trade result cards with concise summaries that remove empty category noise.

#### Scenario: Accepted trade result contains sparse exchanges
- **WHEN** an accepted trade result has only a subset of cash, property, or card changes
- **THEN** the room page SHALL omit empty categories from the result detail and SHALL lead with a concise bilateral summary before the detailed lines

#### Scenario: Rejected trade result contains sparse exchanges
- **WHEN** a rejected trade result has only a subset of cash, property, or card content
- **THEN** the room page SHALL omit empty categories from the rejected summary and SHALL still make clear what the proposer was offering or requesting

### Requirement: The room page uses a scene-first shell
The system SHALL present the playable room route through a dedicated scene-first shell instead of the generic lobby shell.

#### Scenario: Player enters a real room
- **WHEN** a player opens a room route
- **THEN** the page SHALL present a lightweight room top bar, a primary board stage, and a secondary room rail instead of the lobby hero shell

#### Scenario: Player needs the current action
- **WHEN** the room page renders an active room stage
- **THEN** the room rail SHALL prioritize the current stage and primary action before overview, assets, or diagnostics

### Requirement: The board stage renders through Pixi
The system SHALL render the playable room board through a Pixi stage instead of a static DOM tile grid.

#### Scenario: Player opens the room board
- **WHEN** a player enters a room page
- **THEN** the board region SHALL mount a Pixi canvas that renders the board stage inside the existing scene boundary

#### Scenario: Player reads board focus
- **WHEN** the room stage is rendered with a current player and highlighted tile
- **THEN** the board SHALL visually distinguish player positions, current-turn emphasis, and the current highlighted tile without relying only on side-panel text

### Requirement: The Pixi room board carries a live turn HUD
The system SHALL use the center of the Pixi room board as a live turn HUD instead of a placeholder brand card.

#### Scenario: Player opens an active room
- **WHEN** the Pixi room board renders an active room state
- **THEN** the center stage SHALL identify the current actor and the currently focused tile rather than generic implementation placeholder copy

### Requirement: The Pixi room board exposes stronger stage-state signals
The system SHALL make focused tiles, ownership state, and current-turn tokens more legible on the Pixi room board.

#### Scenario: Player reads the board after room progression
- **WHEN** the authoritative room state updates current turn, focus, or ownership
- **THEN** the Pixi room board SHALL update its stage-state signals to reflect the new board state without relying only on side-panel text

### Requirement: The room rail exposes a stable primary action anchor
The system SHALL present a fixed primary action anchor at the top of the room rail so players can quickly understand who acts next and what advances the room.

#### Scenario: Player opens a room state
- **WHEN** the room page renders any waiting, normal-turn, trade-response, auction, or deficit-recovery state
- **THEN** the room rail SHALL keep a primary action anchor visible before overview, assets, and diagnostics

#### Scenario: Player needs the next step
- **WHEN** the room page renders a state with a current actor and a room-advancing action
- **THEN** the primary action anchor SHALL explain who acts, what the must-do action is, and what immediate outcome follows

### Requirement: The primary action anchor carries high-pressure room controls
The system SHALL expose decisive controls for auction and deficit-recovery states directly in the primary action anchor.

#### Scenario: Player must act in an auction
- **WHEN** the current player can bid or pass in an active auction
- **THEN** the primary action anchor SHALL expose direct controls to submit a bid or pass without requiring the player to scan lower detail cards first

#### Scenario: Player must resolve a deficit
- **WHEN** the current player is resolving an active cash deficit
- **THEN** the primary action anchor SHALL expose the shortest valid recovery action and the bankruptcy action before the detailed recovery card

### Requirement: The primary action anchor guides stepwise deficit recovery
The system SHALL continue guiding deficit recovery through the primary action anchor when a single mortgage action is not enough.

#### Scenario: Player still has a shortfall after the next recovery action
- **WHEN** the current deficit cannot be fully resolved by the best immediate mortgage action
- **THEN** the primary action anchor SHALL explain the next recommended action and the remaining shortfall after that action

#### Scenario: Player continues deficit recovery after one mortgage
- **WHEN** an authoritative mortgage action succeeds but the room remains in deficit recovery
- **THEN** the primary action anchor SHALL refresh to show the next recommended recovery action from the new room snapshot

### Requirement: Mobile room pages keep the primary action anchor visible
The system SHALL keep the primary action anchor visible on narrow screens while the player scrolls through the room page.

#### Scenario: Player scrolls a mobile room page
- **WHEN** the room page is rendered on a narrow screen and the player scrolls through the board or support sections
- **THEN** the primary action anchor SHALL remain visible as a persistent mobile decision tray

#### Scenario: Player reaches the bottom of a mobile room page
- **WHEN** the room page is rendered on a narrow screen with a persistent action tray
- **THEN** the page layout SHALL reserve enough bottom space that the final interactive room content is not hidden behind the tray

### Requirement: The Pixi room board reflects recent authoritative results
The system SHALL surface recent authoritative results in the Pixi room board center HUD when a new outcome has just been resolved.

#### Scenario: Formal room result becomes the latest outcome
- **WHEN** the latest room projection includes a formal result such as a completed trade, bankruptcy settlement, or unsold auction
- **THEN** the Pixi room board SHALL surface that result title and consequence in its center HUD

#### Scenario: Room page recovers after refresh
- **WHEN** the room page refreshes after a recent authoritative result
- **THEN** the Pixi room board SHALL restore the same recent result feedback from the recovered room projection

### Requirement: Neutral room results keep a confirmation-state tone
The system SHALL present neutral room results as resolved state confirmations rather than celebratory success feedback.

#### Scenario: Trade offer is rejected
- **WHEN** a pending trade is formally rejected and the room returns to the proposer
- **THEN** the room board and result card SHALL present that outcome with a neutral confirmation tone

#### Scenario: Auction ends without a winner
- **WHEN** an auction ends unsold and the property remains unowned
- **THEN** the room board and result card SHALL present that outcome with a neutral confirmation tone

### Requirement: Formal room results use a single detailed result surface
The system SHALL keep the detailed explanation of a formal room result in the result card, while the primary action anchor returns to current responsibility.

#### Scenario: Formal result is visible in the room rail
- **WHEN** a formal room result such as a trade outcome or unsold auction is present
- **THEN** the result card SHALL carry the detailed explanation and the primary action anchor SHALL focus on the next current action

### Requirement: Unsold auctions read as contextual neutral results
The system SHALL present an unsold auction as a contextual neutral result instead of a generic success or warning outcome.

#### Scenario: Auction ends without transfer
- **WHEN** all remaining bidders pass and the auction closes without a winner
- **THEN** the room board and result card SHALL explain that the auction ended without transfer and ownership remains unsold

### Requirement: Mobile primary action trays are consequence-first
The system SHALL make the mobile primary action tray emphasize the result of the next decision before secondary guidance.

#### Scenario: Room page is viewed on mobile during an actionable state
- **WHEN** the room page is rendered on a narrow screen while a player can act
- **THEN** the primary action tray SHALL foreground the immediate consequence of that action and present a single dominant main action

### Requirement: Room routes are delivered through lazy chunks
The system SHALL lazy load room-facing route modules instead of bundling them into a single eager entry chunk.

#### Scenario: User enters the room page from the lobby
- **WHEN** the user navigates from the lobby to a room route
- **THEN** the room page code SHALL be loaded through a route chunk rather than the main entry bundle

### Requirement: Lazy route loads show a shell fallback
The system SHALL show a lightweight fallback while lazy route chunks are being fetched.

#### Scenario: User cold-loads a lazy route
- **WHEN** the browser is still fetching a lazy route chunk
- **THEN** the web client SHALL render a lightweight loading shell instead of a blank page

### Requirement: Room route loading shells show room-entry context
The system SHALL display deterministic room-entry context while a room route chunk is still loading.

#### Scenario: Player cold-loads a room route
- **WHEN** the room route chunk is still being fetched
- **THEN** the loading shell SHALL show the room id, sync stages, and whether the player is restoring an active room session or entering as read-only

### Requirement: Route loading and data loading remain distinct
The system SHALL use different loading surfaces for route-chunk delay and room-snapshot delay.

#### Scenario: Route chunk is slow but room snapshot is not yet requested
- **WHEN** the room page JavaScript chunk is still loading
- **THEN** the user SHALL see the room-route loading shell

#### Scenario: Route chunk has loaded but room snapshot is slow
- **WHEN** the room page has mounted but the room snapshot request is still pending
- **THEN** the user SHALL see the room page's room-sync loading state instead of the route loading shell

### Requirement: In-page room sync uses a dedicated sync shell
The system SHALL present incomplete room synchronization through a dedicated in-page sync shell instead of loose subtitle text.

#### Scenario: Room route has loaded but room state is still synchronizing
- **WHEN** the room page has mounted and room synchronization is still loading, falling back, or recovering
- **THEN** the page SHALL show a dedicated room sync shell with deterministic sync context

### Requirement: Mobile room sync shell stays prioritized
The system SHALL keep the in-page room sync shell visually prioritized on mobile while synchronization is incomplete.

#### Scenario: Mobile user enters a room while data is still loading
- **WHEN** the room page is rendered on a narrow screen and room data is still synchronizing
- **THEN** the in-page room sync shell SHALL appear before deeper room content and remain readable without horizontal overflow

### Requirement: Realtime reconnect uses a distinct room sync state
The system SHALL present realtime reconnect as a distinct in-page sync state instead of reusing first-load or fallback language.

#### Scenario: Realtime updates fail after a room has already loaded
- **WHEN** the room page has already loaded and the realtime event connection fails
- **THEN** the room page SHALL show reconnect-focused guidance while preserving the last successful room state

### Requirement: Realtime reconnect recovers through room catch-up
The system SHALL clear the reconnect sync shell after room catch-up succeeds.

#### Scenario: Polling catches up after realtime failure
- **WHEN** realtime updates fail and a later room catch-up response succeeds
- **THEN** the reconnect sync shell SHALL disappear and the room page SHALL show the recovered latest state

### Requirement: Spectator reconnect stays read-only
The system SHALL keep spectator reconnect recovery in a read-only state before and after catch-up recovery.

#### Scenario: Spectator reconnects after realtime failure
- **WHEN** a spectator page loses realtime updates and later catches up through polling
- **THEN** the spectator SHALL keep seeing read-only room state and SHALL NOT gain player actions

### Requirement: High-frequency room and board copy uses player language
The system SHALL prefer player-readable game language over internal system wording on repeated room and board surfaces.

#### Scenario: Player sees room anchors and board waiting states
- **WHEN** the UI presents room anchors, turn tools, reconnect guidance, or board waiting text
- **THEN** those surfaces SHALL use player-facing game language rather than internal engineering phrasing

### Requirement: Reconnect recovery shows lightweight success feedback
The system SHALL provide a lightweight success acknowledgment after room catch-up recovery completes.

#### Scenario: Room reconnect finishes catching up
- **WHEN** the room page has recovered from reconnect and caught up to the latest room state
- **THEN** the page SHALL briefly acknowledge that the room has been reconnected successfully

### Requirement: Mobile spectator reconnect stays readable and read-only
The system SHALL preserve spectator read-only recovery behavior on narrow screens.

#### Scenario: Spectator reconnects on mobile
- **WHEN** a spectator page on a narrow screen loses realtime updates and later catches up through polling
- **THEN** the spectator SHALL see reconnect recovery complete, remain read-only, and avoid horizontal overflow

### Requirement: Reconnect success explains recovered room context
The system SHALL pair reconnect success feedback with key recovered room context.

#### Scenario: Player reconnect succeeds
- **WHEN** a room reconnect succeeds after catch-up recovery
- **THEN** the success feedback SHALL briefly explain the recovered room context, such as the recovered event summary or the current acting player

### Requirement: Mobile player reconnect keeps success feedback lightweight
The system SHALL keep reconnect success feedback lightweight on narrow screens while preserving the current primary action.

#### Scenario: Player reconnects on mobile
- **WHEN** a player page on a narrow screen recovers from reconnect
- **THEN** the success strip SHALL appear briefly, remain visible long enough to notice, dismiss automatically, and preserve the recovered current primary action without horizontal overflow

### Requirement: Reconnect success provides a recovery narrative
The system SHALL explain both the recovered change and the current action context when reconnect success feedback appears.

#### Scenario: Ordinary reconnect succeeds
- **WHEN** reconnect success feedback appears after catch-up recovery
- **THEN** the feedback SHALL explain the recovered update and the current ordinary turn context

#### Scenario: Property decision reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into property decision
- **THEN** the feedback SHALL explain the recovered property decision context

#### Scenario: Deficit recovery reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into deficit resolution
- **THEN** the feedback SHALL explain the recovered deficit context

### Requirement: Reconnect success falls back gracefully without event summary
The system SHALL still provide actionable reconnect success context when no latest event summary exists.

#### Scenario: No recent event summary is available
- **WHEN** reconnect success feedback appears but the recovered room has no latest event summary
- **THEN** the feedback SHALL fall back to the current acting player or decision context instead of showing an empty or placeholder summary

### Requirement: Reconnect success narrates auction recovery
The system SHALL explain auction context when reconnect success occurs during a live auction.

#### Scenario: Auction reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into a live auction
- **THEN** the feedback SHALL explain the current auction stakes and who decides next

### Requirement: Reconnect success narrates trade response recovery
The system SHALL explain trade response context when reconnect success occurs during a pending trade response.

#### Scenario: Trade response reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into trade response
- **THEN** the feedback SHALL explain the current trade responder and decision state

### Requirement: Reconnect success narrates jail decision recovery
The system SHALL explain jail decision context when reconnect success occurs during a jail decision.

#### Scenario: Jail decision reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into jail decision
- **THEN** the feedback SHALL explain the current jail decision options and who decides next

### Requirement: Later reconnects replace earlier reconnect context
The system SHALL replace stale reconnect narration with the newest recovered context after repeated reconnects.

#### Scenario: A second reconnect reaches a new phase
- **WHEN** the client reconnects, recovers, disconnects again, and later recovers into a newer room phase
- **THEN** the next reconnect success feedback SHALL describe only the newest recovered phase and SHALL NOT reuse stale text from the earlier recovery

### Requirement: Reconnect success remains noticeable on mobile
The system SHALL keep reconnect success feedback perceptible on narrow screens without obscuring the current action context.

#### Scenario: Mobile reconnect succeeds
- **WHEN** reconnect success feedback appears on a narrow screen
- **THEN** the feedback SHALL remain visible long enough to notice, stay within the viewport, and preserve the nearby current action context

### Requirement: Repeated reconnects retrigger success feedback cleanly
The system SHALL treat each reconnect success as a new display event.

#### Scenario: A second reconnect succeeds before the first notice fully ages out
- **WHEN** reconnect success occurs again during a later recovery
- **THEN** the success feedback SHALL refresh to the newest context and restart its display lifetime instead of being swallowed by the earlier notice state

### Requirement: Reconnect context remains lightly reviewable after dismissal
The system SHALL preserve a lightweight recent recovery recap after the reconnect success strip disappears.

#### Scenario: Reconnect success strip dismisses
- **WHEN** reconnect success feedback has finished its transient display
- **THEN** the room overview SHALL preserve a lightweight recap of the most recent recovery context without recreating the full transient strip

### Requirement: Spectator reconnect stays perceptible during pressure phases
The system SHALL keep reconnect recovery context perceptible for spectators during decision-heavy room phases.

#### Scenario: Spectator reconnects during live auction
- **WHEN** a spectator reconnects while the room is in a live auction
- **THEN** reconnect feedback and the follow-up recap SHALL explain the auction context while preserving spectator read-only behavior

#### Scenario: Spectator reconnects during trade response
- **WHEN** a spectator reconnects while the room is waiting on a trade response
- **THEN** reconnect feedback and the follow-up recap SHALL explain the waiting counterparties while preserving spectator read-only behavior

#### Scenario: Spectator reconnects during jail decision
- **WHEN** a spectator reconnects while the room is waiting on a jail decision
- **THEN** reconnect feedback and the follow-up recap SHALL explain the jail context while preserving spectator read-only behavior

### Requirement: Recent recovery recaps indicate their authoritative anchor
The system SHALL show which authoritative room context a recent recovery recap came from.

#### Scenario: A recovery recap is visible
- **WHEN** a recent recovery recap is shown in the room overview
- **THEN** it SHALL indicate the authoritative phase or sequence anchor that the recap refers to

### Requirement: Stale recovery recaps clear after room progress advances
The system SHALL remove recent recovery recaps once they no longer match the latest authoritative room progress.

#### Scenario: Authoritative progress advances beyond the recap anchor
- **WHEN** the room receives newer authoritative progress than the recap anchor
- **THEN** the stale recap SHALL be removed instead of remaining as an outdated context hint

### Requirement: Mobile spectator reconnect remains perceptible during pressure phases
The system SHALL keep spectator reconnect feedback readable on narrow screens during decision-heavy phases.

#### Scenario: Mobile spectator reconnects during live auction
- **WHEN** a spectator reconnects on a narrow screen during a live auction
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow

#### Scenario: Mobile spectator reconnects during trade response
- **WHEN** a spectator reconnects on a narrow screen during a trade response
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow

#### Scenario: Mobile spectator reconnects during jail decision
- **WHEN** a spectator reconnects on a narrow screen during a jail decision
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow

### Requirement: Recent recovery recaps use player-facing game language
The system SHALL describe recovery anchors in player-facing game language instead of internal-style recovery terminology.

#### Scenario: A recent recovery recap is shown
- **WHEN** the room overview shows a recent recovery recap
- **THEN** the anchor copy SHALL explain where the player or spectator was brought back into the game using game-facing language

### Requirement: Stale recovery recaps dismiss softly before removal
The system SHALL weaken stale recent recovery recaps briefly before removing them from the overview.

#### Scenario: Authoritative progress invalidates a visible recap
- **WHEN** newer authoritative progress makes the current recap stale
- **THEN** the recap SHALL briefly de-emphasize before it is removed

### Requirement: Mobile player reconnect remains actionable during pressure phases
The system SHALL keep reconnect feedback readable and actionable on narrow screens during decision-heavy phases.

#### Scenario: Mobile player reconnects during live auction
- **WHEN** a player reconnects on a narrow screen during a live auction
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue auction actions without horizontal overflow

#### Scenario: Mobile player reconnects during trade response
- **WHEN** a player reconnects on a narrow screen during a trade response
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue the response actions without horizontal overflow

#### Scenario: Mobile player reconnects during jail decision
- **WHEN** a player reconnects on a narrow screen during a jail decision
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue the jail decision actions without horizontal overflow

### Requirement: Playwright supports environment-driven local validation profiles
The system SHALL allow the existing local Playwright lane to run against alternate frontend and backend execution settings through environment-driven configuration.

#### Scenario: A local isolated validation run uses alternate ports
- **WHEN** a local e2e run specifies alternate frontend and backend execution settings
- **THEN** the frontend preview, backend health check, Playwright base URL, and frontend API base URL SHALL all target the same isolated environment

### Requirement: The frontend package exposes a formal clean local e2e lane
The system SHALL provide a formal package script for isolated local clean e2e validation.

#### Scenario: A developer wants to run a clean local e2e pass
- **WHEN** a developer uses the formal clean local e2e script
- **THEN** the run SHALL disable existing server reuse and isolate its PocketBase data path from the default local lane

### Requirement: Clean spectator reconnect coverage remains deterministic on mobile
The system SHALL keep the mobile spectator reconnect coverage stable under the clean e2e lane.

#### Scenario: Mobile spectator reconnect coverage validates read-only recovery
- **WHEN** the clean e2e suite validates mobile spectator reconnect recovery
- **THEN** the test SHALL use a deterministic recovery baseline that still proves read-only recovery feedback and overflow safety

### Requirement: Clean live trade coverage respects the current authoritative turn model
The system SHALL validate live trade response and rejection flows only after the proposer regains an authoritative turn that can open turn tools.

#### Scenario: The clean suite validates a live trade response flow
- **WHEN** the proposer reaches the next authoritative turn after the opponent acts
- **THEN** the suite SHALL validate the live trade response flow from that turn

#### Scenario: The clean suite validates a rejected trade flow
- **WHEN** the proposer reaches the next authoritative turn after the opponent acts
- **THEN** the suite SHALL validate the rejected trade flow from that turn

### Requirement: The roll phase feels like a clear stage entrance
The system SHALL present the waiting-roll state as the primary visual entrance of the current turn without changing the underlying authoritative roll command.

#### Scenario: The active player reaches the waiting-roll phase
- **WHEN** the active player reaches the waiting-roll phase
- **THEN** the room page SHALL emphasize the roll action as the dominant primary action surface while preserving the existing roll command semantics

### Requirement: The board keeps first-visual priority during active play
The system SHALL present the board as the dominant play surface, with dense room-state information acting as a supporting layer.

#### Scenario: A player views an active room on desktop
- **WHEN** an active room is shown on desktop-sized layouts
- **THEN** the board SHALL receive more visual space than the room-state rail

### Requirement: The center board overlay remains readable on tighter layouts
The system SHALL keep the center board overlay concise enough to avoid visually crowding the play surface as the viewport tightens.

#### Scenario: The board is rendered on a tighter layout
- **WHEN** the board is rendered in a tighter viewport or smaller board stage
- **THEN** the center overlay SHALL reduce its persistent information density instead of stacking overlapping visual panels in the middle of the board

### Requirement: BoardScene reveals confirmed roll outcomes inside the board
The system SHALL visually reveal a confirmed roll outcome inside the board scene after the authoritative state is available.

#### Scenario: A roll result is confirmed
- **WHEN** an authoritative roll result reaches the board scene
- **THEN** the board SHALL present a short reveal phase that communicates the confirmed dice outcome without predicting or inventing it client-side

### Requirement: BoardScene only animates movement when the path is provably safe
The system SHALL animate stepwise token movement only when the authoritative previous and next states prove a single safe forward path.

#### Scenario: A single player moves by a confirmed dice total
- **WHEN** exactly one player position changes and the dice total maps to a forward path that lands on the authoritative final tile
- **THEN** the board SHALL animate stepwise token movement along that path

#### Scenario: A movement path is ambiguous or non-standard
- **WHEN** the board cannot prove a safe forward stepwise path from the authoritative states
- **THEN** the board SHALL snap directly to the final authoritative position instead of animating an ambiguous path

### Requirement: Landing highlight and result handoff stay non-blocking
The system SHALL highlight the final landing tile and hand off to the result state without delaying the authoritative UI state.

#### Scenario: A token finishes a board movement
- **WHEN** the animated token reaches its authoritative final tile
- **THEN** the board SHALL emphasize the landing tile and transition into the confirmed result state while preserving immediate DOM semantics and actions

### Requirement: BoardScene explains key landing consequences inside the board
The system SHALL explain property purchase, rent, tax, and jail landing consequences directly inside the board scene after the authoritative result is confirmed.

#### Scenario: A supported landing consequence is confirmed
- **WHEN** the latest authoritative board result is property-purchased, rent-charged, tax-paid, or player-jailed
- **THEN** the board SHALL present a concise board-level consequence message that explains the confirmed outcome without creating a new action surface

### Requirement: Board consequence feedback stays spectator-readable
The system SHALL phrase supported landing consequences in a way that lets non-acting viewers understand who was affected and what happened.

#### Scenario: A spectator watches a supported landing consequence
- **WHEN** a supported landing consequence appears on the board
- **THEN** the board SHALL expose enough concise scene-facing summary information for a spectator to understand the affected player and confirmed outcome

### Requirement: Supported landing consequences are reflected in semantic board summaries
The system SHALL expose concise semantic consequence summaries for supported landing outcomes through the board host summary surface.

#### Scenario: A supported landing consequence is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise consequence summary for the supported landing outcome

### Requirement: BoardScene bridges authoritative turn handoff inside the board
The system SHALL explain authoritative turn ownership changes directly inside the board scene without creating a new gameplay phase.

#### Scenario: The turn advances to the next player
- **WHEN** an authoritative `turn-advanced` result becomes the latest board-level ownership change
- **THEN** the board SHALL present a concise handoff message that identifies the incoming active player and next phase

### Requirement: Previous board results step back when the next player takes control
The system SHALL visually reduce the prominence of the previous resolved board result when the next player takes the stage.

#### Scenario: A handoff cue is active
- **WHEN** the board is showing a supported turn handoff cue
- **THEN** the board SHALL keep the previous result context readable while lowering its visual dominance behind the incoming turn owner

### Requirement: Turn handoff context is reflected in semantic board summaries
The system SHALL expose concise handoff summaries through the board host summary surface.

#### Scenario: A handoff cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise handoff summary naming the incoming active player and the next stage

### Requirement: BoardScene explains active multi-party pressure stages inside the board
The system SHALL explain auction, trade response, and deficit recovery directly inside the board scene without creating a new gameplay phase.

#### Scenario: A supported multi-party pressure stage is active
- **WHEN** the board is in `awaiting-auction`, `awaiting-trade-response`, or `awaiting-deficit-resolution`
- **THEN** the board SHALL present a concise phase focus message identifying the current decision owner, the affected counterpart when relevant, and the stage pressure source

### Requirement: Multi-party phase focus keeps action ownership readable
The system SHALL visually distinguish the current decision owner from affected but non-controlling players.

#### Scenario: A supported phase focus cue is active
- **WHEN** the board is showing a supported multi-party phase focus cue
- **THEN** the board SHALL emphasize the current decision owner more strongly than secondary affected players

### Requirement: Multi-party phase focus is reflected in semantic board summaries
The system SHALL expose concise phase focus summaries through the board host summary surface.

#### Scenario: A phase focus cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise multi-party phase focus summary

### Requirement: The board and rule presentation are configuration driven
The system SHALL load board layout, tile presentation, labels, and rule-linked content from shared configuration rather than hardcoding them into view components.

#### Scenario: Client renders tile metadata
- **WHEN** the board scene renders a tile or card-dependent interaction
- **THEN** the client SHALL resolve its display metadata through shared board or rule configuration

#### Scenario: Shared configuration changes
- **WHEN** a supported board or rule configuration is updated
- **THEN** the client SHALL be able to reflect that configuration without requiring gameplay logic to be rewritten in UI components
