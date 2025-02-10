import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import {RNG} from './rng';
import {blocks,resources} from './blocks';



/**
 * WorldChunk.js është përgjegjës për gjenerimin dhe menaxhimin e një pjese (chunk) të botës Minecraft në Three.js. Ky skript përfshin:

Gjenerimin e terrenit duke përdorur Simplex Noise për lartësinë dhe biomat.
Menaxhimin e blloqeve, përfshirë shtimin, fshirjen dhe fshehjen e tyre.
Krijimin e pemëve, reve dhe burimeve natyrore në mënyrë procedurale.
Përdorimin e InstancedMesh për të optimizuar renditjen e blloqeve.
Ruajtjen dhe ngarkimin e ndryshimeve të bëra nga lojtari me DataStore.
 Në thelb, ky skript menaxhon pjesët individuale të botës
 duke i përfaqësuar ato si objekte 3D në Three.js!
 */

 
const geometry = new THREE.BoxGeometry(); 
// Krijon një gjeometri kubike për blloqet e chunk-ut.

/**
 * Përfaqëson një chunk të botës, duke përfshirë të dhënat dhe strukturën e tij.
 */
export class WorldChunk extends THREE.Group {
    /**
     * Ruajtja e të dhënave të blloqeve brenda chunk-ut.
     * @type {{
     *   id: number, // ID e llojit të bllokut.
     *   instanceId: number // ID e instancës për menaxhimin e mesh-eve.
     * }[][][]}
     */
    data = [];

   
    constructor(size, params, dataStore) {
        super();
        this.loaded = false; // Tregon nëse chunk-u është i ngarkuar.
        this.size = size; // Ruajtja e përmasave të chunk-ut.
        this.params = params; // Parametrat e botës për terrenin dhe biomet.
        this.dataStore = dataStore; // Lidhje me të dhënat e botës për ruajtje.
    }


    /**
 * Gjeneron të dhënat dhe objektet 3D të chunk-ut.
 */
generate() {
    const start = performance.now();  
    // Regjistron kohën e fillimit për të matur sa shpejt ngarkohet chunk-u.

    const rng = new RNG(this.params.seed);  
    // Krijon një gjenerator të rastësishëm për formimin procedural të terrenit.

    this.initializeTerrain();  
    // Inicializon strukturën e terrenit për chunk-un.

    this.generateTerrain(rng);  
    // Gjeneron terrenin duke përdorur parametrat proceduralë.

    // this.generateTrees(rng);  
    // (E komentuar) Do të gjeneronte pemë në chunk.

    this.generateClouds(rng);  
    // Gjeneron retë sipas parametrave të botës.

    this.loadPlayerChanges();  
    // Ngarkon ndryshimet e bëra nga lojtari në chunk (p.sh., blloqet e vendosura/hequra).

    this.generateMeshes();  
    // Krijon mesh-et 3D për të shfaqur chunk-un vizualisht.

    this.loaded = true;  
    // E shënon chunk-un si të ngarkuar.

    // console.log(`Loaded chunk in ${performance.now() - start}ms`);  
    // (E komentuar) Mund të përdoret për debug për të parë kohën e ngarkimit.
}



/**
 * Inicializon të dhënat e terrenit për chunk-un duke e mbushur me blloqe bosh.
 */
 initializeTerrain() {
    this.data = [];  
    // Krijon një listë bosh për të ruajtur të dhënat e chunk-ut.

    for (let x = 0; x < this.size.width; x++) {
        const slice = [];  
        // Krijon një segment të chunk-ut përgjatë boshtit X.

        for (let y = 0; y < this.size.height; y++) {
            const row = [];  
            // Krijon një rresht të blloqeve përgjatë boshtit Y.

            for (let z = 0; z < this.size.width; z++) {
                row.push({
                    id: blocks.empty.id,  // Vendos bllok bosh në secilën koordinatë.
                    instanceId: null,  // Nuk ka instancë të mesh-it për këtë bllok.
                });
            }
            slice.push(row);
        }
        this.data.push(slice);
        // Shton segmentin e përpunuar në të dhënat e chunk-ut.
    }
}


