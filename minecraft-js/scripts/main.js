import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics.js';
import { createUI } from './ui.js';
import { blocks } from './blocks';
import { ModelLoader } from './modelLoader';


// UI Setup - Shton një panel statistikor për të shfaqur performancën e lojës
const stats = new Stats(); // Krijon një instancë të `Stats` për të monitoruar FPS dhe përdorimin e CPU/GPU.
document.body.append(stats.dom); // Shton panelin e statistikave në dokumentin HTML.

// Renderer setup - Konfigurimi i motorit grafik për vizualizimin e skenës 3D
const renderer = new THREE.WebGLRenderer(); // Krijon një renderer për të vizatuar grafikën me WebGL.
renderer.setPixelRatio(window.devicePixelRatio); // Përshtat cilësinë e renderit me densitetin e pikselave të ekranit.
renderer.setSize(window.innerWidth, window.innerHeight); // Vendos madhësinë e ekranit sipas përmasave të dritares së shfletuesit.
renderer.setClearColor(0x80a0e0); // Vendos një ngjyrë blu të hapur si sfond të skenës 3D.
renderer.shadowMap.enabled = true; // Aktivizon hijet për objekte të ndriçuara.
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Përdor hijet e buta për efekte më realiste.
document.body.appendChild(renderer.domElement); // Shton elementin `canvas` të renderer-it në dokumentin HTML për të shfaqur grafikën.


// Camera setup - Konfigurimi i kamerës për të parë botën 3D
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
// Krijon një kamerë perspektivë me një kënd shikimi 75° dhe një raport të ekranit bazuar në madhësinë e dritares.
orbitCamera.position.set(-20, 20, -20); 
// Vendos pozicionin fillestar të kamerës në hapësirën 3D me koordinata (x: -20, y: 20, z: -20).
// Kjo e vendos kamerën pak larg nga origjina për një pamje më të mirë të skenës.
orbitCamera.layers.enable(1); 
// Aktivizon një shtresë të veçantë (`layer 1`) për kamerën, që mund të përdoret për të parë objekte specifike.
// Kontrolli i lëvizjes së kamerës
const controls = new OrbitControls(orbitCamera, renderer.domElement); 
// Krijon kontrolle interaktive të kamerës duke përdorur `OrbitControls`.
// Kjo lejon përdoruesin të rrotullojë, zmadhon dhe lëviz kamerën duke përdorur miun.
controls.target.set(16, 16, 16); 
// Vendos pikën ku duhet të fokusohet kamera
// (qendra e skenës në koordinatat x: 16, y: 16, z: 16).
controls.update(); 
// Përditëson kontrollet për të aplikuar ndryshimet në pozicionin e kamerës.
// Scene setup - Krijimi i skenës ku do të vendosen objektet 3D
const scene = new THREE.Scene(); 
// Krijon një skenë bosh ku do të vendosen blloqet dhe objektet e lojës.
scene.fog = new THREE.Fog(0x80a0e0, 500, 1000); 
// Shton efektin e mjegullës me një ngjyrë blu të hapur (0x80a0e0).
// Mjegulla fillon në distancën 500 njësi dhe bëhet e plotë në 1000 njësi.


// Krijimi i botës 3D
const world = new World(); 
// Krijon një instancë të klasës `World`, e cila përfaqëson botën e lojës.
world.generate(); 
// Gjeneron botën duke përdorur metodën `generate()`, e cila mund të krijojë terrenin, blloqet dhe strukturat.
scene.add(world); 
// Shton botën në skenë për ta bërë të dukshme në lojë.



// Krijimi i lojtarit dhe fizikës në lojë
const player = new Player(scene); 
// Krijon një lojtar dhe e lidh atë me skenën aktuale.
const physics = new Physics(scene); 
// Krijon sistemin fizik që menaxhon përplasjet dhe lëvizjet e objekteve në botën 3D.


// Ngarkimi i modeleve 3D për lojtarin
const modelLoader = new ModelLoader(); 
// Krijon një instancë të `ModelLoader`, që përdoret për të ngarkuar modele 3D.


