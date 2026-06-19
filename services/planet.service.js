const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const identifyPlant = async (imagePath) => {

  const form = new FormData();

  form.append("images", fs.createReadStream(imagePath));

  const response = await axios.post(
    "https://my-api.plantnet.org/v2/identify/all?api-key=TON_API_KEY",
    form,
    {
      headers: form.getHeaders()
    }
  );

  return response.data;
};

module.exports = {
  identifyPlant
};