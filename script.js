(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  if (!reduce) root.classList.add("js-anim");
  var SVG = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVG, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- music ---------- */
  var audio = document.getElementById("bgm");
  var musicBtn = document.getElementById("music");
  var musicLabel = document.getElementById("music-label");
  var noAudio = false, playing = false, fadeId = 0;
  var src = audio.querySelector("source");
  if (src) src.addEventListener("error", function () { noAudio = true; musicBtn.hidden = true; });
  // Phones (iPhone especially) ignore volume changes from a page, so only fade where it works.
  var canFade = (function () { try { var v = audio.volume; audio.volume = 0.5; var ok = audio.volume === 0.5; audio.volume = v; return ok; } catch (e) { return false; } })();
  function setMusicUI(on) {
    playing = on;
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicLabel.textContent = on ? "Music On" : "Music Off";
  }
  function fadeIn() {
    var id = ++fadeId;
    if (!canFade) return;
    audio.volume = 0;
    (function step() {
      if (id !== fadeId) return;
      audio.volume = Math.min(0.75, audio.volume + 0.03);
      if (audio.volume < 0.75) requestAnimationFrame(step);
    })();
  }
  function playMusic() {
    if (noAudio || playing) return;
    setMusicUI(true);
    var p = audio.play();
    if (p && p.then) p.then(function () { musicBtn.hidden = false; fadeIn(); }).catch(function () { setMusicUI(false); });
    else { musicBtn.hidden = false; fadeIn(); }
  }
  function stopMusic() { fadeId++; setMusicUI(false); audio.pause(); }   // instant, on every device
  musicBtn.addEventListener("click", function () { playing ? stopMusic() : playMusic(); });
  audio.addEventListener("pause", function () { if (playing) setMusicUI(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && playing) stopMusic(); });

  /* ---------- thoranam (mango leaves and marigolds) ---------- */
  var thor = document.getElementById("thoranam");
  function buildThoranam() {
    var w = thor.clientWidth, h = 100;
    thor.innerHTML = "";
    var s = el("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "none" }, thor);
    var defs = el("defs", {}, s);
    var lg = el("linearGradient", { id: "leafG", x1: "0", x2: "1" }, defs);
    el("stop", { offset: "0", "stop-color": "#3f6b33" }, lg);
    el("stop", { offset: ".5", "stop-color": "#6d9a4c" }, lg);
    el("stop", { offset: "1", "stop-color": "#3a612e" }, lg);
    el("path", { d: "M0 12 Q" + w / 2 + " 20 " + w + " 12", fill: "none", stroke: "#b8892f", "stroke-width": "1.4" }, s);
    var step = 38, n = Math.ceil(w / step) + 1;
    for (var i = 0; i < n; i++) {
      var x = i * step, t = x / w, y = 12 + 8 * 4 * t * (1 - t) * 0.5;
      var g = el("g", { class: "hang", style: "animation-delay:" + (-(i * 0.37) % 4).toFixed(2) + "s" }, s);
      if (i % 3 === 1) {
        for (var k = 0; k < 4; k++) {
          el("circle", { cx: x, cy: y + 7 + k * 9, r: 5, fill: k % 2 ? "#f4c24a" : "#e8912d" }, g);
          el("circle", { cx: x, cy: y + 7 + k * 9, r: 2, fill: "rgba(160,70,10,.35)" }, g);
        }
        el("circle", { cx: x, cy: y + 7 + 4 * 9, r: 3.2, fill: "#fffaf0", stroke: "#d9cdb4", "stroke-width": ".6" }, g);
      } else {
        var L = 46 + (i % 2) * 8;
        el("path", { d: "M" + x + " " + y + " C" + (x + 9) + " " + (y + 12) + " " + (x + 8) + " " + (y + L * 0.66) + " " + x + " " + (y + L) +
          " C" + (x - 8) + " " + (y + L * 0.66) + " " + (x - 9) + " " + (y + 12) + " " + x + " " + y + "Z", fill: "url(#leafG)" }, g);
        el("path", { d: "M" + x + " " + (y + 3) + " L" + x + " " + (y + L - 4), stroke: "rgba(230,240,200,.5)", "stroke-width": ".8" }, g);
      }
      // marigold knot on the string
      var fx = x + step / 2, fy = 12 + 8 * 4 * ((fx / w) * (1 - fx / w)) * 0.5;
      for (var a = 0; a < 8; a++) {
        var ang = a / 8 * Math.PI * 2;
        el("circle", { cx: (fx + Math.cos(ang) * 3.4).toFixed(1), cy: (fy + Math.sin(ang) * 3.4).toFixed(1), r: 3, fill: a % 2 ? "#e8912d" : "#f0a43a" }, s);
      }
      el("circle", { cx: fx, cy: fy, r: 2.4, fill: "#c46a14" }, s);
    }
  }
  buildThoranam();
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(buildThoranam, 150); });

  /* ---------- kolam mandala ---------- */
  var kolam = document.getElementById("kolam");
  function polar(r, a) { return [(r * Math.cos(a)).toFixed(2), (r * Math.sin(a)).toFixed(2)]; }
  function petal(r0, r1, a, w) {
    var m = (r0 + r1) / 2, p0 = polar(r0, a), c1 = polar(m, a - w), p1 = polar(r1, a), c2 = polar(m, a + w);
    return "M" + p0 + " Q" + c1 + " " + p1 + " Q" + c2 + " " + p0 + "Z";
  }
  function ring(cls, spin) {
    var g = el("g", { class: "ring " + cls }, kolam);
    return el("g", { class: spin || "" }, g);
  }
  (function buildKolam() {
    var g, i, a;
    g = ring("r1", "spin1");
    for (i = 0; i < 16; i++) { a = i / 16 * Math.PI * 2; el("path", { d: petal(84, 106, a, 0.16), class: "stroke draw", pathLength: "1" }, g); }
    g = ring("r2", "spin2");
    for (i = 0; i < 48; i++) { a = i / 48 * Math.PI * 2; var p = polar(112, a); el("circle", { cx: p[0], cy: p[1], r: 1.5, class: "dotf" }, g); }
    g = ring("r3", "spin1");
    for (i = 0; i < 12; i++) {
      a = i / 12 * Math.PI * 2 + Math.PI / 12;
      el("path", { d: petal(118, 148, a, 0.2), class: "petalf" }, g);
      el("path", { d: petal(124, 141, a, 0.1), class: "stroke m draw", pathLength: "1" }, g);
    }
    g = ring("r4", "spin2");
    var d = "";
    for (i = 0; i <= 360; i++) { a = i / 360 * Math.PI * 2; var r = 154 + 4 * Math.sin(a * 24); d += (i ? "L" : "M") + polar(r, a); }
    el("path", { d: d + "Z", class: "stroke draw", pathLength: "1" }, g);
    g = ring("r5", "spin1");
    for (i = 0; i < 24; i++) {
      a = i / 24 * Math.PI * 2;
      var q = polar(165, a); el("circle", { cx: q[0], cy: q[1], r: 2.2, class: "dotf" }, g);
      el("path", { d: petal(158, 170, a + Math.PI / 24, 0.05), class: "stroke m" }, g);
    }
  })();

  /* ---------- falling petals ---------- */
  var petals = (function () {
    var cv = document.getElementById("petals"), ctx = cv.getContext("2d"), list = [], running = false, W, H;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); window.addEventListener("resize", size);
    function drawOne(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, 0.6 + 0.4 * Math.abs(Math.sin(p.f)));
      if (p.type === 0) {            // jasmine
        ctx.fillStyle = "#fffdf6";
        for (var i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -p.s * 0.6, p.s * 0.32, p.s * 0.6, 0, 0, 6.29); ctx.fill(); }
        ctx.fillStyle = "#f2d27a"; ctx.beginPath(); ctx.arc(0, 0, p.s * 0.18, 0, 6.29); ctx.fill();
      } else {
        ctx.fillStyle = p.type === 1 ? "#ec942f" : (p.type === 2 ? "#f5c445" : "#a8222f");
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.45, p.s * 0.8, 0, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (p.delay > 0) { p.delay--; alive++; continue; }
        p.vy += 0.012; p.y += p.vy; p.f += p.fs; p.x += Math.sin(p.f) * 0.9 + p.vx; p.r += p.vr;
        if (p.y < H + 30) { alive++; drawOne(p); }
      }
      if (alive) requestAnimationFrame(frame); else { running = false; list = []; ctx.clearRect(0, 0, W, H); }
    }
    return function burst() {
      if (reduce) return;
      for (var i = 0; i < 110; i++) {
        list.push({ x: Math.random() * W, y: -20 - Math.random() * 60, vx: (Math.random() - 0.5) * 0.4, vy: 0.8 + Math.random() * 1.4,
          s: 7 + Math.random() * 7, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.06, f: Math.random() * 6.28, fs: 0.03 + Math.random() * 0.04,
          type: Math.random() < 0.38 ? 0 : (Math.random() < 0.5 ? 1 : (Math.random() < 0.6 ? 2 : 3)), delay: Math.floor(Math.random() * 120) });
      }
      if (!running) { running = true; frame(); }
    };
  })();

  /* ---------- opening ---------- */
  var opened = false;
  document.getElementById("open").addEventListener("click", function () {
    playMusic();
    if (opened) { document.getElementById("invite").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    opened = true;
    document.body.classList.add("opened");
    document.getElementById("seal-tap").textContent = "Welcome";
    petals();
    setTimeout(function () { document.body.classList.add("bloomed"); }, 1700);
    setTimeout(function () { document.getElementById("invite").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, reduce ? 0 : 1500);
  });

  /* ---------- full card viewer ---------- */
  var viewer = document.getElementById("viewer"), zoomBtn = document.getElementById("zoom"), lastFocus = null;
  function openViewer() {
    lastFocus = document.activeElement; viewer.hidden = false; document.body.style.overflow = "hidden";
    viewer.classList.remove("zoomed"); zoomBtn.textContent = "Zoom In"; document.getElementById("close").focus();
  }
  function closeViewer() { viewer.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.getElementById("view-card").addEventListener("click", openViewer);
  document.getElementById("view-card-2").addEventListener("click", openViewer);
  document.getElementById("close").addEventListener("click", closeViewer);
  zoomBtn.addEventListener("click", function () { zoomBtn.textContent = viewer.classList.toggle("zoomed") ? "Zoom Out" : "Zoom In"; });
  viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target.id === "viewer-scroll") closeViewer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !viewer.hidden) closeViewer(); });

  /* ---------- muhurtham clock ---------- */
  var ticks = document.getElementById("c-ticks");
  for (var t = 0; t < 60; t++) {
    var ang = t / 60 * Math.PI * 2, big = t % 5 === 0, r0 = big ? 76 : 80;
    el("line", { x1: 100 + r0 * Math.sin(ang), y1: 100 - r0 * Math.cos(ang), x2: 100 + 85 * Math.sin(ang), y2: 100 - 85 * Math.cos(ang), class: "c-tick" + (big ? " big" : "") }, ticks);
  }
  var hourH = document.getElementById("c-hour"), minH = document.getElementById("c-min"), arc = document.getElementById("c-arc"), readout = document.getElementById("readout");
  function setClock(p) {
    // 10.10 am sweeps to 12.00, then the muhurtham window 12.00 to 12.25 fills in gold
    var mins = p < 0.55 ? 610 + (p / 0.55) * 110 : 720 + ((p - 0.55) / 0.45) * 25;
    mins = clamp(mins, 610, 745);
    var h = Math.floor(mins / 60), m = Math.floor(mins % 60);
    hourH.style.transform = "rotate(" + (((h % 12) + (mins % 60) / 60) * 30) + "deg)";
    minH.style.transform = "rotate(" + ((mins % 60) * 6) + "deg)";
    var fill = clamp((mins - 720) / 25, 0, 1) * 150;
    arc.style.strokeDasharray = fill + " 360";
    readout.textContent = (h > 12 ? h - 12 : h) + "." + (m < 10 ? "0" : "") + m + (h >= 12 ? " pm" : " am");
  }

  /* ---------- the road to the venue ---------- */
  var road = document.getElementById("road"), bed = document.getElementById("road-bed"), car = document.getElementById("car");
  var journey = document.querySelector(".journey"), len = bed.getTotalLength();
  (function placeKottayam() {
    var pt = bed.getPointAtLength(len * 0.5);
    document.getElementById("kottayam").setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
  })();
  function setJourney(p) {
    var q = clamp((p - 0.04) / 0.8, 0, 1);
    road.style.strokeDashoffset = String(1 - q);
    var L = Math.max(0.5, len * q), a = bed.getPointAtLength(L), b = bed.getPointAtLength(Math.min(len, L + 2)), c = bed.getPointAtLength(Math.max(0, L - 2));
    var deg = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
    var flip = Math.cos(deg * Math.PI / 180) < 0;
    car.setAttribute("transform", "translate(" + a.x.toFixed(1) + " " + (a.y - 4).toFixed(1) + ") rotate(" + (flip ? deg + 180 : deg).toFixed(1) + ")" + (flip ? " scale(-1 1)" : ""));
    journey.classList.toggle("arrived", q >= 0.99);
  }

  /* ---------- scroll progress for the sticky scenes ---------- */
  var scenes = [
    { el: document.querySelector(".clock-scene"), set: setClock },
    { el: journey, set: setJourney }
  ];
  if (reduce) { setClock(1); setJourney(1); }
  else {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      scenes.forEach(function (s) {
        var r = s.el.getBoundingClientRect(), travel = r.height - vh;
        if (r.bottom < -vh || r.top > vh * 2) return;
        s.set(clamp(-r.top / Math.max(1, travel), 0, 1));
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else reveals.forEach(function (r) { r.classList.add("in"); });

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
    if (tick()) { var iv = setInterval(function () { if (!tick()) clearInterval(iv); }, 1000); }
  })();
})();
