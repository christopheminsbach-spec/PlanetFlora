import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);

    const res = await fetch("http://localhost:8000/register", {
      method: "POST",
      body: form,
    });

    console.log(await res.json());
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass p-6 rounded-2xl w-96">
        <h1 className="text-xl mb-4">Inscription 🌿</h1>

        <input
          className="w-full p-3 mb-3 rounded bg-white/10"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 mb-3 rounded bg-white/10"
          placeholder="Mot de passe"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-green-500 text-black py-3 rounded-xl"
        >
          Créer compte
        </button>
      </div>
    </div>
  );
}