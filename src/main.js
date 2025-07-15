import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7.5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

// HDR Environment
new RGBELoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
  (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture;
  }
);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Load GLTF Model
let carModel;
const loader = new GLTFLoader();
loader.load(
  '/scene.gltf',
  (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(1, 1, 1);
    carModel.position.set(0, -1, 0);
    carModel.rotation.y = Math.PI;
    scene.add(carModel);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.002;
composer.addPass(rgbShiftPass);

// Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Full Drag Interaction
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let currentRotation = { x: 0, y: Math.PI }; // start facing front

// Desktop Mouse
window.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging || !carModel) return;

  const deltaX = (e.clientX - previousMousePosition.x) * 0.005;
  const deltaY = (e.clientY - previousMousePosition.y) * 0.005;

  currentRotation.y += deltaX;
  currentRotation.x += deltaY;
  currentRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentRotation.x));

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

// Touch Support
window.addEventListener('touchstart', (e) => {
  isDragging = true;
  previousMousePosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };
});

window.addEventListener('touchend', () => {
  isDragging = false;
});

window.addEventListener('touchmove', (e) => {
  if (!isDragging || !carModel) return;

  const deltaX = (e.touches[0].clientX - previousMousePosition.x) * 0.005;
  const deltaY = (e.touches[0].clientY - previousMousePosition.y) * 0.005;

  currentRotation.y += deltaX;
  currentRotation.x += deltaY;
  currentRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentRotation.x));

  previousMousePosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  if (carModel) {
    gsap.to(carModel.rotation, {
      x: currentRotation.x,
      y: currentRotation.y,
      duration: 0.5,
      ease: 'power2.out',
    });
  }

  composer.render();
}
animate();
