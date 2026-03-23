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
          <p className="shell__eyebrow">棋盘舞台</p>
          <h2>当前棋局的视觉焦点</h2>
          <p>
            当前位置、归属和当前行动会先在这里汇聚。后续会继续把 PixiJS 画布、棋子动画和镜头编排接进来。
          </p>
        </div>
      </div>
    </div>
  );
}
