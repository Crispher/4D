import * as THREE from 'three'
import { Camera, Vector3, Vector4, WebGLRenderer } from 'three'
import { lerp } from 'three/src/math/MathUtils';
import { Camera4, CameraQueue,  Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from './math/primitives'


interface Sample {
    t: number;
    x: number;
}

const INFTY = 1e9;
const ATAN_1 = Math.atan(1);

function pwl(t: number, samples: Sample[], easing?: any) {
    if (t < samples[0].t) {
        return 0;
    }
    for (let i = 0; i < samples.length - 1; i++) {
        if (samples[i].t <= t && t< samples[i+1].t) {
            let r = (t - samples[i].t) / (samples[i+1].t - samples[i].t);
            if (easing) {
                r = easing(r);
            }
            return lerp(samples[i].x, samples[i+1].x, r);
        }
    }
    return 0;
}

function impulse(t: number, T0: number, T: number) {
    if (t < T0 || (T0 + T) < t) {
        return 0;
    }
    return Math.sin((t-T0)/T*Math.PI);
}

function impulses(t: number,  T0s: number[], T: number) {
    let ret = 0
    for (let T0 of T0s) {
        ret += impulse(t, T0, T);
    }
    return ret;
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

abstract class BaseAnimation {
    scene4: Scene4;
    cam4: Camera4;
    camQueue: CameraQueue;
    scene3: Scene3WithMemoryTracker;
    cam3: Camera;

    nSteps = 0;
    frameRate = 60;
    time = 0;

    constructor(cam4: Camera4, camQueue: CameraQueue) {
        this.scene4 = new Scene4([]);
        this.scene3 = new Scene3WithMemoryTracker();
        this.cam3 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 1000);

        this.cam4 = cam4;
        this.camQueue = camQueue;
    }

    advance = (t?: number) => {
        if (t) {
            this.time = t;
        }
        else {
            this.nSteps++;
            this.time += 1 / this.frameRate;
        }
    }

    abstract prepareFrame(): void;

    getCallbackHandler = (renderer: WebGLRenderer) => {
        return () => {
            this.prepareFrame();
            this.scene3.clearScene();
            this.camQueue.pushCamera(this.cam4);
            this.scene4.render(this.scene3, this.camQueue);
            renderer.render(this.scene3, this.cam3);
            this.advance();
        }
    }
}


class Animation_1 extends BaseAnimation {
    constructor() {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(150, cam4, 10);

        super(cam4, camQueue);

        let tess = new Tesseract('tess');
        this.scene4.objects.push(tess);
    }

    cam3Pos(t: number) {
        let k = 0.0001;
        return new Vector3(2*Math.sin(k*t), 0.25, 3*Math.cos(k*t));
    }

    prepareFrame(): void {
        let t = this.time;
        this.cam3.position.copy(this.cam3Pos(t));
        this.cam3.lookAt(0, 0, 0);
    }
}

class EmptyFrameAnimation extends BaseAnimation {
    // 空相框，旋转3 - 相框各面颜色分离 - 上下边框闪烁 - 四周侧边框闪烁
    constructor() {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(150, cam4, 10);

        super(cam4, camQueue);
    }

    cam3Pos(t: number) {
        let k = 1;
        t = pwl(t, [
            {t: 0, x: 0},
            {t: 5, x: Math.PI * 1.1},
            {t: INFTY, x: Math.PI * 2}
        ], easeInOutCubic)
        let kt = k * t;
        return new Vector3(2*Math.sin(kt), 0.25, 2*Math.cos(kt));
    }

    setFrame(t: number) {
        this.camQueue.frameGap = pwl(t, [
            {t: 0, x: 0.01},
            {t: 5, x: 0.01},
            {t: 7, x: 0.04},
            {t: INFTY, x: 0.04}
        ], easeInOutCubic);
        this.camQueue.frameLinewidth = [
            3,
            3,
            3 + 8 * impulses(t, [7, 9, 11], 2), // up
            3 + 8 * impulses(t, [13, 15, 17], 2), // down
            3,
            3 + 8 * impulses(t, [19, 21, 23], 2)
        ];
    }

    prepareFrame(): void {
        let t = this.time;
        this.cam3.position.copy(this.cam3Pos(t));
        this.cam3.lookAt(0, 0, 0);

        this.setFrame(t);
    }
}


class MovingEmptyFrameAnimation extends BaseAnimation {
    constructor() {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(60, cam4, 1);

        super(cam4, camQueue);
        this.advance(20);
    }

    setCam3Pos(t: number) {
        let k = 1;
        t = pwl(t, [
            {t: 0, x: Math.PI * 1.2},
            {t: 5, x: Math.PI * 1.1},
            {t: 7, x: Math.PI * 1.5},
            {t: INFTY, x: 0}
        ], easeInOutCubic)
        let kt = k * t;
        this.cam3.position.set(2*Math.sin(kt), 0.25, 2*Math.cos(kt));
        this.cam3.lookAt(0, 0, 0);
    }

    setCam4Pos(t: number) {
        this.cam4.pos.y -= 1/this.frameRate * pwl(t, [
            {t: 0, x: 0.1},
            {t: 10, x: 0},
        ], Math.floor);

        this.cam4.pos.z += 1/this.frameRate * pwl(t, [
            {t: 12, x: 0.1},
            {t: 22, x: 0},
        ], Math.floor);

        if (t >= 22)
            this.cam4.tilt(3, 0.002);

        this.camQueue.opacityAlpha = 1;
        this.camQueue.opacityBeta = 0.1;
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}

export {
    Animation_1,
    EmptyFrameAnimation,
    MovingEmptyFrameAnimation,
}