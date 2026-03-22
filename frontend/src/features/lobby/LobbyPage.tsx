import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ProjectionSnapshot } from "@dafuweng/contracts";
import { createRoom, getRoom, joinRoom } from "../../network/roomApi";
import { setActivePlayer } from "../../state/projection/activePlayer";

export function LobbyPage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("房主");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("新玩家");
  const [room, setRoom] = useState<ProjectionSnapshot | null>(null);
  const [message, setMessage] = useState("创建房间或输入房间码加入一局真实多人房间。");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!joinRoomId.trim()) {
      return;
    }

    getRoom(joinRoomId.trim())
      .then((snapshot) => {
        setRoom(snapshot);
        setMessage(`已找到房间 ${snapshot.roomId}，可以加入。`);
      })
      .catch(() => {
        setRoom(null);
      });
  }, []);

  async function handleCreateRoom() {
    setIsSubmitting(true);
    try {
      const response = await createRoom({ hostName });
      setActivePlayer(
        response.snapshot.roomId,
        response.session.playerId,
        response.session.playerName,
        response.session.playerToken
      );
      setRoom(response.snapshot);
      setMessage(`已创建房间 ${response.snapshot.roomId}，正在进入等待房间。`);
      navigate(`/room/${response.snapshot.roomId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建房间失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinRoom() {
    setIsSubmitting(true);
    try {
      const response = await joinRoom(joinRoomId.trim(), { playerName: joinPlayerName });
      setActivePlayer(
        response.snapshot.roomId,
        response.session.playerId,
        response.session.playerName,
        response.session.playerToken
      );
      setRoom(response.snapshot);
      setMessage(`已加入房间 ${response.snapshot.roomId}，正在进入等待房间。`);
      navigate(`/room/${response.snapshot.roomId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加入房间失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="lobby">
      <section className="panel">
        <p className="panel__meta">Room lifecycle and onboarding baseline</p>
        <h2 className="panel__title">经典大富翁，多人房间先跑通</h2>
        <p className="panel__subtitle">
          这里是首版 web 主端入口，优先建立创建房间、加入房间、准备、开始和重连恢复的体验基线。
        </p>
        <p className="panel__subtitle">{message}</p>
        <div className="player-grid">
          <label className="player-card">
            <strong>房主昵称</strong>
            <input aria-label="房主昵称" value={hostName} onChange={(event) => setHostName(event.target.value)} />
          </label>
          <label className="player-card">
            <strong>加入房间</strong>
            <input aria-label="加入房间" value={joinRoomId} onChange={(event) => setJoinRoomId(event.target.value)} />
          </label>
          <label className="player-card">
            <strong>玩家昵称</strong>
            <input aria-label="玩家昵称" value={joinPlayerName} onChange={(event) => setJoinPlayerName(event.target.value)} />
          </label>
        </div>
        <div className="lobby__actions">
          <button className="button button--primary" type="button" onClick={handleCreateRoom} disabled={isSubmitting || !hostName.trim()}>
            {isSubmitting ? "处理中..." : "创建房间"}
          </button>
          <button className="button button--secondary" type="button" onClick={handleJoinRoom} disabled={isSubmitting || !joinRoomId.trim() || !joinPlayerName.trim()}>
            加入房间
          </button>
          {room ? (
            <Link className="button button--secondary" to={`/room/${room.roomId}`}>
              返回房间 {room.roomId}
            </Link>
          ) : null}
        </div>
      </section>
      <section className="panel">
        <p className="panel__meta">Room readiness snapshot</p>
        {room ? (
          <>
            <h3 className="panel__title">房间 {room.roomId}</h3>
            <p className="panel__subtitle">版本 {room.snapshotVersion} / 事件序列 {room.eventSequence}</p>
            <div className="player-grid">
              {room.players.map((player) => (
                <article className="player-card" key={player.id}>
                  <strong>{player.name}</strong>
                  <span>{player.id === room.hostId ? "房主" : "玩家"}</span>
                  <span>{player.ready ? "已准备" : "待准备"}</span>
                  <span>现金 {player.cash}</span>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="panel__subtitle">当前还没有活动房间。创建或加入后，这里会显示真实房间状态。</p>
        )}
      </section>
    </main>
  );
}
