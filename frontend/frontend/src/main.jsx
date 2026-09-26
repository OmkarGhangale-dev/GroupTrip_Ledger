import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/fonts.css";
import "./styles/theme.css";
import App from "./App.jsx";
import { TripProvider } from "./context/TripContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TripProvider>
      <App />
    </TripProvider>
  </StrictMode>
);