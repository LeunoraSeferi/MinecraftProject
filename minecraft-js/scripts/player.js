import * as THREE from 'three';
import {World} from './world';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { blocks } from './blocks';
import { Tool } from './tool';


/**
 * Ky skript menaxhon lojtarin, duke përfshirë:
Lëvizjen (W, A, S, D) dhe kërcimin (Space).
Kamerën dhe kontrollin me maus.
Përzgjedhjen dhe vendosjen e blloqeve.
Përplasjet dhe fizikën e lojtarit.
 */


const CENTER_SCREEN = new THREE.Vector2(); 
// Vektor që përfaqëson qendrën e ekranit për gjurmimin e objektivave.

/**
 * Klasë që përfaqëson lojtarin dhe menaxhon lëvizjet, fizikën dhe ndërveprimin e tij.
 */
export class Player {
    radius = 0.5; // Rrezja e cilindrit kufizues të lojtarit
    height = 1.75; // Lartësia e lojtarit
    jumpSpeed = 10; // Shpejtësia e kërcimit
    onGround = false; // Statusi nëse lojtari është në tokë

    maxSpeed = 10; // Shpejtësia maksimale e lëvizjes
    input = new THREE.Vector3(); // Vektori që ruan input-et e lojtarit
    velocity = new THREE.Vector3(); // Shpejtësia aktuale e lojtarit
    #worldVelocity = new THREE.Vector3(); // Shpejtësia në botën e lojës

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    // Kamera e lojtarit me kënd shikimi 70° dhe distancë shikimi nga 0.1 deri në 200 njësi.

    controls = new PointerLockControls(this.camera, document.body);
    // Kontrollues që i lejon lojtarit të lëvizë me miun kur është i bllokuar.

    cameraHelper = new THREE.CameraHelper(this.camera);
    // Ndihmës për shfaqjen e kamerës në botën 3D (përdoret për debug).

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
    // `Raycaster` për të zbuluar objektet përpara lojtarit (p.sh., përzgjedhja e blloqeve).

    selectedCoords = null; // Koordinatat e bllokut të përzgjedhur
    activeBlockId = blocks.empty.id; // ID e bllokut aktiv të lojtarit (p.sh., për ndërtim)

    tool = new Tool(); 
    // Mjeti që lojtari përdor (p.sh., kazma për minierat ose ndërtimi).


  /**
 * Konstruktori i lojtarit - Inicializon kamerën, kontrollin dhe kufizimin e trupit.
 * @param {THREE.Scene} scene - Skena ku do të vendoset lojtari.
 */
constructor(scene) {
  this.position.set(16, 16, 16);
  // Vendos pozicionin fillestar të lojtarit në koordinatat (16, 16, 16).

  this.camera.layers.enable(1);
  // Aktivizon shtresën e dytë të kamerës për efektet vizuale.

  scene.add(this.camera);
  // Shton kamerën e lojtarit në skenë për të shfaqur pamjen e parë.

  // scene.add(this.cameraHelper);  
  // (Opsionale) Shton ndihmësin vizual të kamerës për debug.

  this.camera.add(this.tool);
  // Shton mjetin e lojtarit (p.sh., kazmën) si pjesë e kamerës.

  document.addEventListener('keydown', this.onKeyDown.bind(this));
  document.addEventListener('keyup', this.onKeyUp.bind(this));
  // Regjistron eventet e tastierës për lëvizjen e lojtarit.

  // Krijon një model vizual (wireframe) për cilindrin kufizues të lojtarit.
  this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
  );

