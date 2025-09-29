import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // или ./App.css, если ты используешь App.css

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
