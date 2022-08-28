import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class World {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.InitializeSkybox();
        this.InitializeLights();
    }

    InitializeSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            "../../resources/skybox/xpos.png",
            "../../resources/skybox/xneg.png",
            "../../resources/skybox/ypos.png",
            "../../resources/skybox/yneg.png",
            "../../resources/skybox/zpos.png",
            "../../resources/skybox/zneg.png",
        ]);
        this.scene.background = texture;
    }

    InitializeLights() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        this.scene.add(directionalLight);
    }
}

export { World }