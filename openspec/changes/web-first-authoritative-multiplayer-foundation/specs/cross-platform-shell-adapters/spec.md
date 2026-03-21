## ADDED Requirements

### Requirement: Non-web clients embed the shared web experience
The system SHALL treat desktop, mobile, and HarmonyOS clients as shells around the shared web client rather than as separate gameplay implementations.

#### Scenario: Desktop shell loads the shared client
- **WHEN** the desktop application starts
- **THEN** it SHALL host the same web client used by the browser product and SHALL NOT replace gameplay rules with desktop-only logic

#### Scenario: Mobile shell loads the shared client
- **WHEN** the mobile application starts
- **THEN** it SHALL host the same web client used by the browser product and SHALL preserve compatibility with the shared backend protocol

### Requirement: Platform-specific capabilities are exposed through adapters
The system SHALL isolate platform-specific features such as notifications, storage, lifecycle hooks, and bridge calls behind adapter interfaces.

#### Scenario: Web environment uses browser adapter
- **WHEN** the shared client runs in a standard browser
- **THEN** platform calls SHALL resolve through a browser-safe adapter implementation

#### Scenario: HarmonyOS environment needs bridge access
- **WHEN** the shared client needs a HarmonyOS-specific capability
- **THEN** it SHALL call an abstract platform interface that can be implemented through ArkWeb plus a JavaScript bridge

### Requirement: Platform support does not fork gameplay contracts
The system MUST preserve shared command and event contracts across browser, desktop, mobile, and HarmonyOS clients.

#### Scenario: Platform-specific shell sends gameplay input
- **WHEN** a player action originates from any supported shell
- **THEN** the client SHALL translate it into the same shared command contract used by the browser client

#### Scenario: Shared backend event is received on multiple platforms
- **WHEN** the backend emits an authoritative gameplay event
- **THEN** each supported client SHALL be able to consume it through the same shared contract model