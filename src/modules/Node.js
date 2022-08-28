import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class Node {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.coordinate = null;

        this.geometry = new THREE.BoxGeometry(5, 1, 5);
        this.material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);

        this.moveGeometry = new THREE.BoxGeometry(4.5, 1.5, 4.5);
        this.moveMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.8 });
        this.moveMesh = new THREE.Mesh(this.moveGeometry, this.moveMaterial);
        this.moveMesh.position.copy(this.position);
        this.moveMesh.NODE = this;
    }

    SetColor(hex) {
        this.material.color.setHex(hex);
    }

    SetCoordinate(coordinate) {
        this.coordinate = coordinate;
    }

    ShowMove(scene) {
        if (this.moveMesh.parent) return;

        scene.add(this.moveMesh)
    }

    HideMove(scene) {
        if (!this.moveMesh.parent) return;

        scene.remove(this.moveMesh);
    }
}

export { Node }