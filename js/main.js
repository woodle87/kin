import * as THREE from 'three';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

import { Physics } from './physics.js';
import { Terrain } from './terrain.js';
import { Vehicle } from './vehicle.js';
import { UI } from './ui.js';
import { getKeys, checkKeyOnce } from './utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

// Setup
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8e6);
scene.fog = new THREE.Fog(0x87b8e6, 180, 420);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Lighting (UPDATED)

// Ambient mais suave
const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

// Luz de céu (mais natural para ambientes externos)
const hemiLight = new THREE.HemisphereLight(0xdff4ff, 0x7a7468, 0.9);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// Luz principal (sol)
const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
dirLight.position.set(80, 120, 60);
dirLight.castShadow = true;

// Qualidade da sombra
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Área de projeção da sombra (menor = sombra melhor)
dirLight.shadow.camera.left = -45;
dirLight.shadow.camera.right = 45;
dirLight.shadow.camera.top = 45;
dirLight.shadow.camera.bottom = -45;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 260;

// Correções de artefatos de sombra
dirLight.shadow.bias = -0.00008;
dirLight.shadow.normalBias = 0.02;

scene.add(dirLight);

// Initialization
const ui = new UI();
const physics = new Physics();
const terrain = new Terrain(scene, physics);
const vehicle = new Vehicle(scene, physics);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// Camera modes
const CAM_MODES = ['CHASE', 'HOOD', 'TOP', 'ORBIT'];
let camIndex = 0;

// Teleport locations
const TP_ZONES = [
  new CANNON.Vec3(0, 4, 0),        // Start
  new CANNON.Vec3(0, 4, 50),       // Bumps
  new CANNON.Vec3(100, 4, 0),      // Ramp
  new CANNON.Vec3(-100, 4, 0),     // Rocks
  new CANNON.Vec3(0, 4, -100),     // Jump
];
let tpIndex = 0;

ui.hideLoading();

// Car Selector Logic
const carSelector = document.getElementById('car-selector');
carSelector.addEventListener('change', (e) => {
  vehicle.loadCarModel(e.target.value);
});

const clock = new THREE.Clock();
let sessionTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  sessionTime += dt;
  const keys = getKeys();

  if (keys.r) {
    vehicle.reset();
  }

  if (checkKeyOnce('c')) {
    camIndex = (camIndex + 1) % CAM_MODES.length;
    ui.updateCameraName(CAM_MODES[camIndex]);
    controls.enabled = (CAM_MODES[camIndex] === 'ORBIT');
  }

  if (checkKeyOnce('t')) {
    tpIndex = (tpIndex + 1) % TP_ZONES.length;
    vehicle.reset(TP_ZONES[tpIndex]);
  }

  physics.step(Math.min(dt, 0.1));
  vehicle.update(keys);

  const carPos = vehicle.chassisBody.position;
  const carQuat = vehicle.chassisBody.quaternion;

  if (CAM_MODES[camIndex] === 'CHASE') {
    const q = new THREE.Quaternion(carQuat.x, carQuat.y, carQuat.z, carQuat.w);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const targetPos = new THREE.Vector3(carPos.x, carPos.y, carPos.z)
      .add(forward.multiplyScalar(10))
      .add(new THREE.Vector3(0, 4, 0));
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(carPos.x, carPos.y + 0.5, carPos.z);
  } else if (CAM_MODES[camIndex] === 'HOOD') {
    const q = new THREE.Quaternion(carQuat.x, carQuat.y, carQuat.z, carQuat.w);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const targetPos = new THREE.Vector3(carPos.x, carPos.y, carPos.z)
      .add(up.multiplyScalar(0.8))
      .add(forward.multiplyScalar(0.5));
    camera.position.copy(targetPos);
    const look = targetPos.clone().add(forward.multiplyScalar(10));
    camera.lookAt(look);
  } else if (CAM_MODES[camIndex] === 'TOP') {
    camera.position.set(carPos.x, carPos.y + 30, carPos.z);
    camera.lookAt(carPos.x, carPos.y, carPos.z);
  } else if (CAM_MODES[camIndex] === 'ORBIT') {
    controls.target.set(carPos.x, carPos.y, carPos.z);
    controls.update();
  }

  const up = new THREE.Vector3(0, 1, 0);
  const carUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
    new THREE.Quaternion(carQuat.x, carQuat.y, carQuat.z, carQuat.w)
  );
  const inclination = up.angleTo(carUp) * (180 / Math.PI);

  ui.updateTelemetry(
    vehicle.getSpeed(),
    keys.s,
    vehicle.getSpeed() / 150,
    vehicle.getSuspensionLoad()
  );

  ui.updateTrackZone(terrain.getCurrentZone(carPos));
  ui.updateExtraData(inclination, sessionTime);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();