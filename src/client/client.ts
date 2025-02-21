import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { Camera4, CameraQueue, Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, RED, GREEN, BLUE, YELLOW, WHITE, SimplexCell, LineObject, TwoManifoldMesh_2, ThreeManifoldMesh, getTesseractCells, FiveCell, SixteenCell, TwentyFourCell, getDuocylinder, getConicalCylinder, getSphericalCone, getCubinder, getSphericalCylinder } from './math/primitives'

import {exp, sin, pow, tan, cos, cosh, tanh, sqrt, log, complex} from 'mathjs'

import * as EP3 from './animations/ep3';
import { CubinderAnimation, HypersphereAnimation, HypersphereAnimation2, HypersphereAnimation3, SpherinderAnimation } from './animations/ep5';
import { ConeSweepingAnimation, CylinderSweepingAnimation, DuocylinderAnimation, EightCellAnimation, FiveCellAnimation, HypersphereAnimation_EP6, RotatingPolyCellAnimation, SixteenCellAnimation, SphereSweepingAnimation, SphericalConeAnimation, TwentyFourCellAnimation } from './animations/ep6';

// get parameters from url
const urlParams = new URLSearchParams(window.location.search);
const isStereo = urlParams.get('stereo') === 'true';
const eyeSep = parseFloat(urlParams.get('eyeSep') || '0.06');
const sceneId = urlParams.get('scene') || '0';

const camera4 = new Camera4(
    new Vector4(-12,0,0,0),
    // new Vector4(-4, 2, 2, 2), // 相机位置
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }), // 相机朝向（由四个向量组成）
    4 // 投影屏面距离
);
camera4.lookAt(new Vector4(0, 0, 0, 0)); //改变相机朝向，让它看向某个点

let camQueue = new CameraQueue(2, 1); //用来画相机轨迹的队列，可以不用管


function getScene(sceneId: string) {
    let floor = new ThreeManifoldMesh(
        'floor',
        [-2, 2],
        [-2, 2],
        [-2, 2],
        4,4,4,
        (u, v, w) => new Vector4(u,v,w,-0.6),
        (u:number, v:number, w: number) => new Vector4(0,0,0,-1),
    )
    floor.thicknessRange = 1

    if (sceneId === "0") {
        let t_cells = getTesseractCells();
        return new Scene4([
            ...t_cells,
            floor,
        ])
    } else if (sceneId === "1") {
        let s3 = new ThreeManifoldMesh(
            'f',
            [0*Math.PI, 0.5*Math.PI],
            [0, 2*Math.PI],
            [0, 2*Math.PI],
            5,7,7,
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
            ),
            [false, true, true]
        )
        s3.isClosedSurface = true;

        return new Scene4([
            s3,
        ])
    } else if (sceneId === "2") {
        let s3 = new ThreeManifoldMesh(
            'f',
            [0*Math.PI, 0.5*Math.PI],
            [0, 2*Math.PI],
            [0, 2*Math.PI],
            5,7,7,
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
            ),
            [false, true, true]
        ).scale(0.5).translate(new Vector4(0,0.5,0,0))
        let tesseract = getTesseractCells().map((e) => e.translate(new Vector4(0,-0.5,0,0)));

        return new Scene4([
            ...tesseract,
            s3,
            floor
        ])
    } else if (sceneId === "5") {
        // return a scene4 with a fivecell and a floor
        let fivecell = new FiveCell("fivecell").scale(0.75);
        return new Scene4([
            fivecell,
            floor
        ]);
    } else if (sceneId === "6") {
        let sixteenCell = new SixteenCell("sixteencell").scale(0.75).translate(new Vector4(0,0,0,0.25));
        return new Scene4([
            sixteenCell,
            floor
        ]);
    } else if (sceneId === "7") {
        let twentyFourCell = new TwentyFourCell("twentyfourcell").scale(0.75).translate(new Vector4(0,0,0,0.25));
        return new Scene4([
            twentyFourCell,
        //    floor
        ]);
    } else  if (sceneId === "8") {
        let duocylinder = getDuocylinder();
        // for (let s of duocylinder) {
        //     s.scale(0.75).translate(new Vector4(0,0,0,0.25));
        // }
        return new Scene4([
            ...duocylinder
        ]);
    } else if (sceneId === "9") {
        let conicalCylinder = getConicalCylinder();
        for (let s of conicalCylinder) {
            s.translate(new Vector4(0,0,-0.5,-0.5));
        }
        return new Scene4([
            ...conicalCylinder
        ]);
    } else if (sceneId === "10") {
        let sphericalCone = getSphericalCone();
        for (let sc of sphericalCone) {
            sc.translate(new Vector4(0,0,0,-.75));
        }
        return new Scene4([
            sphericalCone[0], sphericalCone[1]
        ]);
    } else if (sceneId === "11") {
        let cubinder = getCubinder(2);
        for (let sc of cubinder) {
            sc.scale(0.8).translate(new Vector4(0,0,0,-.75));
        }
        return new Scene4([
            ...cubinder
        ]);
    } else if (sceneId === "12") {
        let sphericalCylindder = getSphericalCylinder(1.5);
        for (let sc of sphericalCylindder) {
            sc.translate(new Vector4(0,0,0,-.75));
        }
        return new Scene4([
            ...sphericalCylindder
        ]);
    }
    else {
        return new Scene4([]);
    }
}


