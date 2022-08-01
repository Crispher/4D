import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE,  } from './math/primitives'
import {i2ia, ia2i, generate_boxes} from './math/demo2'



let url = window.location;
let params = new URLSearchParams(url.search);
let p_param = params.get('p');

let p = 0.05;

if (p_param) {
    p = parseFloat(p_param);
}


const tesseracts = [];

console.log('generateing boxes...');

let tess_grid = generate_boxes(p);

console.log('rendering...');

for (let i = 0; i < 81; i++) {
    if (tess_grid[i]) {
        let ia = i2ia(i);
        tesseracts.push(
            new Tesseract('t', new Vector4(...ia)).showFaceBorderOnly(3.5)
        )
    }
}


let N = 3.1;
const grid = new Grid4('tess', [N+1, N, N, 0.1]);
let side = 15;
const camera4 = new Camera4(
    // new Vector4(-10, 0, 0, 1),
    new Vector4(100,side, side, side),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    20
);
camera4.lookAt_w_as_up(new Vector4(1, 1, 1, 2));

let camQueue = new CameraQueue(1, 1);


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

// generate random int beween 0 and 3

let truth_index = Math.floor(Math.random() * 3.99);

let div_ids = ["a", "b", "c", "d"];
let div_values = [0, 0, 0, 0];
for (let i = 0; i < 4; i++) {
    div_values[i] = tesseracts.length + (i - truth_index);
}

let truth_div = document.getElementById(div_ids[truth_index]);
for (let i = 0; i < div_ids.length; i++) {
    let div = document.getElementById(div_ids[i]);
    div!.textContent = `${div_values[i]}`;
    div!.addEventListener('click', () => {
        truth_div!.classList.add('correct');
        if (i !== truth_index) {
            div!.classList.add('wrong');
        }
    })
}


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

