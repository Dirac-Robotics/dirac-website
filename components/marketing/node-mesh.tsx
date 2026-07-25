"use client";

import * as React from "react";

/**
 * Decorative interactive node network that fills the empty right side of the
 * content pages. Nodes drift slowly and link to nearby neighbours; when the
 * pointer is over the area, nodes within a radius are pulled toward it and
 * gather into a cluster. Pure 2D canvas (no WebGL) so it stays cheap next to
 * the hero's R3F canvas. The caller hides it on small screens; it renders a
 * single static frame under prefers-reduced-motion and pauses when offscreen.
 */

type Node = {
  x: number;
  y: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
};

export function NodeMesh({ className = "" }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context2d = canvasEl.getContext("2d");
    if (!context2d) return;
    // Non-null aliases so the render closures below keep the narrowed type.
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context2d;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const LINK_DIST = 128;
    const POINTER_RADIUS = 150;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    const pointer = { x: 0, y: 0, active: false };
    let raf = 0;
    let running = false;

    function seed() {
      const count = Math.min(
        64,
        Math.max(20, Math.round((width * height) / 15000)),
      );
      nodes = Array.from({ length: count }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          x,
          y,
          bx: x,
          by: y,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(150,152,162,${(1 - d / LINK_DIST) * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(200,197,188,0.8)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function update() {
      for (const n of nodes) {
        n.bx += n.vx;
        n.by += n.vy;
        if (n.bx < 0 || n.bx > width) n.vx *= -1;
        if (n.by < 0 || n.by > height) n.vy *= -1;
        n.bx = Math.max(0, Math.min(width, n.bx));
        n.by = Math.max(0, Math.min(height, n.by));

        let tx = n.bx;
        let ty = n.by;
        if (pointer.active) {
          const dx = pointer.x - n.bx;
          const dy = pointer.y - n.by;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_RADIUS) {
            const f = (1 - d / POINTER_RADIUS) * 0.65;
            tx = n.bx + dx * f;
            ty = n.by + dy * f;
          }
        }
        n.x += (tx - n.x) * 0.12;
        n.y += (ty - n.y) * 0.12;
      }
    }

    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduce) draw();
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer.active = x >= 0 && y >= 0 && x <= width && y <= height;
      pointer.x = x;
      pointer.y = y;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { rootMargin: "80px" },
    );
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
