import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
// import { Animation_1, EmptyFrameAnimation, Ep2PreviewAnimation, Ep2PreviewAnimation_MultipleTesseract, ExerciseAnimation, get3DAnimationHandler, GridAnimation_Part1, GridAnimation_Part2, GridAnimation_Part3, MovingEmptyFrameAnimation, TesseractAnimation_Part1 } from './animations'
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from './math/primitives'
import { test } from './test'

import * as EP2 from './animations/ep2';



const tesseracts = [
    new Tesseract('tesseract'),
    // new Tesseract('tess2', new Vector4(0, 0, -1, 0)).showFaceBorderOnly(3.5),
    new Tesseract('tess2', new Vector4(0, -1, -1, 0)), // occluded
    // new Tesseract('tess2', new Vector4(0, -1, 0, 0)).showFaceBorderOnly(2),
    // new Tesseract('tess2', new Vector4(-1, -1, -1, 0)),
    // new Tesseract('tess2', new Vector4(-1, 0, 0, 0)),
    // // new Tesseract('tess2', new Vector4(-1, 0, -1, 0)),
    // // new Tesseract('tess2', new Vector4(-1, -1, 0, 0)),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 1)),
];


let N = 1.5;
const grid = new Grid4('tess', [N+1, N, N, 0.1]);
const camera4 = new Camera4(
    // new Vector4(-10, 0, 0, 1),
    new Vector4(-4, 2, 2, 2),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    1.2
);
camera4.lookAt(new Vector4(0, 0, 0, 1));

let camQueue = new CameraQueue(150, 10);

// tesseract.showFaceBorderOnly();

const scene4 = new Scene4([
    ...tesseracts,
    // facet,
    grid.getX(RED),
    grid.getY(GREEN),
    grid.getZ(BLUE),
    // grid.getW().withMaterial(YELLOW)
    // line
])

console.log(window.innerHeight, window.innerWidth);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.z = 2


const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.setSize(3840, 2160);
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
effect.setEyeSeparation(-0.064);
effect.setSize(window.innerWidth, window.innerHeight);

var capturer = new CCapture( { format: 'webm', framerate: 48} );

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
    capturer.capture(renderer.domElement);
}

window.addEventListener('keydown', (e) => {
    if (e.which === 83) {
        capturer.start()
    }
    if (e.which === 68) {
        capturer.save();
    }
}, false);



// const animation_1 = new EmptyFrameAnimation(8);
// const animation_1 = new MovingEmptyFrameAnimation(8);
// const animation_1 = new GridAnimation_Part1(10);
// const animation_1 = new TesseractAnimation_Part1(10, 1);
// animation_1.playbackSpeed = 1;

// const animation_1 = new GridAnimation_Part3(12, 0.2);
// const animation_1 = new TesseractAnimation_Part1(8, .1);
// const animation_1 = new ExerciseAnimation(8, 0.1);
// const animation_1 = new Ep2PreviewAnimation(8, .1);
// window.setInterval(render, 1000/15);

let save_animation = false;
if (save_animation) {
    renderer.setSize(3840, 2160);
}
// renderer.setSize(1920, 1080);

let render3 = EP2.get3DAnimationHandler(renderer, capturer)

let animation = new EP2.P1(save_animation?48:18);
let render_animation = animation.getCallbackHandler(renderer, save_animation?capturer:undefined, effect);

// window.setInterval(animation_1.getCallbackHandler(renderer), 1000/animation_1.frameRate);
// window.setInterval(render, 24);
window.setInterval(render_animation, save_animation?(1000/48):(1000/18));
// window.setInterval(render3, 1000/48);
