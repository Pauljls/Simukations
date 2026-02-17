import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DoorGarageSimulation } from "./components/garage-door/door-garage-simulation.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DoorGarageSimulation />
  </StrictMode>,
);
