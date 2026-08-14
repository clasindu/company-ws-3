/* =========================================================================
   ETEK Hero — Radial Digital Data Hub (Three.js UMD / file:// safe)
   ONE hub at center. Devices and panels orbit it in a fixed hierarchy.
   Transparent canvas. Left hero copy untouched.
   ========================================================================= */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  var stage = document.getElementById('hero-scene');
  if (!stage) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 48rem)').matches;
  var isTablet = window.matchMedia('(max-width: 64rem)').matches && !isMobile;

  var C = {
    metal: 0x1a2433,
    metalMid: 0x2c3a4e,
    metalLite: 0x3d4e66,
    black: 0x0b121c,
    cyan: 0x2dbef7,
    ice: 0xb9e9fc,
    lime: 0xa5be00,
    glass: 0x0c2a4a
  };

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 1.75));
  renderer.setClearColor(0x000000, 0);
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var root = new THREE.Group();
  scene.add(root);

  /* Camera looks slightly down at the hub (~22°) */
  var camera = new THREE.PerspectiveCamera(isMobile ? 34 : 32, 1, 0.1, 60);
  var camBase = isMobile
    ? { x: 0.00, y: 3.15, z: 6.55 }
    : { x: 0.00, y: 3.85, z: 8.35 };
  var lookY = isMobile ? 0.72 : 0.55;
  camera.position.set(camBase.x, camBase.y, camBase.z);
  camera.lookAt(0, lookY, 0);

  scene.add(new THREE.AmbientLight(0x6e97b8, 0.48));
  var key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(3.5, 7, 5);
  scene.add(key);
  var rim = new THREE.DirectionalLight(C.cyan, 0.38);
  rim.position.set(-4, 3, -2);
  scene.add(rim);
  var hubLight = new THREE.PointLight(C.cyan, 1.85, 8, 2);
  hubLight.position.set(0, 0.85, 0.15);
  scene.add(hubLight);

  var matMetal = new THREE.MeshStandardMaterial({ color: C.metal, metalness: 0.78, roughness: 0.34 });
  var matMetalMid = new THREE.MeshStandardMaterial({ color: C.metalMid, metalness: 0.62, roughness: 0.4 });
  var matMetalLite = new THREE.MeshStandardMaterial({ color: C.metalLite, metalness: 0.5, roughness: 0.44 });
  var matBlack = new THREE.MeshStandardMaterial({ color: C.black, metalness: 0.55, roughness: 0.42 });
  var matGlass = new THREE.MeshStandardMaterial({
    color: C.glass, metalness: 0.2, roughness: 0.14,
    transparent: true, opacity: 0.32, emissive: C.cyan, emissiveIntensity: 0.08
  });
  var matCyan = new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.95 });
  var matIce = new THREE.MeshBasicMaterial({ color: C.ice, transparent: true, opacity: 0.9 });
  var matLime = new THREE.MeshBasicMaterial({ color: C.lime, transparent: true, opacity: 0.92 });
  var matHubGlow = new THREE.MeshStandardMaterial({
    color: C.cyan, emissive: C.cyan, emissiveIntensity: 0.95,
    metalness: 0.15, roughness: 0.22
  });
  var matTube = new THREE.MeshStandardMaterial({
    color: C.cyan, emissive: C.cyan, emissiveIntensity: 0.62,
    metalness: 0.12, roughness: 0.35, transparent: true, opacity: 0.78
  });

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeScreen(kind) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 160);
    g.addColorStop(0, '#0c2744');
    g.addColorStop(1, '#071828');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#2dbef7';
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.fillText('ETEK', 12, 20);
    ctx.fillStyle = 'rgba(185,233,252,0.5)';
    ctx.font = '500 10px Inter, system-ui, sans-serif';
    ctx.fillText(kind, 12, 34);
    if (kind === 'WEB' || kind === 'APP') {
      ctx.fillStyle = 'rgba(45,190,247,0.22)';
      ctx.fillRect(14, 48, 108, 72);
      ctx.fillStyle = 'rgba(185,233,252,0.18)';
      ctx.fillRect(132, 48, 108, 32);
      ctx.fillRect(132, 88, 108, 32);
      ctx.strokeStyle = 'rgba(45,190,247,0.7)';
      ctx.beginPath();
      ctx.moveTo(22, 104);
      ctx.lineTo(48, 82);
      ctx.lineTo(78, 90);
      ctx.lineTo(110, 62);
      ctx.stroke();
    } else if (kind === 'MOBILE') {
      ctx.fillStyle = 'rgba(45,190,247,0.28)';
      ctx.fillRect(36, 50, 78, 42);
      ctx.fillRect(132, 50, 78, 42);
      ctx.fillStyle = '#a5be00';
      ctx.fillRect(36, 112, 174, 8);
    } else {
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(165,190,0,0.45)' : 'rgba(45,190,247,0.35)';
        var bh = 22 + (i % 3) * 16;
        ctx.fillRect(28 + i * 42, 122 - bh, 24, bh);
      }
    }
    var tex = new THREE.CanvasTexture(c);
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeLabel(text) {
    var c = document.createElement('canvas');
    var lw = isMobile ? 352 : 220;
    var lh = isMobile ? 90 : 56;
    c.width = lw;
    c.height = lh;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, lw, lh);
    ctx.fillStyle = 'rgba(0, 22, 54, 0.72)';
    roundRect(ctx, lw * 0.08, lh * 0.18, lw * 0.84, lh * 0.64, isMobile ? 14 : 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(45,190,247,0.55)';
    ctx.lineWidth = isMobile ? 2.2 : 1.4;
    ctx.stroke();
    ctx.font = isMobile ? '700 36px Inter, system-ui, sans-serif' : '600 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ebf2fa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, lw * 0.5, lh * 0.5);
    var tex = new THREE.CanvasTexture(c);
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    var sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 })
    );
    sprite.scale.set(isMobile ? 1.55 : 1.05, isMobile ? 0.4 : 0.27, 1);
    return sprite;
  }

  var packets = [];
  var cables = [];
  var hoverHits = [];
  var neuralDots = [];
  var pulseLeds = [];

  function addHover(group, key, radius) {
    group.userData.flowKey = key;
    group.userData.hover = 0;
    var hit = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.userData.target = group;
    group.add(hit);
    hoverHits.push(hit);
  }

  function attachLabel(group, text, y) {
    var lab = makeLabel(text);
    lab.position.set(0, y, 0);
    group.add(lab);
  }

  /* ========================================================================
     RADIAL LAYOUT — all positions relative to hub origin (0, 0.42, 0)
     Units chosen so hub ≈ 16–18% of scene width (~5.6 units).
     Depth: AI above hub, panels back, devices front.
     ======================================================================== */
  var HUB = new THREE.Vector3(0, 0.42, 0);

  var POS = {
    ai: new THREE.Vector3(0.00, 1.82, 0.00),
    web: new THREE.Vector3(-2.18, 0.36, -0.42),
    erp: new THREE.Vector3(-2.18, 1.54, -0.62),
    analytics: new THREE.Vector3(2.18, 1.00, -0.42),
    laptop: new THREE.Vector3(-2.12, 0.10, 1.38),
    mobile: new THREE.Vector3(0.28, 0.08, 1.62),
    monitor: new THREE.Vector3(2.18, 0.52, 1.18)
  };

  if (isMobile) {
    POS.web.set(-1.78, 0.38, -0.28);
    POS.erp.set(-1.78, 1.50, -0.48);
    POS.laptop.set(-1.72, 0.10, 1.22);
    POS.mobile.set(0.22, 0.08, 1.38);
  }

  /* ---- Subtle circular platform ---- */
  var platform = new THREE.Group();
  var disc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.45, 0.05, 48),
    new THREE.MeshStandardMaterial({
      color: 0x081828, metalness: 0.35, roughness: 0.28,
      transparent: true, opacity: 0.42, emissive: C.cyan, emissiveIntensity: 0.04
    })
  );
  platform.add(disc);
  var rimRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.012, 8, 64),
    new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.28 })
  );
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = 0.03;
  platform.add(rimRing);
  platform.position.set(0, -0.08, 0.15);
  root.add(platform);

  /* ========================================================================
     1. CENTRAL HUB
     ======================================================================== */
  var hub = new THREE.Group();
  var hubOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.16, 32), matMetalMid);
  hub.add(hubOuter);
  var hubGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.14, 28),
    new THREE.MeshStandardMaterial({
      color: C.glass, metalness: 0.18, roughness: 0.16,
      transparent: true, opacity: 0.5, emissive: C.cyan, emissiveIntensity: 0.55
    })
  );
  hubGlass.position.y = 0.12;
  hub.add(hubGlass);
  var hubCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), matHubGlow);
  hubCore.position.y = 0.14;
  hub.add(hubCore);
  var hubInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.018, 8, 32),
    new THREE.MeshBasicMaterial({ color: C.ice, transparent: true, opacity: 0.7 })
  );
  hubInner.position.y = 0.14;
  hub.add(hubInner);
  var hubHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 24, 24),
    new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.07, depthWrite: false })
  );
  hubHalo.position.y = 0.1;
  hub.add(hubHalo);
  var hubPort = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.05, 0.07, 10),
    new THREE.MeshStandardMaterial({
      color: C.cyan, emissive: C.cyan, emissiveIntensity: 0.7,
      metalness: 0.2, roughness: 0.3
    })
  );
  hubPort.position.y = 0.24;
  hub.add(hubPort);
  hub.userData.core = hubCore;
  hub.userData.inner = hubInner;
  hub.position.copy(HUB);
  addHover(hub, 'hub', 0.75);
  root.add(hub);

  /* ========================================================================
     2. AI — directly above hub, same X/Z axis
     ======================================================================== */
  var ai = new THREE.Group();
  var aiCase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.42), matGlass);
  ai.add(aiCase);
  var aiBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.46), matMetalMid);
  aiBase.position.y = -0.16;
  ai.add(aiBase);
  var npts = [[-0.14, 0.04, 0.08], [0.12, 0.08, -0.06], [0.02, -0.04, 0.1], [-0.08, -0.06, -0.1]];
  npts.forEach(function (p, i) {
    var d = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), i % 2 ? matIce : matCyan);
    d.position.set(p[0], p[1], p[2]);
    d.userData.base = d.position.clone();
    d.userData.phase = i;
    ai.add(d);
    neuralDots.push(d);
  });
  [[-0.16, 0.02, 0.28, 0.05], [0.02, -0.06, 0.22, 0.04], [0.14, 0.06, 0.18, 0.05]].forEach(function (b) {
    var bar = new THREE.Mesh(new THREE.BoxGeometry(b[2], b[3], 0.02), matCyan);
    bar.position.set(b[0], b[1], 0.22);
    ai.add(bar);
  });
  [[-0.2, 0.12, 0.18], [0, 0.12, 0.22], [0.2, 0.12, 0.16]].forEach(function (p, i) {
    var led = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.018, 0.018),
      new THREE.MeshBasicMaterial({ color: i === 1 ? C.lime : C.cyan, transparent: true, opacity: 0.7 })
    );
    led.position.set(p[0], p[1], p[2]);
    led.userData.phase = i * 1.1;
    ai.add(led);
    pulseLeds.push(led);
  });
  var aiPort = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.08, 10),
    new THREE.MeshStandardMaterial({
      color: C.cyan, emissive: C.cyan, emissiveIntensity: 0.7,
      metalness: 0.2, roughness: 0.3
    })
  );
  aiPort.position.y = -0.22;
  ai.add(aiPort);
  ai.position.copy(POS.ai);
  attachLabel(ai, 'AI', 0.42);
  addHover(ai, 'ai', 0.48);
  root.add(ai);

  /* ========================================================================
     4–6. WEB / ERP / ANALYTICS panels — camera-facing, around hub
     ======================================================================== */
  function makePanel(kind, w, h) {
    var g = new THREE.Group();
    var plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), matGlass);
    g.add(plate);
    var sc = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.88, h * 0.78, 0.02),
      new THREE.MeshBasicMaterial({ map: makeScreen(kind), transparent: true, opacity: 0.88 })
    );
    sc.position.z = 0.03;
    g.add(sc);
    return g;
  }

  var web = null;
  var erp = null;
  var analytics = null;

  web = makePanel('WEB', isMobile ? 0.7 : 0.78, isMobile ? 0.44 : 0.5);
  web.position.copy(POS.web);
  web.lookAt(camBase.x, camBase.y * 0.35, camBase.z);
  attachLabel(web, 'WEB', 0.42);
  addHover(web, 'web', 0.5);
  root.add(web);

  erp = makePanel('ERP', isMobile ? 0.64 : 0.72, isMobile ? 0.4 : 0.46);
  erp.position.copy(POS.erp);
  erp.lookAt(camBase.x, camBase.y * 0.35, camBase.z);
  attachLabel(erp, 'ERP', 0.4);
  addHover(erp, 'erp', 0.48);
  root.add(erp);

  if (!isMobile) {
    analytics = makePanel('APP', 0.82, 0.52);
    analytics.position.copy(POS.analytics);
    analytics.lookAt(camBase.x, camBase.y * 0.35, camBase.z);
    attachLabel(analytics, 'ANALYTICS', 0.44);
    addHover(analytics, 'analytics', 0.52);
    root.add(analytics);
  }

  /* ========================================================================
     7. DEVICES — foreground, facing viewer + toward hub
     ======================================================================== */
  function createLaptop() {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.042, 0.84), matMetalMid));
    var kb = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.014, 0.58), matBlack);
    kb.position.set(0, 0.028, 0.05);
    g.add(kb);
    var lid = new THREE.Group();
    lid.add(new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.78, 0.042), matBlack));
    var sc = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 0.66, 0.018),
      new THREE.MeshBasicMaterial({ map: makeScreen('WEB') })
    );
    sc.position.z = 0.028;
    lid.add(sc);
    lid.position.set(0, 0.02, -0.4);
    lid.rotation.x = -1.08;
    g.add(lid);
    g.position.copy(POS.laptop);
    g.rotation.y = 0.42;
    g.userData.parallax = 1.2;
    addHover(g, 'laptop', 0.85);
    return g;
  }

  function createPhone() {
    var g = new THREE.Group();

    function roundRectShape(w, h, r) {
      var s = new THREE.Shape();
      var x = -w * 0.5;
      var y = -h * 0.5;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x12151a, metalness: 0.78, roughness: 0.26
    });
    var bodyGeo = new THREE.ExtrudeGeometry(roundRectShape(0.33, 0.70, 0.055), {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.0035,
      bevelSize: 0.0035,
      bevelSegments: 2,
      curveSegments: 12
    });
    bodyGeo.translate(0, 0, -0.012);
    g.add(new THREE.Mesh(bodyGeo, bodyMat));

    var screen = new THREE.Mesh(
      new THREE.ShapeGeometry(roundRectShape(0.304, 0.668, 0.048), 16),
      new THREE.MeshBasicMaterial({ map: makeScreen('MOBILE') })
    );
    screen.position.z = 0.012;
    g.add(screen);

    var island = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.011, 0.072, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x07090c, metalness: 0.6, roughness: 0.32 })
    );
    island.rotation.z = Math.PI / 2;
    island.position.set(0, 0.268, 0.014);
    g.add(island);

    var pwr = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.068, 0.012), matMetalLite);
    pwr.position.set(0.166, 0.06, 0);
    g.add(pwr);
    var vol = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.092, 0.012), matMetalLite);
    vol.position.set(-0.166, 0.09, 0);
    g.add(vol);

    g.position.copy(POS.mobile);
    g.rotation.set(-0.35, 0.08, 0);
    g.userData.parallax = 1.25;
    attachLabel(g, 'MOBILE', 0.58);
    addHover(g, 'mobile', 0.5);
    return g;
  }

  function createMonitor() {
    var g = new THREE.Group();
    var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.12, 0.48, 12), matMetalMid);
    stand.position.y = -0.48;
    g.add(stand);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.045, 16), matMetal);
    base.position.y = -0.73;
    g.add(base);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.9, 0.065), matBlack));
    var sc = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.78, 0.022),
      new THREE.MeshBasicMaterial({ map: makeScreen('APP') })
    );
    sc.position.z = 0.04;
    g.add(sc);
    g.position.copy(POS.monitor);
    g.rotation.y = -0.42;
    g.userData.parallax = 1.15;
    addHover(g, 'monitor', 0.9);
    return g;
  }

  var laptop = createLaptop();
  var phone = createPhone();
  var monitor = createMonitor();
  root.add(laptop);
  root.add(phone);
  if (!isMobile) root.add(monitor);

  /* ========================================================================
     DATA PATHS — each has its own clean arc; all meet at hub
     ======================================================================== */
  function addPath(from, to, lift, radius, key, nPack, colors) {
    var mid = from.clone().lerp(to, 0.5);
    mid.y += lift;
    var side = new THREE.Vector3().subVectors(to, from);
    side.cross(new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(lift * 0.35);
    mid.add(side);
    var curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()], false, 'catmullrom', 0.18);
    var segs = isMobile ? 24 : 44;
    var mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, radius, 6, false),
      matTube.clone()
    );
    mesh.userData.flowKey = key;
    mesh.userData.baseEmissive = 0.62;
    mesh.userData.baseOpacity = 0.78;
    root.add(mesh);
    cables.push(mesh);
    var count = isMobile ? Math.min(nPack, 1) : nPack;
    for (var i = 0; i < count; i++) {
      var col = colors[i % colors.length];
      var pkt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), col);
      root.add(pkt);
      packets.push({
        mesh: pkt,
        curve: curve,
        t: (i / count + key.length * 0.07) % 1,
        speed: 0.13 + (i % 3) * 0.03,
        dir: i % 2 === 0 ? 1 : -1
      });
    }
    return curve;
  }

  /* Side/front docks only — keep the hub top free for the AI column */
  var hubFront = HUB.clone().add(new THREE.Vector3(0, 0.06, 0.48));
  var hubLeft = HUB.clone().add(new THREE.Vector3(-0.52, 0.08, 0.06));
  var hubRight = HUB.clone().add(new THREE.Vector3(0.52, 0.08, 0.06));
  var hubTop = HUB.clone().add(new THREE.Vector3(0, 0.28, 0));
  var aiBottom = POS.ai.clone().add(new THREE.Vector3(0, -0.26, 0));

  addPath(
    POS.laptop.clone().add(new THREE.Vector3(0.45, 0.15, -0.15)),
    hubFront.clone().add(new THREE.Vector3(-0.22, 0, 0.02)),
    0.12, 0.02, 'laptop', 2, [matCyan, matIce]
  );
  addPath(
    POS.mobile.clone().add(new THREE.Vector3(0, 0.12, -0.15)),
    hubFront.clone().add(new THREE.Vector3(0.12, 0, 0.04)),
    0.1, 0.016, 'mobile', 2, [matLime, matCyan]
  );
  if (!isMobile) {
    addPath(
      hubFront.clone().add(new THREE.Vector3(0.22, 0.02, 0.02)),
      POS.monitor.clone().add(new THREE.Vector3(-0.35, 0.15, -0.1)),
      0.12, 0.018, 'monitor', 2, [matCyan, matIce]
    );
  }

  if (web) {
    addPath(
      POS.web.clone().add(new THREE.Vector3(0.32, 0.02, 0.1)),
      hubLeft.clone().add(new THREE.Vector3(0, -0.04, 0.05)),
      0.02, 0.014, 'web', 1, [matCyan]
    );
  }
  if (erp) {
    addPath(
      POS.erp.clone().add(new THREE.Vector3(0.32, -0.04, 0.1)),
      hubLeft.clone().add(new THREE.Vector3(0, 0.18, -0.1)),
      0.04, 0.014, 'erp', 1, [matIce]
    );
  }
  if (analytics) {
    addPath(
      hubRight.clone(),
      POS.analytics.clone().add(new THREE.Vector3(-0.32, -0.04, 0.1)),
      0.04, 0.014, 'analytics', 1, [matCyan]
    );
  }

  /* One continuous vertical AI → HUB tube on the shared X/Z axis */
  (function addAiHubPath() {
    var midY = (aiBottom.y + hubTop.y) * 0.5;
    var curve = new THREE.CatmullRomCurve3([
      aiBottom.clone(),
      new THREE.Vector3(0, midY + 0.08, 0),
      new THREE.Vector3(0, midY - 0.08, 0),
      hubTop.clone()
    ], false, 'catmullrom', 0.01);
    var matAi = new THREE.MeshStandardMaterial({
      color: C.cyan,
      emissive: C.cyan,
      emissiveIntensity: 1.05,
      metalness: 0.08,
      roughness: 0.28,
      transparent: true,
      opacity: 0.92
    });
    var mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, isMobile ? 24 : 48, 0.036, 10, false),
      matAi
    );
    mesh.userData.flowKey = 'ai';
    mesh.userData.baseEmissive = 1.05;
    mesh.userData.baseOpacity = 0.92;
    root.add(mesh);
    cables.push(mesh);
    var glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, isMobile ? 16 : 28, 0.058, 8, false),
      new THREE.MeshBasicMaterial({
        color: C.cyan, transparent: true, opacity: 0.16, depthWrite: false
      })
    );
    root.add(glow);
    var n = isMobile ? 2 : 3;
    for (var i = 0; i < n; i++) {
      var pkt = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.055, 0.055),
        i % 2 ? matLime : matIce
      );
      root.add(pkt);
      packets.push({
        mesh: pkt,
        curve: curve,
        t: i / n,
        speed: 0.18,
        dir: 1
      });
    }
  })();

  /* ---- Interaction ---- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var ndc = new THREE.Vector2(2, 2);
  var raycaster = new THREE.Raycaster();
  var hovered = null;
  var running = true;
  var clock = new THREE.Clock();
  var lastT = 0;
  var sway = 0;
  var enableParallax = !isMobile && !reduced;

  function onMove(e) {
    var rect = stage.getBoundingClientRect();
    var nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    var ny = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    pointer.tx = Math.max(-1, Math.min(1, nx));
    pointer.ty = Math.max(-1, Math.min(1, ny));
    ndc.set(nx, -ny);
  }
  function onLeave() {
    pointer.tx = 0;
    pointer.ty = 0;
    ndc.set(2, 2);
  }
  if (enableParallax) {
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave);
  }

  function resize() {
    var w = stage.clientWidth || 640;
    var h = stage.clientHeight || 420;
    isMobile = w < 560;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    /* Keep 8–12% visual margin by slightly scaling down */
    root.scale.setScalar(isMobile ? 1.0 : isTablet ? 0.96 : 0.92);
  }
  resize();
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.08 }).observe(stage);
  }

  function updateHover() {
    if (!enableParallax) return;
    raycaster.setFromCamera(ndc, camera);
    var hits = raycaster.intersectObjects(hoverHits, false);
    var next = hits.length ? hits[0].object.userData.target : null;
    hovered = next;
    stage.style.cursor = hovered ? 'pointer' : 'grab';
  }

  var fg = [laptop, phone];
  if (!isMobile) fg.push(monitor);

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    var t = clock.getElapsedTime();
    var dt = Math.min(Math.max(t - lastT, 0), 0.05);
    lastT = t;

    if (!reduced) {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      sway += dt * 0.03;

      if (enableParallax) {
        camera.position.x = camBase.x + Math.sin(sway) * 0.08 + pointer.x * 0.28;
        camera.position.y = camBase.y + Math.sin(sway * 0.7) * 0.04 - pointer.y * 0.16;
        camera.lookAt(0 + pointer.x * 0.06, lookY - pointer.y * 0.04, 0);
        root.rotation.y = pointer.x * 0.04;
        root.rotation.x = pointer.y * 0.02;
        updateHover();
      } else {
        camera.position.x = camBase.x + Math.sin(sway) * 0.06;
        camera.lookAt(0, lookY, 0);
      }

      hub.userData.core.scale.setScalar(0.94 + Math.sin(t * 2.1) * 0.1);
      hub.userData.inner.rotation.z += dt * 0.7;
      hub.userData.inner.rotation.x = Math.PI / 2.4;
      hubLight.intensity = 1.65 + Math.sin(t * 1.7) * 0.25;
      matHubGlow.emissiveIntensity = 0.82 + Math.sin(t * 2) * 0.18;

      neuralDots.forEach(function (d) {
        d.position.y = d.userData.base.y + Math.sin(t * 2.2 + d.userData.phase) * 0.02;
      });
      pulseLeds.forEach(function (led) {
        led.material.opacity = 0.4 + Math.max(0, Math.sin(t * 2.8 + led.userData.phase)) * 0.55;
      });

      fg.forEach(function (obj) {
        if (obj.userData.baseY == null) {
          obj.userData.baseY = obj.position.y;
          obj.userData.baseX = obj.position.x;
        }
        var para = obj.userData.parallax || 1;
        obj.position.y = obj.userData.baseY + Math.sin(t * 0.55 + para) * 0.025;
        if (enableParallax) obj.position.x = obj.userData.baseX + pointer.x * 0.05 * para;
      });

      var hoverKey = hovered ? hovered.userData.flowKey : null;
      cables.forEach(function (c) {
        var hot = hoverKey && (c.userData.flowKey === hoverKey || hoverKey === 'hub');
        var wantE = hot ? 1.05 : c.userData.baseEmissive;
        var wantO = hot ? 0.95 : c.userData.baseOpacity;
        if (c.material.emissiveIntensity !== undefined) {
          c.material.emissiveIntensity += (wantE - c.material.emissiveIntensity) * 0.12;
        }
        c.material.opacity += (wantO - c.material.opacity) * 0.12;
      });

      packets.forEach(function (p) {
        p.t += dt * p.speed * p.dir;
        if (p.t > 1) p.t = 0;
        if (p.t < 0) p.t = 1;
        var pt = p.curve.getPointAt(p.t);
        p.mesh.position.copy(pt);
        p.mesh.lookAt(pt.clone().add(p.curve.getTangentAt(p.t)));
        p.mesh.scale.setScalar(0.88 + Math.sin(t * 7 + p.t * 10) * 0.16);
      });
    }

    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  if (!reduced) tick();
  else {
    setTimeout(function () {
      resize();
      renderer.render(scene, camera);
    }, 40);
  }
})();
