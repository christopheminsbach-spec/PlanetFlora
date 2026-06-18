const API = "http://localhost:8000";

export async function register(email, password) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(`${API}/register`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function login(email, password) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(`${API}/login`, {
    method: "POST",
    body: form,
  });

  return res.json();
}