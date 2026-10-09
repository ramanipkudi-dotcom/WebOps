import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import countriesData from '../data/globe.json';

export interface GlobeProps {
  className?: string;
  autoRotateSpeed?: number;
  interactive?: boolean;
}

// Enterprise connection hubs matching global network density
const HUBS = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, color: '#d1ffca' },
  { name: 'New York', lat: 40.7128, lng: -74.006, color: '#d1ffca' },
  { name: 'London', lat: 51.5074, lng: -0.1278, color: '#d1ffca' },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, color: '#fff100' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, color: '#d1ffca' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, color: '#d1ffca' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, color: '#d1ffca' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, color: '#fff100' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, color: '#d1ffca' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, color: '#d1ffca' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, color: '#d1ffca' },
  { name: 'Seoul', lat: 37.5665, lng: 126.978, color: '#d1ffca' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, color: '#d1ffca' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, color: '#d1ffca' },
  { name: 'Austin', lat: 30.2672, lng: -97.7431, color: '#d1ffca' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, color: '#d1ffca' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, color: '#fff100' }
];

// Curated network arcs calibrated with natural altitudes (0.14 - 0.26) to prevent any clipping
const SAMPLE_ARCS = [
  { startLat: 37.7749, startLng: -122.4194, endLat: 51.5074, endLng: -0.1278, color: ['#d1ffca', '#ffffff'], alt: 0.24 },
  { startLat: 40.7128, startLng: -74.006, endLat: 48.8566, endLng: 2.3522, color: ['#d1ffca', '#d1ffca'], alt: 0.18 },
  { startLat: 51.5074, startLng: -0.1278, endLat: 35.6762, endLng: 139.6503, color: ['#fff100', '#d1ffca'], alt: 0.26 },
  { startLat: 35.6762, startLng: 139.6503, endLat: 1.3521, endLng: 103.8198, color: ['#d1ffca', '#d1ffca'], alt: 0.16 },
  { startLat: 1.3521, startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, color: ['#d1ffca', '#ffffff'], alt: 0.20 },
  { startLat: -23.5505, startLng: -46.6333, endLat: 40.7128, endLng: -74.006, color: ['#d1ffca', '#d1ffca'], alt: 0.22 },
  { startLat: 25.2048, startLng: 55.2708, endLat: 50.1109, endLng: 8.6821, color: ['#fff100', '#d1ffca'], alt: 0.17 },
  { startLat: 37.7749, startLng: -122.4194, endLat: 35.6762, endLng: 139.6503, color: ['#d1ffca', '#ffffff'], alt: 0.25 },
  { startLat: 43.6532, startLng: -79.3832, endLat: 51.5074, endLng: -0.1278, color: ['#d1ffca', '#d1ffca'], alt: 0.18 },
  { startLat: 50.1109, startLng: 8.6821, endLat: 1.3521, endLng: 103.8198, color: ['#d1ffca', '#d1ffca'], alt: 0.24 },
  { startLat: -33.8688, startLng: 151.2093, endLat: 37.7749, endLng: -122.4194, color: ['#d1ffca', '#ffffff'], alt: 0.26 },
  { startLat: 40.7128, startLng: -74.006, endLat: 25.2048, endLng: 55.2708, color: ['#d1ffca', '#d1ffca'], alt: 0.22 },
  { startLat: 37.5665, startLng: 126.978, endLat: 37.7749, endLng: -122.4194, color: ['#fff100', '#d1ffca'], alt: 0.25 },
  { startLat: 52.3676, startLng: 4.9041, endLat: -23.5505, endLng: -46.6333, color: ['#d1ffca', '#ffffff'], alt: 0.24 },
  { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.006, color: ['#d1ffca', '#d1ffca'], alt: 0.14 },
  { startLat: 48.8566, startLng: 2.3522, endLat: 25.2048, endLng: 55.2708, color: ['#d1ffca', '#ffffff'], alt: 0.19 },
  { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093, color: ['#d1ffca', '#d1ffca'], alt: 0.21 },
  { startLat: 59.3293, startLng: 18.0686, endLat: 40.7128, endLng: -74.006, color: ['#d1ffca', '#d1ffca'], alt: 0.22 },
  { startLat: -23.5505, startLng: -46.6333, endLat: 51.5074, endLng: -0.1278, color: ['#fff100', '#d1ffca'], alt: 0.25 },
  { startLat: 50.1109, startLng: 8.6821, endLat: 37.7749, endLng: -122.4194, color: ['#d1ffca', '#ffffff'], alt: 0.23 },
  { startLat: 30.2672, startLng: -97.7431, endLat: 52.5200, endLng: 13.4050, color: ['#d1ffca', '#ffffff'], alt: 0.21 },
  { startLat: 22.3193, startLng: 114.1694, endLat: 51.5074, endLng: -0.1278, color: ['#fff100', '#d1ffca'], alt: 0.26 },
  { startLat: 37.7749, startLng: -122.4194, endLat: 1.3521, endLng: 103.8198, color: ['#d1ffca', '#d1ffca'], alt: 0.25 },
  { startLat: 40.7128, startLng: -74.006, endLat: -33.8688, endLng: 151.2093, color: ['#d1ffca', '#ffffff'], alt: 0.26 }
];

