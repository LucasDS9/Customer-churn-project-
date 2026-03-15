// API base URL: use when frontend is opened from file or another port
window.API_BASE = window.location.hostname === "localhost"
  ? "http://127.0.0.1:8000"
  : "https://customer-churn-project-d7xs.onrender.com";
