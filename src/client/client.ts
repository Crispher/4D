import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { Animation_1 } from './animations'
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from './math/primitives'
import { test } from './test'


const tesseract = new Tesseract('tesseract');
const facet = new ParallelepipedCell('facet-0',
    [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    })
)


let N = 5.1;
const grid = new Grid4('tess', [N+1, N, N, 0.1]);
const camera4 = new Camera4(
    new Vector4(-10, 0, 0, 1),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    2
);


let camQueue = new CameraQueue(150, camera4, 10);

// tesseract.showFaceBorderOnly();

const scene4 = new Scene4([
    tesseract,
    // facet,
    grid.getX(RED),
    grid.getY(GREEN),
    grid.getZ(BLUE),
    // grid.getW().withMaterial(YELLOW)
    // line
])

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.z = 2


const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const scene = new Scene3WithMemoryTracker();

var sceneUpdated = true;

window.addEventListener('keydown', (e) => {
    camera4.keyboardEventHandler(e);
    sceneUpdated = true;
}, false);


let effect = new StereoEffect( renderer );
effect.setEyeSeparation(-0.01);

function render() {
    if (sceneUpdated) {
        scene.clearScene();
        camQueue.pushCamera(camera4);
        scene4.render(scene, camQueue);
        renderer.render(scene, camera);
        sceneUpdated = false;
    } else {
        // renderer.render(scene, camera);
        effect.render(scene, camera)
    }
}


const a1 = new Animation_1();
let a1r = a1.getCallbackHandler(renderer);

window.setInterval(a1r, 1000/15);
