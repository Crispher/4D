import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from './math/primitives'

import * as EP2 from './animations/ep2';

/* 场景中的超立方体 */

const tesseracts = [
    new Tesseract('tess1').showFaceBorderOnly(),
    // new Tesseract('tess2', new Vector4(0, 0, -1, 0)).showFaceBorderOnly(3.5),
    new Tesseract('tess2', new Vector4(0, -1, -1, 0)), // occluded
    // new Tesseract('tess2', new Vector4(0, -1, 0, 0)).showFaceBorderOnly(2),
    // new Tesseract('tess2', new Vector4(-1, -1, -1, 0)),
    new Tesseract('tess2', new Vector4(-1, 0, 0, 0)),
    // // new Tesseract('tess2', new Vector4(-1, 0, -1, 0)),
    // // new Tesseract('tess2', new Vector4(-1, -1, 0, 0)),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 1)),
];


let N = 1.5;
const grid = new Grid4('tess', [N+1, N, N, 0.1]);
const camera4 = new Camera4(
    // new Vector4(-10, 0, 0, 1),
    new Vector4(-4, 2, 2, 2), // 相机位置
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }), // 相机朝向（由四个向量组成）
    1.2 // 投影屏面距离
);
camera4.lookAt(new Vector4(0, 0, 0, 1)); //改变相机朝向，让它看向某个点

let camQueue = new CameraQueue(3, 1); //用来画相机轨迹的队列，可以不用管


// 场景中加入超立方体和网格
const scene4 = new Scene4([
    ...tesseracts,
    grid.getX(RED),
    grid.getY(GREEN),
    grid.getZ(BLUE),
])

// 用来看三维照片的相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.z = 2

// 用来把三维照片渲染成二维画面的渲染器
const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

// 用来放四维物体在三维照片中的像的三维场景
const scene = new Scene3WithMemoryTracker();

var sceneUpdated = true;

window.addEventListener('keydown', (e) => {
    camera4.keyboardEventHandler(e);
    sceneUpdated = true;
}, false);

// 用来把三维照片渲染成立体画面的渲染器，可以不用管
let effect = new StereoEffect( renderer );
effect.setEyeSeparation(-0.064);
effect.setSize(window.innerWidth, window.innerHeight);

// 渲染视频用的，可以不用管
var capturer = new CCapture( { format: 'webm', framerate: 48} );

function render() {
    if (sceneUpdated) {
        scene.clearScene();
        camQueue.pushCamera(camera4);
        scene4.render(scene, camQueue);
        renderer.render(scene, camera);
        sceneUpdated = false;
    } else {
        renderer.render(scene, camera);
        // 如果用下面这行替代上面的，会渲染出立体画（裸眼3D）
        // effect.render(scene, camera)
    }
    capturer.capture(renderer.domElement);
}


window.setInterval(render, 24);
