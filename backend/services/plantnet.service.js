const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function analyzePlant(imagePath) {
  const form = new FormData();
  form.append("images", fs.createReadStream(imagePath));

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`;

  const res = await axios.post(url, form, {
    headers: form.getHeaders()
  });

  const results = res.data?.results || [];

  return {
    top5: results.slice(0, 5).map(r => ({
      name: r.species?.scientificName,
      score: r.score
    }))
  };
}

module.exports = { analyzePlant };