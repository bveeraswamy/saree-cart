// In production (Netlify), set VITE_API_BASE to the deployed backend's URL
// (e.g. https://yourusername.pythonanywhere.com). Locally, falls back to
// whatever host the page itself was loaded from, so it keeps working over
// localhost, 127.0.0.1, or a LAN IP without any extra configuration.
export const API_BASE = import.meta.env.VITE_API_BASE || `http://${location.hostname}:8000`;
