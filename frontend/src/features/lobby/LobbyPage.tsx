import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ProjectionSnapshot } from "@dafuweng/contracts";
import { createRoom, getRoom, joinRoom, startRoom } from "../../network/roomApi";
import { sampleProjection } from "@dafuweng/board-config";
import { setActivePlayer } from "../../state/projection/activePlayer";

export function LobbyPage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("房主");
  const [joinRoomId, setJoinRoomId] = useState("demo-room");
  const [joinPlayerName, setJoinPlayerName] = useState("新玩家");
  const [room, setRoom] = useState<ProjectionSnapshot>(sampleProjection);
  const [message, setMessage] = useState("正在读取演示房间...");

  useEffect(() => {
    getRoom("demo-room")
      .then((snapshot) => {
        setRoom(snapshot);
        setMessage("已连接后端演示房间");
      })
      .catch(() => {
        setRoom(sampleProjection);
        setMessage("后端未就绪，当前显示本地演示房间");
      });
  }, []);

  async function handleCreateRoom() {
    try {
      const snapshot = await createRoom({ hostName });
      const host = snapshot.players.find((player) => player.id === snapshot.hostId);
      if (host) {
        setActivePlayer(snapshot.roomId, host.id, host.name);
      }
      setRoom(snapshot);
      setMessage(`已创建房间 ${snapshot.roomId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建房间失败");
    }
  }

  async function handleJoinRoom() {
    try {
      const snapshot = await joinRoom(joinRoomId, { playerName: joinPlayerName });
      const joinedPlayer = snapshot.players[snapshot.players.length - 1];
      if (joinedPlayer) {
        setActivePlayer(snapshot.roomId, joinedPlayer.id, joinedPlayer.name);
      }
      setRoom(snapshot);
      setMessage(`已加入房间 ${snapshot.roomId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加入房间失败");
    }
  }

  async function handleStartRoom() {
    if (!room.hostId) {
      setMessage("当前房间缺少 host 信息");
      return;
    }

    try {
      const snapshot = await startRoom(room.roomId, { hostId: room.hostId });
      const host = snapshot.players.find((player) => player.id === snapshot.hostId);
      if (host) {
        setActivePlayer(snapshot.roomId, host.id, host.name);
      }
      setRoom(snapshot);
      setMessage(`房间 ${snapshot.roomId} 已开始`);
      navigate(`/room/${snapshot.roomId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "开始房间失败");
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
          <button className="button button--primary" type="button" onClick={handleCreateRoom}>创建房间</button>
          <button className="button button--secondary" type="button" onClick={handleJoinRoom}>加入房间</button>
          <button className="button button--secondary" type="button" onClick={handleStartRoom}>开始当前房间</button>
          <Link className="button button--secondary" to={`/room/${room.roomId}`}>
            进入当前房间
          </Link>
        </div>
      </section>
      <section className="panel">
        <p className="panel__meta">Room readiness snapshot</p>
        <h3 className="panel__title">房间 {room.roomId}</h3>
        <p className="panel__subtitle">版本 {room.snapshotVersion} / 事件序列 {room.eventSequence}</p>
        <div className="player-grid">
          {room.players.map((player) => (
            <article className="player-card" key={player.id}>
              <strong>{player.name}</strong>
              <span>{player.ready ? "已准备" : "待准备"}</span>
              <span>现金 {player.cash}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
