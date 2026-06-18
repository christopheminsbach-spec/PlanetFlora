import { motion } from "framer-motion";
import ProductCard from "../ui/ProductCard";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden text-white">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 glass px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="font-bold text-lg">
          🌿 Planet Flora
        </div>

        {/* Links */}
        <div className="hidden md:flex gap-6 text-sm text-white/70">
          <a href="#shop" className="hover:text-white">Boutique</a>
          <a href="#predict" className="hover:text-white">Prédiction plante</a>
          <a href="#countries" className="hover:text-white">Pays</a>
        </div>

        {/* Auth buttons */}
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20">
            Connexion
          </button>
          <button className="px-4 py-2 rounded-full bg-green-500 text-black font-semibold">
            Inscription
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex items-center justify-center text-center px-6 py-40 pt-56">
        
        <div className="absolute w-[600px] h-[600px] bg-green-500/20 blur-3xl rounded-full top-[-200px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Planet Flora
          </h1>

          <p className="text-white/70 mt-6 text-lg">
            Identifie les plantes, découvre leur origine et explore la nature 🌍
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-6 py-3 rounded-full bg-green-500 text-black font-semibold"
          >
            Démarrer l’analyse
          </motion.button>
        </motion.div>
      </section>

      {/* PLANT PREDICTION */}
      <section id="predict" className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Prédiction de plante</h2>

        <div className="glass p-6 rounded-2xl">
          <p className="text-white/60 mb-4">
            Upload une image pour analyser la plante avec Pl@ntNet
          </p>

          <button className="px-5 py-3 rounded-xl bg-green-500 text-black font-semibold">
            Upload image
          </button>
        </div>
      </section>

      {/* COUNTRIES */}
      <section id="countries" className="px-6 py-10 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Pays d’origine</h2>

        <select className="w-full p-3 rounded-xl bg-white/10">
          <option>France</option>
          <option>Espagne</option>
          <option>Maroc</option>
          <option>Brésil</option>
          <option>Japon</option>
        </select>
      </section>

      {/* PRODUCTS */}
      <section id="shop" className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Produits populaires</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <ProductCard title="Monstera Deluxe" price="29€" />
          <ProductCard title="Bonsaï Zen" price="49€" />
          <ProductCard title="Palm Premium" price="39€" />
        </div>
      </section>
    </div>
  );
}