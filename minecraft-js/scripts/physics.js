import * as THREE from 'three';
import { blocks } from './blocks';
import { Player } from './player';
import { World } from './world';

/**
 * Ky skript menaxhon fizikën e lojës, përfshirë përplasjet dhe gravitetin. Ai:
Përditëson lëvizjen e lojtarit duke aplikuar gravitetin dhe input-et.
Detekton përplasjet duke përdorur broadPhase (kërkim i përgjithshëm) dhe narrowPhase (kontroll i detajuar).
Zgjidh përplasjet duke rregulluar pozicionin dhe shpejtësinë e lojtarit.
Vizualizon përplasjet me ndihmës vizualë për debug.
 */

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000, // Ngjyra e kuqe për të treguar zonën e përplasjes.
  transparent: true, // E bën materialin gjysmë transparent.
  opacity: 0.2 // Vendos një transparencë të lehtë (20% e dukshme).
});

const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);
// Krijon një kub shumë të vogël më të madh se 1x1x1 për të treguar kufirin e përplasjes.

// Material për kontaktin (kur një objekt prek një tjetër)
const contactMaterial = new THREE.MeshBasicMaterial({
  wireframe: true, // Shfaq vetëm skicat e formës për pamje më të qartë.
  color: 0x00ff00 // Ngjyra jeshile për të dalluar zonën e kontaktit.
});

const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6);
// Krijon një sferë shumë të vogël me rreze 0.05 për të treguar pikën e kontaktit.



export class Physics {
    
  simulationRate = 200; // Shkalla e simulimit fizik (200 hapa në sekondë).
  timestep = 1 / this.simulationRate; // Intervali kohor i çdo hapi të simulimit.
  accumulator = 0; // Akumulatori për ruajtjen e kohës së mbetur midis hapave.
  gravity = 32; // Forca e gravitetit në lojë.

  constructor(scene) {
      this.helpers = new THREE.Group();  
      // Krijon një grup ndihmësish vizualë për fizikën.

      scene.add(this.helpers);  
      // Shton ndihmësit në skenë për të parë vizualisht kufijtë e fizikës (opsionale).
  }


    /**
 * Përditëson simulimin fizik me kalimin e kohës 'dt'.
 * @param {number} dt - Diferenca e kohës midis frame-ve.
 * @param {Player} player - Lojtari që ndikohet nga fizika.
 * @param {World} world - Bota e lojës ku ndodhen përplasjet.
 */
update(dt, player, world) {
  this.accumulator += dt;  
  // Akumulon kohën për të siguruar përditësim të qëndrueshëm të fizikës.

  while (this.accumulator >= this.timestep) {
      this.helpers.clear();  
      // Pastron ndihmësit vizualë për përplasjet nga frame-i i mëparshëm.

      player.velocity.y -= this.gravity * this.timestep;  
      // Aplikohet graviteti duke zvogëluar shpejtësinë në drejtim të poshtëm.

      player.applyInputs(this.timestep);  
      // Aplikohet lëvizja e lojtarit bazuar në input-et e tij.

      player.updateBoundsHelper();  
      // Përditëson kufijtë e lojtarit për detektimin e përplasjes.

      this.detectCollisions(player, world);  
      // Kontrollon përplasjet e lojtarit me botën.

      this.accumulator -= this.timestep;  
      // Zvogëlon kohën e akumuluar për të ruajtur balancën e simulimit.
  }
}

    
  /**
 * Funksioni kryesor për detektimin e përplasjeve.
 * @param {Player} player - Lojtari që kontrollohet për përplasje.
 * @param {World} world - Bota ku ndodhen objektet e përplasjes.
 */
detectCollisions(player, world) {
  player.onGround = false;  
  // Inicializon statusin e lojtarit, duke supozuar që ai nuk është në tokë.

  const candidates = this.broadPhase(player, world);  
  // Kryen fazën e parë të përplasjes (kontroll i përgjithshëm) për të gjetur objektet e mundshme.

  const collisions = this.narrowPhase(candidates, player);  
  // Kryen fazën e dytë (kontroll i detajuar) për të përcaktuar përplasjet e sakta.

  if (collisions.length > 0) {  
      this.resolveCollisions(collisions, player);  
      // Nëse ka përplasje, thirret funksioni për t'i zgjidhur ato.
  }
}