 /**
 * Përcakton biomen në koordinatat lokale (x, z) brenda chunk-ut.
 * @param {SimplexNoise} simplex - Gjeneratori i zhurmës për terrenin procedural.
 * @param {number} x - Koordinata X lokale e chunk-ut.
 * @param {number} z - Koordinata Z lokale e chunk-ut.
 * @returns {string} - Emri i biomës (Tundra, Temperate, Jungle, Desert).
 */
getBiome(simplex, x, z) {
    let noise = 0.5 * simplex.noise(
        (this.position.x + x) / this.params.biomes.scale,
        (this.position.z + z) / this.params.biomes.scale
    ) + 0.5;
    // Gjeneron një vlerë të rastësishme të bazuar në pozicionin e chunk-ut për të përcaktuar biomen.

    noise += this.params.biomes.variation.amplitude * (simplex.noise(
        (this.position.x + x) / this.params.biomes.variation.scale,
        (this.position.z + z) / this.params.biomes.variation.scale
    ));
    // Shton një variacion të vogël në vlerën e biomës për ta bërë terrenin më të natyrshëm.

    // **Përcaktimi i biomës bazuar në vlerën e `noise`**:
    // 0 - 0.25  = Tundra  
    // 0.25 - 0.5 = Temperate  
    // 0.5 - 0.75 = Jungle  
    // 0.75 - 1   = Desert  

    if (noise < this.params.biomes.tundraToTemperate) {
        return 'Tundra';  // Klima e ftohtë, borë, dhe pak bimësi.
    } else if (noise < this.params.biomes.temperateToJungle) {
        return 'Temperate';  // Klima e butë, me pyje dhe bimësi mesatare.
    } else if (noise < this.params.biomes.jungleToDesert) {
        return 'Jungle';  // Klima tropikale, me lagështi dhe shumë pemë.
    } else {
        return 'Desert';  // Klima e nxehtë dhe e thatë, me pak bimësi.
    }

   /*
    // Përcakton biomen bazuar në temperaturë dhe lagështi.

    if (temperature > 0.5) {  
        // Nëse temperatura është mbi 0.5 (e ngrohtë):

        if (humidity > 0.5) {  
            // Nëse lagështia është mbi 0.5 (e lartë) → Bioma do të jetë 'Jungle'.
            return 'Jungle';  // 🌿 Xhungël - Klima e ngrohtë me shumë shi.
        } else {
            // Nëse lagështia është ≤ 0.5 (e ulët) → Bioma do të jetë 'Desert'.
            return 'Desert';  // 🏜 Shkretëtirë - Klima e thatë dhe e nxehtë.
        }
    } else {  
        // Nëse temperatura është ≤ 0.5 (e ftohtë):

        if (humidity > 0.5) {  
            // Nëse lagështia është mbi 0.5 (e lartë) → Bioma do të jetë 'Temperate'.
            return 'Temperate';  // 🌲 Klima e butë me pyje dhe lëndina.
        } else {
            // Nëse lagështia është ≤ 0.5 (e ulët) → Bioma do të jetë 'Tundra'.
            return 'Tundra';  // ❄ Klima e ftohtë me pak bimësi dhe borë.
        }
    }
*/

}





/**
 * Gjeneron të dhënat e terrenit për chunk-un duke përdorur zhurmën `SimplexNoise`.
 * @param {RNG} rng - Gjeneratori i numrave të rastësishëm për detaje procedurale.
 */
 generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);
    // Krijon një objekt `SimplexNoise` për të gjeneruar terrenin procedural.

    for (let x = 0; x < this.size.width; x++) {
        for (let z = 0; z < this.size.width; z++) {
            const biome = this.getBiome(simplex, x, z);
            // Përcakton biomen në bazë të koordinatave (x, z).

            // Gjeneron një vlerë të zhurmës për këtë pozicion x-z.
            const value = simplex.noise(
                (this.position.x + x) / this.params.terrain.scale,
                (this.position.z + z) / this.params.terrain.scale
            );

            // Llogarit lartësinë bazuar në parametrat e terrenit.
            const scaledNoise = 
                this.params.terrain.offset + 
                this.params.terrain.magnitude * value;

            let height = Math.floor(scaledNoise);
            // Rrumbullakos vlerën për të përcaktuar lartësinë e bllokut.

            height = Math.max(0, Math.min(height, this.size.height - 1));
            // Siguron që lartësia të jetë brenda kufijve të chunk-ut.

            // Mbush terrenin deri në lartësinë e përcaktuar.
            for (let y = this.size.height; y >= 0; y--) {
                if (y <= this.params.terrain.waterOffset && y === height) {
                    this.setBlockId(x, y, z, blocks.sand.id);
                    // Vendos bllok rëre nëse është nën nivelin e ujit.
                } else if (y === height) {
                    let groundBlockType;

                    // Përcakton llojin e bllokut sipas biomës.
                    if (biome === 'Desert') {
                        groundBlockType = blocks.sand.id;
                    } else if (biome === 'Temperate' || biome === 'Jungle') {
                        groundBlockType = blocks.grass.id;
                    } else if (biome === 'Tundra') {
                        groundBlockType = blocks.snow.id;
                    }

                    this.setBlockId(x, y, z, groundBlockType);
                    // Vendos bllokun përfundimtar të sipërfaqes.

                    // Gjeneron pemë në mënyrë të rastësishme bazuar në probabilitetin e caktuar.
                    if (rng.random() < this.params.trees.frequency) {
                        this.generateTree(rng, biome, x, height + 1, z);
                    }
                } else if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
                    this.generateResourceIfNeeded(simplex, x, y, z);
                    // Gjeneron burime (p.sh. qymyr, hekur) nën sipërfaqe.
                }
            }
        }
    }
}


    /**
 * Përcakton nëse duhet të gjenerohet një bllok burimi (p.sh. qymyr, hekur) në (x, y, z).
 * @param {SimplexNoise} simplex - Gjeneratori i zhurmës për shpërndarjen e burimeve.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
generateResourceIfNeeded(simplex, x, y, z) {
    this.setBlockId(x, y, z, blocks.dirt.id);
    // Vendos bllokun fillestar si tokë (dirt).

    resources.forEach(resource => {
        // Kalon nëpër listën e burimeve të mundshme (qymyr, hekur, etj.).

        const value = simplex.noise3d(
            (this.position.x + x) / resource.scale.x,
            (this.position.y + y) / resource.scale.y,
            (this.position.z + z) / resource.scale.z
        );
        // Gjeneron një vlerë të zhurmës 3D për të përcaktuar nëse një burim duhet të shfaqet.

        if (value > resource.scarcity) {
            this.setBlockId(x, y, z, resource.id);
            // Zëvendëson bllokun e tokës me një burim (p.sh., qymyr, hekur) nëse vlera e zhurmës është mbi pragun.
        }
    });
}

/**
 * Krijon një pemë në varësi të biomës në koordinatat (x, y, z).
 * @param {string} biome - Bioma ku do të vendoset pema.
 * @param {number} x - Koordinata X e trungut të pemës.
 * @param {number} y - Koordinata Y (lartësia fillestare e trungut).
 * @param {number} z - Koordinata Z e trungut të pemës.
 */
 generateTree(rng, biome, x, y, z) {
    const minH = this.params.trees.trunk.minHeight;
    const maxH = this.params.trees.trunk.maxHeight;
    const h = Math.round(minH + (maxH - minH) * rng.random());
    // Llogarit një lartësi të rastësishme për trungun brenda kufijve të caktuar.

    // Gjeneron trungun e pemës nga baza deri në majë.
    for (let treeY = y; treeY <= y + h; treeY++) {  
        if (biome === 'Temperate' || biome === 'Tundra') {
            this.setBlockId(x, treeY, z, blocks.tree.id); // Përdor trung standard.
        } else if (biome === 'Jungle') {
            this.setBlockId(x, treeY, z, blocks.jungleTree.id); // Trung i xhunglës.
        } else if (biome === 'Desert') {
            this.setBlockId(x, treeY, z, blocks.cactus.id); // Në shkretëtirë vendos kaktus.
        }
    }

    // Gjeneron kurorën e pemës nëse bioma është e përshtatshme (Temperate/Jungle).
    if (biome === 'Temperate' || biome === 'Jungle') {
        this.generateTreeCanopy(biome, x, y + h, z, rng);
    }
}


 generateTreeCanopy(biome, centerX, centerY, centerZ, rng) {
    const minR = this.params.trees.canopy.minRadius;
    const maxR = this.params.trees.canopy.maxRadius;
    const r = Math.round(minR + (maxR - minR) * rng.random());
    // Llogarit një rreze të rastësishme për kurorën brenda kufijve të caktuar.

    for (let x = -r; x <= r; x++) {
        for (let y = -r; y <= r; y++) {
            for (let z = -r; z <= r; z++) {
                const n = rng.random();

                // Kontrollon nëse blloku ndodhet brenda rrezes së kurorës.
                if (x * x + y * y + z * z > r * r) continue;

                // Sigurohet që të mos mbishkruhet një bllok ekzistues.
                const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
                if (block && block.id !== blocks.empty.id) continue;

                // Vendos gjethet me një probabilitet të përcaktuar nga densiteti i pemës.
                if (n < this.params.trees.canopy.density) {
                    if (biome === 'Temperate') {
                        this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.leaves.id);
                    } else if (biome === 'Jungle') {
                        this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.jungleLeaves.id);
                    }
                }
            }
        }
    }
}


    /**
 * Gjeneron re të vogla të bukura në qiell .
 * @param {RNG} rng - Gjeneratori i numrave të rastësishëm për shpërndarjen e reve.
 */
generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    // Krijon një objekt `SimplexNoise` për shpërndarjen procedurale të reve.

    for (let x = 0; x < this.size.width; x++) {
        for (let z = 0; z < this.size.width; z++) {
            // Gjeneron një vlerë të zhurmës për të përcaktuar vendosjen e reve.
            const value = (simplex.noise(
                (this.position.x + x) / this.params.clouds.scale,
                (this.position.z + z) / this.params.clouds.scale
            ) + 1) * 0.5;
            // Normalizon vlerën e zhurmës për ta sjellë në intervalin [0, 1].

            if (value < this.params.clouds.density) {
                this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
                // Vendos një bllok reje në shtresën më të lartë të chunk-ut.
            }
        }
    }
}




/**
 * Ngarkon ndryshimet e lojtarit nga data store dhe i aplikon në botë.
 */
 loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
            for (let z = 0; z < this.size.width; z++) {
                // Kontrollon nëse ekziston një ndryshim nga lojtari në këtë koordinatë.
                if (this.dataStore.contains(this.position.x, this.position.z, x, y, z)) {
                    const blockId = this.dataStore.get(this.position.x, this.position.z, x, y, z);
                    this.setBlockId(x, y, z, blockId);
                    // Aplikon ndryshimin e lojtarit në botë.
                }
            }
        }
    }
}

