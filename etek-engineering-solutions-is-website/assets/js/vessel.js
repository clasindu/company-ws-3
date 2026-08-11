/* =========================================================================
   ETEK - Container vessel, built with three.js
   -------------------------------------------------------------------------
   Drives the Noah Port / Noah Depo visual in the Products section. The scene
   is assembled from primitives so nothing has to be downloaded beyond the
   local three.js build, and the still photograph underneath stays visible if
   WebGL is unavailable.

   Loaded as a classic script against the global three.js build, so the page
   also works when index.html is opened straight from disk. Module scripts are
   blocked over file:// and would leave only the fallback photograph.

   Colours are read from the CSS design tokens so the model always matches the
   brand palette defined in tokens.css.
   ========================================================================= */
(function () {
  'use strict';

  var THREE = window.THREE;
  var canvas = document.getElementById('vessel-canvas');
  var shell = document.getElementById('vessel');

  if (!canvas || !shell) return;

  if (!THREE) {
    console.warn('ETEK vessel: three.js did not load; keeping the still photograph.');
    return;
  }

  try {
    build();
  } catch (error) {
    /* Leave the photographic fallback in place. */
    console.warn('ETEK vessel: 3D scene unavailable.', error);
  }

  function token(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function build() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var palette = {
      hull: token('--brand-baltic-500', '#05668d'),
      hullDark: token('--brand-baltic-300', '#033e56'),
      deck: token('--brand-cerulean-300', '#284a62'),
      house: token('--brand-alice-500', '#ebf2fa'),
      houseDark: token('--brand-cerulean-300', '#284a62'),
      accent: token('--brand-lime-500', '#a5be00'),
      water: token('--brand-baltic-200', '#022a39'),
      sky: token('--brand-baltic-900', '#b9e9fc'),
      rim: token('--brand-baltic-700', '#2dbef7'),
      containers: [
        token('--brand-baltic-500', '#05668d'),
        token('--brand-cerulean-500', '#427aa1'),
        token('--brand-lime-500', '#a5be00'),
        token('--brand-sage-500', '#679436'),
        token('--brand-baltic-600', '#089bd5'),
        token('--brand-cerulean-400', '#356282')
      ]
    };

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color(palette.water), 95, 300);

    var camera = new THREE.PerspectiveCamera(34, 16 / 11, 0.5, 400);

    /* --- lighting ------------------------------------------------------- */
    var hemi = new THREE.HemisphereLight(
      new THREE.Color(palette.sky),
      new THREE.Color(palette.water),
      1.15
    );
    scene.add(hemi);

    var sun = new THREE.DirectionalLight(0xffffff, 3.1);
    sun.position.set(26, 30, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.bias = -0.0008;
    scene.add(sun);

    var rim = new THREE.DirectionalLight(new THREE.Color(palette.rim), 0.85);
    rim.position.set(-24, 12, -20);
    scene.add(rim);

    /* --- water ---------------------------------------------------------- */
    var water = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.water),
        roughness: 0.28,
        metalness: 0.55
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);

    /* --- vessel --------------------------------------------------------- */
    var ship = new THREE.Group();
    scene.add(ship);

    var hullMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.hull),
      roughness: 0.55,
      metalness: 0.25
    });
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.deck),
      roughness: 0.85,
      metalness: 0.1
    });

    // Plan-view outline: raked bow to starboard tip, rounded stern.
    var plan = new THREE.Shape();
    plan.moveTo(-17, -4);
    plan.lineTo(11, -4);
    plan.quadraticCurveTo(17, -3.5, 20.5, 0);
    plan.quadraticCurveTo(17, 3.5, 11, 4);
    plan.lineTo(-17, 4);
    plan.quadraticCurveTo(-19.6, 3.3, -19.6, 0);
    plan.quadraticCurveTo(-19.6, -3.3, -17, -4);

    var hull = new THREE.Mesh(
      new THREE.ExtrudeGeometry(plan, {
        depth: 5.2,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 2,
        curveSegments: 26
      }),
      [deckMaterial, hullMaterial]   // group 0 = end caps, group 1 = side walls
    );
    hull.rotation.x = -Math.PI / 2;  // extrude upward
    hull.position.y = -1.7;          // sit the keel below the waterline
    hull.castShadow = true;
    hull.receiveShadow = true;
    ship.add(hull);

    var DECK_Y = 5.2 - 1.7;

    // Dark boot-topping band just above the waterline.
    var boot = new THREE.Mesh(
      new THREE.ExtrudeGeometry(plan, {
        depth: 0.9,
        bevelEnabled: true,
        bevelThickness: 0.42,
        bevelSize: 0.42,
        bevelSegments: 1,
        curveSegments: 26
      }),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.hullDark),
        roughness: 0.7,
        metalness: 0.2
      })
    );
    boot.rotation.x = -Math.PI / 2;
    boot.position.y = -1.5;
    ship.add(boot);

    /* --- containers ------------------------------------------------------ */
    var BOX_L = 6;
    var BOX_W = 2.4;
    var BOX_H = 2.6;
    var boxGeometry = new THREE.BoxGeometry(BOX_L, BOX_H, BOX_W);

    // Tier counts per bay and row give the stack an uneven, working profile.
    var stacks = [
      [4, 5, 4],
      [5, 6, 5],
      [3, 4, 3]
    ];
    var bayX = [-6.4, 0, 6.4];
    var rowZ = [-2.55, 0, 2.55];

    var colourIndex = 0;
    stacks.forEach(function (rows, bay) {
      rows.forEach(function (tiers, row) {
        for (var tier = 0; tier < tiers; tier += 1) {
          var base = palette.containers[colourIndex % palette.containers.length];
          colourIndex += 1;

          var side = new THREE.MeshStandardMaterial({
            color: new THREE.Color(base),
            roughness: 0.72,
            metalness: 0.16
          });
          var end = new THREE.MeshStandardMaterial({
            color: new THREE.Color(base).multiplyScalar(0.72),
            roughness: 0.78,
            metalness: 0.16
          });
          var top = new THREE.MeshStandardMaterial({
            color: new THREE.Color(base).multiplyScalar(1.08),
            roughness: 0.8,
            metalness: 0.14
          });

          // BoxGeometry material order: +x, -x, +y, -y, +z, -z
          var box = new THREE.Mesh(boxGeometry, [end, end, top, end, side, side]);
          box.position.set(
            bayX[bay],
            DECK_Y + BOX_H / 2 + tier * (BOX_H + 0.06),
            rowZ[row]
          );
          box.castShadow = true;
          box.receiveShadow = true;
          ship.add(box);
        }
      });
    });

    /* --- accommodation block, bridge and funnel -------------------------- */
    var houseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.house),
      roughness: 0.6,
      metalness: 0.08
    });
    var houseTrim = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.houseDark),
      roughness: 0.5,
      metalness: 0.3
    });

    var house = new THREE.Mesh(new THREE.BoxGeometry(6.4, 8.4, 6.6), houseMaterial);
    house.position.set(-13.2, DECK_Y + 4.2, 0);
    house.castShadow = true;
    house.receiveShadow = true;
    ship.add(house);

    // Window bands break up the block.
    for (var level = 0; level < 4; level += 1) {
      var band = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.55, 6.7), houseTrim);
      band.position.set(-13.2, DECK_Y + 2 + level * 1.7, 0);
      ship.add(band);
    }

    // Bridge deck, wider than the block to read as bridge wings.
    var bridge = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.7, 9.2), houseTrim);
    bridge.position.set(-13.2, DECK_Y + 9.2, 0);
    bridge.castShadow = true;
    ship.add(bridge);

    var funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.25, 3.6, 24),
      houseTrim
    );
    funnel.position.set(-16.6, DECK_Y + 6.2, 0);
    funnel.castShadow = true;
    ship.add(funnel);

    // Brand band on the funnel.
    var funnelBand = new THREE.Mesh(
      new THREE.CylinderGeometry(1.16, 1.16, 1, 24),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.accent),
        roughness: 0.45,
        metalness: 0.2
      })
    );
    funnelBand.position.set(-16.6, DECK_Y + 6.6, 0);
    ship.add(funnelBand);

    /* --- forecastle and mast --------------------------------------------- */
    var forecastle = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.5, 6.2), deckMaterial);
    forecastle.position.set(14, DECK_Y + 0.75, 0);
    forecastle.castShadow = true;
    ship.add(forecastle);

    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 6, 12),
      houseTrim
    );
    mast.position.set(13, DECK_Y + 4.5, 0);
    mast.castShadow = true;
    ship.add(mast);

    var crossTree = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 3.2), houseTrim);
    crossTree.position.set(13, DECK_Y + 6.6, 0);
    ship.add(crossTree);

    /* --- hatch coaming rails, one per bay -------------------------------- */
    bayX.forEach(function (x) {
      var coaming = new THREE.Mesh(new THREE.BoxGeometry(BOX_L + 0.5, 0.4, 8.2), houseTrim);
      coaming.position.set(x, DECK_Y + 0.2, 0);
      coaming.receiveShadow = true;
      ship.add(coaming);
    });

    /* --- camera orbit ----------------------------------------------------
       `base` is the framing distance for the current canvas size and `zoom`
       is the visitor's multiplier on top of it, so resizing never discards
       a zoom level.                                                        */
    var target = new THREE.Vector3(-0.5, 7, 0);
    var view = { base: 56, zoom: 1, azimuth: -0.78, polar: 1.22 };
    var POLAR_MIN = 0.42;
    var POLAR_MAX = 1.44;
    // Closest zoom still frames the whole vessel; furthest sits it in open water.
    var ZOOM_MIN = 0.74;
    var ZOOM_MAX = 1.6;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function placeCamera() {
      var radius = view.base * view.zoom;
      camera.position.set(
        target.x + radius * Math.sin(view.polar) * Math.cos(view.azimuth),
        target.y + radius * Math.cos(view.polar),
        target.z + radius * Math.sin(view.polar) * Math.sin(view.azimuth)
      );
      camera.lookAt(target);
    }

    function applyZoom(factor) {
      var before = view.zoom;
      view.zoom = clamp(view.zoom * factor, ZOOM_MIN, ZOOM_MAX);
      if (view.zoom !== before) placeCamera();
      return view.zoom !== before;
    }

    /* --- pointer interaction --------------------------------------------
       Pointers are tracked in a map so a two-finger pinch can zoom without
       interfering with single-finger dragging.                             */
    var pointers = new Map();
    var lastPinch = 0;
    var idleFor = 0;
    var dragging = false;

    function pinchDistance() {
      var points = Array.from(pointers.values());
      var dx = points[0].x - points[1].x;
      var dy = points[0].y - points[1].y;
      return Math.hypot(dx, dy);
    }

    canvas.addEventListener('pointerdown', function (event) {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      idleFor = 0;
      dragging = pointers.size === 1;
      if (pointers.size === 2) lastPinch = pinchDistance();
      canvas.setPointerCapture(event.pointerId);
      shell.classList.add('is-engaged');
    });

    canvas.addEventListener('pointermove', function (event) {
      var previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size >= 2) {
        // Pinch: scale the zoom by the change in finger separation.
        var distance = pinchDistance();
        if (lastPinch > 0 && distance > 0) applyZoom(lastPinch / distance);
        lastPinch = distance;
        event.preventDefault();
        return;
      }

      if (!dragging) return;
      idleFor = 0;
      view.azimuth -= (event.clientX - previous.x) * 0.006;
      view.polar = clamp(view.polar - (event.clientY - previous.y) * 0.005, POLAR_MIN, POLAR_MAX);
      placeCamera();
    });

    function endPointer(event) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) lastPinch = 0;
      if (pointers.size === 0) dragging = false;
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('pointerleave', endPointer);

    /* Wheel zoom is armed only once the visitor has interacted with the
       model, so scrolling past the section never gets trapped. */
    canvas.addEventListener('wheel', function (event) {
      if (!shell.classList.contains('is-engaged')) return;
      var changed = applyZoom(event.deltaY > 0 ? 1.1 : 0.9);
      // At a zoom limit the gesture falls through and the page scrolls.
      if (changed) {
        event.preventDefault();
        idleFor = 0;
      }
    }, { passive: false });

    document.addEventListener('pointerdown', function (event) {
      if (!shell.contains(event.target)) shell.classList.remove('is-engaged');
    });

    canvas.addEventListener('dblclick', function () {
      applyZoom(0.8);
    });

    /* --- zoom buttons ---------------------------------------------------- */
    var controls = shell.querySelectorAll('[data-vessel-action]');
    Array.prototype.forEach.call(controls, function (button) {
      button.addEventListener('click', function () {
        var action = button.dataset.vesselAction;
        idleFor = 0;
        if (action === 'zoom-in') applyZoom(0.82);
        if (action === 'zoom-out') applyZoom(1.22);
        if (action === 'reset') {
          view.zoom = 1;
          view.azimuth = -0.78;
          view.polar = 1.22;
          placeCamera();
        }
      });
    });

    /* --- sizing ---------------------------------------------------------- */
    function resize() {
      var width = canvas.clientWidth || 1;
      var height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Pull the camera back on narrow viewports so the vessel always fits.
      view.base = width < 560 ? 72 : 56;
      camera.updateProjectionMatrix();
      placeCamera();
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    /* --- render loop, paused when off-screen ----------------------------- */
    var clock = new THREE.Clock();
    var visible = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.02 }).observe(shell);
    }

    var ready = false;

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;

      var delta = Math.min(clock.getDelta(), 0.05);
      var elapsed = clock.elapsedTime;

      if (!reducedMotion) {
        // Idle auto-rotation resumes a moment after the visitor stops dragging.
        if (dragging || pointers.size > 0) {
          idleFor = 0;
        } else {
          idleFor += delta;
          if (idleFor > 1.2) view.azimuth += delta * 0.055;
          placeCamera();
        }

        ship.position.y = Math.sin(elapsed * 0.62) * 0.16;
        ship.rotation.z = Math.sin(elapsed * 0.48) * 0.014;
        ship.rotation.x = Math.sin(elapsed * 0.37) * 0.006;
      }

      renderer.render(scene, camera);

      if (!ready) {
        ready = true;
        shell.classList.add('is-ready');
      }
    }

    frame();

    /* Rebuild materials when the theme changes so the model keeps matching. */
    var themeObserver = new MutationObserver(function () {
      hemi.color.set(token('--brand-baltic-900', '#b9e9fc'));
      var waterColour = token('--brand-baltic-200', '#022a39');
      water.material.color.set(waterColour);
      scene.fog.color.set(waterColour);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
})();