modelLoader.loadModels((models) => { 
    // Ngarkon modelet 3D dhe, kur përfundojnë, ekzekuton funksionin callback.
    player.tool.setMesh(models.pickaxe); 
    // Vendos modelin e kazmës (`pickaxe`) si mjeti që përdor lojtari.
});



const sun = new THREE.DirectionalLight(); 
// Krijon një burim drite drejtimi (`DirectionalLight`), i cili simulon dritën e diellit.

// Funksioni për konfigurimin e ndriçimit
function setupLights() {
    sun.intensity = 3; 
    // Vendos intensitetin e dritës. Një vlerë më e lartë e bën më të ndritshme skenën.

    sun.position.set(20, 20, 20); 
    // Vendos pozicionin e dritës në koordinatat (x: 20, y: 20, z: 20).
    // Kjo e vendos dritën mbi skenë për të ndriçuar objektet nga lart.

    sun.castShadow = true; 
    // Aktivizon krijimin e hijes nga drita, duke e bërë skenën më realiste.



    // Vendos madhësinë e kutisë së hijes për dritën e diellit
sun.shadow.camera.left = -50;  // Përcakton kufirin e majtë të zonës së hijes (-50 njësi).
sun.shadow.camera.right = 50;  // Përcakton kufirin e djathtë të zonës së hijes (50 njësi).
sun.shadow.camera.bottom = -50; // Kufiri i poshtëm i hijes (-50 njësi).
sun.shadow.camera.top = 50;    // Kufiri i sipërm i hijes (50 njësi).

sun.shadow.camera.near = 0.1;  // Distanca minimale ku fillon të ndikohet nga hija.
sun.shadow.camera.far = 100;   // Distanca maksimale ku hija është e dukshme.

sun.shadow.bias = -0.0005;  
// Shton një zhvendosje të vogël për të parandaluar defekte vizuale të hijes (`shadow acne`).

sun.shadow.mapSize = new THREE.Vector2(2048, 2048);  
// Vendos rezolucionin e hartës së hijes në 2048x2048 për hije më të qarta.

scene.add(sun);  
// Shton dritën e diellit në skenë për të ndriçuar objektet.

scene.add(sun.target);  
// Shton objektin e synuar nga drita në skenë për të përcaktuar drejtimin e rrezeve të saj.


const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);  
// Krijon një ndihmës vizual (`CameraHelper`) që tregon zonën e hijes së diellit.
// Kjo ndihmon për të parë në cilën zonë do të bien hijet në skenë.

scene.add(shadowHelper);  
// Shton ndihmësin e hijes në skenë, duke e bërë atë të dukshëm në ekran për debug.

const ambient = new THREE.AmbientLight();  
// Krijon një dritë ambientale (`AmbientLight`) që ndriçon të gjitha objektet njëtrajtësisht.
// Kjo ndihmon për të parandaluar errësimin e plotë të zonave pa dritë direkte.

ambient.intensity = 0.1;  
// Vendos intensitetin e dritës ambientale në 0.1, duke shtuar një dritë të lehtë në skenë.

scene.add(ambient);  
// Shton dritën ambientale në skenë për të siguruar një ndriçim të butë.
}

function onMouseDown(event) { 
  // Ky funksion ekzekutohet kur përdoruesi klikon me maus.

  if (player.controls.isLocked && player.selectedCoords) { 
      // Kontrollon nëse kontrolli i lojtarit është i bllokuar (p.sh., në modalitetin e lojës) 
      // dhe nëse ka një bllok të zgjedhur në koordinatat përkatëse.

      if (player.activeBlockId === blocks.empty.id) { 
          // Kontrollon nëse lojtari ka zgjedhur një bllok bosh për ta hequr.

          console.log(`removing block at ${JSON.stringify(player.selectedCoords)}`);  
          // Printon në console koordinatat e bllokut që do të hiqet, për qëllime debug-u.

          world.removeBlock(
              player.selectedCoords.x,
              player.selectedCoords.y,
              player.selectedCoords.z
          );  
          // Thërret funksionin `removeBlock()` për të hequr bllokun në koordinatat e zgjedhura.
 


          player.tool.startAnimation();  
          // Aktivizon animacionin e veglës së lojtarit kur ai heq një bllok (p.sh., lëvizja e kazmës).
          
          } else {  
              // Nëse lojtari nuk po heq një bllok, atëherë do të vendosë një bllok të ri.
          
              console.log(`add block at ${JSON.stringify(player.selectedCoords)}`);  
              // Printon në console koordinatat e bllokut që do të shtohet, për qëllime debug-u.
          
              world.addBlock(
                  player.selectedCoords.x,
                  player.selectedCoords.y,
                  player.selectedCoords.z,
                  player.activeBlockId
              );  
              // Shton një bllok të ri në koordinatat e zgjedhura me ID-në e bllokut aktiv të lojtarit.
          }
        }
      }
          document.addEventListener('mousedown', onMouseDown);  
          // Shton një dëgjues (`event listener`) për klikimin e mausit.
          // Kur përdoruesi klikon, ekzekutohet funksioni `onMouseDown()`, i cili vendos ose heq një bllok.
          