    // scene.add(this.boundsHelper);  
// (Opsionale) Shton kufirin vizual të lojtarit për debug.

/**
 * Ndihmës vizual për të shfaqur bllokun aktiv të përzgjedhur.
 */
const selectionMaterial = new THREE.MeshBasicMaterial({
  transparent: true, // Bën materialin gjysmë transparent.
  opacity: 0.3, // Vendos transparencën në 30% për të mos mbuluar bllokun real.
  color: 0xffffaa // Ngjyra e verdhë për të dalluar bllokun e përzgjedhur.
});

const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
// Krijon një kub pak më të madh se 1x1x1 për të rrethuar bllokun e përzgjedhur.

this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
// Krijon një objekt `Mesh` për të vizualizuar përzgjedhjen e bllokut.

scene.add(this.selectionHelper);
// Shton ndihmësin e përzgjedhjes në skenë.

this.raycaster.layers.set(0);
// Përdor `raycaster` për të kërkuar blloqe vetëm në shtresën `0`.
}

  /**
 * Kthen shpejtësinë e lojtarit në koordinatat e botës.
 * @returns {THREE.Vector3} - Shpejtësia e lojtarit në hapësirën globale.
 */
get worldVelocity() {
  this.#worldVelocity.copy(this.velocity);  
  // Kopjon shpejtësinë aktuale të lojtarit.

  this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));  
  // Aplikon rrotacionin e kamerës për të përshtatur drejtimin e shpejtësisë.

  return this.#worldVelocity;  
  // Kthen vektorin e shpejtësisë në hapësirën globale.
}

/**
* Përditëson gjendjen e lojtarit.
* @param {World} world - Bota ku ndodhet lojtari.
*/
update(world) {
  this.updateRaycaster(world);  
  // Përditëson raycaster-in për të zbuluar blloqet përpara lojtarit.
}


    /**
 * Përditëson raycaster-in për të identifikuar blloqet që lojtari mund të zgjedhë.
 * @param {World} world - Bota ku ndodhet lojtari.
 */
updateRaycaster(world) {
  this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
  // Vendos raycaster-in për të filluar nga qendra e ekranit dhe nga kamera e lojtarit.

  const intersections = this.raycaster.intersectObject(world, true);
  // Gjen të gjitha objektet në botë që ndërpriten nga raycaster-i.

  if (intersections.length > 0) {
      const intersection = intersections[0]; 
      // Merr objektin më të afërt që është prekur nga raycaster-i.

      const chunk = intersection.object.parent; 
      // Merr chunk-un që përmban bllokun e prekur.

      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);
      // Merr matricën e transformimit të bllokut të prekur.

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);
      // Llogarit koordinatat e sakta të bllokut të përzgjedhur.

      // Nëse lojtari po shton një bllok, llogarit pozicionin ngjitur për të vendosur bllokun e ri.
      if (this.activeBlockId !== blocks.empty.id) {
          this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      // Vendos ndihmësin vizual në bllokun e zgjedhur.

      this.selectionHelper.visible = true;
      // Bën të dukshëm ndihmësin vizual të përzgjedhjes.

  } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
      // Nëse nuk ka përzgjedhje, fsheh ndihmësin vizual.
  }
}

    /**
 * Aplikon një ndryshim në shpejtësinë e lojtarit (`dv`) bazuar në koordinatat e botës.
 * @param {THREE.Vector3} dv - Ndryshimi i shpejtësisë në hapësirën globale.
 */
applyWorldDeltaVelocity(dv) {
  dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
  // Përshtat ndryshimin e shpejtësisë sipas rrotacionit të kamerës.

  this.velocity.add(dv);
  // Shton ndryshimin në shpejtësinë aktuale të lojtarit.
}


applyInputs(dt) {
  if (this.controls.isLocked) {  
      // Kontrollon nëse lojtarit i është bllokuar kursori (është në modalitetin e lojës).

      this.velocity.x = this.input.x;  
      this.velocity.z = this.input.z;  
      // Vendos shpejtësinë në drejtimin X dhe Z bazuar në input-et e lojtarit.

      this.controls.moveRight(this.velocity.x * dt);  
      this.controls.moveForward(this.velocity.z * dt);  
      // Lëviz lojtarin përpara dhe djathtas bazuar në shpejtësinë dhe kohën `dt`.

      this.position.y += this.velocity.y * dt;  
      // Aplikon lëvizjen vertikale në boshtin Y (p.sh., për kërcimin ose rënien).

      document.getElementById('player-position').innerHTML = this.toString();  
      // Përditëson UI-në për të treguar pozicionin aktual të lojtarit.
  }
}



  /**
 * Përditëson pozicionin e ndihmësit vizual të cilindrit kufizues të lojtarit.
 */