  /**
 * Kryen një kërkim të përgjithshëm për të gjetur blloqet e mundshme 
 * me të cilat lojtari mund të përplaset.
 * @param {Player} player - Lojtari që po kontrollohet për përplasje.
 * @param {World} world - Bota ku ndodhen blloqet.
 * @returns {[]} - Lista e blloqeve të mundshme për përplasje.
 */
broadPhase(player, world) {
  const candidates = [];  
  // Lista që do të mbajë blloqet e mundshme për përplasje.

  // Llogarit kufijtë e lojtarit për të përcaktuar zonën e kontrollit.
  const extents = {
      x: {
          min: Math.floor(player.position.x - player.radius), // Kufiri minimal në boshtin X.
          max: Math.ceil(player.position.x + player.radius)  // Kufiri maksimal në boshtin X.
      },
      y: {
          min: Math.floor(player.position.y - player.height), // Kufiri minimal në boshtin Y (lartësi e lojtarit).
          max: Math.ceil(player.position.y)  // Kufiri maksimal në boshtin Y.
      },
      z: {
          min: Math.floor(player.position.z - player.radius), // Kufiri minimal në boshtin Z.
          max: Math.ceil(player.position.z + player.radius)  // Kufiri maksimal në boshtin Z.
      }
  }

    // Kalon nëpër të gjithë blloqet brenda kufijve të lojtarit
// Nëse blloku nuk është bosh, e shton në listën e përplasjeve
for (let x = extents.x.min; x <= extents.x.max; x++) {
  for (let y = extents.y.min; y <= extents.y.max; y++) {
      for (let z = extents.z.min; z <= extents.z.max; z++) {
          const block = world.getBlock(x, y, z); // Merr bllokun në këto koordinata
          if (block && block.id !== blocks.empty.id) {  
              // Nëse blloku ekziston dhe nuk është bosh, është kandidat për përplasje
              const blockPos = { x, y, z };
              candidates.push(blockPos); // Shton bllokun në listën e përplasjeve
              this.addCollisionHelper(blockPos); // Shton ndihmës vizual për përplasjen
          }
      }
  }
}

// Kthen listën e blloqeve të mundshme për përplasje
return candidates;
}

   
  /**
 * Përpilon listën përfundimtare të blloqeve me të cilat lojtari po përplaset realisht.
 * @param {{ x:number, y:number, z:number }[]} candidates - Lista e blloqeve të mundshme për përplasje.
 * @param {Player} player - Lojtari që po kontrollohet për përplasje.
 * @returns  - Lista e blloqeve me të cilat ka përplasje të vërtetë.
 */
narrowPhase(candidates, player) {
  const collisions = [];  
  // Lista e blloqeve me të cilat lojtari ka një përplasje të vërtetë.

  for (const block of candidates) {  
      // Kalon nëpër secilin bllok të mundshëm nga `broadPhase`.

      // Merr pozicionin e lojtarit
      const p = player.position;

      // Gjen pikën më të afërt të bllokut në qendër të lojtarit
      const closestPoint = {
          x: Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
          y: Math.max(block.y - 0.5, Math.min(p.y - (player.height / 2), block.y + 0.5)),
          z: Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5))
      };

        // 2. Përcakton nëse pika më e afërt është brenda cilindrit kufizues të lojtarit

// Llogarit distancën midis pikës më të afërt dhe qendrës së lojtarit
const dx = closestPoint.x - player.position.x;  
const dy = closestPoint.y - (player.position.y - (player.height / 2));  
const dz = closestPoint.z - player.position.z;  

if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {  
    // Nëse pika është brenda cilindrit kufizues të lojtarit

    // Llogarit sa shumë pika mbivendoset në boshtin Y (vertikalisht)
    const overlapY = (player.height / 2) - Math.abs(dy);  

    // Llogarit sa shumë pika mbivendoset në planin XZ (horizontalisht)
    const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);


         // Llogarit normalen e përplasjes (drejtimi i forcës që largon lojtarin nga blloku)
// dhe sasinë e mbivendosjes midis lojtarit dhe bllokut
let normal, overlap;

if (overlapY < overlapXZ) {  
    // Nëse mbivendosja në boshtin Y është më e vogël se në planin XZ:
    normal = new THREE.Vector3(0, -Math.sign(dy), 0);  
    // Vektori i normalizuar drejtuar lart ose poshtë për përplasje vertikale.

    overlap = overlapY;  
    // Përdor mbivendosjen vertikale si faktor për shtyrjen e lojtarit.

    player.onGround = true;  
    // Vendos lojtarin si "në tokë" pasi ka një përplasje poshtë tij.
} else {  
    // Përndryshe, përplasja ndodh në planin horizontal XZ.
    normal = new THREE.Vector3(-dx, 0, -dz).normalize();  
    // Normalja drejtuar larg nga qendra e lojtarit për ta shtyrë atë jashtë.

    overlap = overlapXZ;  
    // Përdor mbivendosjen horizontale për të korrigjuar pozicionin.
}

// Shton informacionin e përplasjes në listën e përplasjeve
collisions.push({
    block,  // Blloku me të cilin lojtari është përplasur
    contactPoint: closestPoint,  // Pika e kontaktit midis lojtarit dhe bllokut
    normal,  // Drejtimi i forcës së përplasjes
    overlap  // Shkalla e mbivendosjes për të korrigjuar pozicionin e lojtarit
});

this.addContactPointHelper(closestPoint);  
// Shton një ndihmës vizual për të parë pikën e kontaktit në skenë.
}
  }
    
    // console.log(`Narrowphase Collisions: ${collisions.length}`);  
