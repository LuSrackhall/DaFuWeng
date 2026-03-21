import type { BoardTile, ProjectionSnapshot, PlayerState } from "@dafuweng/contracts";

const colorGroups: Record<number, string | undefined> = {
  1: "old-town",
  3: "old-town",
  6: "lakeside",
  8: "lakeside",
  9: "lakeside",
  11: "campus",
  13: "campus",
  14: "campus",
  16: "theater",
  18: "theater",
  19: "theater",
  21: "industry",
  23: "industry",
  24: "industry",
  26: "market",
  28: "market",
  29: "market",
  31: "future",
  32: "future",
  34: "future",
  37: "summit",
  39: "summit"
};

const outerRingLabels = [
  "起点",
  "南城路",
  "命运",
  "北城路",
  "税务局",
  "中央车站",
  "东湖路",
  "机会",
  "西街",
  "海湾路",
  "监狱",
  "学府街",
  "水电局",
  "商业街",
  "中央广场",
  "滨江车站",
  "剧院街",
  "命运",
  "花园路",
  "金融街",
  "免费停车",
  "工业路",
  "机会",
  "博物馆街",
  "山景路",
  "北港车站",
  "商业区",
  "中心银行",
  "星河路",
  "海景路",
  "去监狱",
  "乐园街",
  "科技园",
  "命运",
  "机场路",
  "东港车站",
  "税务抽查",
  "云顶路",
  "机会",
  "终章大道"
];

export const sampleBoard: BoardTile[] = outerRingLabels.map((label, index) => ({
  id: `tile-${index}`,
  index,
  label,
  type:
    index === 0 || index === 10 || index === 20 || index === 30
      ? "corner"
      : label.includes("机会")
        ? "chance"
        : label.includes("命运")
          ? "community"
          : label.includes("税")
            ? "tax"
            : label.includes("车站")
              ? "railway"
              : label.includes("局")
                ? "utility"
                : "property",
  colorGroup: colorGroups[index],
  buildCost: colorGroups[index] ? Math.floor((100 + index * 10) / 2) : undefined,
  rentByLevel: colorGroups[index] ? (() => {
    const baseRent = 10 + index * 2;
    return [baseRent, baseRent * 5, baseRent * 15, baseRent * 45, baseRent * 80, baseRent * 125];
  })() : undefined,
  price: index > 0 && index % 5 !== 0 ? 100 + index * 10 : undefined,
  rent: index > 0 && index % 5 !== 0 ? 10 + index * 2 : undefined
}));

export const samplePlayers: PlayerState[] = [
  { id: "p1", name: "房主", cash: 1500, position: 6, properties: ["tile-1", "tile-6"], propertyImprovements: { "tile-1": 1 }, heldCardIds: [] },
  { id: "p2", name: "玩家二", cash: 1360, position: 13, properties: ["tile-8"], propertyImprovements: {}, heldCardIds: [] },
  { id: "p3", name: "玩家三", cash: 1240, position: 18, properties: ["tile-16", "tile-19"], propertyImprovements: { "tile-16": 2 }, heldCardIds: [] },
  { id: "p4", name: "玩家四", cash: 980, position: 25, properties: [], propertyImprovements: {}, heldCardIds: [] }
];

export const sampleProjection: ProjectionSnapshot = {
  roomId: "demo-room",
  roomState: "in-game",
  hostId: "p1",
  snapshotVersion: 4,
  eventSequence: 4,
  turnState: "awaiting-roll",
  currentTurnPlayerId: "p1",
  pendingActionLabel: "等待当前玩家掷骰",
  pendingProperty: null,
  pendingAuction: null,
  pendingPayment: null,
  pendingTrade: null,
  chanceDeck: {
    drawPile: [
      "chance-jail-card",
      "chance-go-to-jail",
      "chance-advance-airport",
      "chance-bonus-50",
      "chance-move-back-three",
      "chance-nearest-railway",
      "chance-pay-bank-75",
    ],
    discardPile: [],
  },
  communityDeck: {
    drawPile: [
      "community-bonus-100",
      "community-jail-card",
      "community-go-start",
      "community-bonus-50",
      "community-repair-fee",
      "community-player-count-bonus",
      "community-pay-bank-75",
    ],
    discardPile: [],
  },
  lastRoll: [0, 0],
  players: samplePlayers,
  recentEvents: [
    {
      id: "evt-1",
      type: "room-created",
      sequence: 1,
      snapshotVersion: 1,
      summary: "房主创建了演示房间。",
    },
    {
      id: "evt-2",
      type: "player-joined",
      sequence: 2,
      snapshotVersion: 2,
      summary: "玩家二加入了演示房间。",
    },
    {
      id: "evt-3",
      type: "player-joined",
      sequence: 3,
      snapshotVersion: 3,
      summary: "玩家三加入了演示房间。",
    },
    {
      id: "evt-4",
      type: "room-started",
      sequence: 4,
      snapshotVersion: 4,
      summary: "房主开始了演示对局。",
    },
  ],
};
