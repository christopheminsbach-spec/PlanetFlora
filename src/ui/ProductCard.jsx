import { motion } from "framer-motion";

export default function ProductCard({ title, price }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="glass rounded-2xl p-5"
    >
      <div className="h-40 rounded-xl bg-gradient-to-tr from-green-400/30 to-emerald-600/10 mb-4" />

      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-white/60 text-sm">Plante premium</p>

      <div className="flex justify-between items-center mt-4">
        <span className="font-bold text-green-400">{price}</span>

        <button className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm">
          Ajouter
        </button>
      </div>
    </motion.div>
  );
}