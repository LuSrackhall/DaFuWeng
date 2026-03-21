# Purpose

Define reconnect-safe frontend projection behavior for streamed room events.

# Requirements

### Requirement: Streamed room events remain reconnect-safe
The system MUST keep the web projection coherent when SSE disconnects, reconnects, or encounters sequence gaps.

#### Scenario: Client misses one or more live events
- **WHEN** the frontend detects a gap between the last applied sequence and a streamed event or reconnect attempt
- **THEN** it SHALL recover through the existing catch-up or snapshot fallback path instead of applying an unsafe partial projection
