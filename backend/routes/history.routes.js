const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:userId", async (req, res) => {
  const data = await prisma.prediction.findMany({
    where: { userId: Number(req.params.userId) },
    orderBy: { id: "desc" }
  });

  res.json(data);
});

module.exports = router;