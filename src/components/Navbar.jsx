import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="flex justify-between p-4 bg-black text-white">
      <h1>🌿 Planet Flora</h1>

      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/register">Inscription</Link>
        <Link to="/auth">Connexion</Link>
        <Link to="/predict">Plantes</Link>
      </div>
    </div>
  );
}