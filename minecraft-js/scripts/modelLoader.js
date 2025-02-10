import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Importon `GLTFLoader`, i cili përdoret për të ngarkuar modele 3D në formatin `.glb` ose `.gltf`.

export class ModelLoader { 
    loader = new GLTFLoader(); 
    // Krijon një instancë të `GLTFLoader` për të menaxhuar ngarkimin e modeleve.

    models = { pickaxe: undefined };  
    // Objekti `models` ruan modelet e ngarkuara, ku `pickaxe` do të përmbajë modelin e kazmës.

    /**
     * Ngarkon modelet 3D në memorie.
     * @param {(object) => ()} onLoad - Funksion që ekzekutohet pasi modeli të jetë ngarkuar.
     */
    loadModels(onLoad) {
        this.loader.load('/models/pickaxe.glb', (model) => {
            const mesh = model.scene;  
            // Merr skenën (`scene`) nga modeli të ngarkuar.

            this.models.pickaxe = mesh;  
            // Ruajtja e modelit të kazmës në objektin `models`.

            onLoad(this.models);  
            // Ekzekuton funksionin `onLoad` pasi modeli të jetë ngarkuar.
        });
    }
}
