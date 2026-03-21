import { describe, expect, test } from "vitest";
import { sampleProjection } from "@dafuweng/board-config";
import { toProjectionView } from "./gameProjection";

describe("toProjectionView", () => {
  test("returns the current turn player name from the authoritative projection", () => {
    const projection = toProjectionView(sampleProjection);

    expect(projection.roomId).toBe("demo-room");
    expect(projection.currentTurnPlayerName).toBe("玩家二");
    expect(projection.players).toHaveLength(4);
  });
});