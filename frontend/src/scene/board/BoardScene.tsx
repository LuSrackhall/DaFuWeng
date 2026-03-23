import { memo, useEffect, useLayoutEffect, useRef } from "react";
import type { BoardTile, PlayerState } from "@dafuweng/contracts";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileGridPoint } from "./boardLayout";

type BoardSceneProps = {
  board: BoardTile[];
  currentTurnPlayerId: string;
  highlightedTileId: string | null;
  players: PlayerState[];
  resultFeedback: {
    title: string;
    detail: string;
    nextLabel: string;
    diceLabel: string | null;
    chipLabel: string;
    chipValue: string;
    tone: "default" | "warning" | "danger" | "success";
  } | null;
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
  return fallbackColor;
}

function getHostSize(host: HTMLDivElement) {
  const rect = host.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width || host.clientWidth || 640)),
    height: Math.max(320, Math.floor(rect.height || host.clientHeight || 640)),
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

    if (tile.id === props.highlightedTileId) {
      const highlightFrame = new Graphics();
      highlightFrame.roundRect(x - 5, y - 5, tileInnerSize + 10, tileInnerSize + 10, Math.max(12, tileSize * 0.2));
      highlightFrame.stroke({ color: 0xf6e7af, width: 4, alpha: 0.85 });
      root.addChild(highlightFrame);

      const highlightWash = new Graphics();
      highlightWash.roundRect(x + 2, y + 2, tileInnerSize - 4, tileInnerSize - 4, Math.max(8, tileSize * 0.14));
      highlightWash.fill({ color: accentColor, alpha: 0.14 });
      root.addChild(highlightWash);
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

function drawCenterHud(
  root: Container,
  props: BoardSceneProps,
  boardX: number,
  boardY: number,
  tileSize: number,
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
  const feedbackAccent = getFeedbackAccent(resultFeedback?.tone ?? "default", currentPlayerColor);

  const centerX = boardX + tileSize * 2.05;
  const centerY = boardY + tileSize * 2.05;
  const centerWidth = tileSize * 6.9;
  const centerHeight = tileSize * 6.9;

  const panelShadow = new Graphics();
  panelShadow.roundRect(centerX + 4, centerY + 8, centerWidth, centerHeight, 32);
  panelShadow.fill({ color: 0x07120f, alpha: 0.26 });
  root.addChild(panelShadow);

  const centerPanel = new Graphics();
  centerPanel.roundRect(centerX, centerY, centerWidth, centerHeight, 32);
  centerPanel.fill({ color: 0x10261f, alpha: 0.96 });
  centerPanel.stroke({ color: feedbackAccent, width: 2, alpha: 0.58 });
  root.addChild(centerPanel);

  const currentGlow = new Graphics();
  currentGlow.roundRect(centerX + 18, centerY + 18, centerWidth - 36, 92, 24);
  currentGlow.fill({ color: feedbackAccent, alpha: 0.1 });
  root.addChild(currentGlow);

  if (resultFeedback) {
    const resultBanner = new Graphics();
    resultBanner.roundRect(centerX + 22, centerY + 22, centerWidth - 44, 124, 24);
    resultBanner.fill({ color: feedbackAccent, alpha: 0.12 });
    resultBanner.stroke({ color: feedbackAccent, width: 1.5, alpha: 0.38 });
    root.addChild(resultBanner);
  }

  const eyebrow = new Text({ text: resultFeedback ? "最近结果" : "当前回合", style: centerEyebrowStyle });
  eyebrow.anchor.set(0.5, 0);
  eyebrow.x = centerX + centerWidth / 2;
  eyebrow.y = centerY + 24;
  root.addChild(eyebrow);

  const title = new Text({
    text: resultFeedback ? resultFeedback.title : currentPlayer?.name ?? "等待同步",
    style: resultFeedback ? centerResultTitleStyle : centerTitleStyle,
  });
  title.anchor.set(0.5, 0);
  title.x = centerX + centerWidth / 2;
  title.y = centerY + 48;
  root.addChild(title);

  if (resultFeedback) {
    const resultMeta = new Text({ text: `当前行动 · ${currentPlayer?.name ?? "等待同步"}`, style: centerResultMetaStyle });
    resultMeta.anchor.set(0.5, 0);
    resultMeta.x = centerX + centerWidth / 2;
    resultMeta.y = centerY + 86;
    root.addChild(resultMeta);
  }

  const focusLabel = highlightedTile?.label ?? "当前没有焦点地块";
  const focusMeta = resultFeedback
    ? `${resultFeedback.detail}\n${resultFeedback.nextLabel}`
    : highlightedTile
      ? focusOwner
        ? `归属 ${focusOwner.name}`
        : highlightedTile.type === "property"
          ? `待决策 · ${highlightedTile.price ?? "-"}`
          : `事件地块 · ${highlightedTile.type}`
      : "等待权威状态推进到下一格";
  const body = new Text({
    text: resultFeedback ? focusMeta : `焦点地块：${focusLabel}\n${focusMeta}`,
    style: centerBodyStyle,
  });
  body.anchor.set(0.5, 0);
  body.x = centerX + centerWidth / 2;
  body.y = resultFeedback ? centerY + 118 : centerY + 108;
  root.addChild(body);

  drawCenterChip(root, centerX + 24, centerY + centerHeight - 114, 132, "当前行动", currentPlayer?.name ?? "等待同步", feedbackAccent);
  drawCenterChip(root, centerX + centerWidth / 2 - 66, centerY + centerHeight - 114, 132, resultFeedback?.chipLabel ?? "待售地产", resultFeedback?.chipValue ?? `${Math.max(0, availablePropertyCount)}`, resultFeedback ? feedbackAccent : 0xe6c37d);
  drawCenterChip(root, centerX + centerWidth - 156, centerY + centerHeight - 114, 132, "最近骰子", resultFeedback?.diceLabel ?? (props.players.length > 0 ? "未掷出" : "--"), 0xa6c7b7);
}

function drawPlayerTokens(
  root: Container,
  props: BoardSceneProps,
  boardX: number,
  boardY: number,
  tileSize: number,
) {
  const playersByPosition = new Map<number, PlayerState[]>();
  props.players.forEach((player) => {
    const onTile = playersByPosition.get(player.position) ?? [];
    onTile.push(player);
    playersByPosition.set(player.position, onTile);
  });

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
      const tokenRadius = Math.max(10, tileSize * 0.13);
      const tokenX = baseX + offset.x;
      const tokenY = baseY + offset.y;

      const shadow = new Graphics();
      shadow.circle(tokenX + 1.5, tokenY + 3, tokenRadius + 1);
      shadow.fill({ color: 0x07120f, alpha: 0.28 });
      root.addChild(shadow);

      if (player.id === props.currentTurnPlayerId) {
        const ring = new Graphics();
        ring.circle(tokenX, tokenY, tokenRadius + 7);
        ring.fill({ color: tokenColor, alpha: 0.14 });
        ring.stroke({ color: 0xf6e7af, width: 2.5, alpha: 0.95 });
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
    });
  });
}

