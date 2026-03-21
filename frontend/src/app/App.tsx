import { Outlet } from "react-router-dom";

export function App() {
  return (
    <div className="shell">
      <header className="shell__header">
        <div>
          <p className="shell__eyebrow">Web-first multiplayer Monopoly</p>
          <h1>Da Fu Weng</h1>
        </div>
        <p className="shell__status">Authoritative multiplayer foundation</p>
      </header>
      <Outlet />
    </div>
  );
}