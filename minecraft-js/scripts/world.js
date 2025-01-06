import * as THREE from 'three';



const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

export class World extends THREE.Group {
    /**
     * @type {{
     *   id: number,
     *   instanceId: number
     * }[][][]}
     */
    data = [];

    constructor(size = { width: 64, height: 32 }) {
        super();
        this.size = size;
    }


    /**
     * Generates the world data and meshes
     */
     generate() {
        this.generateTerrain();
        this.generateMeshes();
    }

    /**
 * Generates the world terrain data
 */
generateTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
        const slice = [];
        for (let y = 0; y < this.size.height; y++) {
            const row = [];
            for (let z = 0; z < this.size.width; z++) {
                row.push({
                    id: 1,
                    instanceId: null,
                });
            }
            slice.push(row);
        }
        this.data.push(slice);
    }
}


    /**
     * Generates the 3D representation of the world from the world data
     */
    generateMeshes() {
        this.clear();

        const maxCount = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
        mesh.count = 0;

        const matrix = new THREE.Matrix4();

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
                    mesh.setMatrixAt(mesh.count++, matrix);
                }
            }
        }

        this.add(mesh);
    }
}