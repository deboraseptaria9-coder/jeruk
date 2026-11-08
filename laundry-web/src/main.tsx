import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { LaundryApp } from "./LaundryApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LaundryApp />
  </StrictMode>,
);
