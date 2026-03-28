import { memo, useEffect, useLayoutEffect, useRef } from "react";
import type { BoardTile, PlayerState } from "@dafuweng/contracts";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileGridPoint } from "./boardLayout";

type BoardStageCue = {
  eyebrowLabel: string;
  title: string;
  detail: string;
  diceLabel: string | null;
  accentTone: "default" | "warning" | "danger" | "success" | "neutral";
};

type BoardSceneTransitionHint = {
  transitionKey: string;
  eventSequence: number;
  snapshotVersion: number;
  eventType: string;
  actingPlayerId: string | null;
  diceLabel: string | null;
  diceTotal: number | null;
};

type BoardConsequenceCue = {
  key: string;
  eventType: "property-purchased" | "rent-charged" | "tax-paid" | "player-jailed";
  tone: "default" | "warning" | "danger" | "success" | "neutral";
  headline: string;
  amountLabel: string | null;
  spectatorLabel: string;
  anchorTileId: string | null;
  ariaSummary: string;
  primaryPlayerId: string | null;
  secondaryPlayerId: string | null;
};

type BoardTurnHandoffCue = {
  key: string;
  playerId: string;
  playerName: string;
  stageLabel: string;
  stageDetail: string;
  ariaSummary: string;
};

type BoardActorTakeoverCue = {
  key: string;
  playerId: string;
  playerName: string;
  tone: "default" | "warning" | "danger" | "success" | "neutral";
  scenarioLabel: string;
  detail: string;
  ariaSummary: string;
};

type BoardPhaseFocusCue = {
  key: string;
  phaseKind: "auction" | "trade-response" | "deficit" | "jail";
  tone: "default" | "warning" | "danger" | "success" | "neutral";
  phaseLabel: string;
  headline: string;
  detail: string;
  briefLabel: string | null;
  pressureLabel: string;
  ariaSummary: string;
  primaryPlayerId: string | null;
  secondaryPlayerId: string | null;
  anchorTileId: string | null;
};

type BoardPhaseClosureCue = {
  key: string;
  phaseKind: "auction" | "trade-response" | "deficit" | "jail" | "economic-chain";
  resolutionKind: "settled" | "unsold" | "accepted" | "rejected" | "resolved" | "released" | "bankruptcy";
  tone: "default" | "warning" | "danger" | "success" | "neutral";
  closureLabel: string;
  headline: string;
  detail: string;
  resumeLabel: string;
  nextStepLabel: string;
  ariaSummary: string;
  primaryPlayerId: string | null;
  secondaryPlayerId: string | null;
  anchorTileId: string | null;
};

type BoardSceneProps = {
  board: BoardTile[];
  currentTurnPlayerId: string;
  highlightedTileId: string | null;
  players: PlayerState[];
  deEmphasizeCenterCue?: boolean;
  resultFeedback: {
    eyebrowLabel: string;
    title: string;
    metaLabel: string;
    detail: string;
    nextLabel: string;
    diceLabel: string | null;
    chipLabel: string;
    chipValue: string;
    tone: "default" | "warning" | "danger" | "success" | "neutral";
  } | null;
  stageCue: BoardStageCue | null;
  transitionHint: BoardSceneTransitionHint | null;
  consequenceHint: BoardConsequenceCue | null;
  handoffHint: BoardTurnHandoffCue | null;
  actorTakeoverHint: BoardActorTakeoverCue | null;
  phaseFocusHint: BoardPhaseFocusCue | null;
  phaseClosureHint: BoardPhaseClosureCue | null;
};

type SceneAnimationCue = {
  key: string;
  startedAt: number;
  durationMs: number;
  revealDurationMs: number;
  moveStartMs: number;
  moveDurationMs: number;
  landingStartMs: number;
  landingDurationMs: number;
  movingPlayerId: string | null;
  path: number[];
  landingTileId: string | null;
  diceLabel: string | null;
};

type SceneAnimationState = {
  progress: number;
  pulse: number;
  glowAlpha: number;
  revealProgress: number;
  movementProgress: number;
  landingProgress: number;
  movingPlayerId: string | null;
  movingTileIndex: number | null;
  landingTileId: string | null;
  diceLabel: string | null;
};

type TileTrackSide = "top" | "bottom" | "left" | "right" | "corner";

const tileTypeFill: Record<string, number> = {
  corner: 0x13251f,
  property: 0x18372f,
  railway: 0x24443d,
  utility: 0x31493a,
  chance: 0x5f4218,
  community: 0x423761,
  tax: 0x632f2f,
  jail: 0x38513a,
};

const colorGroupPalette: Record<string, number> = {
  "old-town": 0x9c6a34,
  lakeside: 0x50a7c2,
  campus: 0xd65f78,
  theater: 0xe2b94a,
  industry: 0xc26d3b,
  market: 0xb55454,
  future: 0x5fa0d9,
  summit: 0x6a62cc,
};

const playerTokenPalette = [0xf6c85f, 0x7dcfb6, 0xf28c8c, 0x7aa6ff, 0xd4a5ff, 0xffd166];

const boardLabelStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 11,
  fill: 0xf7f2e8,
  fontWeight: "700",
  wordWrap: true,
  wordWrapWidth: 78,
  align: "left",
  lineHeight: 12,
});

const boardMetaStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 10,
  fill: 0xe7d5ad,
  wordWrap: true,
  wordWrapWidth: 78,
  lineHeight: 11,
});

const centerEyebrowStyle = new TextStyle({
  fontFamily: "Inter, Noto Sans SC, sans-serif",
  fontSize: 12,
  fill: 0xe6c37d,
  letterSpacing: 2,
  fontWeight: "700",
});

const centerTitleStyle = new TextStyle({
  fontFamily: "Noto Serif SC, Source Han Serif SC, serif",
  fontSize: 34,
  fill: 0xf8f0dd,
  fontWeight: "700",
});

const centerBodyStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 14,
  fill: 0xf2e5c3,
  align: "center",
  wordWrap: true,
  wordWrapWidth: 280,
  lineHeight: 18,
});

const centerChipLabelStyle = new TextStyle({
  fontFamily: "Inter, Noto Sans SC, sans-serif",
  fontSize: 10,
  fill: 0xe6c37d,
  fontWeight: "700",
  letterSpacing: 1,
});

const centerChipValueStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 14,
  fill: 0xf8f0dd,
  fontWeight: "700",
});

const centerResultTitleStyle = new TextStyle({
  fontFamily: "Noto Serif SC, Source Han Serif SC, serif",
  fontSize: 28,
  fill: 0xf8f0dd,
  fontWeight: "700",
  align: "center",
  wordWrap: true,
  wordWrapWidth: 300,
});

const centerResultMetaStyle = new TextStyle({
  fontFamily: "Inter, Noto Sans SC, sans-serif",
  fontSize: 11,
  fill: 0xe6c37d,
  letterSpacing: 1,
  fontWeight: "700",
});

