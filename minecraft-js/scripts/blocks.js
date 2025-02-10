/**Ky kod është një modul në Three.js për krijimin dhe menaxhimin e blloqeve të ndryshme në një botë Minecraft-like.
 *  Ai kryen këto funksione kryesore:

1.Ngarkon teksturat për blloqet nga skedarët .png dhe aplikon filtrimin e ngjyrave 
për t'i bërë teksturat të duken më të pastra.
2.Krijon një objekt textures që përmban të gjitha teksturat e blloqeve,
 duke i ndarë sipas tipave (bar, gur, pemë, etj.).
3.Ndërton një objekt blocks, i cili përmban të gjithë blloqet e lojës me vetitë e tyre: 
ID, emër, ngjyrë, material, përmasat dhe shkallën e rrallësisë (për minerale).
4.Definon një listë resources, e cila përmban vetëm blloqet minerale si stone, coalOre, dhe ironOre */




// Importimi i bibliotekës Three.js për krijimin e botës 3D
import * as THREE from 'three';

// Krijimi i një instance të `TextureLoader` për të ngarkuar teksturat
const textureLoader = new THREE.TextureLoader();

/**
 * Funksion për të ngarkuar një teksturë nga një skedar PNG.
 * - Ngarkon teksturën nga rruga e dhënë.
 * - Përdor hapësirën e ngjyrave `SRGBColorSpace` për ngjyra më të sakta.
 * - Vendos filtrin `NearestFilter` për të ruajtur pamjen pixel-art pa turbullim.
 */
  function loadTexture(path) {
    const texture = textureLoader.load(path); // Ngarkon teksturën nga rruga e dhënë
    texture.colorSpace = THREE.SRGBColorSpace; // Siguron që tekstura të ketë hapësirën e duhur të ngjyrave
    texture.magFilter = THREE.NearestFilter; // Përdor filtrin më të afërt për zmadhim (ruan pixel-art)
    texture.minFilter = THREE.NearestFilter; // Përdor filtrin më të afërt për zvogëlim (ruan pixel-art)
    return texture; // Kthen teksturën e përpunuar
}

// Krijimi i një objekti që përmban të gjitha teksturat e blloqeve të lojës
const textures = {
  cactusSide: loadTexture('textures/cactus_side.png'), // Tekstura e anës së kaktusit
  cactusTop: loadTexture('textures/cactus_top.png'), // Tekstura e sipërme e kaktusit
  dirt: loadTexture('textures/dirt.png'), // Tekstura e dheut
  grass: loadTexture('textures/grass.png'), // Tekstura e barit
  grassSide: loadTexture('textures/grass_side.png'), // Tekstura anësore e barit
  stone: loadTexture('textures/stone.png'), // Tekstura e gurit
  coalOre: loadTexture('textures/coal_ore.png'), // Tekstura e mineralit të qymyrit
  ironOre: loadTexture('textures/iron_ore.png'), // Tekstura e mineralit të hekurit
  leaves: loadTexture('textures/leaves.png'), // Tekstura e gjetheve
  treeSide: loadTexture('textures/tree_side.png'), // Tekstura anësore e trungut të pemës
  treeTop: loadTexture('textures/tree_top.png'), // Tekstura e sipërme e trungut të pemës
  jungleTreeSide: loadTexture('textures/jungle_tree_side.png'), // Tekstura anësore e trungut të xhunglës
  jungleTreeTop: loadTexture('textures/jungle_tree_top.png'), // Tekstura e sipërme e trungut të xhunglës
  jungleLeaves: loadTexture('textures/jungle_leaves.png'), // Tekstura e gjetheve të xhunglës
  sand: loadTexture('textures/sand.png') // Tekstura e rërës
};

