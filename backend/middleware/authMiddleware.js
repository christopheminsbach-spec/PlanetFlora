import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token manquant. Connecte-toi pour analyser une plante.",
      });
    }

    const token = authorization.substring(7);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET est absent du fichier .env");

      return res.status(500).json({
        message: "Configuration serveur incomplète : JWT_SECRET manquant.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Token invalide : identifiant utilisateur absent.",
      });
    }

    req.user = {
      id: userId,
      email: decoded.email || null,
    };

    next();
  } catch (error) {
    console.error("Erreur JWT :", error.message);

    return res.status(401).json({
      message: "Session invalide ou expirée. Connecte-toi à nouveau.",
    });
  }
}
