import React, { useEffect, useRef } from "react";

class Particle {
  constructor(container, coordinates, friction, ballColor) {
    this.container = container;
    this.coordinates = coordinates;
    this.friction = friction;
    this.ballColor = ballColor;

    this.position = this.coordinates.y;
    this.steps = window.innerHeight / 2;
    this.rotationValue = 0;
    this.rotationDirection = Math.random() > 0.5 ? "+" : "-";
    this.scale = 0.4 + Math.random() * 2;
    this.siner = (window.innerWidth / 2.5) * Math.random();

    this.dimensions = {
      width: 30,
      height: 30,
    };

    this.element = this.render();
  }

  render() {
    const svgNS = "http://www.w3.org/2000/svg";

    const svgEl = document.createElementNS(svgNS, "svg");
    svgEl.setAttribute("viewBox", "0 0 67.4 67.4");

    const circleEl = document.createElementNS(svgNS, "circle");
    circleEl.setAttribute("cx", "33.7");
    circleEl.setAttribute("cy", "33.7");
    circleEl.setAttribute("r", "33.7");
    circleEl.setAttribute("fill", this.ballColor);

    svgEl.appendChild(circleEl);

    svgEl.style.position = "absolute";
    svgEl.style.width = `${this.dimensions.width}px`;
    svgEl.style.height = `${this.dimensions.height}px`;
    svgEl.style.transform = `translateX(${this.coordinates.x}px) translateY(${this.coordinates.y}px)`;

    this.container.appendChild(svgEl);

    return svgEl;
  }

  move() {
    this.position -= this.friction;

    const top = this.position;

    const left =
      this.coordinates.x +
      Math.sin((this.position * Math.PI) / this.steps) *
        this.siner;

    this.rotationValue += this.friction;

    const rotation =
      this.rotationDirection === "+"
        ? this.rotationValue
        : -this.rotationValue;

    this.element.style.transform = `translateX(${left}px) translateY(${top}px) scale(${this.scale}) rotate(${rotation}deg)`;

    if (this.position < -this.dimensions.height) {
      this.destroy();
      return false;
    }

    return true;
  }

  destroy() {
    this.element.remove();
  }
}

export const MorphicBackground = ({
  ballColor = "#f39c12",
  className = "",
}) => {
  const particleContainerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameId = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const container = particleContainerRef.current;

    if (!container) return;

    const handleFocus = () => {
      isPausedRef.current = false;
    };

    const handleBlur = () => {
      isPausedRef.current = true;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    const particleInterval = setInterval(() => {
      if (!isPausedRef.current && container) {
        const newParticle = new Particle(
          container,
          {
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
          },
          1 + Math.random(),
          ballColor
        );

        particlesRef.current.push(newParticle);
      }
    }, 180);

    const update = () => {
      particlesRef.current =
        particlesRef.current.filter((particle) =>
          particle.move()
        );

      animationFrameId.current =
        requestAnimationFrame(update);
    };

    update();

    return () => {
      clearInterval(particleInterval);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);

      container.innerHTML = "";
      particlesRef.current = [];
    };
  }, [ballColor]);

  return (
    <>
      <div
        id="particles"
        ref={particleContainerRef}
        className={`morphic-background ${className}`}
      />

      <svg
        width="0"
        height="0"
        style={{
          position: "absolute",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation="12"
            />

            <feColorMatrix
              in="blur"
              result="colormatrix"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 21 -9
              "
            />

            <feBlend
              in="SourceGraphic"
              in2="colormatrix"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
};