function getFeedbackAccent(tone: NonNullable<BoardSceneProps["resultFeedback"]>["tone"], fallbackColor: number) {
  if (tone === "danger") {
    return 0xdd7464;
  }
  if (tone === "success") {
    return 0x70ba94;
  }
  if (tone === "warning") {
    return 0xe2b94a;
  }
  if (tone === "neutral") {
    return 0xa5b6ad;
  }
  return fallbackColor;
}

function getFeedbackBannerAlpha(tone: NonNullable<BoardSceneProps["resultFeedback"]>["tone"]) {
  if (tone === "success") {
    return 0.18;
  }
  if (tone === "neutral") {
    return 0.08;
  }
  if (tone === "danger") {
    return 0.16;
  }
  return 0.12;
}

function getHostSize(host: HTMLDivElement) {
  const rect = host.getBoundingClientRect();
  return {
    width: Math.max(1, Math.floor(rect.width || host.clientWidth || 1)),
    height: Math.max(1, Math.floor(rect.height || host.clientHeight || 1)),
  };
}

function getTrackSide(tile: BoardTile): TileTrackSide {
  if (tile.index % 10 === 0) {
    return "corner";
  }
  const { row, col } = getTileGridPoint(tile.index);
  if (row === 10) {
    return "bottom";
  }
  if (row === 0) {
    return "top";
  }
  if (col === 0) {
    return "left";
  }
  return "right";
}

function getTileAccentColor(tile: BoardTile, ownerColor: number | null) {
  if (ownerColor !== null) {
    return ownerColor;
  }
  if (tile.colorGroup) {
    return colorGroupPalette[tile.colorGroup] ?? 0xe6c37d;
  }
  return tile.type === "chance" || tile.type === "community" ? 0xe6c37d : 0xa6c7b7;
}

function drawSceneBackground(root: Container, boardX: number, boardY: number, stageSize: number, tileSize: number) {
  const frame = new Graphics();
  frame.roundRect(boardX, boardY, stageSize, stageSize, 30);
  frame.fill({ color: 0xcdb186, alpha: 1 });
  frame.stroke({ color: 0xf0ddb1, width: 3, alpha: 0.52 });
  root.addChild(frame);

  const playfield = new Graphics();
  playfield.roundRect(boardX + tileSize * 1.3, boardY + tileSize * 1.3, stageSize - tileSize * 2.6, stageSize - tileSize * 2.6, 28);
  playfield.fill({ color: 0x153229, alpha: 0.94 });
  playfield.stroke({ color: 0x2d574b, width: 2, alpha: 0.55 });
  root.addChild(playfield);
}

function drawTrackAccent(tileGraphic: Graphics, side: TileTrackSide, x: number, y: number, size: number, accentColor: number) {
  const bandThickness = Math.max(10, size * 0.14);
  if (side === "top") {
    tileGraphic.roundRect(x + 4, y + 4, size - 8, bandThickness, 8);
  } else if (side === "bottom") {
    tileGraphic.roundRect(x + 4, y + size - bandThickness - 4, size - 8, bandThickness, 8);
  } else if (side === "left") {
    tileGraphic.roundRect(x + 4, y + 4, bandThickness, size - 8, 8);
  } else if (side === "right") {
    tileGraphic.roundRect(x + size - bandThickness - 4, y + 4, bandThickness, size - 8, 8);
  } else {
    tileGraphic.roundRect(x + 6, y + 6, Math.max(18, size * 0.28), Math.max(18, size * 0.28), 10);
  }
  tileGraphic.fill({ color: accentColor, alpha: 0.95 });
}

function drawBoardTiles(
  root: Container,
  props: BoardSceneProps,
  boardX: number,
  boardY: number,
  tileSize: number,
  tileInnerSize: number,
  cellInset: number,
  animationState: SceneAnimationState | null,
) {
  const ownerByTileId = new Map<string, PlayerState>();
  props.players.forEach((player) => {
    player.properties.forEach((tileId) => ownerByTileId.set(tileId, player));
  });

  props.board.forEach((tile) => {
    const { row, col } = getTileGridPoint(tile.index);
    const x = boardX + col * tileSize + cellInset;
    const y = boardY + row * tileSize + cellInset;
    const owner = ownerByTileId.get(tile.id);
    const ownerIndex = owner ? props.players.findIndex((player) => player.id === owner.id) : -1;
    const ownerColor = ownerIndex >= 0 ? playerTokenPalette[ownerIndex % playerTokenPalette.length] : null;
    const tileSide = getTrackSide(tile);
    const accentColor = getTileAccentColor(tile, ownerColor);
    const isPhaseAnchorTile = tile.id === props.phaseFocusHint?.anchorTileId || tile.id === props.phaseClosureHint?.anchorTileId;

    const tileShadow = new Graphics();
    tileShadow.roundRect(x + 2, y + 4, tileInnerSize, tileInnerSize, Math.max(10, tileSize * 0.16));
    tileShadow.fill({ color: 0x08120f, alpha: 0.2 });
    root.addChild(tileShadow);

    const tileBackground = new Graphics();
    tileBackground.roundRect(x, y, tileInnerSize, tileInnerSize, Math.max(10, tileSize * 0.16));
    tileBackground.fill({ color: tileTypeFill[tile.type] ?? 0x18372f, alpha: 0.98 });
    tileBackground.stroke({
      color: tile.id === props.highlightedTileId ? 0xf6e7af : 0x4a5f57,
      width: tile.id === props.highlightedTileId ? 3 : 1.5,
      alpha: tile.id === props.highlightedTileId ? 0.92 : 0.6,
    });
    root.addChild(tileBackground);

    const accentBand = new Graphics();
    drawTrackAccent(accentBand, tileSide, x, y, tileInnerSize, accentColor);
    root.addChild(accentBand);

    const isLandingTile = animationState?.landingTileId === tile.id && animationState.landingProgress > 0;
    if (tile.id === props.highlightedTileId) {
      const highlightFrame = new Graphics();
      highlightFrame.roundRect(x - 5, y - 5, tileInnerSize + 10, tileInnerSize + 10, Math.max(12, tileSize * 0.2));
      highlightFrame.stroke({ color: 0xf6e7af, width: isLandingTile ? 4.8 : 4, alpha: isLandingTile ? 0.92 : 0.85 });
      root.addChild(highlightFrame);

      const highlightWash = new Graphics();
      highlightWash.roundRect(x + 2, y + 2, tileInnerSize - 4, tileInnerSize - 4, Math.max(8, tileSize * 0.14));
      highlightWash.fill({ color: accentColor, alpha: 0.14 + (isLandingTile ? (animationState?.landingProgress ?? 0) * 0.16 : 0) });
      root.addChild(highlightWash);

      if (isLandingTile) {
        const landingPulse = new Graphics();
        landingPulse.roundRect(x - 10, y - 10, tileInnerSize + 20, tileInnerSize + 20, Math.max(14, tileSize * 0.22));
        landingPulse.stroke({ color: accentColor, width: 2.4, alpha: 0.38 + (animationState?.landingProgress ?? 0) * 0.2 });
        root.addChild(landingPulse);
      }
    }

    if (isPhaseAnchorTile) {
      const phaseFrame = new Graphics();
      phaseFrame.roundRect(x - 3, y - 3, tileInnerSize + 6, tileInnerSize + 6, Math.max(12, tileSize * 0.18));
      phaseFrame.stroke({ color: accentColor, width: 2.2, alpha: 0.62 });
      root.addChild(phaseFrame);
    }

    const label = new Text({ text: tile.label, style: boardLabelStyle });
    label.x = x + 8;
    label.y = y + (tileSide === "top" || tileSide === "corner" ? 20 : 8);
    label.style.wordWrapWidth = tileInnerSize - 16;
    root.addChild(label);

    const metaLabel = owner
      ? `归属 ${owner.name}`
      : tile.type === "property"
        ? tile.colorGroup ?? "待售地产"
        : tile.type === "corner"
          ? "关键地块"
          : tile.type;
    const meta = new Text({ text: metaLabel, style: boardMetaStyle });
    meta.x = x + 8;
    meta.y = y + tileInnerSize - 19;
    meta.style.wordWrapWidth = tileInnerSize - 16;
    root.addChild(meta);
  });
}

