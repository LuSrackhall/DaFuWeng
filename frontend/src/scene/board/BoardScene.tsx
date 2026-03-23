import { memo, useEffect, useLayoutEffect, useRef } from "react";
import type { BoardTile, PlayerState } from "@dafuweng/contracts";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileGridPoint } from "./boardLayout";

type BoardSceneProps = {
  board: BoardTile[];
  currentTurnPlayerId: string;
  highlightedTileId: string | null;
  players: PlayerState[];
};

const tileTypeFill: Record<string, number> = {
  corner: 0x11251f,
  property: 0x16342c,
  railway: 0x24443d,
  utility: 0x31493a,
  chance: 0x5c3e17,
  community: 0x3d355f,
  tax: 0x5f2e2e,
  jail: 0x32452f,
};

const playerTokenPalette = [0xf6c85f, 0x7dcfb6, 0xf28c8c, 0x7aa6ff, 0xd4a5ff, 0xffd166];

const boardLabelStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 11,
  fill: 0xf7f2e8,
  fontWeight: "600",
  wordWrap: true,
  wordWrapWidth: 80,
  align: "left",
  lineHeight: 12,
});

const boardMetaStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 10,
  fill: 0xe5bf69,
  wordWrap: true,
  wordWrapWidth: 80,
  lineHeight: 11,
});

const centerEyebrowStyle = new TextStyle({
  fontFamily: "Inter, Noto Sans SC, sans-serif",
  fontSize: 12,
  fill: 0xb5853f,
  letterSpacing: 3,
  fontWeight: "700",
});

const centerTitleStyle = new TextStyle({
  fontFamily: "Noto Serif SC, Source Han Serif SC, serif",
  fontSize: 28,
  fill: 0x173229,
  fontWeight: "700",
});

const centerBodyStyle = new TextStyle({
  fontFamily: "Noto Sans SC, Inter, sans-serif",
  fontSize: 14,
  fill: 0x173229,
  align: "center",
  wordWrap: true,
  wordWrapWidth: 280,
  lineHeight: 18,
});

function getHostSize(host: HTMLDivElement) {
  const rect = host.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width || host.clientWidth || 640)),
    height: Math.max(320, Math.floor(rect.height || host.clientHeight || 640)),
  };
}

