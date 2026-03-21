# HarmonyOS JS Bridge Contract

## Purpose

Expose HarmonyOS-specific capabilities to the shared web client without embedding gameplay logic in the bridge.

## Initial Bridge Surface

- `notify(eventName, payload)`
- `shareRoom(roomId, inviteCode)`
- `vibrate(pattern)`
- `getDeviceInfo()`

## Constraints

- All bridge methods must be optional from the web client's perspective.
- Errors must be normalized into structured responses instead of thrown strings.
- Bridge versioning must be explicit so the web client can degrade gracefully.