function drawCenterChip(root: Container, x: number, y: number, width: number, label: string, value: string, accentColor: number) {
  const chip = new Graphics();
  chip.roundRect(x, y, width, 54, 16);
  chip.fill({ color: 0x10261f, alpha: 0.86 });
  chip.stroke({ color: accentColor, width: 1.5, alpha: 0.55 });
  root.addChild(chip);

  const labelText = new Text({ text: label, style: centerChipLabelStyle });
  labelText.x = x + 12;
  labelText.y = y + 10;
  root.addChild(labelText);

  const valueText = new Text({ text: value, style: centerChipValueStyle });
  valueText.x = x + 12;
  valueText.y = y + 24;
  root.addChild(valueText);
}

function createAdaptiveTextStyle(base: TextStyle, overrides: ConstructorParameters<typeof TextStyle>[0]) {
  return new TextStyle({
    ...base,
    ...overrides,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTileCenter(tileIndex: number, boardX: number, boardY: number, tileSize: number) {
  const { row, col } = getTileGridPoint(tileIndex);
  return {
    x: boardX + col * tileSize + tileSize / 2,
    y: boardY + row * tileSize + tileSize / 2,
  };
}

function getPlayerPositionMap(players: PlayerState[]) {
  return new Map(players.map((player) => [player.id, player.position]));
}

function buildMovementPath(startPosition: number, endPosition: number, steps: number, boardSize: number) {
  if (steps <= 0) {
    return null;
  }

  const path = [startPosition];
  let currentPosition = startPosition;

  for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
    currentPosition = (currentPosition + 1) % boardSize;
    path.push(currentPosition);
  }

  return currentPosition === endPosition ? path : null;
}

function buildSceneAnimationCue(previousProps: BoardSceneProps, nextProps: BoardSceneProps) {
  const nextHint = nextProps.transitionHint;
  const previousHint = previousProps.transitionHint;
  if (!nextHint || !nextHint.diceTotal || !nextHint.diceLabel) {
    return null;
  }

  if (!previousHint || nextHint.eventSequence !== previousHint.eventSequence + 1) {
    return null;
  }

  const previousPositions = getPlayerPositionMap(previousProps.players);
  const movedPlayers = nextProps.players.filter((player) => previousPositions.get(player.id) !== player.position);
  if (movedPlayers.length > 1) {
    return null;
  }

  const movedPlayer = movedPlayers[0] ?? null;
  let path: number[] = [];
  if (movedPlayer) {
    const previousPosition = previousPositions.get(movedPlayer.id);
    if (typeof previousPosition !== "number") {
      return null;
    }

    const movementPath = buildMovementPath(previousPosition, movedPlayer.position, nextHint.diceTotal, nextProps.board.length);
    if (!movementPath) {
      return null;
    }

    path = movementPath;
  }

  return {
    key: nextHint.transitionKey,
    startedAt: performance.now(),
    durationMs: movedPlayer ? 1320 : 760,
    revealDurationMs: 280,
    moveStartMs: 180,
    moveDurationMs: movedPlayer ? 700 : 0,
    landingStartMs: movedPlayer ? 860 : 280,
    landingDurationMs: movedPlayer ? 420 : 360,
    movingPlayerId: movedPlayer?.id ?? nextHint.actingPlayerId,
    path,
    landingTileId: nextProps.highlightedTileId,
    diceLabel: nextHint.diceLabel,
  } satisfies SceneAnimationCue;
}

function resolveSceneAnimationState(cue: SceneAnimationCue | null) {
  if (!cue) {
    return null;
  }

  const elapsed = performance.now() - cue.startedAt;
  if (elapsed >= cue.durationMs) {
    return null;
  }

  const progress = elapsed / cue.durationMs;
  const revealProgress = clamp(elapsed / cue.revealDurationMs, 0, 1);
  const movementProgress = cue.moveDurationMs > 0
    ? clamp((elapsed - cue.moveStartMs) / cue.moveDurationMs, 0, 1)
    : 0;
  const landingProgress = clamp((elapsed - cue.landingStartMs) / cue.landingDurationMs, 0, 1);
  let movingTileIndex: number | null = null;

  if (cue.path.length > 1 && movementProgress > 0) {
    const pathIndex = Math.min(cue.path.length - 1, Math.floor(movementProgress * (cue.path.length - 1)) + 1);
    movingTileIndex = cue.path[pathIndex] ?? cue.path.at(-1) ?? null;
  }

  return {
    progress,
    pulse: Math.sin(progress * Math.PI),
    glowAlpha: (1 - progress) * 0.22,
    revealProgress,
    movementProgress,
    landingProgress,
    movingPlayerId: cue.movingPlayerId,
    movingTileIndex,
    landingTileId: cue.landingTileId,
    diceLabel: cue.diceLabel,
  };
}

function resolveAnimatedTokenPosition(
  cue: SceneAnimationCue,
  state: SceneAnimationState,
  boardX: number,
  boardY: number,
  tileSize: number,
) {
  if (!cue.path.length || cue.path.length < 2 || state.movementProgress <= 0) {
    return null;
  }

  const segmentCount = cue.path.length - 1;
  const rawSegmentProgress = state.movementProgress * segmentCount;
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(rawSegmentProgress));
  const segmentProgress = clamp(rawSegmentProgress - segmentIndex, 0, 1);
  const startTile = cue.path[segmentIndex] ?? cue.path[0];
  const endTile = cue.path[segmentIndex + 1] ?? cue.path.at(-1) ?? cue.path[0];
  const start = getTileCenter(startTile, boardX, boardY, tileSize);
  const end = getTileCenter(endTile, boardX, boardY, tileSize);
  const easedProgress = 1 - (1 - segmentProgress) * (1 - segmentProgress);
  const hop = Math.sin(segmentProgress * Math.PI) * Math.max(8, tileSize * 0.12);

  return {
    x: start.x + (end.x - start.x) * easedProgress,
    y: start.y + (end.y - start.y) * easedProgress - hop,
  };
}

function drawCenterHud(
  root: Container,
  props: BoardSceneProps,
  boardX: number,
  boardY: number,
  tileSize: number,
  animationState: SceneAnimationState | null,
) {
  const currentPlayer = props.players.find((player) => player.id === props.currentTurnPlayerId) ?? null;
  const currentPlayerIndex = currentPlayer ? props.players.findIndex((player) => player.id === currentPlayer.id) : -1;
  const currentPlayerColor = currentPlayerIndex >= 0 ? playerTokenPalette[currentPlayerIndex % playerTokenPalette.length] : 0xe6c37d;
  const highlightedTile = props.highlightedTileId
    ? props.board.find((tile) => tile.id === props.highlightedTileId) ?? null
    : null;
  const focusOwner = highlightedTile
    ? props.players.find((player) => player.properties.includes(highlightedTile.id)) ?? null
    : null;
  const ownedPropertyCount = props.players.reduce((total, player) => total + player.properties.length, 0);
  const availablePropertyCount = props.board.filter((tile) => tile.type === "property").length - ownedPropertyCount;
  const resultFeedback = props.resultFeedback;
  const stageCue = props.stageCue;
  const shouldMuteCenterCue = Boolean(props.deEmphasizeCenterCue && (resultFeedback || stageCue));
  const consequenceHint = props.consequenceHint;
  const handoffHint = props.handoffHint;
  const actorTakeoverHint = props.actorTakeoverHint;
  const phaseFocusHint = props.phaseFocusHint;
  const phaseClosureHint = props.phaseClosureHint;
  const feedbackAccent = getFeedbackAccent(resultFeedback?.tone ?? "default", currentPlayerColor);
  const stageSize = tileSize * 11;
  const compactHud = stageSize < 620;
  const crampedHud = stageSize < 500;

  const centerX = boardX + tileSize * 2.28;
  const centerY = boardY + tileSize * 2.22;
  const centerWidth = tileSize * 6.45;
  const centerHeight = tileSize * 6.25;
  const cardInset = compactHud ? 16 : 20;
  const ribbonHeight = crampedHud ? 80 : 94;
  const cardHeight = compactHud ? centerHeight - 20 : centerHeight - 10;
  const titleStyle = createAdaptiveTextStyle(resultFeedback ? centerResultTitleStyle : centerTitleStyle, {
    fontSize: resultFeedback
      ? (shouldMuteCenterCue ? (crampedHud ? 17 : compactHud ? 20 : 23) : (crampedHud ? 19 : compactHud ? 22 : 26))
      : (shouldMuteCenterCue ? (crampedHud ? 19 : compactHud ? 22 : 26) : (crampedHud ? 21 : compactHud ? 25 : 30)),
    wordWrapWidth: centerWidth - cardInset * 2 - (shouldMuteCenterCue ? 44 : 24),
    lineHeight: shouldMuteCenterCue ? (crampedHud ? 20 : compactHud ? 23 : 26) : (crampedHud ? 22 : compactHud ? 25 : 29),
  });
  const eyebrowStyle = createAdaptiveTextStyle(centerEyebrowStyle, {
    fontSize: crampedHud ? 10 : 11,
    letterSpacing: crampedHud ? 1.1 : 1.7,
  });
  const bodyStyle = createAdaptiveTextStyle(centerBodyStyle, {
    fontSize: shouldMuteCenterCue ? (crampedHud ? 10 : compactHud ? 11 : 12) : (crampedHud ? 11 : compactHud ? 12 : 13),
    lineHeight: shouldMuteCenterCue ? (crampedHud ? 13 : compactHud ? 15 : 16) : (crampedHud ? 14 : compactHud ? 16 : 17),
    wordWrapWidth: centerWidth - cardInset * 2 - (shouldMuteCenterCue ? 34 : 18),
  });
  const metaStyle = createAdaptiveTextStyle(centerResultMetaStyle, {
    fontSize: shouldMuteCenterCue ? (crampedHud ? 8 : 9) : (crampedHud ? 9 : 10),
    letterSpacing: crampedHud ? 0.8 : 1,
  });

  const panelShadow = new Graphics();
  panelShadow.roundRect(centerX + 4, centerY + 8, centerWidth, cardHeight, 32);
  panelShadow.fill({ color: 0x07120f, alpha: 0.26 });
  root.addChild(panelShadow);

  const centerPanel = new Graphics();
  centerPanel.roundRect(centerX, centerY, centerWidth, cardHeight, 32);
  centerPanel.fill({ color: 0x10261f, alpha: shouldMuteCenterCue ? 0.84 : 0.96 });
  centerPanel.stroke({ color: feedbackAccent, width: 2, alpha: shouldMuteCenterCue ? 0.32 : 0.58 });
  root.addChild(centerPanel);

  const currentGlow = new Graphics();
  currentGlow.roundRect(centerX + 18, centerY + 18, centerWidth - 36, ribbonHeight, 24);
  currentGlow.fill({ color: feedbackAccent, alpha: (shouldMuteCenterCue ? 0.03 : 0.08) + (animationState?.glowAlpha ?? 0) * (shouldMuteCenterCue ? 0.42 : 1) });
  root.addChild(currentGlow);

  if (animationState?.diceLabel && animationState.revealProgress < 1) {
    const revealWidth = compactHud ? 128 : 154;
    const revealHeight = compactHud ? 54 : 62;
    const revealX = centerX + centerWidth / 2 - revealWidth / 2;
    const revealY = centerY - 18;

    const revealPill = new Graphics();
    revealPill.roundRect(revealX, revealY, revealWidth, revealHeight, 22);
    revealPill.fill({ color: 0x11261f, alpha: 0.9 });
    revealPill.stroke({ color: feedbackAccent, width: 1.8, alpha: 0.45 + animationState.revealProgress * 0.22 });
    root.addChild(revealPill);

    const revealLabel = new Text({
      text: "权威掷骰",
      style: createAdaptiveTextStyle(centerChipLabelStyle, { fontSize: compactHud ? 9 : 10 }),
    });
    revealLabel.anchor.set(0.5, 0);
    revealLabel.x = revealX + revealWidth / 2;
    revealLabel.y = revealY + 10;
    root.addChild(revealLabel);

    const revealValue = new Text({
      text: animationState.diceLabel,
      style: createAdaptiveTextStyle(centerResultTitleStyle, {
        fontSize: compactHud ? 20 : 24,
        wordWrapWidth: revealWidth - 24,
        lineHeight: compactHud ? 22 : 26,
      }),
    });
    revealValue.anchor.set(0.5, 0);
    revealValue.x = revealX + revealWidth / 2;
    revealValue.y = revealY + 22;
    root.addChild(revealValue);
  }

  if (resultFeedback) {
    const resultBanner = new Graphics();
    const bannerInset = 22 - (animationState?.pulse ?? 0) * 2;
    resultBanner.roundRect(centerX + bannerInset, centerY + bannerInset, centerWidth - bannerInset * 2, ribbonHeight + 22, 24);
    const resultAlpha = (getFeedbackBannerAlpha(resultFeedback.tone) + (animationState?.glowAlpha ?? 0) * 0.5) * (handoffHint ? 0.54 : 1) * (shouldMuteCenterCue ? 0.64 : 1);
    resultBanner.fill({ color: feedbackAccent, alpha: resultAlpha });
    resultBanner.stroke({ color: feedbackAccent, width: 1.5, alpha: shouldMuteCenterCue ? 0.2 : 0.38 });
    root.addChild(resultBanner);

    if (animationState && !shouldMuteCenterCue) {
      const burst = new Graphics();
      burst.circle(centerX + centerWidth - 86, centerY + cardHeight - 66, 26 + animationState.pulse * 18);
      burst.fill({ color: feedbackAccent, alpha: animationState.glowAlpha });
      root.addChild(burst);
    }
  }

  const eyebrow = new Text({ text: resultFeedback ? resultFeedback.eyebrowLabel : stageCue?.eyebrowLabel ?? "当前回合", style: eyebrowStyle });
  eyebrow.anchor.set(0.5, 0);
  eyebrow.x = centerX + centerWidth / 2;
  eyebrow.y = centerY + 22;
  root.addChild(eyebrow);

  const title = new Text({
    text: resultFeedback ? resultFeedback.title : stageCue?.title ?? currentPlayer?.name ?? "牌局马上就到这一步",
    style: titleStyle,
  });
  title.anchor.set(0.5, 0);
  title.x = centerX + centerWidth / 2;
  title.y = centerY + (crampedHud ? 42 : 48);
  root.addChild(title);

  if (resultFeedback || stageCue) {
    const resultMeta = new Text({ text: resultFeedback?.metaLabel ?? "当前舞台已对准这一步", style: metaStyle });
    resultMeta.anchor.set(0.5, 0);
    resultMeta.x = centerX + centerWidth / 2;
    resultMeta.y = centerY + (crampedHud ? 70 : compactHud ? 76 : 82);
    root.addChild(resultMeta);
  }

  const focusLabel = highlightedTile?.label ?? "当前没有焦点地块";
  const focusMeta = resultFeedback
    ? `${resultFeedback.detail}`
    : stageCue
      ? stageCue.detail
    : highlightedTile
      ? focusOwner
        ? `归属 ${focusOwner.name}`
        : highlightedTile.type === "property"
          ? `可购买 · ${highlightedTile.price ?? "-"}`
          : `特殊事件 · ${highlightedTile.type}`
      : "下一步很快就会揭晓";
  const body = new Text({
    text: resultFeedback || stageCue ? focusMeta : `焦点地块：${focusLabel}\n${focusMeta}`,
    style: bodyStyle,
  });
  body.anchor.set(0.5, 0);
  body.x = centerX + centerWidth / 2;
  body.y = centerY + (crampedHud ? 98 : compactHud ? 108 : 116);
  root.addChild(body);

  const bottomY = centerY + cardHeight - (compactHud ? 72 : 82);
  const compactChipWidth = compactHud ? 118 : 136;
  const bottomLeftX = centerX + 22;
  const bottomRightX = centerX + centerWidth - compactChipWidth - 22;
  const leftChipValue = resultFeedback?.chipValue ?? currentPlayer?.name ?? `${Math.max(0, availablePropertyCount)}`;
  const rightChipValue = resultFeedback?.diceLabel ?? stageCue?.diceLabel ?? (props.players.length > 0 ? "待揭晓" : "--");

  drawCenterChip(root, bottomLeftX, bottomY, compactChipWidth, resultFeedback?.chipLabel ?? "当前行动", leftChipValue, feedbackAccent);
  drawCenterChip(root, bottomRightX, bottomY, compactChipWidth, "最近骰子", rightChipValue, 0xa6c7b7);

  const footer = new Text({
    text: resultFeedback?.nextLabel ?? `焦点地块 ${focusLabel}`,
    style: createAdaptiveTextStyle(centerChipLabelStyle, {
      fontSize: crampedHud ? 9 : 10,
      fill: 0xf2e5c3,
      wordWrapWidth: centerWidth - 48,
      wordWrap: true,
      letterSpacing: 0.2,
    }),
  });
  footer.anchor.set(0.5, 0);
  footer.x = centerX + centerWidth / 2;
  footer.y = centerY + cardHeight - (compactHud ? 22 : 26);
  root.addChild(footer);

  if (handoffHint && (!animationState?.diceLabel || animationState.revealProgress >= 1)) {
    const bridgeWidth = compactHud ? 210 : 246;
    const bridgeHeight = compactHud ? 54 : 62;
    const bridgeX = centerX + centerWidth / 2 - bridgeWidth / 2;
    const bridgeY = centerY - 18;

    const bridge = new Graphics();
    bridge.roundRect(bridgeX, bridgeY, bridgeWidth, bridgeHeight, 22);
    bridge.fill({ color: 0x10261f, alpha: 0.92 });
    bridge.stroke({ color: currentPlayerColor, width: 1.7, alpha: 0.5 });
    root.addChild(bridge);

    const handoffLabel = new Text({
      text: `当前行动者 ${handoffHint.playerName}`,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 9 : 10,
        fill: 0xe6c37d,
      }),
    });
    handoffLabel.anchor.set(0.5, 0);
    handoffLabel.x = bridgeX + bridgeWidth / 2;
    handoffLabel.y = bridgeY + 10;
    root.addChild(handoffLabel);

    const handoffStage = new Text({
      text: handoffHint.stageLabel,
      style: createAdaptiveTextStyle(centerChipValueStyle, {
        fontSize: compactHud ? 16 : 18,
        fill: 0xf8f0dd,
      }),
    });
    handoffStage.anchor.set(0.5, 0);
    handoffStage.x = bridgeX + bridgeWidth / 2;
    handoffStage.y = bridgeY + 25;
    root.addChild(handoffStage);
  }

  if (actorTakeoverHint && !handoffHint && (!animationState?.diceLabel || animationState.revealProgress >= 1)) {
    const bridgeWidth = compactHud ? 232 : 274;
    const bridgeHeight = compactHud ? 62 : 70;
    const bridgeX = centerX + centerWidth / 2 - bridgeWidth / 2;
    const bridgeY = centerY - 24;
    const takeoverAccent = getFeedbackAccent(actorTakeoverHint.tone, currentPlayerColor);

    const bridge = new Graphics();
    bridge.roundRect(bridgeX, bridgeY, bridgeWidth, bridgeHeight, 22);
    bridge.fill({ color: 0x10261f, alpha: 0.94 });
    bridge.stroke({ color: takeoverAccent, width: 1.9, alpha: 0.58 });
    root.addChild(bridge);

    const takeoverLabel = new Text({
      text: `${actorTakeoverHint.scenarioLabel} ${actorTakeoverHint.playerName}`,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 9 : 10,
        fill: 0xe6c37d,
      }),
    });
    takeoverLabel.anchor.set(0.5, 0);
    takeoverLabel.x = bridgeX + bridgeWidth / 2;
    takeoverLabel.y = bridgeY + 9;
    root.addChild(takeoverLabel);

    const takeoverDetail = new Text({
      text: actorTakeoverHint.detail,
      style: createAdaptiveTextStyle(centerBodyStyle, {
        fontSize: compactHud ? 10 : 11,
        lineHeight: compactHud ? 13 : 14,
        fill: 0xf8f0dd,
        wordWrapWidth: bridgeWidth - 28,
        align: "center",
      }),
    });
    takeoverDetail.anchor.set(0.5, 0);
    takeoverDetail.x = bridgeX + bridgeWidth / 2;
    takeoverDetail.y = bridgeY + 25;
    root.addChild(takeoverDetail);
  }

  if (phaseClosureHint) {
    const closureAccent = getFeedbackAccent(phaseClosureHint.tone, currentPlayerColor);
    const closureWidth = compactHud ? 186 : 214;
    const closureHeight = compactHud ? 106 : 118;
    const closureX = centerX + 14;
    const closureY = centerY + 16;

    const closurePanel = new Graphics();
    closurePanel.roundRect(closureX, closureY, closureWidth, closureHeight, 18);
    closurePanel.fill({ color: 0x0f221d, alpha: 0.92 });
    closurePanel.stroke({ color: closureAccent, width: 1.5, alpha: 0.44 });
    root.addChild(closurePanel);

    const closureLabel = new Text({
      text: phaseClosureHint.closureLabel,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 9 : 10,
        fill: 0xe6c37d,
      }),
    });
    closureLabel.x = closureX + 14;
    closureLabel.y = closureY + 12;
    root.addChild(closureLabel);

    const closureHeadline = new Text({
      text: phaseClosureHint.headline,
      style: createAdaptiveTextStyle(centerChipValueStyle, {
        fontSize: compactHud ? 13 : 15,
        fill: 0xf8f0dd,
      }),
    });
    closureHeadline.x = closureX + 14;
    closureHeadline.y = closureY + 30;
    root.addChild(closureHeadline);

    const closureResume = new Text({
      text: phaseClosureHint.detail,
      style: createAdaptiveTextStyle(centerBodyStyle, {
        fontSize: compactHud ? 10 : 11,
        lineHeight: compactHud ? 13 : 14,
        wordWrapWidth: closureWidth - 28,
        fill: 0xf2e5c3,
        align: "left",
      }),
    });
    closureResume.x = closureX + 14;
    closureResume.y = closureY + 49;
    root.addChild(closureResume);

    const nextStep = new Text({
      text: `${phaseClosureHint.resumeLabel} · ${phaseClosureHint.nextStepLabel}`,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 8.5 : 9.5,
        fill: 0xf8f0dd,
        letterSpacing: 0.2,
        wordWrapWidth: closureWidth - 28,
        wordWrap: true,
      }),
    });
    nextStep.x = closureX + 14;
    nextStep.y = closureY + closureHeight - 28;
    root.addChild(nextStep);
  }

  if (phaseFocusHint) {
    const phaseAccent = getFeedbackAccent(phaseFocusHint.tone, currentPlayerColor);
    const focusWidth = compactHud ? 186 : 214;
    const focusHeight = compactHud ? 112 : 126;
    const focusX = centerX + centerWidth - focusWidth - 14;
    const focusY = centerY + 16;

    const focusPanel = new Graphics();
    focusPanel.roundRect(focusX, focusY, focusWidth, focusHeight, 18);
    focusPanel.fill({ color: 0x0f221d, alpha: 0.92 });
    focusPanel.stroke({ color: phaseAccent, width: 1.5, alpha: 0.44 });
    root.addChild(focusPanel);

    const phaseLabel = new Text({
      text: phaseFocusHint.phaseLabel,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 9 : 10,
        fill: 0xe6c37d,
      }),
    });
    phaseLabel.x = focusX + 14;
    phaseLabel.y = focusY + 12;
    root.addChild(phaseLabel);

    const phaseHeadline = new Text({
      text: phaseFocusHint.headline,
      style: createAdaptiveTextStyle(centerChipValueStyle, {
        fontSize: compactHud ? 13 : 15,
        fill: 0xf8f0dd,
      }),
    });
    phaseHeadline.x = focusX + 14;
    phaseHeadline.y = focusY + 30;
    root.addChild(phaseHeadline);

    const phaseDetail = new Text({
      text: phaseFocusHint.detail,
      style: createAdaptiveTextStyle(centerBodyStyle, {
        fontSize: compactHud ? 10 : 11,
        lineHeight: compactHud ? 13 : 14,
        wordWrapWidth: focusWidth - 28,
        fill: 0xf2e5c3,
        align: "left",
      }),
    });
    phaseDetail.x = focusX + 14;
    phaseDetail.y = focusY + 48;
    root.addChild(phaseDetail);

    if (phaseFocusHint.briefLabel) {
      const brief = new Text({
        text: phaseFocusHint.briefLabel,
        style: createAdaptiveTextStyle(centerChipLabelStyle, {
          fontSize: compactHud ? 8.5 : 9.5,
          fill: 0xf8f0dd,
          wordWrapWidth: focusWidth - 28,
          wordWrap: true,
        }),
      });
      brief.x = focusX + 14;
      brief.y = focusY + focusHeight - 36;
      root.addChild(brief);
    }

    const pressure = new Text({
      text: phaseFocusHint.pressureLabel,
      style: createAdaptiveTextStyle(centerChipLabelStyle, {
        fontSize: compactHud ? 9 : 10,
        fill: 0xf8f0dd,
      }),
    });
    pressure.x = focusX + 14;
    pressure.y = focusY + focusHeight - 18;
    root.addChild(pressure);
  }

  if (consequenceHint) {
    const consequenceAccent = getFeedbackAccent(consequenceHint.tone, feedbackAccent);
    const ribbonWidth = centerWidth - 20;
    const ribbonHeight = compactHud ? 58 : 66;
    const ribbonX = centerX + 10;
    const ribbonY = centerY + cardHeight + 12;
    const ribbonAlpha = (0.92 + (animationState?.landingProgress ?? 0) * 0.04) * (handoffHint ? 0.58 : 1);

    const ribbon = new Graphics();
    ribbon.roundRect(ribbonX, ribbonY, ribbonWidth, ribbonHeight, 20);
    ribbon.fill({ color: 0x0f221d, alpha: ribbonAlpha });
    ribbon.stroke({ color: consequenceAccent, width: 1.6, alpha: 0.44 });
    root.addChild(ribbon);

    const toneBand = new Graphics();
    toneBand.roundRect(ribbonX + 10, ribbonY + 11, 6, ribbonHeight - 22, 6);
    toneBand.fill({ color: consequenceAccent, alpha: 0.9 });
    root.addChild(toneBand);

    const headline = new Text({
      text: consequenceHint.headline,
      style: createAdaptiveTextStyle(centerChipValueStyle, {
        fontSize: compactHud ? 13 : 15,
        fill: 0xf8f0dd,
      }),
    });
    headline.x = ribbonX + 28;
    headline.y = ribbonY + 10;
    root.addChild(headline);

    if (consequenceHint.amountLabel) {
      const amount = new Text({
        text: consequenceHint.amountLabel,
        style: createAdaptiveTextStyle(centerChipLabelStyle, {
          fontSize: compactHud ? 10 : 11,
          fill: 0xe6c37d,
          letterSpacing: 0.4,
        }),
      });
      amount.x = ribbonX + ribbonWidth - amount.width - 16;
      amount.y = ribbonY + 13;
      root.addChild(amount);
    }

    const spectator = new Text({
      text: consequenceHint.spectatorLabel,
      style: createAdaptiveTextStyle(centerBodyStyle, {
        fontSize: compactHud ? 10 : 11,
        lineHeight: compactHud ? 13 : 15,
        wordWrapWidth: ribbonWidth - 44,
        fill: 0xf2e5c3,
        align: "left",
      }),
    });
    spectator.x = ribbonX + 28;
    spectator.y = ribbonY + 30;
    root.addChild(spectator);
  }
}

