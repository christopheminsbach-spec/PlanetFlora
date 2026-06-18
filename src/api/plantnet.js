const API_KEY = "2b10IghA3Wd3PtQX4Nphkeyu";

export async function identifyPlant(file) {
  const formData = new FormData();
  formData.append("images", file);

  const response = await fetch(
    "https://my-api.plantnet.org/v2/identify/all?api-key=" + API_KEY,
    {
      method: "POST",
      body: formData,
    }
  );

  return await response.json();
}