// Printon numrin e përplasjeve të identifikuara në `narrowPhase` (për debug).

return collisions;  
// Kthen listën përfundimtare të përplasjeve për t'u zgjidhur.
}
/**
 * Zgjidh përplasjet e gjetura në fazën `narrowPhase`.
 * @param {object} collisions - Lista e përplasjeve të identifikuara.
 * @param {Player} player - Lojtari që ndikohet nga përplasjet.
 */
resolveCollisions(collisions, player) {
    // Rendit përplasjet nga mbivendosja më e vogël te më e madhja
    collisions.sort((a, b) =>{

     a.overlap - b.overlap;
});

    for (const collision of collisions) {
        // Pasi lojtari lëviz pas zgjidhjes së çdo përplasjeje,
        // rishikojmë nëse pika e kontaktit është ende brenda cilindrit të lojtarit.
        if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player)) continue;




// 1. Rregullon pozicionin e lojtarit për të shmangur mbivendosjen me bllokun
let deltaPosition = collision.normal.clone();  
// Kopjon normalen e përplasjes për të përcaktuar drejtimin e lëvizjes larg nga përplasja.

deltaPosition.multiplyScalar(collision.overlap);  
// Shumëzon normalen me vlerën e mbivendosjes për të llogaritur sa larg duhet të zhvendoset lojtari.

player.position.add(deltaPosition);  
// Zhvendos lojtarin larg përplasjes për të parandaluar mbivendosjen me bllokun.

// 2. Negon shpejtësinë e lojtarit përgjatë normales së përplasjes
// Llogarit komponentin e shpejtësisë së lojtarit përgjatë normales së përplasjes
let magnitude = player.worldVelocity.dot(collision.normal);  

// Llogarit vektorin që duhet të largohet nga shpejtësia e lojtarit
let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude);  

// Aplikon ndryshimin e shpejtësisë për ta ndaluar lojtarin nga lëvizja në drejtimin e përplasjes
player.applyWorldDeltaVelocity(velocityAdjustment.negate());  
    }
  }


   /**
 * Vizualizon bllokun me të cilin lojtari po përplaset.
 * @param {THREE.Object3D} block - Blloku që po përplaset me lojtarin.
 */
addCollisionHelper(block) {
  const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
  // Krijon një kub vizual për të treguar zonën e përplasjes.

  blockMesh.position.copy(block);
  // Vendos bllokun në koordinatat e tij në botën e lojës.

  this.helpers.add(blockMesh);
  // Shton bllokun në grupin e ndihmësve vizualë.
}

/**
* Vizualizon pikën e kontaktit gjatë një përplasjeje.
* @param {{ x, y, z }} p - Pika e kontaktit në hapësirën 3D.
*/
addContactPointHelper(p) {
  const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
  // Krijon një sferë të vogël për të treguar pikën e kontaktit.

  contactMesh.position.copy(p);
  // Vendos sferën në pikën e kontaktit.

  this.helpers.add(contactMesh);
  // Shton ndihmësin vizual në skenë.
}

/**
* Kontrollon nëse pika `p` është brenda cilindrit kufizues të lojtarit.
* @param {{ x: number, y: number, z: number }} p - Pika që po kontrollohet.
* @param {Player} player - Lojtari që po krahasohet.
* @returns {boolean} - Kthen `true` nëse pika është brenda cilindrit, përndryshe `false`.
*/
pointInPlayerBoundingCylinder(p, player) {
  const dx = p.x - player.position.x;
  const dy = p.y - (player.position.y - (player.height / 2));
  const dz = p.z - player.position.z;
  const r_sq = dx * dx + dz * dz;

  // Kontrollon nëse pika `p` është brenda lartësisë dhe rrezes së cilindrit të lojtarit.
  return (Math.abs(dy) < player.height / 2) && (r_sq < player.radius * player.radius);
}
}