function drawPlayerTokens(
  root: Container,
  props: BoardSceneProps,
  boardX: number,
  boardY: number,
  tileSize: number,
  animationCue: SceneAnimationCue | null,
  animationState: SceneAnimationState | null,
) {
  const playersByPosition = new Map<number, PlayerState[]>();
  props.players.forEach((player) => {
    if (player.id === animationState?.movingPlayerId && animationState.movementProgress > 0 && animationState.movementProgress < 1) {
      return;
    }
    const onTile = playersByPosition.get(player.position) ?? [];
    onTile.push(player);
    playersByPosition.set(player.position, onTile);
  });

  function drawToken(player: PlayerState, tokenX: number, tokenY: number, tokenColor: number) {
    const tokenRadius = Math.max(10, tileSize * 0.13);
    const isCurrentTurnPlayer = player.id === props.currentTurnPlayerId;
    const isMovingPlayer = player.id === animationState?.movingPlayerId;
    const isHandoffPlayer = player.id === props.handoffHint?.playerId;
    const isConsequencePrimary = player.id === props.consequenceHint?.primaryPlayerId;
    const isConsequenceSecondary = player.id === props.consequenceHint?.secondaryPlayerId;
    const isPhasePrimary = player.id === props.phaseFocusHint?.primaryPlayerId;
    const isPhaseSecondary = player.id === props.phaseFocusHint?.secondaryPlayerId;
    const isClosurePrimary = player.id === props.phaseClosureHint?.primaryPlayerId;
    const isClosureSecondary = player.id === props.phaseClosureHint?.secondaryPlayerId;
    const isTakeoverPlayer = player.id === props.actorTakeoverHint?.playerId;
    const shadow = new Graphics();
    shadow.circle(tokenX + 1.5, tokenY + 3, tokenRadius + 1);
    shadow.fill({ color: 0x07120f, alpha: 0.28 });
    root.addChild(shadow);

    if (isCurrentTurnPlayer || isMovingPlayer || isConsequencePrimary || isConsequenceSecondary || isPhasePrimary || isPhaseSecondary || isClosurePrimary || isClosureSecondary || isTakeoverPlayer) {
      const ring = new Graphics();
      const ringBoost = isMovingPlayer ? (animationState?.pulse ?? 0) * 2 : isHandoffPlayer ? 1.8 : 0;
      ring.circle(tokenX, tokenY, tokenRadius + 7 + ringBoost);
      const fillAlpha = isConsequenceSecondary || isPhaseSecondary || isClosureSecondary
        ? 0.1
        : 0.14 + (isMovingPlayer ? (animationState?.glowAlpha ?? 0) * 0.45 : 0) + (isHandoffPlayer || isPhasePrimary || isClosurePrimary || isTakeoverPlayer ? 0.06 : 0);
      const strokeColor = isConsequenceSecondary || isPhaseSecondary || isClosureSecondary ? tokenColor : 0xf6e7af;
      const strokeAlpha = isConsequenceSecondary || isPhaseSecondary || isClosureSecondary ? 0.74 : 0.95;
      ring.fill({ color: tokenColor, alpha: fillAlpha });
      ring.stroke({ color: strokeColor, width: isHandoffPlayer || isPhasePrimary || isClosurePrimary || isTakeoverPlayer ? 3 : 2.5, alpha: strokeAlpha });
      root.addChild(ring);
    }

    const token = new Graphics();
    token.circle(tokenX, tokenY, tokenRadius);
    token.fill({ color: tokenColor, alpha: player.isBankrupt ? 0.35 : 1 });
    token.stroke({ color: 0x0f241d, width: 2, alpha: 0.84 });
    root.addChild(token);

    const tokenLabel = new Text({
      text: player.name.slice(0, 1),
      style: new TextStyle({
        fontFamily: "Inter, Noto Sans SC, sans-serif",
        fontSize: Math.max(10, tileSize * 0.13),
        fill: 0x10251f,
        fontWeight: "800",
      }),
    });
    tokenLabel.anchor.set(0.5);
    tokenLabel.x = tokenX;
    tokenLabel.y = tokenY + 0.5;
    root.addChild(tokenLabel);
  }

  playersByPosition.forEach((playersOnTile, tileIndex) => {
    const { row, col } = getTileGridPoint(tileIndex);
    const baseX = boardX + col * tileSize + tileSize / 2;
    const baseY = boardY + row * tileSize + tileSize / 2;
    const offsets = [
      { x: -13, y: -13 },
      { x: 13, y: -13 },
      { x: -13, y: 13 },
      { x: 13, y: 13 },
    ];

    playersOnTile.forEach((player, playerIndex) => {
      const paletteIndex = props.players.findIndex((candidate) => candidate.id === player.id);
      const tokenColor = playerTokenPalette[(paletteIndex >= 0 ? paletteIndex : playerIndex) % playerTokenPalette.length];
      const offset = offsets[playerIndex % offsets.length] ?? { x: 0, y: 0 };
      const tokenX = baseX + offset.x;
      const tokenY = baseY + offset.y;
      drawToken(player, tokenX, tokenY, tokenColor);
    });
  });

  if (animationCue && animationState?.movingPlayerId) {
    const movingPlayer = props.players.find((player) => player.id === animationState.movingPlayerId);
    const movingTokenPosition = resolveAnimatedTokenPosition(animationCue, animationState, boardX, boardY, tileSize);
    if (movingPlayer && movingTokenPosition) {
      const paletteIndex = props.players.findIndex((candidate) => candidate.id === movingPlayer.id);
      const tokenColor = playerTokenPalette[(paletteIndex >= 0 ? paletteIndex : 0) % playerTokenPalette.length];
      drawToken(movingPlayer, movingTokenPosition.x, movingTokenPosition.y, tokenColor);
    }
  }
}

