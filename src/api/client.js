const API_BASE = "http://localhost:8080/api";

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = await response.json();
      message = error.message || error.error || message;
    } catch {
      const text = await response.text();
      message = text || message;
    }

    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}
