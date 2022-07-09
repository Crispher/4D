import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE,  } from './math/primitives'



const tesseracts = [
    new Tesseract('tesseract').showFaceBorderOnly(3.5),
    // new Tesseract('tess2', new Vector4(0, 0, -1, 0)).showFaceBorderOnly(3.5),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 0)), // occluded
    // new Tesseract('tess2', new Vector4(0, -1, 0, 0)).showFaceBorderOnly(2),
    // new Tesseract('tess2', new Vector4(-1, -1, -1, 0)),
    // new Tesseract('tess2', new Vector4(-1, 0, 0, 0)),
    // // new Tesseract('tess2', new Vector4(-1, 0, -1, 0)),
    // // new Tesseract('tess2', new Vector4(-1, -1, 0, 0)),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 1)),
];


let N = 2.1;
const grid = new Grid4('tess', [N+1, N, N, 0.1]);
const camera4 = new Camera4(
    // new Vector4(-10, 0, 0, 1),
    new Vector4(-5, 0, 0, 0),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    1.2
);
camera4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));

let camQueue = new CameraQueue(5, 1);


const scene4 = new Scene4([
    ...tesseracts,
    grid.getX(RED),
    grid.getY(GREEN),
    grid.getZ(BLUE)
])

console.log(window.innerHeight, window.innerWidth);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.z = 2


const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true;
const container = document.getElementById('container');

if (container) {
    container.appendChild(renderer.domElement)
}

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
        renderer.render(scene, camera)
    }

}



window.setInterval(render, 24);