export const Globe: React.FC<GlobeProps> = ({
  className = '',
  autoRotateSpeed = 0.55,
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 560;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Camera distance 310 provides optimal scale with full breathing room around the sphere and arcs
    camera.position.set(0, 0, 310);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = interactive;

    // 3. Lighting (Clean editorial showroom lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(-160, 200, 220);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e8e8, 0.8);
    fillLight.position.set(200, -80, -100);
    scene.add(fillLight);

    // 4. ThreeGlobe Initialization
    const globe = new ThreeGlobe({ waitForGlobeReady: false, animateIn: false });

    // Globe base sphere material: Off-white paper finish matching Dayos brutalist style
    const globeMaterial = globe.globeMaterial() as THREE.MeshStandardMaterial;
    globeMaterial.color = new THREE.Color(0xf5f5f5);
    globeMaterial.roughness = 0.80;
    globeMaterial.metalness = 0.04;

    // Atmosphere
    globe.showAtmosphere(true);
    globe.atmosphereColor('#ffffff');
    globe.atmosphereAltitude(0.12);

    // 5. Hexagonal Dots for Continents via synchronous GeoJSON
    globe
      .hexPolygonsData((countriesData as any).features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.62)
      .hexPolygonUseDots(true)
      .hexPolygonColor(() => '#1c1c1c');

    // 6. Arcs Setup with prominent stroke and animated glow trails
    globe
      .arcsData(SAMPLE_ARCS)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcAltitude('alt')
      .arcStroke(0.85)
      .arcDashLength(0.44)
      .arcDashGap(0.22)
      .arcDashInitialGap(() => Math.random())
      .arcDashAnimateTime(2200);

    // 7. Rings Setup (pulsing signal waves at connection hubs)
    globe
      .ringsData(HUBS)
      .ringLat('lat')
      .ringLng('lng')
      .ringColor(() => (t: number) => `rgba(209, 255, 202, ${Math.max(0, 0.85 - t)})`)
      .ringMaxRadius(3.5)
      .ringPropagationSpeed(1.8)
      .ringRepeatPeriod(1400);

    // 8. Hub Points (glowing mint & yellow pin markers on surface)
    globe
      .pointsData(HUBS)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointAltitude(0.015)
      .pointRadius(0.95);

    // 9. Tactile 3D Hub Pins sticking out of the surface
    globe
      .objectsData(HUBS)
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude(0.005)
      .objectThreeObject((d: any) => {
        const group = new THREE.Group();

        // Pin stem
        const stemGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.6, 8);
        stemGeo.translate(0, 1.3, 0);
        const stemMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const stem = new THREE.Mesh(stemGeo, stemMat);

        // Pin head (glowing mint or voltage yellow sphere)
        const headGeo = new THREE.SphereGeometry(1.15, 14, 14);
        const headMat = new THREE.MeshBasicMaterial({
          color: d.color === '#fff100' ? 0xfff100 : 0xd1ffca
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.6;

        // Glowing aura around pin head
        const auraGeo = new THREE.SphereGeometry(1.7, 12, 12);
        const auraMat = new THREE.MeshBasicMaterial({
          color: d.color === '#fff100' ? 0xfff100 : 0xd1ffca,
          transparent: true,
          opacity: 0.42
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.position.y = 2.6;

        group.add(stem, head, aura);
        return group;
      });

    // Initial globe angle matching reference photo (Americas & Atlantic facing forward)
    globe.rotation.x = THREE.MathUtils.degToRad(12);
    globe.rotation.y = THREE.MathUtils.degToRad(55);

    scene.add(globe);

    // 10. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotateSpeed, interactive]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Soft organic contact shadow directly beneath the bottom curve of the globe */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[62%] h-[34px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 46%, transparent 72%)',
          filter: 'blur(10px)',
          borderRadius: '50%'
        }}
      />
    </div>
  );
};