// Krijimi i një objekti `blocks` që përmban të gjithë blloqet e lojës
export const blocks = {
  empty: {
      id: 0,  // ID-ja e bllokut bosh (hapësirë e zbrazët)
      name: 'empty' // Emri i bllokut bosh
  },

  grass: {
    id: 1, // ID unike për bllokun e barit
    name: 'grass', // Emri i bllokut
    color: 0x559020, // Ngjyra në rast se nuk përdoret tekstura
    material: [ // Materialet për secilën anë të bllokut
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Ana e djathtë
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Ana e majtë
        new THREE.MeshLambertMaterial({ map: textures.grass }), // Pjesa e sipërme (bar)
        new THREE.MeshLambertMaterial({ map: textures.dirt }), // Pjesa e poshtme (dhe)
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Pjesa e përparme
        new THREE.MeshLambertMaterial({ map: textures.grassSide })  // Pjesa e pasme
    ]
},
dirt: {
  id: 2, // ID e bllokut të dheut
  name: 'dirt', // Emri i bllokut
  color: 0x807020, // Ngjyra e tokës
  material: new THREE.MeshLambertMaterial({ map: textures.dirt }) // Materiali i tij
},
stone: {
  id: 3, // ID e bllokut të gurit
  name: 'stone',
  color: 0x808080, // Ngjyra gri
  scale: { x: 30, y: 30, z: 30 }, // Përmasat e gurit
  scarcity: 0.5, // Shkalla e rrallësisë në botën e lojës
  material: new THREE.MeshLambertMaterial({ map: textures.stone })
},
 
coalOre: { // Ky është objekti që përfaqëson bllokun e mineralit të qymyrit
  id: 4, // Identifikuesi unik i bllokut të qymyrit në lojë.
  name: 'coalOre', // Emri i bllokut. 
  color: 0x202020, // Ngjyra e bllokut nëse nuk ka teksturë. 
  // 0x202020 është një ngjyrë gri shumë e errët, për të imituar pamjen e qymyrit.
  scale: { x: 20, y: 20, z: 20 }, // Përmasat e bllokut në tre drejtime (X, Y, Z).
  // x: 20 -> Gjerësia e bllokut është 20 njësi.
  // y: 20 -> Lartësia e bllokut është 20 njësi.
  // z: 20 -> Thellësia e bllokut është 20 njësi.
  // Ky parametër përcakton sa i madh do të jetë blloku në lojë.
  scarcity: 0.8, // Rrallësia e bllokut në botë.
  // Vlera më e lartë do të thotë se ky bllok është më i rrallë dhe më i vështirë për t’u gjetur.
  material: new THREE.MeshLambertMaterial({ map: textures.coalOre }) 
  // Materiali i bllokut, i cili përcakton se si do të duket në lojë.
  // new THREE.MeshLambertMaterial({ map: textures.coalOre })
  // krijon një material që përdor një teksturë të ngarkuar.
  // textures.coalOre është tekstura që kemi ngarkuar më parë
  // nga skedari 'textures/coal_ore.png'.
  // `MeshLambertMaterial` është një material i përshtatshëm për
  // ndriçim të butë, duke krijuar një pamje realiste.
},


ironOre: { // Ky është objekti që përfaqëson bllokun e mineralit të hekurit.
  id: 5, // Identifikuesi unik i bllokut të mineralit të hekurit. 
  name: 'ironOre', // Emri i bllokut. 
  color: 0x806060, // Ngjyra e bllokut nëse nuk ka një teksturë të ngarkuar.
  // 0x806060 është një ngjyrë gri e butë me nuanca të lehta portokalli për të imituar mineralin e hekurit.
  scale: { x: 60, y: 60, z: 60 }, // Përmasat e bllokut në hapësirën 3D.
  // Kjo përcakton madhësinë e bllokut të mineralit të hekurit në botën e lojës.
  scarcity: 0.9, // Rrallësia e bllokut në botë.
  material: new THREE.MeshLambertMaterial({ map: textures.ironOre }) 
  // Materiali i bllokut, i cili përcakton si do të duket në lojë.
},


tree: { // Ky është objekti që përfaqëson trungun e pemës në lojë.
  id: 6, // Identifikuesi unik i bllokut të trungut të pemës.
  name: 'tree', // Emri i bllokut. Ky është një varg (string) që përfaqëson emrin e tij
  visible: true, // Ky parametër tregon nëse blloku është i dukshëm në lojë ose jo.
  material: [ // Lista e materialeve për secilën faqe të bllokut.
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Ana e djathtë e trungut.
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Ana e majtë e trungut.
      new THREE.MeshLambertMaterial({ map: textures.treeTop }),  // Ana e sipërme e trungut.
      new THREE.MeshLambertMaterial({ map: textures.treeTop }),  // Ana e poshtme e trungut.
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Ana e përparme e trungut.
      new THREE.MeshLambertMaterial({ map: textures.treeSide })  // Ana e pasme e trungut.
  ]
},


leaves: { 
  id: 7, // ID unike për bllokun e gjetheve.
  name: 'leaves', // Emri i bllokut, përfaqëson gjethet e pemës.
  material: new THREE.MeshLambertMaterial({ map: textures.leaves }) 
  // Materiali përcakton pamjen e bllokut duke përdorur teksturën e gjetheve.
},

sand: { 
  id: 8, // ID unike për bllokun e rërës.
  name: 'sand', // Emri i bllokut, përfaqëson rërën.
  
  material: new THREE.MeshLambertMaterial({ map: textures.sand }) 
  // Materiali përcakton pamjen e bllokut duke përdorur teksturën e rërës.
},
cloud: { 
  id: 9, // ID unike për bllokun e reve.
  name: 'cloud', // Emri i bllokut, përfaqëson një re.
  material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }) 
  // Materiali përdor një ngjyrë të bardhë të hapur (0xf0f0f0) pa teksturë.
  // `MeshBasicMaterial` nuk ndikohet nga drita,
  // duke e bërë bllokun gjithmonë të ndriçuar njëtrajtësisht.
},