function renderBoardStage(app: Application, props: BoardSceneProps) {
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
  drawBoardTiles(root, props, boardX, boardY, tileSize, tileInnerSize, cellInset);
  drawCenterHud(root, props, boardX, boardY, tileSize);
  drawPlayerTokens(root, props, boardX, boardY, tileSize);
}

function BoardSceneInner(props: BoardSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
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
      renderBoardStage(app, latestPropsRef.current);

      const observer = new ResizeObserver(() => {
        const currentHostRef = hostRef.current;
        const currentApp = appRef.current;
        if (!currentHostRef || !currentApp) {
          return;
        }
        const nextSize = getHostSize(currentHostRef);
        currentApp.renderer.resize(nextSize.width, nextSize.height);
        renderBoardStage(currentApp, latestPropsRef.current);
      });

      observer.observe(stableHost);
      resizeObserverRef.current = observer;
    }

    void mountStage();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      if (stableHost.firstChild) {
        stableHost.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current) {
      renderBoardStage(appRef.current, props);
    }
  }, [props.board, props.currentTurnPlayerId, props.highlightedTileId, props.players, props.resultFeedback]);

  const currentPlayerName = props.players.find((player) => player.id === props.currentTurnPlayerId)?.name ?? "未知玩家";
  const highlightedTileLabel = props.highlightedTileId
    ? props.board.find((tile) => tile.id === props.highlightedTileId)?.label ?? props.highlightedTileId
    : "无";
  const occupiedPropertyCount = props.players.reduce((total, player) => total + player.properties.length, 0);
  const feedbackSummary = props.resultFeedback
    ? `，最近结果 ${props.resultFeedback.title}，${props.resultFeedback.detail}，${props.resultFeedback.nextLabel}`
    : "";

  return (
    <div className="board__surface">
      <div
        aria-label={`当前回合 ${currentPlayerName}，焦点 ${highlightedTileLabel}，已占领地产 ${occupiedPropertyCount} 处${feedbackSummary}`}
        className="board__pixi-host"
        ref={hostRef}
      />
    </div>
  );
}

export const BoardScene = memo(BoardSceneInner);
