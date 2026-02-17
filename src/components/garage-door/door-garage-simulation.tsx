import { useEffect, useState, useRef } from "react";
import { Application, extend } from "@pixi/react";
import { Graphics } from "pixi.js";

extend({ Graphics });

export function DoorGarageSimulation() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [doorPosition, setDoorPosition] = useState(0);
  const [carPosition, setCarPosition] = useState(-200);
  const [isAnimating, setIsAnimating] = useState(false);
  const [doorState, setDoorState] = useState<"SHUT" | "OPEN" | "MOVING">(
    "SHUT",
  );
  const [carState, setCarState] = useState<"OUTSIDE" | "ENTERING" | "INSIDE">(
    "OUTSIDE",
  );

  useEffect(() => {
    if (!parentRef.current) return;
    const updateDimensions = () => {
      if (parentRef.current) {
        setDimensions({
          width: parentRef.current.offsetWidth,
          height: parentRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setDoorPosition((prev) => {
        const speed = 0.005;
        const target = doorState === "OPEN" ? 1 : 0;
        const newPos = prev + (target > prev ? speed : -speed);

        if (Math.abs(newPos - target) < speed) {
          setIsAnimating(false);
          if (target === 1) {
            setCarState("ENTERING");
          }
          return target;
        }
        return newPos;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isAnimating, doorState]);

  useEffect(() => {
    if (carState !== "ENTERING") return;

    const interval = setInterval(() => {
      setCarPosition((prev) => {
        const speed = 3;
        const target = dimensions.width / 2 - 50;
        const newPos = prev + speed;

        if (newPos >= target) {
          setCarState("INSIDE");
          return target;
        }
        return newPos;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [carState, dimensions.width]);

  const handleOpen = () => {
    if (doorState !== "OPEN" && carState === "OUTSIDE") {
      setDoorState("OPEN");
      setIsAnimating(true);
    }
  };

  const handleClose = () => {
    if (doorState !== "SHUT" && carState !== "ENTERING") {
      if (carState === "INSIDE") {
        setCarState("OUTSIDE");
        setCarPosition(-200);
      }
      setDoorState("SHUT");
      setIsAnimating(true);
    }
  };

  const handleStop = () => {
    setIsAnimating(false);
    if (carState === "ENTERING") {
      setCarState("OUTSIDE");
    }
  };

  const handleReset = () => {
    setDoorPosition(0);
    setCarPosition(-200);
    setDoorState("SHUT");
    setCarState("OUTSIDE");
    setIsAnimating(false);
  };

  const doorWidth = 360;
  const doorHeight = 280;
  const doorX = dimensions.width / 2;
  const doorY = dimensions.height / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        ref={parentRef}
        style={{
          width: "800px",
          height: "400px",
          border: "2px solid #333",
          position: "relative",
          background: "#E8DDB5",
          overflow: "hidden",
        }}
      >
        <Application
          width={dimensions.width}
          height={dimensions.height}
          backgroundAlpha={0}
        >
          {/* Fondo - Casa */}
          <pixiGraphics
            draw={(g) => {
              g.clear();
              // Pared superior beige
              g.beginFill(0xe8ddb5);
              g.drawRect(0, 0, dimensions.width, dimensions.height / 2 - 30);
              g.endFill();

              // Piso gris (carretera)
              g.beginFill(0x808080);
              g.drawRect(
                0,
                dimensions.height / 2 + 150,
                dimensions.width,
                dimensions.height,
              );
              g.endFill();

              // Líneas discontinuas de carretera
              g.lineStyle(3, 0xffffff, 1);
              const lineY = dimensions.height / 2 + 200;
              const dashLength = 20;
              const gapLength = 15;
              let currentX = 0;

              while (currentX < dimensions.width) {
                g.moveTo(currentX, lineY);
                g.lineTo(
                  Math.min(currentX + dashLength, dimensions.width),
                  lineY,
                );
                currentX += dashLength + gapLength;
              }

              // Marco de la puerta
              g.lineStyle(8, 0x654321);
              g.drawRect(
                doorX - doorWidth / 2 - 5,
                doorY - doorHeight / 2 - 5,
                doorWidth + 10,
                doorHeight + 10,
              );

              // Interior oscuro del garaje (se ve cuando se abre)
              g.lineStyle(0);
              g.beginFill(0x1a1a1a);
              g.drawRect(
                doorX - doorWidth / 2,
                doorY - doorHeight / 2,
                doorWidth,
                doorHeight,
              );
              g.endFill();
            }}
          />

          {/* Puerta del garaje PLEGABLE - se comprime hacia arriba */}
          <pixiGraphics
            draw={(g) => {
              g.clear();

              const numSections = 8; // 8 secciones horizontales
              const sectionHeight = doorHeight / numSections;
              const startX = doorX - doorWidth / 2;
              const startY = doorY - doorHeight / 2;

              // La altura total de la puerta se reduce según doorPosition
              const currentTotalHeight = doorHeight * (1 - doorPosition);
              const compressionRatio = currentTotalHeight / doorHeight;

              // Dibujar cada sección comprimida
              for (let i = 0; i < numSections; i++) {
                // Cada sección se comprime proporcionalmente
                const currentSectionHeight = sectionHeight * compressionRatio;

                // La posición Y se calcula desde arriba hacia abajo
                const sectionY = startY + i * currentSectionHeight;

                // Solo dibujar si la sección tiene altura
                if (currentSectionHeight > 0.5) {
                  // Color base de la sección
                  const baseColor = 0x008b8b;

                  // Alternar tonos ligeramente para dar efecto de secciones
                  const shade = i % 2 === 0 ? 1 : 0.95;
                  const r = ((baseColor >> 16) & 0xff) * shade;
                  const gColor = ((baseColor >> 8) & 0xff) * shade;
                  const b = (baseColor & 0xff) * shade;
                  const sectionColor = (r << 16) | (gColor << 8) | b;

                  // Dibujar la sección
                  g.beginFill(sectionColor);
                  g.drawRect(startX, sectionY, doorWidth, currentSectionHeight);
                  g.endFill();

                  // Línea divisoria entre secciones (más visible cuando está comprimida)
                  const lineThickness = compressionRatio < 0.5 ? 3 : 2;
                  g.lineStyle(lineThickness, 0x006666);
                  g.moveTo(startX, sectionY);
                  g.lineTo(startX + doorWidth, sectionY);

                  // Línea inferior de la sección
                  if (i === numSections - 1) {
                    g.moveTo(startX, sectionY + currentSectionHeight);
                    g.lineTo(
                      startX + doorWidth,
                      sectionY + currentSectionHeight,
                    );
                  }
                }
              }

              // Manija de la puerta (solo visible cuando está cerrada o poco abierta)
              if (doorPosition < 0.3) {
                const handleY = startY + (doorHeight - 30) * (1 - doorPosition);
                g.lineStyle(0);
                g.beginFill(0x333333);
                g.drawCircle(doorX, handleY, 10 * (1 - doorPosition * 2));
                g.endFill();
              }

              // Marco superior que "sostiene" la puerta plegada
              if (doorPosition > 0) {
                g.lineStyle(0);
                g.beginFill(0x654321);
                g.drawRect(startX - 5, startY - 15, doorWidth + 10, 10);
                g.endFill();
              }
            }}
          />

          {/* Carro (camión rojo) */}
          <pixiGraphics
            draw={(g) => {
              g.clear();

              // Cabina del camión
              g.beginFill(0xcc0000);
              g.drawRect(0, 0, 80, 60);
              g.endFill();

              // Parabrisas
              g.beginFill(0x87ceeb);
              g.drawRect(5, 5, 30, 25);
              g.endFill();

              // Contenedor/caja
              g.beginFill(0xb22222);
              g.drawRect(-100, 5, 95, 50);
              g.endFill();

              // Detalles contenedor
              g.lineStyle(2, 0x8b0000);
              g.moveTo(-100, 30);
              g.lineTo(-5, 30);

              // Ruedas
              g.lineStyle(3, 0x333333);
              g.beginFill(0x1a1a1a);
              g.drawCircle(65, 65, 15);
              g.drawCircle(-20, 65, 15);
              g.drawCircle(-50, 65, 15);
              g.endFill();

              // Llantas (parte interior)
              g.beginFill(0x666666);
              g.drawCircle(65, 65, 8);
              g.drawCircle(-20, 65, 8);
              g.drawCircle(-50, 65, 8);
              g.endFill();

              // Faros
              g.lineStyle(0);
              g.beginFill(0xffff00);
              g.drawCircle(78, 20, 5);
              g.drawCircle(78, 40, 5);
              g.endFill();

              // Parachoques
              g.lineStyle(0);
              g.beginFill(0xc0c0c0);
              g.drawRect(75, 15, 5, 35);
              g.endFill();
            }}
            x={carPosition}
            y={dimensions.height / 2 + 90}
          />

          {/* Sensores límite */}
          <pixiGraphics
            draw={(g) => {
              g.clear();
              // Sensor superior (LS1)
              g.beginFill(doorPosition > 0.9 ? 0x00ff00 : 0xff0000);
              g.drawRect(0, 0, 15, 25);
              g.endFill();

              // Sensor inferior (LS2)
              g.beginFill(doorPosition < 0.1 ? 0x00ff00 : 0xff0000);
              g.drawRect(0, doorHeight + 10, 15, 25);
              g.endFill();
            }}
            x={doorX - doorWidth / 2 - 25}
            y={doorY - doorHeight / 2}
          />

          {/* Etiquetas de sensores */}
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.lineStyle(1, 0x000000);
              g.beginFill(0xffffff, 0.8);
              g.drawRect(-45, -5, 35, 20);
              g.endFill();

              g.beginFill(0xffffff, 0.8);
              g.drawRect(-45, doorHeight + 15, 35, 20);
              g.endFill();
            }}
            x={doorX - doorWidth / 2 - 25}
            y={doorY - doorHeight / 2}
          />
        </Application>

        {/* Texto de sensores */}
        <div
          style={{
            position: "absolute",
            left: `${doorX - doorWidth / 2 - 60}px`,
            top: `${doorY - doorHeight / 2 - 5}px`,
            fontFamily: "monospace",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          LS1
        </div>
        <div
          style={{
            position: "absolute",
            left: `${doorX - doorWidth / 2 - 60}px`,
            top: `${doorY + doorHeight / 2 + 15}px`,
            fontFamily: "monospace",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          LS2
        </div>

        {/* Indicador de estado */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "13px",
          }}
        >
          <div>
            <strong>🚪 Puerta:</strong> {doorState}
          </div>
          <div>
            <strong>📍 Posición:</strong> {Math.round(doorPosition * 100)}%
          </div>
          <div>
            <strong>📏 Altura:</strong> {Math.round((1 - doorPosition) * 100)}%
          </div>
          <div>
            <strong>🚗 Carro:</strong> {carState}
          </div>
          <div
            style={{
              marginTop: "10px",
              fontSize: "11px",
              borderTop: "1px solid #666",
              paddingTop: "8px",
            }}
          >
            <div>LS1 (Arriba): {doorPosition > 0.9 ? "🟢 ON" : "🔴 OFF"}</div>
            <div>LS2 (Abajo): {doorPosition < 0.1 ? "🟢 ON" : "🔴 OFF"}</div>
          </div>
        </div>
      </div>

      {/* Panel de control */}
      <div
        style={{
          border: "3px solid #333",
          padding: "20px",
          background: "linear-gradient(145deg, #f5f5f5, #e0e0e0)",
          borderRadius: "10px",
          width: "fit-content",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ margin: "0 0 15px 0", fontFamily: "Arial", color: "#333" }}
        >
          🎮 Control Panel
        </h3>
        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
          <button
            onClick={handleOpen}
            disabled={
              isAnimating || doorState === "OPEN" || carState !== "OUTSIDE"
            }
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                isAnimating || doorState === "OPEN" || carState !== "OUTSIDE"
                  ? "not-allowed"
                  : "pointer",
              background: doorState === "OPEN" ? "#90EE90" : "#4CAF50",
              color: "white",
              border: "3px solid #2E7D32",
              borderRadius: "8px",
              opacity:
                isAnimating || doorState === "OPEN" || carState !== "OUTSIDE"
                  ? 0.5
                  : 1,
              transition: "all 0.3s",
            }}
          >
            ⚪ OPEN (I:100)
          </button>
          <button
            onClick={handleClose}
            disabled={
              isAnimating || doorState === "SHUT" || carState === "ENTERING"
            }
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                isAnimating || doorState === "SHUT" || carState === "ENTERING"
                  ? "not-allowed"
                  : "pointer",
              background: doorState === "SHUT" ? "#FFB6C1" : "#2196F3",
              color: "white",
              border: "3px solid #0D47A1",
              borderRadius: "8px",
              opacity:
                isAnimating || doorState === "SHUT" || carState === "ENTERING"
                  ? 0.5
                  : 1,
              transition: "all 0.3s",
            }}
          >
            ⚪ CLOSE (I:101)
          </button>
          <button
            onClick={handleStop}
            disabled={!isAnimating && carState !== "ENTERING"}
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                !isAnimating && carState !== "ENTERING"
                  ? "not-allowed"
                  : "pointer",
              background: "#f44336",
              color: "white",
              border: "3px solid #C62828",
              borderRadius: "8px",
              opacity: !isAnimating && carState !== "ENTERING" ? 0.5 : 1,
              transition: "all 0.3s",
            }}
          >
            🔴 STOP (I:102)
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              background: "#FF9800",
              color: "white",
              border: "3px solid #E65100",
              borderRadius: "8px",
              transition: "all 0.3s",
              marginTop: "10px",
            }}
          >
            🔄 RESET
          </button>
        </div>
      </div>
    </div>
  );
}
