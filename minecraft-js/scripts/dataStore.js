/**
 * Klasë për ruajtjen dhe menaxhimin e blloqeve në lojë.
 * Përdoret si një database e thjeshtë për të mbajtur gjurmët e 
 * blloqeve bazuar në koordinatat e tyre.
 */

export class DataStore { 
  // Kjo klasë ruan dhe menaxhon të dhënat për blloqet në lojë.
  
  constructor() {
      this.data = {}; // Inicializon një objekt bosh për ruajtjen e të dhënave.
  }

  clear() {
      this.data = {}; // Pastron të gjitha të dhënat e ruajtura.
  }

  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
      // Kontrollon nëse ekziston një bllok në koordinatat e dhëna.
      const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ); // Gjeneron çelësin unik për bllokun.
      return this.data[key] !== undefined; // Kthen `true` nëse ekziston, përndryshe `false`.
  }

  get(chunkX, chunkZ, blockX, blockY, blockZ) {
      // Merr ID-në e një blloku bazuar në koordinatat e tij.
      const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ); // Gjeneron çelësin unik.
      const blockId = this.data[key]; // Merr ID-në e bllokut nga të dhënat.
      console.log(`retrieving value ${blockId} at key ${key}`); // Printon ID-në dhe çelësin në console për debug.
      return blockId; // Kthen ID-në e bllokut.
  }

  set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
      // Vendos një bllok në një lokacion të caktuar me një ID të dhënë.
      const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ); // Gjeneron çelësin unik për bllokun.
      this.data[key] = blockId; // Ruaj ID-në e bllokut në objektin `data`.
      console.log(`setting key ${key} to ${blockId}`); // Printon çelësin dhe ID-në për debug.
  }

  getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
      // Krijon një çelës unik për një bllok duke kombinuar koordinatat.
      return `${chunkX}-${chunkZ}-${blockX}-${blockY}-${blockZ}`; // Kthen çelësin si një string.
  }
}
