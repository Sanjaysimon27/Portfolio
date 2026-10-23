/**
 * High-Performance Smooth Scroll Sequence Engine
 * Preloads 240 frames, renders on high-DPI canvas, and scrubs frames with smooth lerp physics.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });

  // Frame image cache: index 1 to 240
  const images = new Array(TOTAL_FRAMES + 1);
  let currentRenderedFrame = -1;
  let firstFrameLoaded = false;

  // Smoothing state (Linear interpolation)
  let targetProgress = 0;
  let currentProgress = 0;
  const LERP_FACTOR = 0.1; // Responsive and butter-smooth

  // Frame URL generator
  function getFramePath(index) {
    const padded = String(index).padStart(3, '0');
    return `images/ezgif-frame-${padded}.jpg`;
  }

  // Draw image centered and covering full viewport (object-fit: cover)
  function drawCover(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let dw, dh, ox, oy;

    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      ox = 0;
      oy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      ox = (cw - dw) / 2;
      oy = 0;
    }

    ctx.drawImage(img, ox, oy, dw, dh);
  }

  // Render a specific frame index with neighbor fallback
  function renderFrame(index) {
    let img = images[index];

    // Fallback to nearest loaded neighbor if frame is still decoding
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = images[index - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev;
          break;
        }
        const next = images[index + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          img = next;
          break;
        }
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      drawCover(img);
      currentRenderedFrame = index;
    }
  }

  // Resize canvas to match display size & devicePixelRatio
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(window.innerWidth * dpr);
    const targetHeight = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (currentRenderedFrame > 0) {
        renderFrame(currentRenderedFrame);
      }
    }
  }

  // Preload all 240 frames immediately
  function preloadImages() {
    // 1. First frame
    const firstImg = new Image();
    images[1] = firstImg;

    firstImg.onload = () => {
      firstFrameLoaded = true;
      resizeCanvas();
      renderFrame(1);
    };

    firstImg.src = getFramePath(1);

    if (firstImg.complete && firstImg.naturalWidth > 0) {
      firstFrameLoaded = true;
      resizeCanvas();
      renderFrame(1);
    }

    // 2. Preload remaining frames in parallel
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      images[i] = img;

      img.onload = () => {
        if ('decode' in img) {
          img.decode().catch(() => {});
        }
      };

      img.src = getFramePath(i);
    }
  }

  // Scroll position calculation
  function getScrollFraction() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (maxScroll <= 0) return 0;
    return Math.max(0, Math.min(1, scrollY / maxScroll));
  }

  // Smooth animation loop
  function loop() {
    targetProgress = getScrollFraction();

    // Lerp towards target scroll progress for buttery-smooth transition
    currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

    if (Math.abs(targetProgress - currentProgress) < 0.0001) {
      currentProgress = targetProgress;
    }

    const frameFloat = 1 + currentProgress * (TOTAL_FRAMES - 1);
    const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(frameFloat)));

    if (targetFrame !== currentRenderedFrame) {
      renderFrame(targetFrame);
    }

    requestAnimationFrame(loop);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (currentRenderedFrame > 0) {
      renderFrame(currentRenderedFrame);
    }
  });

  // Start initialization
  resizeCanvas();
  preloadImages();
  requestAnimationFrame(loop);
})();
