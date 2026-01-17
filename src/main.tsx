import React from "react";
import ReactDOM from "react-dom/client";

const root = document.getElementById("root");

if (!root) {
  document.body.innerHTML = "<h1>ROOT NOT FOUND</h1>";
} else {
  ReactDOM.createRoot(root).render(
    <div style={{ padding: 20, color: "black" }}>
      <h1>✅ Netlify Render Working</h1>
      <p>If you see this, React + Vite is OK</p>
    </div>
  );
}