function renderBoardStage(
  app: Application,
  props: BoardSceneProps,
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

  const ownerByTileId = new Map<string, PlayerState>();
  props.players.forEach((player) => {
    player.properties.forEach((tileId) => ownerByTileId.set(tileId, player));
  });

  const surface = new Graphics();
  surface.roundRect(boardX, boardY, stageSize, stageSize, 28);
  surface.fill({ color: 0xdcc8a2, alpha: 1 });
  surface.stroke({ color: 0xe9d39a, width: 3, alpha: 0.6 });
  root.addChild(surface);

  props.board.forEach((tile) => {
    const { row, col } = getTileGridPoint(tile.index);
    const x = boardX + col * tileSize + cellInset;
    const y = boardY + row * tileSize + cellInset;
    const owner = ownerByTileId.get(tile.id);
    const ownerIndex = owner ? props.players.findIndex((player) => player.id === owner.id) : -1;
    const ownerColor = ownerIndex >= 0 ? playerTokenPalette[ownerIndex % playerTokenPalette.length] : null;
    const fillColor = tileTypeFill[tile.type] ?? 0x16342c;

    const tileBackground = new Graphics();
    tileBackground.roundRect(x, y, tileInnerSize, tileInnerSize, Math.max(10, tileSize * 0.16));
    tileBackground.fill({ color: fillColor, alpha: 0.96 });
    tileBackground.stroke({
      color: tile.id === props.highlightedTileId ? 0xf6e7af : 0x24443d,
      width: tile.id === props.highlightedTileId ? 3 : 1.5,
      alpha: tile.id === props.highlightedTileId ? 0.9 : 0.55,
    });
    root.addChild(tileBackground);

    if (ownerColor !== null) {
      const ownerBand = new Graphics();
      ownerBand.roundRect(x + 4, y + 4, tileInnerSize - 8, Math.max(8, tileSize * 0.12), 6);
      ownerBand.fill({ color: ownerColor, alpha: 0.95 });
      root.addChild(ownerBand);
    }

    if (tile.id === props.highlightedTileId) {
      const highlightFrame = new Graphics();
      highlightFrame.roundRect(x - 4, y - 4, tileInnerSize + 8, tileInnerSize + 8, Math.max(12, tileSize * 0.2));
      highlightFrame.stroke({ color: 0xf6e7af, width: 4, alpha: 0.85 });
      root.addChild(highlightFrame);

      const highlightWash = new Graphics();
      highlightWash.roundRect(x + 2, y + 2, tileInnerSize - 4, tileInnerSize - 4, Math.max(8, tileSize * 0.14));
      highlightWash.fill({ color: 0xf6e7af, alpha: 0.08 });
      root.addChild(highlightWash);
    }

    const label = new Text({
      text: tile.label,
      style: boardLabelStyle,
    });
    label.x = x + 8;
    label.y = y + (ownerColor !== null ? 16 : 8);
    label.style.wordWrapWidth = tileInnerSize - 16;
    root.addChild(label);

    const metaLabel = owner
      ? `归属 ${owner.name}`
      : tile.type === "property"
        ? tile.colorGroup ?? "待售"
        : tile.type;
    const meta = new Text({
      text: metaLabel,
      style: boardMetaStyle,
    });
    meta.x = x + 8;
    meta.y = y + tileInnerSize - 18;
    meta.style.wordWrapWidth = tileInnerSize - 16;
    root.addChild(meta);
  });

  const centerPanel = new Graphics();
  const centerX = boardX + tileSize * 2.2;
  const centerY = boardY + tileSize * 2.2;
  const centerWidth = tileSize * 6.6;
  const centerHeight = tileSize * 6.6;
  centerPanel.roundRect(centerX, centerY, centerWidth, centerHeight, 26);
  centerPanel.fill({ color: 0xf4e2bc, alpha: 0.92 });
  centerPanel.stroke({ color: 0xc69a4f, width: 2, alpha: 0.55 });
  root.addChild(centerPanel);

  const eyebrow = new Text({ text: "PIXI STAGE", style: centerEyebrowStyle });
  eyebrow.anchor.set(0.5, 0);
  eyebrow.x = centerX + centerWidth / 2;
  eyebrow.y = centerY + 38;
  root.addChild(eyebrow);

  const title = new Text({ text: "Da Fu Weng", style: centerTitleStyle });
  title.anchor.set(0.5, 0);
  title.x = centerX + centerWidth / 2;
  title.y = centerY + 64;
  root.addChild(title);

  const highlightText = props.highlightedTileId
    ? props.board.find((tile) => tile.id === props.highlightedTileId)?.label ?? props.highlightedTileId
    : "当前没有焦点地块";
  const currentPlayer = props.players.find((player) => player.id === props.currentTurnPlayerId)?.name ?? "未知玩家";
  const body = new Text({
    text: `当前回合：${currentPlayer}\n焦点地块：${highlightText}\n棋盘舞台现在会直接呈现位置、归属和当前焦点。`,
    style: centerBodyStyle,
  });
  body.anchor.set(0.5, 0);
  body.x = centerX + centerWidth / 2;
  body.y = centerY + 124;
  root.addChild(body);

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
      { x: -12, y: -12 },
      { x: 12, y: -12 },
      { x: -12, y: 12 },
      { x: 12, y: 12 },
    ];

    playersOnTile.forEach((player, playerIndex) => {
      const paletteIndex = props.players.findIndex((candidate) => candidate.id === player.id);
      const tokenColor = playerTokenPalette[(paletteIndex >= 0 ? paletteIndex : playerIndex) % playerTokenPalette.length];
      const offset = offsets[playerIndex % offsets.length] ?? { x: 0, y: 0 };
      const tokenRadius = Math.max(10, tileSize * 0.13);

      if (player.id === props.currentTurnPlayerId) {
        const ring = new Graphics();
        ring.circle(baseX + offset.x, baseY + offset.y, tokenRadius + 5);
        ring.fill({ color: 0xfdf0c1, alpha: 0.22 });
        ring.stroke({ color: 0xf6e7af, width: 2, alpha: 0.9 });
        root.addChild(ring);
      }

      const token = new Graphics();
      token.circle(baseX + offset.x, baseY + offset.y, tokenRadius);
      token.fill({ color: tokenColor, alpha: player.isBankrupt ? 0.35 : 1 });
      token.stroke({ color: 0x0f241d, width: 2, alpha: 0.8 });
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
      tokenLabel.x = baseX + offset.x;
      tokenLabel.y = baseY + offset.y + 0.5;
      root.addChild(tokenLabel);
    });
  });

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
        const currentHost = hostRef.current;
        const currentApp = appRef.current;
        if (!currentHost || !currentApp) {
          return;
        }
        const nextSize = getHostSize(currentHost);
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
  }, [props.board, props.currentTurnPlayerId, props.highlightedTileId, props.players]);

  return (
    <div className="board__surface">
      <div className="board__pixi-host" ref={hostRef} />
    </div>
  );
}

export const BoardScene = memo(BoardSceneInner);