snow: { 
  id: 10, // ID unike për bllokun e borës.
  name: 'snow', // Emri i bllokut, përfaqëson borën.

  material: new THREE.MeshLambertMaterial({ color: 0xffffff }) 
  // Materiali ka një ngjyrë të bardhë të pastër (0xffffff) dhe përdor `MeshLambertMaterial` 
  // për të reflektuar dritën në mënyrë realiste.
},

jungleTree: { 
  id: 11, // ID unike për bllokun e trungut të pemës së xhunglës.
  name: 'jungleTree', // Emri i bllokut, përfaqëson trungun e pemës së xhunglës.

  material: [ // Lista e materialeve për secilën anë të bllokut.
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // Ana e djathtë
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // Ana e majtë
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),  // Ana e sipërme
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),  // Ana e poshtme
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // Ana e përparme
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide })  // Ana e pasme
  ]
},

jungleLeaves: { 
  id: 12, // ID unike për bllokun e gjetheve të pemës së xhunglës.
  name: 'jungleLeaves', // Emri i bllokut, përfaqëson gjethet e pemës së xhunglës.
  material: new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }) 
  // Materiali përdor teksturën e gjetheve të xhunglës për pamje realiste.
},

cactus: { 
  id: 13, // ID unike për bllokun e kaktusit.
  name: 'cactus', // Emri i bllokut, përfaqëson një kaktus.

  material: [ // Lista e materialeve për secilën anë të bllokut.
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // Ana e djathtë
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // Ana e majtë
      new THREE.MeshLambertMaterial({ map: textures.cactusTop }),  // Ana e sipërme
      new THREE.MeshLambertMaterial({ map: textures.cactusTop }),  // Ana e poshtme
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // Ana e përparme
      new THREE.MeshLambertMaterial({ map: textures.cactusSide })  // Ana e pasme
  ]
}
}

export const resources = [ 
  // Ky array përmban blloqet që konsiderohen si burime natyrore në lojë.
  // Këto blloqe mund të minohen dhe të përdoren për ndërtim ose krijimin e objekteve.
  blocks.stone,    // Gurët si burim ndërtimi
  blocks.coalOre,  // Minierali i qymyrit si burim energjie
  blocks.ironOre   // Minierali i hekurit për krijimin e veglave dhe armaturave
]