function renderBoardStage(
  app: Application,
  props: BoardSceneProps,
  animationCue: SceneAnimationCue | null = null,
  animationState: SceneAnimationState | null = null,
) {
  const stage = app.stage;
  stage.removeChildren().forEach((child) => {
    child.destroy({ children: true });
  });

  const root = new Container();
  stage.addChild(root);

  const { width, height } = app.screen;
  const stageSize = Math.min(width, height);
  const boardX = (width - stageSize) / 2;
  const boardY = (height - stageSize) / 2;
  const tileSize = stageSize / 11;
  const cellInset = Math.max(4, tileSize * 0.08);
  const tileInnerSize = tileSize - cellInset * 2;

  drawSceneBackground(root, boardX, boardY, stageSize, tileSize);
  drawBoardTiles(root, props, boardX, boardY, tileSize, tileInnerSize, cellInset, animationState);
  drawCenterHud(root, props, boardX, boardY, tileSize, animationState);
  drawPlayerTokens(root, props, boardX, boardY, tileSize, animationCue, animationState);
}

function BoardSceneInner(props: BoardSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const animationCueRef = useRef<SceneAnimationCue | null>(null);
  const animationKeyRef = useRef<string | null>(null);
  const previousPropsRef = useRef<BoardSceneProps | null>(null);
  const latestPropsRef = useRef(props);

  latestPropsRef.current = props;

  useLayoutEffect(() => {
    const currentHost = hostRef.current;
    if (!currentHost || appRef.current) {
      return;
    }
    const stableHost: HTMLDivElement = currentHost;

    let cancelled = false;

    async function mountStage() {
      const app = new Application();
      const { width, height } = getHostSize(stableHost);
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: false,
        autoDensity: true,
        resolution: 1,
      });

      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      const canvas = app.canvas as HTMLCanvasElement;
      stableHost.appendChild(canvas);
      appRef.current = app;
      renderBoardStage(app, latestPropsRef.current, animationCueRef.current, resolveSceneAnimationState(animationCueRef.current));

      const handleTick = () => {
        const animationState = resolveSceneAnimationState(animationCueRef.current);
        if (!animationState) {
          if (animationCueRef.current) {
            animationCueRef.current = null;
            renderBoardStage(app, latestPropsRef.current, null, null);
          }
          return;
        }

        renderBoardStage(app, latestPropsRef.current, animationCueRef.current, animationState);
      };

      app.ticker.add(handleTick);
      tickerRef.current = handleTick;

      const observer = new ResizeObserver(() => {
        const currentHostRef = hostRef.current;
        const currentApp = appRef.current;
        if (!currentHostRef || !currentApp) {
          return;
        }
        const nextSize = getHostSize(currentHostRef);
        currentApp.renderer.resize(nextSize.width, nextSize.height);
        renderBoardStage(currentApp, latestPropsRef.current, animationCueRef.current, resolveSceneAnimationState(animationCueRef.current));
      });

      observer.observe(stableHost);
      resizeObserverRef.current = observer;
    }

    void mountStage();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (appRef.current && tickerRef.current) {
        appRef.current.ticker.remove(tickerRef.current);
      }
      tickerRef.current = null;
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      if (stableHost.firstChild) {
        stableHost.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current) {
      renderBoardStage(appRef.current, props, animationCueRef.current, resolveSceneAnimationState(animationCueRef.current));
    }
  }, [props.board, props.currentTurnPlayerId, props.highlightedTileId, props.players, props.resultFeedback, props.stageCue, props.transitionHint, props.consequenceHint, props.handoffHint, props.actorTakeoverHint, props.phaseFocusHint, props.phaseClosureHint]);

  useEffect(() => {
    const previousProps = previousPropsRef.current;
    if (previousProps) {
      const nextAnimationKey = props.transitionHint?.transitionKey ?? null;
      if (nextAnimationKey && nextAnimationKey !== animationKeyRef.current) {
        const nextCue = buildSceneAnimationCue(previousProps, props);
        if (nextCue) {
          animationKeyRef.current = nextAnimationKey;
          animationCueRef.current = nextCue;

          if (appRef.current) {
            renderBoardStage(appRef.current, props, animationCueRef.current, resolveSceneAnimationState(animationCueRef.current));
          }
        }
      }
    }

    previousPropsRef.current = props;
  }, [props.players, props.highlightedTileId, props.resultFeedback, props.transitionHint, props.actorTakeoverHint, props.phaseFocusHint, props.phaseClosureHint]);

  const currentPlayerName = props.players.find((player) => player.id === props.currentTurnPlayerId)?.name ?? "未知玩家";
  const highlightedTileLabel = props.highlightedTileId
    ? props.board.find((tile) => tile.id === props.highlightedTileId)?.label ?? props.highlightedTileId
    : "无";
  const occupiedPropertyCount = props.players.reduce((total, player) => total + player.properties.length, 0);
  const feedbackSummary = props.resultFeedback
    ? `，最近结果 ${props.resultFeedback.title}，${props.resultFeedback.detail}，${props.resultFeedback.nextLabel}`
    : "";
  const consequenceSummary = props.consequenceHint
    ? `，棋盘后果 ${props.consequenceHint.ariaSummary}`
    : "";
  const handoffSummary = props.handoffHint
    ? `，回合接管 ${props.handoffHint.ariaSummary}`
    : "";
  const takeoverSummary = props.actorTakeoverHint
    ? `，行动接管 ${props.actorTakeoverHint.ariaSummary}`
    : "";
  const phaseSummary = props.phaseFocusHint
    ? `，阶段焦点 ${props.phaseFocusHint.ariaSummary}`
    : "";
  const closureSummary = props.phaseClosureHint
    ? `，阶段收束 ${props.phaseClosureHint.ariaSummary}`
    : "";

  return (
    <div className="board__surface">
      <div
        aria-label={`当前回合 ${currentPlayerName}，焦点 ${highlightedTileLabel}，已占领地产 ${occupiedPropertyCount} 处${feedbackSummary}${consequenceSummary}${handoffSummary}${takeoverSummary}${phaseSummary}${closureSummary}`}
        className="board__pixi-host"
        ref={hostRef}
      />
    </div>
  );
}

export const BoardScene = memo(BoardSceneInner);
