import { useEffect, useRef } from "react";
import "./CloudShader.css";

function hexToRgb(hex) {
  const value = hex.replace("#", "");

  const number = parseInt(
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value,
    16
  );

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

export default function CloudShader({
  speed = 0.35,
  count = 6,
  cloudColor = "#ffffff",
  skyTopColor = "#1976d2",
  skyBottomColor = "#c9edff",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame;
    let width = 1;
    let height = 1;

    const top = hexToRgb(skyTopColor);
    const bottom = hexToRgb(skyBottomColor);
    const cloud = hexToRgb(cloudColor);

    const clouds = [];

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createClouds();
    }

    function createClouds() {
  clouds.length = 0;

  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * width,

      // Starting vertical position
      baseY:
        height * (0.15 + Math.random() * 0.65),

      // Will be updated during animation
      y: 0,

      width:
        180 + Math.random() * 220,

      height:
        70 + Math.random() * 45,

      // Different speed for every cloud
      
    speed: 18 + Math.random() * 18,

      // Gentle up/down movement
      floatSpeed:
        0.7 + Math.random() * 1.2,

      // Makes each cloud move differently
      phase:
        Math.random() * Math.PI * 2,

      opacity:
        0.45 + Math.random() * 0.25,
    });
  }
}

    function drawCloud(cloudData) {
      const {
        x,
        y,
        width: cloudWidth,
        height: cloudHeight,
        opacity,
      } = cloudData;

      ctx.save();

      /*
       * Blur the entire cloud.
       * This removes the obvious circle edges.
       */
      ctx.filter = "blur(12px)";

      ctx.globalAlpha = opacity;

      /*
       * Soft cloud gradient
       */
      const gradient = ctx.createLinearGradient(
        0,
        y - cloudHeight,
        0,
        y + cloudHeight
      );

      gradient.addColorStop(
        0,
        `rgba(${cloud.r}, ${cloud.g}, ${cloud.b}, 0.95)`
      );

      gradient.addColorStop(
        0.55,
        `rgba(${cloud.r}, ${cloud.g}, ${cloud.b}, 0.8)`
      );

      gradient.addColorStop(
        1,
        `rgba(${cloud.r}, ${cloud.g}, ${cloud.b}, 0)`
      );

      ctx.fillStyle = gradient;

      /*
       * One continuous cloud silhouette.
       *
       * The top is made from smooth curves,
       * not visible individual circles.
       */
      ctx.beginPath();

      ctx.moveTo(
        x - cloudWidth * 0.5,
        y + cloudHeight * 0.15
      );

      ctx.bezierCurveTo(
        x - cloudWidth * 0.5,
        y - cloudHeight * 0.05,
        x - cloudWidth * 0.38,
        y - cloudHeight * 0.1,
        x - cloudWidth * 0.3,
        y - cloudHeight * 0.05
      );

      ctx.bezierCurveTo(
        x - cloudWidth * 0.25,
        y - cloudHeight * 0.42,
        x - cloudWidth * 0.08,
        y - cloudHeight * 0.52,
        x + cloudWidth * 0.02,
        y - cloudHeight * 0.2
      );

      ctx.bezierCurveTo(
        x + cloudWidth * 0.12,
        y - cloudHeight * 0.55,
        x + cloudWidth * 0.34,
        y - cloudHeight * 0.42,
        x + cloudWidth * 0.35,
        y - cloudHeight * 0.05
      );

      ctx.bezierCurveTo(
        x + cloudWidth * 0.48,
        y - cloudHeight * 0.12,
        x + cloudWidth * 0.55,
        y + cloudHeight * 0.02,
        x + cloudWidth * 0.5,
        y + cloudHeight * 0.15
      );

      ctx.bezierCurveTo(
        x + cloudWidth * 0.48,
        y + cloudHeight * 0.35,
        x + cloudWidth * 0.3,
        y + cloudHeight * 0.4,
        x + cloudWidth * 0.05,
        y + cloudHeight * 0.35
      );

      ctx.bezierCurveTo(
        x - cloudWidth * 0.2,
        y + cloudHeight * 0.45,
        x - cloudWidth * 0.45,
        y + cloudHeight * 0.4,
        x - cloudWidth * 0.5,
        y + cloudHeight * 0.15
      );

      ctx.closePath();

      ctx.fill();

      ctx.restore();
    }

    function draw(time) {
      /*
       * SKY
       */
      const sky = ctx.createLinearGradient(
        0,
        0,
        0,
        height
      );

      sky.addColorStop(
        0,
        `rgb(${top.r}, ${top.g}, ${top.b})`
      );

      sky.addColorStop(
        0.55,
        `rgb(
          ${(top.r + bottom.r) / 2},
          ${(top.g + bottom.g) / 2},
          ${(top.b + bottom.b) / 2}
        )`
      );

      sky.addColorStop(
        1,
        `rgb(${bottom.r}, ${bottom.g}, ${bottom.b})`
      );

      ctx.fillStyle = sky;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

   

      /*
       * MOVING CLOUDS
       */
   clouds.forEach((item, index) => {
  // Horizontal movement
  item.x += item.speed / 60;

  // Gentle floating movement
  const floatingY =
    item.baseY +
    Math.sin(
      time * 0.00025 * item.floatSpeed +
        item.phase
    ) *
      8;

  item.y = floatingY;

  // Move cloud back to the left
  if (item.x - item.width / 2 > width) {
    item.x = -item.width / 2 - 50;
  }

  drawCloud(item);
});

      animationFrame =
        requestAnimationFrame(draw);
    }

    resize();

    animationFrame =
      requestAnimationFrame(draw);

    window.addEventListener(
      "resize",
      resize
    );

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, [
    speed,
    count,
    cloudColor,
    skyTopColor,
    skyBottomColor,
  ]);

  return (
    <div className="cloud-shader">
      <canvas
        ref={canvasRef}
        className="cloud-shader-canvas"
      />
    </div>
  );
}