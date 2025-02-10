import * as THREE from 'three';

/**
 * Klasa `Tool` përfaqëson një mjet 3D (p.sh., kazma) që lojtari mund të përdorë.
 * Trashëgon nga `THREE.Group` për ta përfshirë në skenën 3D.
 */
export class Tool extends THREE.Group {
    animate = false; // Tregon nëse mjeti po lëviz.
    animationAmplitude = 0.5; // Amplituda e lëvizjes së animacionit.
    animationDuration = 750; // Kohëzgjatja e animacionit në milisekonda.
    animationStart = 0; // Koha kur animacioni fillon.
    animationSpeed = 0.025; // Shpejtësia e animacionit (rad/s).
    animation = undefined; // Ruajtja e animacionit aktual.
    toolMesh = undefined; // 3D objekti i mjetit.

/**
 * Kthen kohën që ka kaluar nga fillimi i animacionit.
 */
    get animationTime() {
        return performance.now() - this.animationStart;
    }

/**
 * Nis një animacion të ri të mjetit.
 */
    startAnimation() {
        if (this.animate) return; // Parandalon rifillimin e animacionit nëse është aktiv.

        this.animate = true;
        this.animationStart = performance.now(); // Regjistron kohën e fillimit.

        clearTimeout(this.animate); // Ndërpret animacionin e mëparshëm.

        this.animation = setTimeout(() => {
            this.animate = false;
            this.toolMesh.rotation.y = 0; // Reseton animacionin pas përfundimit.
        }, this.animationDuration);
    }

/**
 * Përditëson animacionin e mjetit nëse është aktiv.
 */
    update() {
        if (this.animate && this.toolMesh) {
            // Kryen lëvizje sinusoidale për të simuluar animacionin.
            this.toolMesh.rotation.y = this.animationAmplitude * 
            Math.sin(this.animationTime * this.animationSpeed);
        }
    }

/**
 * Vendos modelin 3D të mjetit aktiv.
 * @param {THREE.Mesh} mesh - Mesh-i 3D që përfaqëson mjetin.
 */
    setMesh(mesh) {
        this.clear(); // Pastron çdo mesh ekzistues.
        this.toolMesh = mesh;
        this.add(this.toolMesh); // Shton modelin e ri në skenë.

        mesh.receiveShadow = true; // Lejon modelin të marrë hije.
        mesh.castShadow = true; // Lejon modelin të krijojë hije.

        // Vendos pozicionin, shkallën dhe rrotacionin e mjetit në dorën e lojtarit.
        this.position.set(0.6, -0.3, -0.5);
        this.scale.set(0.5, 0.5, 0.5);
        this.rotation.z = Math.PI / 2;
        this.rotation.y = Math.PI + 0.2;
    }
}
