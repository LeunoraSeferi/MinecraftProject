import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { DataStore } from './dataStore';



/**
 * Ky skript menaxhon gjenerimin dhe përditësimin e botës 3D duke kontrolluar:
Ngarkimin dhe fshirjen e chunk-eve në bazë të distancës së lojtarit.
Shtimin dhe heqjen e blloqeve sipas ndërveprimeve të lojtarit.
Ruajtjen dhe ngarkimin e të dhënave të botës për të vazhduar progresin.
Fshehjen dhe shfaqjen e blloqeve bazuar në dukshmërinë e tyre.
Përdorimi: Ndërton dhe menaxhon një botë procedurale si në Minecraft.
 */
export class World extends THREE.Group {

  /**
   * Aktivizon ose çaktivizon ngarkimin asinkron të chunk-eve.
   */
      asyncLoading = true;
  
  /**
   * Numri i chunk-eve që do të shfaqen rreth lojtarit.
   * - 0: Vetëm chunk-u ku ndodhet lojtari.
   * - 1: Chunk-u aktual + chunk-et ngjitur.
   * - 2: Chunk-u aktual + dy shtresa chunk-esh rreth tij.
   */
      drawDistance = 3;
  
  /**
   * Përmasat e një chunk-u në botën e lojës.
   * - `width`: Gjerësia e chunk-ut (blloqe në boshtin X).
   * - `height`: Lartësia e chunk-ut (blloqe në boshtin Y).
   */
      chunkSize = { 
          width: 24,  
          height: 32  
      };
    

   /**
 * Parametrat që përcaktojnë formimin e botës 3D.
 */
params = {
  seed: 0, // Farë për gjenerimin procedural të terrenit.

  terrain: {
      scale: 80, // Shkalla e zgjerimit të terrenit.
      magnitude: 10, // Lartësia maksimale e terrenit.
      offset: 5, // Lartësia bazë e terrenit.
      waterOffset: 3 // Niveli i ujit në botë.
  },

  biomes: {
      scale: 200, // Shkalla e ndryshimit midis biome-ve.
      variation: {
          amplitude: 0.2, // Intensiteti i variacionit të biome-ve.
          scale: 50 // Madhësia e detajeve të biome-ve.
      },
      tundraToTemperate: 0.1, // Kalimi nga tundra në klimë të butë.
      temperateToJungle: 0.5, // Kalimi nga klimë e butë në xhungël.
      jungleToDesert: 0.9 // Kalimi nga xhungël në shkretëtirë.
  },

  trees: {
      trunk: {
          minHeight: 5, // Lartësia minimale e trungut të pemëve.
          maxHeight: 7 // Lartësia maksimale e trungut.
      },
      canopy: {
          minRadius: 2, // Rrezja minimale e kurorës së pemës.
          maxRadius: 3, // Rrezja maksimale e kurorës së pemës.
          density: 0.5 // Dendësia e gjetheve (0.0 = e rrallë, 1.0 = shumë e dendur).
      },
      frequency: 0.01 // Frekuenca e shfaqjes së pemëve në botë.
  },

  clouds: {
      scale: 20, // Madhësia e reve.
      density: 0 // Dendësia e reve (0 = pa re, 1 = qiell i mbushur me re).
  }
};

/**
* Ruajtës i të dhënave të botës për menaxhimin e terrenit.
*/
dataStore = new DataStore();



   
 //Konstruktori i botës - Inicializon parametrat dhe menaxhon ruajtjen/ngarkimin e lojës.
 
constructor(seed = 0) {
  super();
  this.seed = seed;

  // Regjistron evente për ruajtjen dhe ngarkimin e lojës me tastet F1 dhe F2.
  document.addEventListener('keydown', (ev) => {
      switch (ev.code) {
          case 'F1':
             this.save(); 
             break; // F1 ruan lojën.
          case 'F2':
             this.load(); 
             break; // F2 ngarkon lojën.
      }
  });
}

/**
* Ruajtja e të dhënave të botës në `localStorage`.
*/
save() {
  localStorage.setItem('minecraft_params', JSON.stringify(this.params));
  // Ruaj parametrat e botës.

  localStorage.setItem('minecraft_data', JSON.stringify(this.dataStore.data));
  // Ruaj të dhënat e terrenit (chunk-et, blloqet, etj.).

  document.getElementById('status').innerHTML = 'GAME SAVED';
  // Shfaq mesazh që loja është ruajtur.

  setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
  // Pas 3 sekondash, fshin mesazhin nga UI.
}