/**
 * Gjeneron një sipërfaqe uji në nivelin e përcaktuar të ujit në terren.
 */
generateWater() {
    const material = new THREE.MeshLambertMaterial({
        color: 0x9090e0, // Ngjyra blu për ujin.
        transparent: true, // Bën ujin gjysmë transparent.
        opacity: 0.5, // Vendos transparencën në 50%.
        side: THREE.DoubleSide // E bën ujin të dukshëm nga të dyja anët.
    });

    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    waterMesh.rotateX(-Math.PI / 2.0); // Rrotullon planin për ta vendosur horizontalisht.

    // Vendos pozicionin e ujit mbi nivelin e terrenit.
    waterMesh.position.set(
        this.size.width / 2,
        this.params.terrain.waterOffset + 0.4, 
        this.size.width / 2
    );

    waterMesh.scale.set(this.size.width, this.size.width, 1); // Shtrirja e ujit në të gjithë chunk-un.
    waterMesh.layers.set(1); // Vendos ujin në një shtresë të veçantë.

    this.add(waterMesh); // Shton ujin në botë.
}



    /**
 * Gjeneron përfaqësimin 3D të botës duke përdorur të dhënat e terrenit.
 */
generateMeshes() {
    this.clear();  
    // Pastron çdo mesh ekzistues për të gjeneruar të rinjtë.

    this.generateWater();  
    // Krijon sipërfaqen e ujit në botë.

    const maxCount = this.size.width * this.size.width * this.size.height;  
    // Numri maksimal i blloqeve në një chunk.

    // Krijon një tabelë kërkimi ku çelësi është ID e bllokut.
    const meshes = {};

    Object.values(blocks)
        .filter(blockType => blockType.id !== blocks.empty.id)  
        // Filtron vetëm blloqet që nuk janë bosh.

        .forEach(blockType => {
            const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
            // Krijon një `InstancedMesh` për të përmirësuar performancën e renditjes.

            mesh.name = blockType.id;  // Emëron mesh-in sipas ID-së së bllokut.
            mesh.count = 0;  // Fillimisht, nuk ka instanca të krijuara.
            mesh.castShadow = true;  // Lejon mesh-in të hedhë hije.
            mesh.receiveShadow = true;  // Lejon mesh-in të marrë hije.

            meshes[blockType.id] = mesh;
            // Shton mesh-in në tabelën e kërkimit sipas ID-së së bllokut.
        });

        const matrix = new THREE.Matrix4();  
        // Krijon një matricë transformimi për pozicionimin e blloqeve.
        
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id;
                    // Merr ID e bllokut në koordinatat (x, y, z).
        
                    if (blockId === blocks.empty.id) continue;
                    // Kalon blloqet bosh për të shmangur gjenerimin e mesh-eve të panevojshme.
        
                    const mesh = meshes[blockId];
                    const instanceId = mesh.count;
                    // Merr mesh-in përkatës dhe ID-në e tij të ardhshme të instancës.
        
                    if (!this.isBlockObscured(x, y, z)) {
                        // Kontrollon nëse blloku është i dukshëm apo i mbuluar nga të tjerë.
        
                        matrix.setPosition(x, y, z);
                        // Vendos koordinatat e bllokut në matricën transformuese.
        
                        mesh.setMatrixAt(instanceId, matrix);
                        // Vendos instancën e mesh-it në pozicionin e duhur.
        
                        this.setBlockInstanceId(x, y, z, instanceId);
                        // Ruan ID-në e instancës për bllokun në atë koordinatë.
        
                        mesh.count++;
                        // Rrit numrin e instancave të mesh-it për këtë lloj blloku.
                    }
                }
            }
        }
        
        this.add(...Object.values(meshes));
        // Shton të gjitha mesh-et në chunk për t'i vizualizuar në skenë.
    }        
    
   /**
 * Kthen të dhënat e bllokut në koordinatat (x, y, z).
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @returns {{id: number, instanceId: number} | null} - ID e bllokut dhe instanceId ose `null` nëse jashtë kufijve.
 */
getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
        return this.data[x][y][z];  // Kthen bllokun nëse është brenda kufijve.
    } else {
        return null;  // Kthen `null` nëse koordinatat janë jashtë chunk-ut.
    }
}

/**
 * Shton një bllok të ri në koordinatat (x, y, z) nëse vendi është bosh.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @param {number} blockId - ID e bllokut që do të shtohet.
 */
addBlock(x, y, z, blockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
        this.setBlockId(x, y, z, blockId);  // Vendos ID e re të bllokut.
        this.addBlockInstance(x, y, z);  // Shton një instancë të mesh-it për bllokun.
        this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
        // Ruajtja e ndryshimit në DataStore për persistencë.
    }
}

  /**
 * Heq bllokun në koordinatat (x, y, z) dhe e zëvendëson me bosh.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
        this.deleteBlockInstance(x, y, z); // Heq instancën vizuale të bllokut.
        this.setBlockId(x, y, z, blocks.empty.id); // Vendos bllokun si bosh në data model.
        this.dataStore.set(this.position.x, this.position.z, x, y, z, blocks.empty.id);
        // Përditëson DataStore për të ruajtur ndryshimin.
    }
}

/**
 * Heq instancën e mesh-it për bllokun duke e ndërruar me të fundit në listë.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block.instanceId === null) return; // Nëse blloku nuk ka instancë, nuk bëhet asgjë.

    // Gjen mesh-in e instancës për këtë bllok.
    const mesh = this.children.find((instanceMesh) => instanceMesh.name === block.id);
    const instanceId = block.instanceId;

    // Merr matricën e transformimit të instancës së fundit në mesh.
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Merr koordinatat e bllokut të fundit.
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);

    // Përditëson ID-në e instancës për bllokun e fundit.
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Ndërron matricën e bllokut që do të fshihet me atë të fundit.
    mesh.setMatrixAt(instanceId, lastMatrix);

    // Ul numrin total të instancave për mesh-in.
    mesh.count--;

    // Përditëson instancat në skenë dhe rillogarit bounding sphere për raycasting.
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Heq ID-në e instancës për bllokun e fshirë në data model.
    this.setBlockInstanceId(x, y, z, null);
}



 /**
 * Krijon një instancë të re të mesh-it për bllokun në koordinatat (x, y, z).
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 */
addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // Kontrollon nëse blloku ekziston dhe nuk është bosh.
    if (block && block.id !== blocks.empty.id) {

        // Gjen mesh-in përkatës bazuar në ID-në e bllokut.
        const mesh = this.children.find((instanceMesh) => instanceMesh.name === block.id);
        
        // Merr ID-në e re të instancës dhe e rrit numrin e instancave.
        const instanceId = mesh.count++;
        this.setBlockInstanceId(x, y, z, instanceId);

        // Krijon një matricë transformimi për pozicionimin e instancës së re.
        const matrix = new THREE.Matrix4();
        matrix.setPosition(x, y, z);

        // Vendos matricën e transformimit për këtë instancë në mesh.
        mesh.setMatrixAt(instanceId, matrix);
        mesh.instanceMatrix.needsUpdate = true; // Përditëson mesh-in në skenë.
    }
}



