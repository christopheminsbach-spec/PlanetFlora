const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

const upload =
multer({
  dest: "uploads/"
});

router.post(
  "/",
  auth,
  upload.single("image"),
  async (req, res) => {

    try {

      const form =
      new FormData();

      form.append(
        "images",
        fs.createReadStream(req.file.path)
      );

      form.append(
        "organs",
        "leaf"
      );

      const response =
      await axios.post(
        `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`,
        form,
        {
          headers:
          form.getHeaders()
        }
      );

      const result =
      response.data.results[0];

      const plante =
      result.species.scientificNameWithoutAuthor;

      const famille =
      result.species.family
      ?.scientificName;

      const confiance =
      result.score;

      const image =
      result.images?.[0]?.url?.o;

      await db.query(
        `
        INSERT INTO diagnostics
        (
          user_id,
          plante,
          famille,
          confiance,
          image_url
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          req.user.id,
          plante,
          famille,
          confiance,
          image
        ]
      );

      res.json({
        plante,
        famille,
        confiance,
        image
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        error: "Erreur analyse"
      });

    }

  }
);

module.exports = router;