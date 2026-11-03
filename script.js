(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animate = !reduce && window.gsap && window.ScrollTrigger;
  if (animate) {
    document.documentElement.classList.add("anim");
    gsap.registerPlugin(ScrollTrigger);
    // Don't re-measure every time a phone's address bar slides in or out; that causes jumps.
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function fitCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function whenVisible(el, onChange) {
    if (!("IntersectionObserver" in window)) { onChange(true); return; }
    new IntersectionObserver(function (e) { onChange(e[0].isIntersecting); }, { rootMargin: "100px" }).observe(el);
  }

  /* ---------- music ---------- */
  var audio = document.getElementById("bgm");
  var musicBtn = document.getElementById("music");
  var musicLabel = document.getElementById("music-label");
  var noAudio = false, playing = false;
  var src = audio.querySelector("source");
  if (src) src.addEventListener("error", function () { noAudio = true; musicBtn.hidden = true; });
  function setMusicUI(on) { playing = on; musicBtn.setAttribute("aria-pressed", on ? "true" : "false"); musicLabel.textContent = on ? "Music On" : "Music Off"; }
  // Phones (iPhone especially) ignore volume changes from a web page, so fades only run
  // where the browser accepts them, and stopping always pauses straight away.
  var canFade = (function () { try { var v = audio.volume; audio.volume = 0.5; var ok = audio.volume === 0.5; audio.volume = v; return ok; } catch (e) { return false; } })();
  var fadeId = 0;
  function fadeTo(target, done) {
    var id = ++fadeId;
    if (!canFade) { if (done) done(); return; }
    var step = function () {
      if (id !== fadeId) return;
      var v = audio.volume + (target > audio.volume ? 0.04 : -0.08);
      v = Math.max(0, Math.min(1, v)); audio.volume = v;
      if (Math.abs(v - target) > 0.05) requestAnimationFrame(step); else { audio.volume = target; if (done) done(); }
    };
    step();
  }
  function playMusic() {
    if (noAudio || playing) return;
    setMusicUI(true);
    if (canFade) audio.volume = 0;
    var p = audio.play();
    if (p && p.then) p.then(function () { fadeTo(0.7); }).catch(function () { setMusicUI(false); });
    else fadeTo(0.7);
  }
  function stopMusic() {
    // Stop instantly on every device; no fade, nothing to wait for.
    fadeId++;
    setMusicUI(false);
    audio.pause();
  }

  // If the phone pauses it (call, lock screen, other app), keep the button honest.
  audio.addEventListener("pause", function () { if (playing) setMusicUI(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && playing) { fadeId++; audio.pause(); setMusicUI(false); } });
  musicBtn.addEventListener("click", function () { playing ? stopMusic() : playMusic(); });

  /* ---------- envelope ---------- */
  var openBtn = document.getElementById("open"), replayBtn = document.getElementById("replay");
  var tl = null;
  if (animate) {
    tl = gsap.timeline({ paused: true })
      .to("#tape .tape-tag", { y: -5, duration: 0.2, ease: "power1.out" })
      .to("#tape .tape-tag", { y: 46, rotation: 14, opacity: 0, duration: 0.5, ease: "power2.in" })
      .to("#tape .tape-l", { xPercent: -70, opacity: 0, duration: 0.6, ease: "power2.in" }, "<0.1")
      .to("#tape .tape-r", { xPercent: 70, opacity: 0, duration: 0.6, ease: "power2.in" }, "<")
      .set("#tape", { display: "none" })
      .to("#flap", { rotateX: 180, duration: 0.8, ease: "power2.inOut" }, "-=0.1")
      .set("#flap", { zIndex: 1 })
      .to("#cover", { yPercent: -58, duration: 1, ease: "power2.out" })
      .set("#cover", { zIndex: 6 })
      .to([".env-back", ".env-front", "#flap"], { y: 70, opacity: 0, duration: 0.8, ease: "power2.in" })
      .to("#cover", { yPercent: 0, scale: 1.14, duration: 1, ease: "power3.out" }, "-=0.55")
      .to(".stage > .eyebrow, .stage > .orn", { opacity: 0, duration: 0.3 }, 0.35)
      .to(".stage > .eyebrow, .stage > .orn", { opacity: 1, duration: 0.6 }, "-=0.2");
  }
  var opened = false;
  function openInvite() {
    playMusic();
    if (opened) { document.getElementById("invite").scrollIntoView(); return; }
    opened = true;
    openBtn.innerHTML = '<span aria-hidden="true">✧</span> Read Invitation';
    replayBtn.hidden = false;
    if (tl) tl.play(0); else document.body.classList.add("opened");
  }
  openBtn.addEventListener("click", openInvite);
  replayBtn.addEventListener("click", function () {
    if (!tl) return;
    tl.pause(0);
    setTimeout(function () { tl.play(0); }, 450);
  });

  /* ---------- full card viewer ---------- */
  var viewer = document.getElementById("viewer"), zoomBtn = document.getElementById("zoom"), lastFocus = null;
  function openViewer() {
    lastFocus = document.activeElement; viewer.hidden = false; document.body.style.overflow = "hidden";
    viewer.classList.remove("zoomed"); zoomBtn.textContent = "＋ Zoom In"; document.getElementById("close").focus();
  }
  function closeViewer() { viewer.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.getElementById("view-card").addEventListener("click", openViewer);
  document.getElementById("view-card-2").addEventListener("click", openViewer);
  document.getElementById("close").addEventListener("click", closeViewer);
  zoomBtn.addEventListener("click", function () {
    var z = viewer.classList.toggle("zoomed");
    zoomBtn.textContent = z ? "－ Zoom Out" : "＋ Zoom In";
  });
  viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target.id === "viewer-scroll") closeViewer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !viewer.hidden) closeViewer(); });

  /* ---------- the backwaters ---------- */
  var river = (function () {
    var cv = document.getElementById("river"), c, R = rng(11);
    var far = [], mid = [];
    for (var i = 0; i < 18; i++) far.push({ x: i / 18 + R() * 0.04, h: 0.45 + R() * 0.55, l: (R() - 0.5) * 0.5, s: 1 + Math.floor(R() * 1e6) });
    for (var j = 0; j < 7; j++) mid.push({ x: 0.55 + j * 0.09 + R() * 0.04, h: 0.7 + R() * 0.45, l: (R() - 0.45) * 0.5, s: 1 + Math.floor(R() * 1e6) });
    var shimmer = []; for (var k = 0; k < 70; k++) shimmer.push({ y: R(), x: R(), w: 0.02 + R() * 0.08, ph: R() * 6.28 });
    var progress = 0.25, time = 0;

    function palm(ctx, x, base, h, lean, col, seed) {
      var r = rng(seed), tx = x + lean * h, ty = base - h;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.5, h * 0.028);
      ctx.beginPath(); ctx.moveTo(x, base);
      ctx.bezierCurveTo(x + lean * h * 0.05, base - h * 0.4, tx - lean * h * 0.25, ty + h * 0.25, tx, ty); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx, ty + h * 0.02, h * 0.025, 0, 6.29); ctx.fill();
      var n = 7 + Math.floor(r() * 3);
      for (var i = 0; i < n; i++) {
        var a = -Math.PI * 0.95 + (i / (n - 1)) * Math.PI * 0.9 + (r() - 0.5) * 0.35;
        var len = h * (0.28 + r() * 0.16);
        var dx = Math.cos(a), up = Math.sin(a);           // up < 0 is upward
        var cx = tx + dx * len * 0.55, cy = ty + up * len * 0.55 - len * 0.12;
        var ex = tx + dx * len, ey = ty + up * len * 0.25 + len * 0.45;
        ctx.lineWidth = Math.max(0.9, h * 0.01);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
        ctx.lineWidth = Math.max(0.5, h * 0.005);
        for (var t = 0.12; t < 1; t += 0.07) {
          var px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * cx + t * t * ex;
          var py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * cy + t * t * ey;
          var ll = len * 0.2 * (1 - t * 0.55);
          var back = dx * ll * 0.25;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + back - ll * 0.18, py + ll);
          ctx.moveTo(px, py); ctx.lineTo(px + back + ll * 0.18, py + ll * 0.9); ctx.stroke();
        }
      }
    }
    function boat(ctx, cx, y, L, reflect) {
      var hullTop = y - L * 0.012;
      // lit cabin between deck and roof
      var x1 = cx - L * 0.31, x2 = cx + L * 0.29, roofBase = hullTop - L * 0.05;
      if (!reflect) {
        var glow = ctx.createRadialGradient(cx, roofBase, 0, cx, roofBase, L * 0.5);
        glow.addColorStop(0, "rgba(255,190,100,.18)"); glow.addColorStop(1, "rgba(255,190,100,0)");
        ctx.fillStyle = glow; ctx.fillRect(cx - L * 0.6, roofBase - L * 0.4, L * 1.2, L * 0.7);
      }
      ctx.fillStyle = "#f2b45c"; ctx.fillRect(x1, roofBase, x2 - x1, hullTop - roofBase + 1);
      ctx.fillStyle = "#1c0c08";
      for (var px = x1; px <= x2; px += L * 0.055) ctx.fillRect(px, roofBase, Math.max(1.5, L * 0.008), hullTop - roofBase);
      // thatched roof
      ctx.fillStyle = "#2b170d";
      ctx.beginPath(); ctx.moveTo(x1 - L * 0.02, roofBase);
      ctx.bezierCurveTo(x1, roofBase - L * 0.11, x2, roofBase - L * 0.11, x2 + L * 0.02, roofBase); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(201,162,75,.35)"; ctx.lineWidth = 1;
      for (var q = 0.1; q < 1; q += 0.1) {
        var qx = x1 + (x2 - x1) * q;
        ctx.beginPath(); ctx.moveTo(qx, roofBase); ctx.quadraticCurveTo(qx, roofBase - L * 0.07, qx + (q - 0.5) * L * 0.04, roofBase - L * 0.082); ctx.stroke();
      }
      // hull
      ctx.fillStyle = "#170806";
      ctx.beginPath();
      ctx.moveTo(cx - L * 0.5, y - L * 0.075);
      ctx.quadraticCurveTo(cx - L * 0.44, y + L * 0.03, cx - L * 0.32, y + L * 0.035);
      ctx.lineTo(cx + L * 0.32, y + L * 0.035);
      ctx.quadraticCurveTo(cx + L * 0.44, y + L * 0.03, cx + L * 0.5, y - L * 0.065);
      ctx.quadraticCurveTo(cx + L * 0.42, hullTop, cx + L * 0.36, hullTop);
      ctx.lineTo(cx - L * 0.36, hullTop);
      ctx.quadraticCurveTo(cx - L * 0.42, hullTop, cx - L * 0.5, y - L * 0.075);
      ctx.fill();
      ctx.strokeStyle = "rgba(241,216,151,.45)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - L * 0.36, hullTop + 1); ctx.lineTo(cx + L * 0.36, hullTop + 1); ctx.stroke();
    }
    function draw() {
      if (!c) return;
      var ctx = c.ctx, W = c.w, H = c.h, p = progress, hz = H * (W < 700 ? 0.4 : 0.56), S = Math.min(H, W * 1.25);
      // sky
      var sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, "#1b0d22"); sky.addColorStop(0.45, "#4d1d32"); sky.addColorStop(0.8, "#b45a37"); sky.addColorStop(1, "#eaa860");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz + 1);
      // sun
      var sr = Math.min(W, H) * 0.065, sx = W * 0.66, sy = hz - sr * 0.9 + p * sr * 1.4;
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
      sg.addColorStop(0, "rgba(255,214,140,.55)"); sg.addColorStop(1, "rgba(255,214,140,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, hz);
      ctx.fillStyle = "#ffe0a0"; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.29); ctx.fill();
      // water
      var wg = ctx.createLinearGradient(0, hz, 0, H);
      wg.addColorStop(0, "#8a4236"); wg.addColorStop(0.35, "#4a1c26"); wg.addColorStop(1, "#140810");
      ctx.fillStyle = wg; ctx.fillRect(0, hz, W, H - hz);
      // far bank with palms
      var shiftF = -p * W * 0.08;
      ctx.fillStyle = "#2a1120"; ctx.fillRect(0, hz - H * 0.012, W, H * 0.02);
      for (var i = 0; i < far.length; i++) {
        var f = far[i], fx = ((f.x * W * 1.2 + shiftF) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1;
        palm(ctx, fx, hz, S * 0.085 * f.h, f.l, "#2a1120", f.s);
      }
      // sun path on water
      for (var k = 0; k < shimmer.length; k++) {
        var s = shimmer[k], yy = hz + 4 + s.y * (H - hz) * 0.9, spread = 0.04 + s.y * 0.18;
        var xx = sx + (s.x - 0.5) * W * spread * 2 + Math.sin(time * 0.8 + s.ph) * 6;
        var a = (1 - s.y) * 0.55 * (0.6 + 0.4 * Math.sin(time * 1.6 + s.ph));
        ctx.strokeStyle = "rgba(255,214,150," + a.toFixed(3) + ")"; ctx.lineWidth = 1 + (1 - s.y);
        ctx.beginPath(); ctx.moveTo(xx - s.w * W * 0.5, yy); ctx.lineTo(xx + s.w * W * 0.5, yy); ctx.stroke();
      }
      // mid bank island, right side
      var shiftM = -p * W * 0.3;
      ctx.fillStyle = "#1d0a14";
      ctx.beginPath(); ctx.moveTo(W * 0.5 + shiftM, hz + H * 0.03);
      ctx.quadraticCurveTo(W * 0.75 + shiftM, hz - H * 0.01, W * 1.3 + shiftM, hz + H * 0.02);
      ctx.lineTo(W * 1.3 + shiftM, hz + H * 0.05); ctx.lineTo(W * 0.5 + shiftM, hz + H * 0.05); ctx.fill();
      for (var m = 0; m < mid.length; m++) palm(ctx, mid[m].x * W + shiftM + W * 0.05, hz + H * 0.03, S * 0.2 * mid[m].h, mid[m].l, "#1d0a14", mid[m].s);
      // boat and reflection
      var L = Math.min(W * 0.66, 560), by = hz + (H - hz) * 0.17, bx = -L * 0.6 + p * (W + L * 1.2);
      ctx.save(); ctx.translate(0, by * 2 + L * 0.07); ctx.scale(1, -1); ctx.globalAlpha = 0.22; boat(ctx, bx, by, L, true); ctx.restore();
      boat(ctx, bx, by, L, false);
      // ripples behind boat
      ctx.strokeStyle = "rgba(241,216,151,.25)"; ctx.lineWidth = 1;
      for (var w = 1; w < 5; w++) { ctx.beginPath(); ctx.moveTo(bx - L * 0.5 - w * 26, by + L * 0.045 + w * 3); ctx.lineTo(bx - L * 0.5 - w * 26 - 40 - w * 12, by + L * 0.045 + w * 3); ctx.stroke(); }
      // foreground bank and leaning palm
      var shiftN = -p * W * 0.55;
      ctx.fillStyle = "#0b0406";
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.9); ctx.quadraticCurveTo(W * 0.25 + shiftN, H * 0.86, W * 0.45 + shiftN, H); ctx.fill();
      palm(ctx, W * 0.06 + shiftN, H * 0.93, S * 0.72, 0.42, "#0b0406", 4242);
      palm(ctx, W * 1.02 - shiftN * 0.4, H * 0.98, S * 0.62, -0.38, "#0b0406", 777);
      // shade at the bottom so the cards read
      var bg = ctx.createLinearGradient(0, H * 0.55, 0, H);
      bg.addColorStop(0, "rgba(18,8,10,0)"); bg.addColorStop(1, "rgba(18,8,10,.75)");
      ctx.fillStyle = bg; ctx.fillRect(0, H * 0.55, W, H * 0.45);
    }
    function size() { c = fitCanvas(cv); draw(); }
    size(); window.addEventListener("resize", size);
    var run = false;
    function loop() { if (!run) return; time += 0.016; draw(); requestAnimationFrame(loop); }
    if (!reduce) whenVisible(cv, function (v) { if (v && !run) { run = true; loop(); } else if (!v) run = false; });
    return { set: function (p) { progress = p; if (!run) draw(); }, palm: palm };
  })();


  if (animate) {
    gsap.from(".water .water-card", { opacity: 0, y: 40, duration: 1, ease: "power2.out", scrollTrigger: { trigger: ".water", start: "top 40%" } });
    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 26, duration: 1.1, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ---------- scroll progress for the two scenes ---------- */
  if (animate) {
    var scenes = [
      { el: document.querySelector(".water"), set: function (p) { river.set(0.05 + p * 0.9); } }
    ];
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      scenes.forEach(function (s) {
        var r = s.el.getBoundingClientRect(), travel = r.height - vh;
        if (r.bottom < -vh || r.top > vh * 2) return;
        s.set(Math.min(1, Math.max(0, -r.top / Math.max(1, travel))));
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- countdown ---------- */
  (function () {
    var target = Date.UTC(2027, 0, 3, 6, 30, 0); // 12.00 noon IST
    var $ = function (id) { return document.getElementById(id); };
    function pad(n) { return String(n).padStart(2, "0"); }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { $("count-grid").hidden = true; $("count-done").hidden = false; return false; }
      var s = Math.floor(diff / 1000);
      $("cd-d").textContent = Math.floor(s / 86400);
      $("cd-h").textContent = pad(Math.floor(s % 86400 / 3600));
      $("cd-m").textContent = pad(Math.floor(s % 3600 / 60));
      $("cd-s").textContent = pad(s % 60);
      return true;
    }
    if (tick()) { var t = setInterval(function () { if (!tick()) clearInterval(t); }, 1000); }
  })();
})();
