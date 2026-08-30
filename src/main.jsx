import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { DataProvider } from "./context/DataContext";
import { useWebSocket } from "./hooks/useWebSocket";
import "./index.css";

function AppWithWebSocket() {
  useWebSocket("ws://localhost:8080/ws");
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DataProvider>
      <AppWithWebSocket />
    </DataProvider>
  </StrictMode>,
);
