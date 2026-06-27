import { useState } from "react";
import { Link } from "react-router-dom";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="fixed top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 py-3">

        {/* LOGO */}
        <div className="text-emerald-400 font-bold text-lg">
          🌿 Planet Flora
        </div>

        {/* HAMBURGER BUTTON */}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col gap-1 w-8 h-8 justify-center items-center md:hidden"
        >
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
        </button>

      </div>

      {/* OVERLAY MENU */}
      <div
        className={`
          fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >

        {/* CLOSE BUTTON */}
        <button
          onClick={closeMenu}
          className="absolute top-5 right-5 text-white text-3xl"
        >
          ✕
        </button>

        {/* MENU CONTENT */}
        <div className="flex flex-col items-center justify-center h-full gap-8 text-white text-2xl">

          <Link onClick={closeMenu} to="/home" className="hover:text-emerald-400 transition">
            Home
          </Link>

          <Link onClick={closeMenu} to="/predict" className="hover:text-emerald-400 transition">
            Analyse Plante
          </Link>

          <Link onClick={closeMenu} to="/dashboard" className="hover:text-emerald-400 transition">
            Dashboard
          </Link>

          <Link onClick={closeMenu} to="/settings" className="hover:text-emerald-400 transition">
            Settings
          </Link>

          {/* LOGOUT */}
          <button
            onClick={logout}
            className="mt-8 px-6 py-3 bg-red-500 rounded-xl text-white font-bold hover:bg-red-400 transition"
          >
            Logout
          </button>

        </div>
      </div>
    </>
  );
}