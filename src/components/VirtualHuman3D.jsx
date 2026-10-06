import React, { useRef, useEffect } from "react";

/**
 * High-Fidelity 3D Virtual Human Companion Renderer
 * Full-body human character with skeletal kinematics, casual hoodie, jeans, sneakers,
 * water bottle prop, facial expressions, and natural movement cycles:
 * (Walk in, Stand & Idle, Wave greeting, Drink/Thumbs-up, Snooze nod, Walk away).
 */
export function VirtualHuman3D({
  animationState = "idle", // "walk_in" | "wave" | "idle" | "drink" | "snooze" | "walk_away"
  onAnimationComplete = () => {},
  characterConfig,
  width = 380,
  height = 500
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateTimeRef = useRef(0);
  const curAnimRef = useRef(animationState);
  const xPosRef = useRef(animationState === "walk_in" ? -140 : 0);
  const targetXRef = useRef(0);
  const facingDirRef = useRef(1); // 1 = facing front/right, -1 = walking away

  useEffect(() => {
    curAnimRef.current = animationState;
    stateTimeRef.current = 0;

    if (animationState === "walk_in") {
      xPosRef.current = -140;
      targetXRef.current = 0;
      facingDirRef.current = 1;
    } else if (animationState === "walk_away") {
      targetXRef.current = 180;
      facingDirRef.current = -1; // Turn around walking away
    } else {
      facingDirRef.current = 1;
      xPosRef.current = 0;
    }
  }, [animationState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    let lastTime = performance.now();
    let isRunning = true;

    // Reset lastTime when user returns to browser tab or focuses window
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    const handleFocus = () => {
      lastTime = performance.now();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    const renderLoop = (time) => {
      if (!isRunning) return;

      // When tab is hidden in browser or canvas is hidden in inactive tab panel
      const isTabHidden = typeof document !== "undefined" && document.hidden;
      const isCanvasHidden = canvas.offsetParent === null && canvas.offsetWidth === 0;

      if (isTabHidden || isCanvasHidden) {
        lastTime = time;
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      stateTimeRef.current += dt;
      const t = stateTimeRef.current;

      // Handle translation for walk_in and walk_away
      if (curAnimRef.current === "walk_in") {
        xPosRef.current += (targetXRef.current - xPosRef.current) * (dt * 3.2);
        if (Math.abs(targetXRef.current - xPosRef.current) < 2) {
          xPosRef.current = targetXRef.current;
          onAnimationComplete("walk_in_arrived");
        }
      } else if (curAnimRef.current === "walk_away") {
        xPosRef.current += dt * 110;
        if (xPosRef.current > targetXRef.current + 60) {
          onAnimationComplete("walk_away_finished");
        }
      }

      // Reset transform and clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply DPR scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Draw 3D Virtual Human
      try {
        draw3DVirtualHuman(
          ctx,
          width,
          height,
          t,
          curAnimRef.current,
          xPosRef.current,
          facingDirRef.current,
          characterConfig
        );
      } catch (err) {
        console.error("VirtualHuman3D draw error:", err);
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height, onAnimationComplete, characterConfig]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "block",
        background: "transparent",
        pointerEvents: "none"
      }}
    />
  );
}

// -------------------------------------------------------------
// Procedural 3D Skeletal Drawing Engine
// -------------------------------------------------------------

function draw3DVirtualHuman(ctx, w, h, t, state, posX, facingDir, cfg) {
  // Validate and sanitize configuration colors with strict fallbacks
  const safeCfg = {
    gender: cfg?.gender || "casual",
    hoodieColor:
      cfg?.hoodieColor && typeof cfg.hoodieColor === "string" && cfg.hoodieColor.startsWith("#")
        ? cfg.hoodieColor
        : cfg?.color && typeof cfg.color === "string" && cfg.color.startsWith("#")
        ? cfg.color
        : "#2563eb",
    jeansColor:
      cfg?.jeansColor && typeof cfg.jeansColor === "string" && cfg.jeansColor.startsWith("#")
        ? cfg.jeansColor
        : "#1e293b",
    skinTone:
      cfg?.skinTone && typeof cfg.skinTone === "string" && cfg.skinTone.startsWith("#")
        ? cfg.skinTone
        : "#f5d0b0",
    hairColor:
      cfg?.hairColor && typeof cfg.hairColor === "string" && cfg.hairColor.startsWith("#")
        ? cfg.hairColor
        : "#27272a"
  };

  const isWalking = state === "walk_in" || state === "walk_away";
  const isWalkingAway = state === "walk_away";

  // Ground plane position
  const groundY = h - 35;
  const centerX = w / 2 + posX;

  // Walk kinematics
  const walkSpeed = 6.2;
  const walkPhase = isWalking ? t * walkSpeed : 0;
  const bodyBob = isWalking ? Math.sin(walkPhase * 2) * 5 : Math.sin(t * 1.8) * 1.5;
  const hipSway = isWalking ? Math.sin(walkPhase) * 0.06 : Math.sin(t * 0.9) * 0.015;

  // Soft ambient contact ground shadow
  ctx.save();
  ctx.translate(centerX, groundY + 12);
  ctx.scale(1, 0.28);
  const shadowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 48);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  shadowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.22)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Root Pelvis Position
  const pelvisY = groundY - 180 + bodyBob;

  // Leg angles
  let leftHipAngle = isWalking ? Math.sin(walkPhase) * 0.45 : -0.04;
  let rightHipAngle = isWalking ? -Math.sin(walkPhase) * 0.45 : 0.04;
  let leftKneeAngle = isWalking ? Math.max(0, -Math.sin(walkPhase + 0.3) * 0.7) : 0.02;
  let rightKneeAngle = isWalking ? Math.max(0, Math.sin(walkPhase + 0.3) * 0.7) : 0.02;

  // Arm kinematics based on state
  let leftShoulderAngle = isWalking ? -Math.sin(walkPhase) * 0.4 : 0.15 + Math.sin(t * 1.4) * 0.04;
  let rightShoulderAngle = isWalking ? Math.sin(walkPhase) * 0.4 : -0.15;
  let leftElbowAngle = isWalking ? 0.3 : 0.2;
  let rightElbowAngle = isWalking ? 0.4 : 0.25;
  let waveHandOffset = 0;
  let thumbsUp = false;
  let holdingBottle = true;
  let bottleRaised = false;

  if (state === "wave") {
    // Waving right arm
    rightShoulderAngle = -2.1 + Math.sin(t * 1.5) * 0.08;
    rightElbowAngle = -1.2;
    waveHandOffset = Math.sin(t * 7.5) * 0.35;
  } else if (state === "drink") {
    // Raising water bottle to drink & thumbs up
    rightShoulderAngle = -1.85 + Math.sin(t * 2) * 0.06;
    rightElbowAngle = -1.7;
    bottleRaised = true;
    leftShoulderAngle = -0.7;
    leftElbowAngle = -1.1;
    thumbsUp = true;
  } else if (state === "snooze") {
    // Friendly nod, holding bottle down
    rightShoulderAngle = -0.25;
    rightElbowAngle = 0.5;
    leftShoulderAngle = 0.2;
    leftElbowAngle = 0.3;
  }

  // --- 1. Draw Legs & Sneakers (Back Layer) ---
  ctx.save();
  ctx.translate(centerX, pelvisY);
  ctx.rotate(hipSway);

  // Left Leg
  drawHumanLeg(ctx, -14, leftHipAngle, leftKneeAngle, safeCfg.jeansColor, isWalkingAway);

  // Right Leg
  drawHumanLeg(ctx, 14, rightHipAngle, rightKneeAngle, safeCfg.jeansColor, isWalkingAway);
  ctx.restore();

  // --- 2. Draw Torso & Hoodie ---
  const torsoY = pelvisY - 75;
  const chestBreathing = Math.sin(t * 1.8) * 1.2;

  ctx.save();
  ctx.translate(centerX, torsoY);
  drawModernHoodie(ctx, chestBreathing, safeCfg.hoodieColor, isWalkingAway);
  ctx.restore();

  // --- 3. Draw Left Arm ---
  ctx.save();
  ctx.translate(centerX - 28, torsoY - 26);
  drawHumanArm(ctx, leftShoulderAngle, leftElbowAngle, false, false, safeCfg.hoodieColor, safeCfg.skinTone, isWalkingAway, false);
  ctx.restore();

  // --- 4. Draw Right Arm (With Water Bottle / Thumbs up) ---
  ctx.save();
  ctx.translate(centerX + 28, torsoY - 26);
  drawHumanArm(
    ctx,
    rightShoulderAngle,
    rightElbowAngle + waveHandOffset,
    holdingBottle,
    thumbsUp,
    safeCfg.hoodieColor,
    safeCfg.skinTone,
    isWalkingAway,
    bottleRaised
  );
  ctx.restore();

  // --- 5. Draw Neck, Head & Face ---
  const headY = torsoY - 55;
  const headBob = bodyBob * 0.4 + (isWalking ? Math.sin(walkPhase * 2) * 1.5 : Math.sin(t * 1.5) * 1);
  const headTilt = state === "drink" ? -0.12 : state === "snooze" ? 0.08 : Math.sin(t * 0.9) * 0.03;

  ctx.save();
  ctx.translate(centerX, headY + headBob);
  ctx.rotate(headTilt);
  drawHumanHeadAndFace(ctx, t, state, safeCfg.skinTone, safeCfg.hairColor, isWalkingAway);
  ctx.restore();
}

// -------------------------------------------------------------
// Component Renderers: Legs, Torso, Arms, Head
// -------------------------------------------------------------

function safeRoundRect(ctx, x, y, width, height, radii) {
  if (typeof ctx.roundRect === "function") {
    try {
      ctx.roundRect(x, y, width, height, radii);
      return;
    } catch {
      // Fallback if array argument fails
    }
  }
  let r = 4;
  if (typeof radii === "number") r = radii;
  else if (Array.isArray(radii) && radii.length > 0) r = radii[0];
  r = Math.min(r, Math.abs(width) / 2, Math.abs(height) / 2);

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHumanLeg(ctx, hipX, hipAngle, kneeAngle, jeansColor, isBack) {
  ctx.save();
  ctx.translate(hipX, 0);
  ctx.rotate(hipAngle);

  // Thigh
  const thighGrad = ctx.createLinearGradient(-10, 0, 10, 0);
  thighGrad.addColorStop(0, adjustBrightness(jeansColor, -15));
  thighGrad.addColorStop(0.5, jeansColor);
  thighGrad.addColorStop(1, adjustBrightness(jeansColor, -25));

  ctx.fillStyle = thighGrad;
  ctx.beginPath();
  safeRoundRect(ctx, -9, 0, 18, 54, 5);
  ctx.fill();

  // Knee Joint & Shin
  ctx.translate(0, 52);
  ctx.rotate(kneeAngle);

  const shinGrad = ctx.createLinearGradient(-8, 0, 8, 0);
  shinGrad.addColorStop(0, jeansColor);
  shinGrad.addColorStop(1, adjustBrightness(jeansColor, -20));

  ctx.fillStyle = shinGrad;
  ctx.beginPath();
  safeRoundRect(ctx, -8, 0, 16, 56, 5);
  ctx.fill();

  // Denim cuff crease
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(-7, 46, 14, 2.5);

  // Modern Clean Sneaker
  ctx.translate(0, 56);
  drawSneaker(ctx, isBack);

  ctx.restore();
}

function drawSneaker(ctx, isBack) {
  // Shoe upper
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  if (isBack) {
    safeRoundRect(ctx, -8, -4, 16, 18, 5);
  } else {
    safeRoundRect(ctx, -8, -4, 23, 16, 6);
  }
  ctx.fill();

  // Sole cushioning (Cyan / Blue stripe)
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(isBack ? -8 : -8, 8, isBack ? 16 : 24, 3.5);

  // Bottom white rubber sole
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(isBack ? -9 : -9, 11.5, isBack ? 18 : 26, 4);

  // Sneaker laces detail
  if (!isBack) {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-4, 0, 8, 1.5);
    ctx.fillRect(-3, 3, 7, 1.5);
  }
}

function drawModernHoodie(ctx, breathing, hoodieColor, isBack) {
  // Main Torso shape
  const w = 48 + breathing;
  const h = 76;

  const hoodieGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  hoodieGrad.addColorStop(0, adjustBrightness(hoodieColor, 15));
  hoodieGrad.addColorStop(0.4, hoodieColor);
  hoodieGrad.addColorStop(1, adjustBrightness(hoodieColor, -30));

  ctx.fillStyle = hoodieGrad;
  ctx.beginPath();
  safeRoundRect(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();

  if (!isBack) {
    // Zipper line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 10);
    ctx.lineTo(0, h / 2 - 8);
    ctx.stroke();

    // Hoodie pocket pouch
    ctx.fillStyle = adjustBrightness(hoodieColor, -12);
    ctx.beginPath();
    safeRoundRect(ctx, -w / 2 + 6, h / 2 - 28, w - 12, 22, 6);
    ctx.fill();

    // Drawstrings
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-7, -h / 2 + 14);
    ctx.lineTo(-6, -h / 2 + 30);
    ctx.moveTo(7, -h / 2 + 14);
    ctx.lineTo(6, -h / 2 + 30);
    ctx.stroke();
  } else {
    // Back Hood Fabric Folds
    ctx.fillStyle = adjustBrightness(hoodieColor, -18);
    ctx.beginPath();
    safeRoundRect(ctx, -w / 2 + 8, -h / 2 + 6, w - 16, 32, 10);
    ctx.fill();
  }

  // Collar ring
  ctx.fillStyle = adjustBrightness(hoodieColor, 20);
  ctx.beginPath();
  ctx.ellipse(0, -h / 2 + 6, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHumanArm(
  ctx,
  shoulderAngle,
  elbowAngle,
  holdsBottle,
  thumbsUp,
  hoodieColor,
  skinTone,
  isBack,
  bottleRaised
) {
  ctx.save();
  ctx.rotate(shoulderAngle);

  // Upper Arm (Hoodie Sleeve)
  const armGrad = ctx.createLinearGradient(-7, 0, 7, 0);
  armGrad.addColorStop(0, hoodieColor);
  armGrad.addColorStop(1, adjustBrightness(hoodieColor, -25));

  ctx.fillStyle = armGrad;
  ctx.beginPath();
  safeRoundRect(ctx, -6.5, 0, 13, 44, 6);
  ctx.fill();

  // Forearm
  ctx.translate(0, 42);
  ctx.rotate(elbowAngle);

  const forearmGrad = ctx.createLinearGradient(-6, 0, 6, 0);
  forearmGrad.addColorStop(0, hoodieColor);
  forearmGrad.addColorStop(1, adjustBrightness(hoodieColor, -20));

  ctx.fillStyle = forearmGrad;
  ctx.beginPath();
  safeRoundRect(ctx, -6, 0, 12, 40, 5);
  ctx.fill();

  // Hand (Skin tone)
  ctx.translate(0, 39);
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.arc(0, 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Thumbs Up Gesture
  if (thumbsUp) {
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    safeRoundRect(ctx, -3, -7, 6, 12, 3);
    ctx.fill();
  }

  // Water Bottle Prop
  if (holdsBottle && !isBack) {
    drawTranslucentWaterBottle(ctx, bottleRaised);
  }

  ctx.restore();
}

function drawTranslucentWaterBottle(ctx, raised) {
  ctx.save();
  ctx.translate(raised ? 4 : 2, raised ? -10 : 8);

  // Translucent blue bottle body
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  safeRoundRect(ctx, -7, -22, 14, 34, 4);
  ctx.fill();
  ctx.stroke();

  // Water level inside (vibrant cyan fluid)
  ctx.fillStyle = "rgba(6, 182, 212, 0.75)";
  ctx.beginPath();
  safeRoundRect(ctx, -6, -8, 12, 19, 2);
  ctx.fill();

  // Bottle cap (Clean white sport cap)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  safeRoundRect(ctx, -4, -27, 8, 6, 2);
  ctx.fill();

  // Glass shine reflection
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fillRect(-5, -18, 2.5, 24);

  // Sparkling water droplet
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(8, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHumanHeadAndFace(ctx, t, state, skinTone, hairColor, isBack) {
  // Head oval
  const headW = 34;
  const headH = 42;

  // Neck
  ctx.fillStyle = adjustBrightness(skinTone, -12);
  ctx.beginPath();
  safeRoundRect(ctx, -7, 14, 14, 18, 2);
  ctx.fill();

  // Face skin
  const skinGrad = ctx.createLinearGradient(0, -headH / 2, 0, headH / 2);
  skinGrad.addColorStop(0, skinTone);
  skinGrad.addColorStop(1, adjustBrightness(skinTone, -15));

  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, headW / 2, headH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = adjustBrightness(skinTone, -6);
  ctx.beginPath();
  ctx.arc(-headW / 2 + 1, 1, 5, 0, Math.PI * 2);
  ctx.arc(headW / 2 - 1, 1, 5, 0, Math.PI * 2);
  ctx.fill();

  if (!isBack) {
    // Blinking logic (every 3.8s)
    const blinkCycle = t % 3.8;
    const isBlinking = blinkCycle > 3.65;

    // Eyes
    const eyeY = -1;
    const eyeSpacing = 8.5;

    if (state === "drink" || state === "wave") {
      // Happy arched smiling eyes (^_^)
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, 4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, 4, Math.PI, 0);
      ctx.stroke();
    } else if (isBlinking || state === "snooze") {
      // Closed/sleepy eyes
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - 4, eyeY);
      ctx.lineTo(-eyeSpacing + 4, eyeY);
      ctx.moveTo(eyeSpacing - 4, eyeY);
      ctx.lineTo(eyeSpacing + 4, eyeY);
      ctx.stroke();
    } else {
      // Expressive human eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-eyeSpacing, eyeY, 4.5, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeSpacing, eyeY, 4.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (looking slightly toward user)
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-eyeSpacing + 0.5, eyeY, 2.2, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + 0.5, eyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye catchlight reflection
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-eyeSpacing + 1.2, eyeY - 1, 0.9, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + 1.2, eyeY - 1, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows
      ctx.strokeStyle = hairColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - 4, eyeY - 6.5);
      ctx.lineTo(-eyeSpacing + 4, eyeY - 6);
      ctx.moveTo(eyeSpacing - 4, eyeY - 6);
      ctx.lineTo(eyeSpacing + 4, eyeY - 6.5);
      ctx.stroke();
    }

    // Mouth / Smile
    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (state === "drink") {
      // Big happy open smile
      ctx.arc(0, 7.5, 5, 0.15, Math.PI - 0.15);
    } else if (state === "snooze") {
      // Neutral calm mouth
      ctx.moveTo(-3, 8.5);
      ctx.lineTo(3, 8.5);
    } else {
      // Natural gentle friendly smile
      ctx.arc(0, 6.5, 4.2, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Rosy cheek blush
    ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
    ctx.beginPath();
    ctx.arc(-11, 4.5, 4.5, 0, Math.PI * 2);
    ctx.arc(11, 4.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Modern Styled Haircut (Volumetric 3D Hair)
  const hairGrad = ctx.createLinearGradient(0, -headH / 2 - 8, 0, 0);
  hairGrad.addColorStop(0, adjustBrightness(hairColor, 25));
  hairGrad.addColorStop(0.6, hairColor);
  hairGrad.addColorStop(1, adjustBrightness(hairColor, -15));

  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  if (isBack) {
    // Full back of hair
    ctx.ellipse(0, -6, headW / 2 + 2, headH / 2 + 1, 0, 0, Math.PI * 2);
  } else {
    // Front styled hair with bangs & textured volume
    ctx.ellipse(0, -10, headW / 2 + 2.5, 17, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(headW / 2 + 1, -4);
    ctx.quadraticCurveTo(8, -12, -4, -6);
    ctx.quadraticCurveTo(-14, -14, -headW / 2 - 1, -4);
  }
  ctx.fill();

  // Subtle hair shine highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.ellipse(4, -18, 9, 3, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function adjustBrightness(hex, percent) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#3b82f6";
  try {
    let raw = hex.replace("#", "");
    if (raw.length === 3) {
      raw = raw.split("").map((c) => c + c).join("");
    }
    const num = parseInt(raw, 16);
    if (isNaN(num)) return "#3b82f6";
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return "#3b82f6";
  }
}
