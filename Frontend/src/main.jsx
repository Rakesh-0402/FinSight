import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

import { ThemeProvider } from "./context/ThemeContext";

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Toaster,
} from "@/components/ui/sonner";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
      <ThemeProvider>
        <TooltipProvider>
          <App />

          <Toaster
            position="top-right"
            richColors
          />
        </TooltipProvider>
      </ThemeProvider>
  </StrictMode>
);