// Render loop - Funksion për të rifreskuar vazhdimisht lojën dhe për të përditësuar skenën
let previousTime = performance.now();  
// Ruajmë kohën e mëparshme për të llogaritur diferencën midis frame-ve.

function animate() {
    let currentTime = performance.now();  
    // Merr kohën aktuale në milisekonda.

    let dt = (currentTime - previousTime) / 1000;  
    // Llogarit ndryshimin e kohës (`delta time`) midis dy frame-ve në sekonda.
    // Kjo ndihmon për të siguruar lëvizje të qëndrueshme pavarësisht shpejtësisë së kompjuterit.

    requestAnimationFrame(animate);  
    // Kërkon ekzekutimin e funksionit `animate()` në frame-in tjetër të shfaqjes.
    // Kjo krijon një cikël të vazhdueshëm për rifreskimin e lojës.



    
  // Përditëso fizikën dhe botën vetëm kur kontrolli i lojtarit është i bllokuar
if (player.controls.isLocked) {  
  player.update(world);  
  // Përditëson gjendjen e lojtarit bazuar në botën aktuale.

  physics.update(dt, player, world);  
  // Përditëson simulimin fizik duke përdorur kohën `dt`, lojtarin dhe botën.

  world.update(player);  
  // Përditëson elementët e botës bazuar në pozicionin e lojtarit.

// Përcakton pozicionin e diellit në raport me lojtarin
  sun.position.copy(player.position);  
  // Vendos pozicionin e diellit në të njëjtin vend si lojtari.

  sun.position.sub(new THREE.Vector3(-50, -50, -50));  
  // Zhvendos diellin pak pas dhe lart për të ruajtur këndin e dritës.

  sun.target.position.copy(player.position);  
  // Përcakton që dielli të ndriçojë drejt lojtarit.
}


renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);  
// Renderon skenën duke përdorur kamerën aktive:
// - Nëse kontrolli i lojtarit është i bllokuar (`isLocked`),
// përdor kamerën e lojtarit (`player.camera`).
// - Përndryshe, përdor kamerën orbitale (`orbitCamera`),
// e cila mund të lëvizet lirshëm rreth skenës.

stats.update();  
// Përditëson panelin e statistikave (`Stats`), i cili monitoron performancën e lojës (FPS, përdorimin e CPU/GPU).

previousTime = currentTime;  
// Rifreskon kohën e mëparshme për të llogaritur `delta time` në ciklin e ardhshëm të `animate()`.
}

// Window resize event listener - Përditëson kamerat dhe renderuesin kur dritarja ndryshon madhësinë
window.addEventListener('resize', () => {
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  
  

  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  // Përditëson `aspect ratio` për kamerën e lojtarit në mënyrë që pamja të mos deformohet.

  renderer.setSize(window.innerWidth, window.innerHeight);
  // Rregullon përmasat e renderuesit për t'iu përshtatur dritares së re.
});


setupLights();  
// Thërret funksionin për të vendosur dritat e skenës (dielli, drita ambientale).

// Krijimi i ndërfaqes së përdoruesit (UI)
createUI(scene, world, player);  
// Thërret funksionin që krijon elementët e UI-së në bazë të skenës, botës dhe lojtarit.

// Nis animacionin dhe ciklin e lojës
animate();  
// Thërret funksionin `animate()`, i cili fillon ciklin e vazhdueshëm të rifreskimit të lojës.
