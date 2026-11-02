/* =========================================================================
   Optical prism visual — matches clean sample composition
   Tall smoked-glass column + left particles + fanned beams + orbs + pills
   ========================================================================= */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  var root = document.getElementById('prism-visual');
  var canvas = document.getElementById('prism-visual-canvas');
  if (!root || !canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 48rem)').matches;

  /* Fanned beams from the right face — sample layout */
  var BEAMS = [
    { label: 'Software', hex: 0x00f5ff, angle: 0.4 },
    { label: 'AI Solutions', hex: 0x8b5cf6, angle: 0.2 },
    { label: 'ERP Systems', hex: 0x00e599, angle: 0 },
    { label: 'Web Development', hex: 0xff007f, angle: -0.2 },
    { label: 'Mobile Apps', hex: 0xffb800, angle: -0.4 }
  ];

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x060813, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.85));
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (renderer.toneMapping !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(isMobile ? 32 : 28, 1, 0.1, 40);
  var camBase = isMobile
    ? { x: 1.15, y: 0.55, z: 7.0 }
    : { x: 1.25, y: 0.48, z: 6.2 };
  camera.position.set(camBase.x, camBase.y, camBase.z);
  camera.lookAt(0.4, 0.05, 0);

  function makeEnv() {
    var env = new THREE.Scene();
    env.add(new THREE.AmbientLight(0xffffff, 0.45));
    env.add(new THREE.Mesh(
      new THREE.SphereGeometry(18, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x1e1035, side: THREE.BackSide })
    ));
    var key = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 8),
      new THREE.MeshBasicMaterial({ color: 0xf4f6fb })
    );
    key.position.set(5, 7, 4);
    key.lookAt(0, 0, 0);
    env.add(key);
    var fill = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 5),
      new THREE.MeshBasicMaterial({ color: 0xa0a5b5 })
    );
    fill.position.set(-4, 2, 3);
    fill.lookAt(0, 0, 0);
    env.add(fill);
    var pmrem = new THREE.PMREMGenerator(renderer);
    var tex = pmrem.fromScene(env, 0.05).texture;
    pmrem.dispose();
    return tex;
  }
  scene.environment = makeEnv();

  scene.add(new THREE.AmbientLight(0x2a2448, 0.5));
  scene.add(new THREE.HemisphereLight(0xb8bdd0, 0x060813, 0.4));
  var keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
  keyLight.position.set(3.2, 5.0, 3.6);
  scene.add(keyLight);
  var rim = new THREE.DirectionalLight(0x8b5cf6, 0.22);
  rim.position.set(-3.2, 1.4, -2.0);
  scene.add(rim);

  var world = new THREE.Group();
  world.position.set(0.05, 0, 0);
  scene.add(world);

  var prismRig = new THREE.Group();
  /* Mild three-quarter yaw — tall column with visible top, not extreme diamond */
  prismRig.rotation.y = -0.38;
  world.add(prismRig);

  function glassMat() {
    if (typeof THREE.MeshPhysicalMaterial !== 'function' || isMobile) {
      return new THREE.MeshStandardMaterial({
        color: 0x141824,
        metalness: 0.1,
        roughness: 0.16,
        transparent: true,
        opacity: 0.34,
        envMapIntensity: 0.95,
        side: THREE.DoubleSide
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: 0x121620,
      metalness: 0.02,
      roughness: 0.08,
      transmission: 0.88,
      thickness: 1.2,
      ior: 1.5,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      attenuationColor: 0x0a0c14,
      attenuationDistance: 1.35,
      side: THREE.DoubleSide
    });
  }

  /* Tall slender smoked-glass monolith */
  var PRISM_W = 0.48;
  var PRISM_H = 2.55;
  var PRISM_D = 0.48;
  var prism = new THREE.Mesh(new THREE.BoxGeometry(PRISM_W, PRISM_H, PRISM_D), glassMat());
  prismRig.add(prism);

  var edgeLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(prism.geometry),
    new THREE.LineBasicMaterial({
      color: 0xa0a5b5,
      transparent: true,
      opacity: 0.88
    })
  );
  prism.add(edgeLines);

  var intakeLocal = new THREE.Vector3(-PRISM_W / 2, 0, 0);
  var exitLocal = new THREE.Vector3(PRISM_W / 2, 0.02, 0.02);

  function softDisc(hex, innerA, outerA) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    var col = new THREE.Color(hex);
    var r = Math.round(col.r * 255);
    var gg = Math.round(col.g * 255);
    var b = Math.round(col.b * 255);
    g.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',' + innerA + ')');
    g.addColorStop(0.38, 'rgba(' + r + ',' + gg + ',' + b + ',' + outerA + ')');
    g.addColorStop(1, 'rgba(6,8,19,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  /* Left inflow — sparse cyan + purple motes */
  var inflowCount = isMobile ? 55 : 110;
  var inflowPos = new Float32Array(inflowCount * 3);
  var inflowCol = new Float32Array(inflowCount * 3);
  var inflowMeta = [];
  var cyan = new THREE.Color(0x00f5ff);
  var violet = new THREE.Color(0x8b5cf6);
  var i;
  for (i = 0; i < inflowCount; i++) {
    var mix = i % 2 ? cyan : violet;
    inflowCol[i * 3] = mix.r;
    inflowCol[i * 3 + 1] = mix.g;
    inflowCol[i * 3 + 2] = mix.b;
    inflowMeta.push({
      t: Math.random(),
      speed: 0.05 + Math.random() * 0.06,
      y: (Math.random() - 0.5) * 1.2,
      z: (Math.random() - 0.5) * 0.5,
      startX: -3.0 - Math.random() * 0.9
    });
  }
  var inflowGeo = new THREE.BufferGeometry();
  inflowGeo.setAttribute('position', new THREE.BufferAttribute(inflowPos, 3));
  inflowGeo.setAttribute('color', new THREE.BufferAttribute(inflowCol, 3));
  world.add(new THREE.Points(inflowGeo, new THREE.PointsMaterial({
    size: isMobile ? 0.042 : 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    sizeAttenuation: true,
    map: softDisc(0x8b5cf6, 0.95, 0.14),
    blending: THREE.AdditiveBlending
  })));

  var beamLen = isMobile ? 2.35 : 2.85;
  var badgeT = 0.62;
  var beams = [];
  var badgeEls = root.querySelectorAll('.prism-visual__badge');

  function makeBeam(spec, index) {
    var group = new THREE.Group();
    group.position.copy(exitLocal);
    group.rotation.z = spec.angle;
    prismRig.add(group);

    var core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, beamLen, 8),
      new THREE.MeshBasicMaterial({
        color: spec.hex,
        transparent: true,
        opacity: 0.98
      })
    );
    core.rotation.z = -Math.PI / 2;
    core.position.x = beamLen / 2;
    group.add(core);

    var glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.014, beamLen, 12),
      new THREE.MeshBasicMaterial({
        color: spec.hex,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glow.rotation.z = -Math.PI / 2;
    glow.position.x = beamLen / 2;
    group.add(glow);

    var halo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.022, beamLen, 12),
      new THREE.MeshBasicMaterial({
        color: spec.hex,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.rotation.z = -Math.PI / 2;
    halo.position.x = beamLen / 2;
    group.add(halo);

    var orb = new THREE.Sprite(new THREE.SpriteMaterial({
      map: softDisc(spec.hex, 0.98, 0.2),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    orb.position.set(beamLen, 0, 0);
    orb.scale.set(0.48, 0.48, 1);
    group.add(orb);

    var tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 14, 14),
      new THREE.MeshBasicMaterial({ color: spec.hex })
    );
    tip.position.set(beamLen, 0, 0);
    group.add(tip);

    var light = new THREE.PointLight(spec.hex, 0.4, 2.4, 2);
    light.position.set(beamLen * 0.7, 0, 0);
    group.add(light);

    var hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, beamLen, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.rotation.z = -Math.PI / 2;
    hit.position.x = beamLen / 2;
    hit.userData.beamIndex = index;
    group.add(hit);

    return {
      spec: spec,
      group: group,
      core: core,
      glow: glow,
      halo: halo,
      orb: orb,
      tip: tip,
      light: light,
      hit: hit,
      badgeEl: badgeEls[index],
      badgeLocal: new THREE.Vector3(beamLen * badgeT, 0, 0),
      intensity: 1,
      target: 1
    };
  }

  BEAMS.forEach(function (spec, index) {
    beams.push(makeBeam(spec, index));
  });

  var raycaster = new THREE.Raycaster();
  var pointerNdc = new THREE.Vector2(-99, -99);
  var hover = -1;
  var running = true;
  var clock = new THREE.Clock();
  var worldPos = new THREE.Vector3();
  var intakeWorld = new THREE.Vector3();

  function setHover(next) {
    hover = next;
    beams.forEach(function (b, i) {
      b.target = next === -1 ? 1 : (i === next ? 1.8 : 0.32);
      if (b.badgeEl) b.badgeEl.classList.toggle('is-hot', next === i);
    });
  }

  function onMove(e) {
    var rect = root.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    var hits = raycaster.intersectObjects(beams.map(function (b) { return b.hit; }), false);
    var next = hits.length ? hits[0].object.userData.beamIndex : -1;
    if (next !== hover) setHover(next);
  }

  function onLeave() {
    pointerNdc.set(-99, -99);
    setHover(-1);
  }

  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);
  Array.prototype.forEach.call(badgeEls, function (el, i) {
    el.addEventListener('pointerenter', function () { setHover(i); });
    el.addEventListener('pointerleave', function () { setHover(-1); });
  });

  function placeBadges() {
    var w = root.clientWidth || 1;
    var h = root.clientHeight || 1;
    beams.forEach(function (b) {
      if (!b.badgeEl) return;
      b.group.localToWorld(worldPos.copy(b.badgeLocal));
      worldPos.project(camera);
      var x = (worldPos.x * 0.5 + 0.5) * w;
      var y = (-worldPos.y * 0.5 + 0.5) * h;
      b.badgeEl.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
      b.badgeEl.classList.add('is-ready');
    });
  }

  function resize() {
    var w = root.clientWidth || 960;
    var h = root.clientHeight || 540;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    world.scale.setScalar(isMobile ? 0.72 : 0.9);
    placeBadges();
  }
  resize();
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(root);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.08 }).observe(root);
  }

  function updateInflow(t) {
    prism.localToWorld(intakeWorld.copy(intakeLocal));
    world.worldToLocal(intakeWorld);
    var arr = inflowGeo.attributes.position.array;
    var n;
    for (n = 0; n < inflowCount; n++) {
      var m = inflowMeta[n];
      var u = (m.t + t * m.speed) % 1;
      var ease = u * u;
      arr[n * 3] = m.startX + (intakeWorld.x - m.startX) * ease;
      arr[n * 3 + 1] = m.y * (1 - ease * 0.7) + intakeWorld.y * ease;
      arr[n * 3 + 2] = m.z * (1 - ease) + intakeWorld.z * ease;
    }
    inflowGeo.attributes.position.needsUpdate = true;
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    var t = clock.getElapsedTime();

    world.position.y = Math.sin(t * 0.6) * 0.03;
    prismRig.rotation.y = -0.38 + Math.sin(t * 0.15) * 0.04;
    prism.position.y = Math.sin(t * 0.8) * 0.015;

    beams.forEach(function (b, n) {
      b.intensity += (b.target - b.intensity) * 0.08;
      var pulse = 0.94 + Math.sin(t * 1.2 + n * 0.6) * 0.06;
      var k = b.intensity * pulse;
      b.core.material.opacity = 0.6 + 0.38 * k;
      b.glow.material.opacity = 0.12 + 0.2 * k;
      b.halo.material.opacity = 0.04 + 0.08 * k;
      b.light.intensity = 0.22 + 0.3 * k;
      var orbS = 0.4 + 0.14 * k + Math.sin(t * 1.5 + n) * 0.03;
      b.orb.scale.set(orbS, orbS, 1);
    });

    updateInflow(t);
    placeBadges();
    renderer.render(scene, camera);
  }

  updateInflow(0);
  renderer.render(scene, camera);
  placeBadges();

  if (!reduced) tick();
  else {
    setTimeout(function () {
      resize();
      renderer.render(scene, camera);
    }, 40);
  }
})();
