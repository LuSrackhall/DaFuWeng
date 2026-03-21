import type { BoardTile, PlayerState } from "@dafuweng/contracts";

type BoardSceneProps = {
  board: BoardTile[];
  currentTurnPlayerId: string;
  highlightedTileId: string | null;
  players: PlayerState[];
};

const cornerIndices = new Set([0, 10, 20, 30]);

export function BoardScene(props: BoardSceneProps) {
  const playerByTile = new Map<number, PlayerState[]>();

  for (const player of props.players) {
    const playersOnTile = playerByTile.get(player.position) ?? [];
    playersOnTile.push(player);
    playerByTile.set(player.position, playersOnTile);
  }

  return (
    <div className="board__surface">
      {props.board.map((tile, index) => {
        const players = playerByTile.get(index) ?? [];
        const owner = props.players.find((player) => player.properties.includes(tile.id));
        const tileClassName = [
          "board__tile",
          cornerIndices.has(index) ? "board__tile--corner" : "",
          props.highlightedTileId === tile.id ? "board__tile--highlighted" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div className={tileClassName} key={tile.id}>
            <span className="board__tile-label">{tile.label}</span>
            <span className="board__tile-owner">
              {owner ? `归属 ${owner.name}` : tile.type}
            </span>
            <span className="board__tile-owner">
              {players.length > 0
                ? players.map((player) => player.id === props.currentTurnPlayerId ? `${player.name}*` : player.name).join(" / ")
                : "空"}
            </span>
          </div>
        );
      })}
      <div className="board__center">
        <div>
          <p className="shell__eyebrow">Board scene boundary</p>
          <h2>服务端权威，前端投影</h2>
          <p>
            这里是首版棋盘场景占位。后续会将 PixiJS 画布、棋子动画、事件时间线和镜头编排接入这个边界。
          </p>
        </div>
      </div>
    </div>
  );
}