import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { Camera4, CameraQueue, Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, SimplexCell, LineObject, TwoManifoldMesh_2, ThreeManifoldMesh } from './math/primitives'

import {exp, sin, pow, tan, cos, cosh, tanh, sqrt, log, complex} from 'mathjs'

import * as EP3 from './animations/ep3';
import * as math from 'mathjs';



/* 场景中的超立方体 */

const tesseracts = [
    new Tesseract('tess1'),
    // new Tesseract('tess2', new Vector4(0, 0, -1, 0)).showFaceBorderOnly(3.5),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 0)), // occluded
    // new Tesseract('tess2', new Vector4(0, -1, 0, 0)).showFaceBorderOnly(2),
    // new Tesseract('tess2', new Vector4(-1, -1, -1, 0)),
    // new Tesseract('tess2', new Vector4(-1, 0, 0, 0)),
    // // new Tesseract('tess2', new Vector4(-1, 0, -1, 0)),
    // // new Tesseract('tess2', new Vector4(-1, -1, 0, 0)),
    // new Tesseract('tess2', new Vector4(0, -1, -1, 1)),
];


let N = 0;
const grid = new Grid4('tess', [N+1, N, N, N]);
const camera4 = new Camera4(
    new Vector4(-12,0,0,0),
    // new Vector4(-4, 2, 2, 2), // 相机位置
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }), // 相机朝向（由四个向量组成）
    5 // 投影屏面距离
);
camera4.lookAt(new Vector4(0, 0, 0, 0)); //改变相机朝向，让它看向某个点

let camQueue = new CameraQueue(2, 1); //用来画相机轨迹的队列，可以不用管


let manifold_func = (u: number, v: number) => {
    return new Vector4(
        Math.cos(u) * Math.cos(v),
        Math.cos(u) * Math.sin(v),
        Math.sin(u),
        0);
}


let f3 = new ThreeManifoldMesh(
    'f',
    [-0*Math.PI, 2*Math.PI],
    [-1, 1],
    [-1, 1],
    12,4,4,
    (u, v, w) => new Vector4(
        cos(u),
        sin(u),
        v,
        w
    ),
    (u:number, v:number, w: number) => new Vector4(
        cos(u),
        sin(u),
        0,
        0
    )
)


let s3 = new ThreeManifoldMesh(
    'f',
    [-0*Math.PI, 0.5*Math.PI],
    [0, 2*Math.PI],
    [0, 2*Math.PI],
    6,9,9,
    (u, v, w) => new Vector4(
        cos(u) * cos(v),
        cos(u) * sin(v),
        sin(u) * cos(w),
        sin(u) * sin(w)
    ),
    (u:number, v:number, w: number) => new Vector4(
        cos(u) * cos(v),
        cos(u) * sin(v),
        sin(u) * cos(w),
        sin(u) * sin(w)
    )
)



// 场景中加入超立方体和网格
const scene4 = new Scene4([
    // ...tesseracts,
    f3,
    // new SimplexCell('cell', [
    //     new Vector4(0, 0, 0, 0),
    //     new Vector4(0, 1, 0, 0),
    //     new Vector4(0, 0, 1, 0),
    //     new Vector4(0, 0, 0, 1),
    // ]),
    // new LineObject('line',
    //     new Vector4(1, -2, 0.2, 0.5),
    //     new Vector4(1, 2, 0.2, 0.5),
    // ).withMaterial(WHITE),
    // grid.getX(RED),
    // grid.getY(GREEN),
    // grid.getZ(BLUE),
])

// 用来看三维照片的相机
const camera = new THREE.PerspectiveCamera(25, 16/9, 0.1, 1000)

camera.position.z = 6

// 用来把三维照片渲染成二维画面的渲染器
const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.setSize(3840, 2160)
// renderer.setSize(1920, 1080)
// renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

// 用来放四维物体在三维照片中的像的三维场景
const scene = new Scene3WithMemoryTracker();

var sceneUpdated = true;

window.addEventListener('keydown', (e) => {
    camera4.keyboardEventHandler(e, 10, 1);
    sceneUpdated = true;
}, false);

// 用来把三维照片渲染成立体画面的渲染器，可以不用管
let effect = new StereoEffect( renderer );
// effect.setEyeSeparation(0.06);
// effect.setSize(window.innerWidth, window.innerHeight);

// 渲染视频用的，可以不用管
var capturer = new CCapture( { format: 'webm', framerate: 48} );

function render() {
    if (sceneUpdated) {
        scene.clearScene();
        camQueue.pushCamera(camera4);
        scene4.render(scene, camQueue);
        sceneUpdated = false;
    }
    renderer.render(scene, camera);// 这里也换成effect.render（裸眼3D）
    // effect.render(scene, camera)
    // capturer.capture(renderer.domElement); 把这行注释掉，似乎可以节省一点内存
}

// 试试调低一下帧率，看看能不能流畅一点，后面的数字是每一帧间隔的毫秒数

var frameRate = 48;
const exp_plot_animation = new EP3.FuncPlot_tan(frameRate);
let animation_render = exp_plot_animation.getCallbackHandler(renderer, frameRate == 48 ? capturer : undefined, effect);



window.setInterval(render, 1000/24);
//  window.setInterval(animation_render, 1000/frameRate);