const scene4 = getScene(sceneId);

// 用来看三维照片的相机
const camera = new THREE.PerspectiveCamera(25, window.innerWidth/window.innerHeight, 0.1, 1000)

camera.position.z = 4

// 用来把三维照片渲染成二维画面的渲染器
const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.setSize(3840, 2160)
// renderer.setSize(1920, 1080)
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement)


// add window resize listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement)

// 用来放四维物体在三维照片中的像的三维场景
const scene = new Scene3WithMemoryTracker();

// 用来把三维照片渲染成立体画面的渲染器，可以不用管
let effect = new StereoEffect( renderer );
effect.setEyeSeparation(eyeSep);



var sceneUpdated = true;

let keydownEvents: KeyboardEvent[] = [];

window.addEventListener('keydown', (e) => {
    if (keydownEvents.filter((e2) => e2.key == e.key).length == 0) {
        keydownEvents.push(e);
    }
}, false);

window.addEventListener('keyup', (e) => {
    keydownEvents = keydownEvents.filter((e2) => e2.key != e.key);
}, false);


let div_ids = ["q", "w", "e", "a", "s", "d"];

for (let i = 0; i < div_ids.length; i++) {
    let key = div_ids[i];
    let div = document.getElementById(key);
    div!.addEventListener('touchstart', () => {
        let keyboardEvent = new KeyboardEvent('keydown', {key: key});
        keydownEvents.push(keyboardEvent);
    })
    div!.addEventListener('touchend', () => {
        let keyboardEvent = new KeyboardEvent('keydown', {key: key});
        keydownEvents = keydownEvents.filter((e2) => e2.key != keyboardEvent.key);
    })
}

let isInFullscreen = false;
// add listener to the button with id="fullscreen"
document.getElementById('fullscreen')!.addEventListener('click', function() {
    if (isInFullscreen) {
        document.exitFullscreen();
        isInFullscreen = false;
        return;
    } else {
        isInFullscreen = true;
        document.querySelector("body")!.requestFullscreen();
    }
});



function render() {
    for (let e of keydownEvents) {
        let udpated = camera4.keyboardEventHandler(e, 12, 0.1);
        sceneUpdated = sceneUpdated || udpated;
    }

    if (sceneUpdated) {
        scene.clearScene();
        camQueue.pushCamera(camera4);
        scene4.render(scene, camQueue);
        sceneUpdated = false;
    }

    if (isStereo) {
        effect.render(scene, camera);
    } else {
        renderer.render(scene, camera);// 这里也换成effect.render（裸眼3D）
    }
    // effect.render(scene, camera)
    // capturer.capture(renderer.domElement); 把这行注释掉，似乎可以节省一点内存
}

// renderer.setSize(1920, 1080);
// let frameRate = 36;
// if (frameRate == 36) {
//     renderer.setSize(3840, 2160);
// }

// let animation = new CylinderSweepingAnimation(frameRate);
// let capturer = new CCapture( { format: 'webm', framerate: frameRate} )

// let animation_render = animation.getCallbackHandler(renderer, frameRate >= 24 ? capturer : undefined);
// window.setInterval(animation_render, 1000/frameRate);


window.setInterval(render, 1000/20);
