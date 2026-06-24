import { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      width: open ? 240 : 70,
      height: "100vh",
      background: "#111827",
      transition: "0.3s",
      padding: 10
    }}>
      <button onClick={() => setOpen(!open)}>
        ☰
      </button>

      <nav style={{ marginTop: 20 }}>
        <Link to="/">🌿 Dashboard</Link><br />
        <Link to="/upload">📸 Upload</Link><br />
        <Link to="/history">🕒 History</Link><br />
        <Link to="/login">🔐 Login</Link>
      </nav>
    </div>
  );
}