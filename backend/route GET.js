router.get("/history", async (req, res) => {

  const analyses = await prisma.analyses.findMany({
    include: {
      plant: true
    },
    orderBy: {
      analysed_at: "desc"
    }
  });

  res.json(
    analyses.map(item => ({
      plante: item.plant.common_name,
      confiance: item.confidence,
      date: item.analysed_at
    }))
  );

});