updateBoundsHelper() {
  this.boundsHelper.position.copy(this.position);
  // Kopjon pozicionin aktual të lojtarit.

  this.boundsHelper.position.y -= this.height / 2;
  // Zhvendos ndihmësin vizual poshtë për ta vendosur në qendër të lojtarit.
}

/**
* Kthen pozicionin aktual të lojtarit në botën 3D.
* @type {THREE.Vector3}
*/
get position() {
  return this.camera.position;
  // Pozicioni i lojtarit është i njëjtë me pozicionin e kamerës.
}


   /**
 * Event handler për shtypjen e tasteve nga tastiera.
 * @param {KeyboardEvent} event - Ngjarja e tastierës.
 */
onKeyDown(event) {
  if (!this.controls.isLocked) {
      this.controls.lock();
      console.log('controls locked');  
      // Bllokon kontrollin e mausit nëse nuk është aktiv.
  }

  switch (event.code) {
      case 'Digit0': 
      case 'Digit1': 
      case 'Digit2': 
      case 'Digit3':  
      case 'Digit4': 
      case 'Digit5': 
      case 'Digit6': 
      case 'Digit7': 
      case 'Digit8':
          // Përditëson ikonën e toolbar-it për bllokun e përzgjedhur.
          document.getElementById(`toolbar-${this.activeBlockId}`)?.classList.remove('selected');
          this.activeBlockId = Number(event.key);
          document.getElementById(`toolbar-${event.key}`)?.classList.add('selected');

          // Përcakton nëse mjeti (kazma) duhet të jetë e dukshme.
          this.tool.visible = (this.activeBlockId === 0);

          console.log(`activeBlockId = ${event.key}`);
          break;

      // Kontrolli i lëvizjes së lojtarit.
      case 'KeyW':
         this.input.z = this.maxSpeed; 
         break; // Lëviz përpara.
      case 'KeyA': 
      this.input.x = -this.maxSpeed; 
      break; // Lëviz majtas.
      case 'KeyS':
         this.input.z = -this.maxSpeed;
       break; // Lëviz prapa.
      case 'KeyD':
         this.input.x = this.maxSpeed;
       break; // Lëviz djathtas.

      case 'KeyR':  
          // Reseton pozicionin e lojtarit në koordinatat (32, 16, 32) dhe ndalon shpejtësinë.
          this.position.set(32, 16, 32);
          this.velocity.set(0, 0, 0);
          break;

      case 'Space':  
          // Nëse lojtari është në tokë, e lejon të kërcejë.
          if (this.onGround) {
              this.velocity.y += this.jumpSpeed;
          }
          break;
  }
}

  

  /**
 * Event handler për lirimin e një tasti nga tastiera.
 * @param {KeyboardEvent} event - Ngjarja e tastierës.
 */
onKeyUp(event) {
  switch (event.code) {
      case 'KeyW': 
      this.input.z = 0; 
      break; // Ndalon lëvizjen përpara.
      case 'KeyA':
         this.input.x = 0; 
         break; // Ndalon lëvizjen majtas.
      case 'KeyS':
         this.input.z = 0; 
         break; // Ndalon lëvizjen prapa.
      case 'KeyD':
         this.input.x = 0; 
         break; // Ndalon lëvizjen djathtas.
  }
}

/**
* Kthen pozicionin e lojtarit si një string të lexueshëm.
* @returns {string} - Pozicioni në formatin "X: ..., Y: ..., Z: ...".
*/
toString() {
  let str = '';
  str += `X: ${this.position.x.toFixed(3)} `; // Formatimi i koordinatës X me 3 shifra dhjetore.
  str += `Y: ${this.position.y.toFixed(3)} `; // Formatimi i koordinatës Y me 3 shifra dhjetore.
  str += `Z: ${this.position.z.toFixed(3)}`;  // Formatimi i koordinatës Z me 3 shifra dhjetore.
  return str;
}
}