/**
 * Vendos ID-në e bllokut në koordinatat (x, y, z).
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @param {number} id - ID e re e bllokut.
 */
 setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
        this.data[x][y][z].id = id; // Përditëson ID-në e bllokut në strukturën e të dhënave.
    }
}

/**
 * Vendos ID-në e instancës së bllokut në koordinatat (x, y, z).
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @param {number} instanceId - ID e re e instancës për mesh-in.
 */
setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
        this.data[x][y][z].instanceId = instanceId; // Përditëson ID-në e instancës në të dhëna.
    }
}


/**
 * Kontrollon nëse koordinatat (x, y, z) janë brenda kufijve të chunk-ut.
 * @param {number} x - Koordinata X.
 * @param {number} y - Koordinata Y.
 * @param {number} z - Koordinata Z.
 * @returns {boolean} - Kthen `true` nëse blloku është brenda kufijve, përndryshe `false`.
 */
 inBounds(x, y, z) {
    if ( x >= 0 && x < this.size.width &&
        y >= 0 && y < this.size.height &&
        z >= 0 && z < this.size.width) {
        return true;
    } else {
        return false;
    }
}


/**
 * Kthen `true` nëse blloku është plotësisht i mbuluar nga blloqe të tjera.
 * @param {number} x - Koordinata X e bllokut.
 * @param {number} y - Koordinata Y e bllokut.
 * @param {number} z - Koordinata Z e bllokut.
 * @returns {boolean} - `true` nëse blloku është i mbuluar, `false` nëse ka ndonjë anë të ekspozuar.
 */
 isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    // Kontrollon nëse ndonjë anë e bllokut është e ekspozuar.
   if(
        up === blocks.empty.id ||
        down === blocks.empty.id ||
        left === blocks.empty.id ||
        right === blocks.empty.id ||
        forward === blocks.empty.id ||
        back === blocks.empty.id
    ) {
        return false;
    } else {
        return true;
    }
}



/**
 * Fshin të gjitha instancat e mesh-eve dhe pastron chunk-un.
 */
 disposeInstances() {
    this.traverse((obj) => {
        if (obj.dispose) obj.dispose(); // Fshin burimet e përdorura nga objektet.
    });
    this.clear(); // Pastron të gjithë chunk-un.
}
}

