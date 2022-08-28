import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/UnrealBloomPass.js';

import { World } from './World.js';
import { ChessBoard } from './ChessBoard.js';
import { SelectionHandler } from './SelectionHandler.js';

class Game {
    constructor(isDemo, isWhite, GameManager) {
        this.InitializeScene();
        this.InitializeCamera();
        this.InitializeRenderer();
        this.AddListeners();

        this.clock = new THREE.Clock();
        this.world = new World(this.scene, this.camera);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(17.5, 0, 17.5);

        this.isDemo = isDemo != null ? isDemo : false;
        this.isWhite = isWhite != null ? isWhite : true;
        this.GameManager = GameManager;
        this.chessBoard = new ChessBoard(this, this.isWhite);

        if (this.isDemo) {
            this.composer = new EffectComposer(this.renderer);
            this.composer.addPass(new RenderPass(this.scene, this.camera));
            this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.0, 0.75));

            this.controls.autoRotate = true;

            // this.selectionHandler_white = new SelectionHandler(this.chessBoard.whitePiecesModels, this, true);
            // this.selectionHandler_black = new SelectionHandler(this.chessBoard.blackPiecesModels, this, false);
        } else {
            if (this.isWhite) {
                this.camera.position.set(-15, 20, 17.5);
                this.selectionHandler = new SelectionHandler(this.chessBoard.whitePiecesModels, this, this.isWhite);
            } else if (!this.isWhite) {
                this.camera.position.set(50, 20, 17.5);
                this.selectionHandler = new SelectionHandler(this.chessBoard.blackPiecesModels, this, this.isWhite);
            }
            // this.selectionHandler_white = new SelectionHandler(this.chessBoard.whitePiecesModels, this, true);
            // this.selectionHandler_black = new SelectionHandler(this.chessBoard.blackPiecesModels, this, false);
        }

        window.requestAnimationFrame(() => this.Update());
    }

    InitializeScene() {
        this.scene = new THREE.Scene();
    }

    InitializeCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);
        this.camera.position.set(-15, 20, 17.5);
    }

    InitializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        if (!this.isDemo) document.querySelector(".canvas-container").appendChild(this.renderer.domElement);
    }

    AddListeners() {
        window.addEventListener("resize", () => this.OnWindowResize(), false);
    }

    OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    Update() {
        const t = this.clock.getDelta();
        this.controls.update();
        if (!this.isDemo) this.renderer.render(this.scene, this.camera);
        else this.composer.render();
        requestAnimationFrame(() => this.Update());
    }
}

export { Game }