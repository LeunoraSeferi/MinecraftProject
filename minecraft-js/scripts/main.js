import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics.js';
import { createUI } from './ui.js';
import { blocks } from './blocks';


// UI Setup
const stats = new Stats();
document.body.append(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
orbitCamera.position.set(-20,20,-20);
orbitCamera.layers.enable(1);
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16,16,16);
controls.update();
// Scene setup
const scene = new THREE.Scene();
scene.fog=new THREE.Fog(0x80a0e0, 50, 100);

const world = new World();
world.generate();
scene.add(world);


const player = new Player(scene);
const physics = new Physics(scene);
const sun = new THREE.DirectionalLight();


// Lighting setup
function setupLights() {
    
    sun.position.set(50,50,50);
    sun.castShadow=true;
    sun.shadow.camera.left=-100;
    sun.shadow.camera.right=100;
    sun.shadow.camera.bottom=-100;
    sun.shadow.camera.top=100;
    sun.shadow.camera.near=0.1;
    sun.shadow.camera.far=200;
    sun.shadow.bias=-0.0001;
    sun.shadow.mapSize=new THREE.Vector2(2048,2048);
    scene.add(sun);
    scene.add(sun.target);

   const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
   scene.add(shadowHelper);

    const ambient = new THREE.AmbientLight();
    ambient.intensity = 0.1;
    scene.add(ambient);
}



function onMouseDown(event){
  if(player.controls.isLocked && player.selectedCoords){
    if(player.activeBlockId === blocks.empty.id){
    console.log(`removing blocks at ${JSON.stringify(player.selectedCoords)}`)
    world.removeBlock(
      player.selectedCoords.x,
      player.selectedCoords.y,
      player.selectedCoords.z
    );
    } else {
      console.log(`add blocks at ${JSON.stringify(player.selectedCoords)}`)
      world.addBlock(
      player.selectedCoords.x,
      player.selectedCoords.y,
      player.selectedCoords.z,
      player.activeBlockId
    );
    }
  }
}
document.addEventListener('mousedown',onMouseDown);



// Render loop
let previousTime=performance.now();
function animate() {
    let currentTime=performance.now();
    let dt =(currentTime - previousTime) / 1000;

    requestAnimationFrame(animate);


    
  // Only update physics when player controls are locked
  if (player.controls.isLocked) {
    player.update(world);
    physics.update(dt, player, world);
    world.update(player);

    
    // Position the sun relative to the player. Need to adjust both the
    // position and target of the sun to keep the same sun angle
    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);

  }




    renderer.render(scene,player.controls.isLocked ? player.camera:
    orbitCamera);
    stats.update();
    
    previousTime=currentTime;
}

// Window resize event listener
window.addEventListener('resize', () => {
    orbitCamera.aspect = window.innerWidth / window.innerHeight;
    orbitCamera.updateProjectionMatrix();

    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});


setupLights();
createUI(scene,world,player);
animate();