  /**
 * Ngarkon të dhënat e lojës nga `localStorage`.
 */
load() {
  this.params = JSON.parse(localStorage.getItem('minecraft_params'));
  // Merr dhe rikthen parametrat e botës nga memoria lokale.

  this.dataStore.data = JSON.parse(localStorage.getItem('minecraft_data'));
  // Merr dhe rikthen të dhënat e terrenit të ruajtura më parë.

  document.getElementById('status').innerHTML = 'GAME LOADED';
  // Shfaq një mesazh që loja u ngarkua me sukses.

  setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
  // Pas 3 sekondash, fshin mesazhin nga UI.

  this.generate();  
  // Rigjeneron botën me të dhënat e ngarkuara.
}



   
 //Rigjeneron modelin e botës dhe objektet 3D (chunk-et dhe blloqet).

generate(clearCache = false) {
  if (clearCache) {
      this.dataStore.clear();  
      // Pastron të gjitha të dhënat e mëparshme të botës.
  }

  this.disposeChunks();
  // Fshin chunk-et ekzistuese për të shmangur mbivendosjen e të dhënave të vjetra.

  // Gjeneron chunk-e të reja brenda distancës së vizatimit (drawDistance).
  for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
          const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
          // Krijon një chunk të ri me parametrat aktualë.

          chunk.position.set(
              x * this.chunkSize.width,  
              0,  
              z * this.chunkSize.width
          );
          // Vendos chunk-un në koordinatat e duhura në botë.

          chunk.userData = { x, z };  
          // Ruajtja e pozicionit të chunk-ut për referencë.

          chunk.generate();  
          // Gjeneron përmbajtjen e chunk-ut (blloqet dhe terrenin).

          this.add(chunk);  
          // Shton chunk-un në botë.
      }
  }
}


  /**
 * Përditëson botën bazuar në pozicionin aktual të lojtarit.
 * @param {Player} player - Lojtari që përcakton zonën e dukshme të botës.
 */
update(player) {
  const visibleChunks = this.getVisibleChunks(player);
  // Merr të gjitha chunk-et që duhet të jenë të dukshme për lojtarin.

  const chunksToAdd = this.getChunksToAdd(visibleChunks);
  // Përcakton chunk-et e reja që duhen shtuar në botë.

  this.removeUnusedChunks(visibleChunks);
  // Heq chunk-et që nuk janë më brenda distancës së vizatimit.

  for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
      // Gjeneron dhe shton chunk-et e reja në botë.
  }
}

/**
* Kthen një listë të koordinatave të chunk-eve që aktualisht janë të dukshme për lojtarin.
* @param {Player} player - Lojtari që përcakton zonën e shikimit.
* @returns {{ x: number, z: number }[]} - Lista e chunk-eve të dukshme.
*/
getVisibleChunks(player) {
  const visibleChunks = [];

  // Konverton koordinatat e lojtarit në koordinata të chunk-ut.
  const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
  );

  const chunkX = coords.chunk.x;
  const chunkZ = coords.chunk.z;

  // Përcakton cilat chunk-e duhet të jenë të dukshme brenda distancës së vizatimit.
  for (let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
      for (let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
          visibleChunks.push({ x, z });
      }
  }

  return visibleChunks;
}


   /**
 * Kthen një listë të chunk-eve që nuk janë ende të ngarkuar dhe duhen shtuar në skenë.
 * @param {{ x: number, z: number }[]} visibleChunks - Lista e chunk-eve të dukshme.
 * @returns {{ x: number, z: number }[]} - Lista e chunk-eve që duhen shtuar.
 */
getChunksToAdd(visibleChunks) {
  // Filtron chunk-et që nuk janë tashmë në skenë.
  return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
          .map((obj) => obj.userData) // Merr të dhënat e userData për çdo objekt në botë.
          .find(({ x, z }) => 
          (chunk.x === x && chunk.z === z)); 
          // Kontrollon nëse chunk-u ekziston tashmë në skenë.

      return !chunkExists;  
      // Kthen vetëm chunk-et që nuk janë gjetur në skenë.
  })
}



    /**
 * Heq chunk-et që nuk janë më brenda zonës së dukshme të lojtarit.
 * @param {{ x: number, z: number }[]} visibleChunks - Lista e chunk-eve të dukshme.
 */
removeUnusedChunks(visibleChunks) {
  // Filtron chunk-et që nuk janë më brenda distancës së shikimit të lojtarit.
  const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find((visibleChunk) => (
          visibleChunk.x === x && visibleChunk.z === z
      ));

      return !chunkExists; // Kthen vetëm chunk-et që nuk janë më të dukshme.
  });

  for (const chunk of chunksToRemove) {
      chunk.disposeInstances(); // Pastron të dhënat për të shmangur mbetjet në memorie.
      this.remove(chunk); // E heq chunk-un nga bota.
      console.log(`Removing chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
      // Log që tregon koordinatat e chunk-ut të fshirë.
  }
}




    /**
 * Gjeneron një chunk të ri në koordinatat (x, z).
 * @param {number} x - Koordinata X e chunk-ut.
 * @param {number} z - Koordinata Z e chunk-ut.
 */
generateChunk(x, z) {
  const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
  // Krijon një objekt të ri `WorldChunk` me përmasat dhe parametrat aktualë.

  chunk.position.set(
      x * this.chunkSize.width * 1.01,  
      0,  
      z * this.chunkSize.width * 1.01
  );
  // Vendos chunk-un në koordinatat e tij në botë, me një ndarje të lehtë (1.01) për shmangien e mbivendosjeve.

  chunk.userData = { x, z };  
  // Ruajtja e koordinatave të chunk-ut për referencë.

  if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
      // Ngarkon chunk-un asinkronisht kur CPU ka kohë të lirë, me një kufi prej 1 sekonde.
  } else {
      chunk.generate();
      // Gjeneron chunk-un menjëherë nëse ngarkimi asinkron është çaktivizuar.
  }

  this.add(chunk);
  // Shton chunk-un e ri në botë.

  console.log(`Adding chunk at X: ${x} Z: ${z}`);
  // Printon një log për të treguar koordinatat e chunk-ut të shtuar.
}


  /**
 * Merr të dhënat e një blloku në koordinatat (x, y, z).
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @returns {{id: number, instanceId: number} | null} - Informacioni i bllokut ose `null` nëse nuk ekziston.
 */
getBlock(x, y, z) {
  const coords = this.worldToChunkCoords(x, y, z);
  // Konverton koordinatat e botës në koordinata të chunk-ut.

  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  // Merr chunk-un që përmban bllokun e kërkuar.

  if (chunk && chunk.loaded) {
      return chunk.getBlock(
          coords.block.x,
          coords.block.y,
          coords.block.z
      );
      // Kthen të dhënat e bllokut brenda chunk-ut nëse është i ngarkuar.
  } else {
      return null;
      // Kthen `null` nëse chunk-u nuk është i ngarkuar ose nuk ekziston.
  }
}

   /**
 * Kthen koordinatat e chunk-ut dhe bllokut për një pikë në botën 3D.
 * - `chunk`: Koordinatat e chunk-ut që përmban bllokun.
 * - `block`: Koordinatat e bllokut brenda chunk-ut.
 * @param {number} x - Koordinata X në botë.
 * @param {number} y - Koordinata Y në botë.
 * @param {number} z - Koordinata Z në botë.
 * @returns {{
 *   chunk: { x: number, z: number },
    *   block: { x: number, y: number, z: number }
    * }} - Koordinatat e chunk-ut dhe bllokut.
    */
   worldToChunkCoords(x, y, z) {
       const chunkCoords = {
           x: Math.floor(x / this.chunkSize.width), // Gjen koordinatën X të chunk-ut.
           z: Math.floor(z / this.chunkSize.width)  // Gjen koordinatën Z të chunk-ut.
       };
   
       const blockCoords = {
           x: x - this.chunkSize.width * chunkCoords.x, // Gjen pozicionin X të bllokut brenda chunk-ut.
           y: y, // Lë koordinatën Y të pandryshuar (blloku në të njëjtën lartësi).
           z: z - this.chunkSize.width * chunkCoords.z // Gjen pozicionin Z të bllokut brenda chunk-ut.
       };
   
       return {
           chunk: chunkCoords, // Kthen koordinatat e chunk-ut.
           block: blockCoords  // Kthen koordinatat relative të bllokut brenda chunk-ut.
       };
   }
   
   /**
 * Kthen objektin `WorldChunk` në koordinatat e specifikuara të chunk-ut.
 * @param {number} chunkX - Koordinata X e chunk-ut.
 * @param {number} chunkZ - Koordinata Z e chunk-ut.
 * @returns {WorldChunk | null} - Chunk-u në ato koordinata ose `null` nëse nuk ekziston.
 */
getChunk(chunkX, chunkZ) {
  return this.children.find((chunk) => (
      chunk.userData.x === chunkX && 
      chunk.userData.z === chunkZ
  ));
  // Kërkon në listën e fëmijëve të `World` chunk-un me koordinatat e dhëna.
}

/**
* Pastron dhe fshin të gjithë chunk-et e ngarkuar në botë.
*/
disposeChunks() {
  this.traverse((chunk) => {
      if (chunk.disposeInstances) {
          chunk.disposeInstances();
          // Thërret metodën `disposeInstances` për të liruar burimet e chunk-ut.
      }
  });

  this.clear();
  // Fshin të gjitha chunk-et nga bota për të parandaluar mbingarkimin e memories.
}

   /**
 * Shton një bllok të ri në koordinatat (x, y, z) me llojin `blockId`.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @param {number} blockId - ID e bllokut që do të shtohet.
 */
addBlock(x, y, z, blockId) {
  const coords = this.worldToChunkCoords(x, y, z);
  // Konverton koordinatat e botës në koordinata të chunk-ut dhe bllokut.

  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  // Gjen chunk-un që përmban bllokun në ato koordinata.

  if (chunk) {
      chunk.addBlock(
          coords.block.x,
          coords.block.y,
          coords.block.z,
          blockId
      );
      // Shton bllokun në chunk-un përkatës.

      // Fsheh blloqet fqinj nëse janë të mbuluar nga blloku i ri.
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
  }
}

  /**
 * Heq bllokun në koordinatat (x, y, z) dhe e vendos atë si bosh.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
removeBlock(x, y, z) {
  const coords = this.worldToChunkCoords(x, y, z);
  // Konverton koordinatat e botës në koordinata të chunk-ut dhe bllokut.

  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  // Gjen chunk-un që përmban bllokun në ato koordinata.

  if (chunk) {
      chunk.removeBlock(
          coords.block.x,
          coords.block.y,
          coords.block.z
      );
      // Heq bllokun nga chunk-u përkatës.

      // Zbulon blloqet fqinj nëse më parë ishin të mbuluara.
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
  }
}


  /**
 * Shfaq bllokun në (x, y, z) duke shtuar një instancë të re të mesh-it.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
revealBlock(x, y, z) {
  const coords = this.worldToChunkCoords(x, y, z);
  // Konverton koordinatat e botës në koordinata të chunk-ut dhe bllokut.

  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  // Gjen chunk-un që përmban bllokun.

  if (chunk) {
      chunk.addBlockInstance(
          coords.block.x,
          coords.block.y,
          coords.block.z
      );
      // Shton një instancë të mesh-it për të shfaqur bllokun.
  }
}

/**
* Fsheh bllokun në (x, y, z) duke hequr instancën e mesh-it nëse është i mbuluar.
* @param {number} x - Koordinata X e bllokut.
* @param {number} y - Koordinata Y e bllokut.
* @param {number} z - Koordinata Z e bllokut.
*/
hideBlock(x, y, z) {
  const coords = this.worldToChunkCoords(x, y, z);
  // Konverton koordinatat e botës në koordinata të chunk-ut dhe bllokut.

  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  // Gjen chunk-un që përmban bllokun.

  if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
      chunk.deleteBlockInstance(
          coords.block.x,
          coords.block.y,
          coords.block.z
      )
      // Heq instancën e mesh-it nëse blloku është i mbuluar nga blloqe të tjera.
  }
}
}