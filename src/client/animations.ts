import * as e from 'express';
import * as THREE from 'three'
import { Camera, Renderer, Vector3, Vector4, WebGLRenderer } from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { lerp } from 'three/src/math/MathUtils';
import { Camera4, CameraQueue,  getLineMaterial,  MaterialSet,  Scene3WithMemoryTracker, Scene4 } from './math/core'
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

function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
    }

abstract class BaseAnimation {
    scene4: Scene4;
    cam4: Camera4;
    camQueue: CameraQueue;
    scene3: Scene3WithMemoryTracker;
    cam3: Camera;

    animation_started: boolean;
    animation_ended: boolean;
    animation_saved: boolean;

    nSteps = 0;
    readonly frameRate;
    time = 0;
    playbackSpeed: number = 1;

    constructor(cam4: Camera4, camQueue: CameraQueue, frameRate: number) {
        this.scene4 = new Scene4([]);
        this.scene3 = new Scene3WithMemoryTracker();
        this.cam3 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 1000);

        this.cam4 = cam4;
        this.camQueue = camQueue;
        this.frameRate = frameRate;

        this.animation_started = false;
        this.animation_ended = false;
        this.animation_saved = false;
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

    getTime() {
        return this.time * this.playbackSpeed;
    }

    setCam3PosAngles = (r: number, theta: number, phi: number) => {
        this.cam3.position.set(
            r*Math.cos(phi)*Math.sin(theta),
            r*Math.sin(phi),
            r*Math.cos(phi)*Math.cos(theta)
        );
        this.cam3.lookAt(0, 0, 0);
    }

    abstract prepareFrame(): void;

    getCallbackHandler = (renderer: WebGLRenderer, capturer?: CCapture) => {
        return () => {
            this.prepareFrame();
            this.scene3.clearScene();
            this.camQueue.pushCamera(this.cam4);
            this.scene4.render(this.scene3, this.camQueue);
            renderer.render(this.scene3, this.cam3);
            if (capturer) {
                if (!this.animation_started) {
                    capturer.start();
                    this.animation_started = true;
                }
                if (this.animation_ended && !this.animation_saved) {
                    capturer.save();
                    this.animation_saved = true;
                }
                capturer.capture(renderer.domElement);
            }

            this.advance();
        }
    }
}


class Animation_1 extends BaseAnimation {
    constructor(frameRate: number) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(150, 10);

        super(cam4, camQueue, frameRate);

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
    constructor(frameRate: number) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(150, 10);

        super(cam4, camQueue, frameRate);
        // this.advance(50)
    }

    setCam3Pos(t: number) {
        t = pwl(t, [
            {t: 0, x: 0},
            {t: 60, x: Math.PI},
            {t: 65, x: Math.PI}
        ], easeInOutSine)
        this.setCam3PosAngles(2.5, t, 0);
    }

    setFrame(t: number) {
        this.camQueue.frameGap = pwl(t, [
            {t: 0, x: 0.01},
            {t: 15, x: 0.01},
            {t: 18, x: 0.05},
            {t: INFTY, x: 0.05}
        ], easeInOutCubic);
        this.camQueue.frameLinewidth = [
            3 + 8 * impulses(t, [27, 28, 29], 1),
            3 + 8 * impulses(t, [27, 28, 29], 1),
            3 + 8 * impulses(t, [20, 21, 22], 1), // up
            3 + 8 * impulses(t, [24, 25], 1), // down
            3 + 8 * impulses(t, [27, 28, 29], 1),
            3 + 8 * impulses(t, [27, 28, 29], 1)
        ];
    }

    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);

        this.setFrame(t);
    }
}


class MovingEmptyFrameAnimation extends BaseAnimation {
    constructor(frameRate: number) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            2
        );
        let camQueue = new CameraQueue(32, 1);

        super(cam4, camQueue, frameRate);
        // this.advance(0);
    }

    setCam3Pos(t: number) {
        t = pwl(t, [
            {t: 0, x: Math.PI},
            {t: 34, x: Math.PI},
            {t: 38, x: Math.PI * 1.5},
            {t: 45, x: Math.PI * 1.5},
            {t: 68, x: Math.PI * 2},
            {t: 68 + 1e-5, x: Math.PI},
            {t: INFTY, x: 0}
        ], easeInOutCubic)
        this.setCam3PosAngles(2.5, t, 0);
    }

    setCam4Pos(t: number) {
        this.cam4.pos.z = pwl(t, [
            {t: 0, x: 0},
            {t: 32, x: 0},
            {t: 40, x: 0.5},
            {t: INFTY, x: 0.5},
        ], easeInOutSine);

        this.cam4.pos.y = pwl(t, [
            {t: 10, x: 0},
            {t: 30, x: -1},
            {t: INFTY, x: -1},
        ], easeInOutSine);

        this.cam4.pos.w = pwl(t, [
            {t: 41, x: 0},
            {t: 45, x: 0.3},
            {t: INFTY, x: 0.3},
        ], easeInOutSine);

        this.cam4.pos.x = pwl(t, [
            {t: 0, x: 0},
            {t: 45, x: 0},
            {t: 55, x: -1},
            {t: 56, x: -1},
            {t: 66, x: 0},
            {t: INFTY, x: 0},
        ], easeInOutSine);

        this.camQueue.opacityBeta = 0.5;
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}


class GridAnimation_Part1 extends BaseAnimation {

    constructor(frameRate: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(5, 1),
            frameRate
        );
        // this.advance(20)
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 35, x: Math.PI * 0.9},
            {t: INFTY, x: 0}
        ], easeInOutSine);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 35, x: Math.PI * 0.03},
            {t: INFTY, x: 0}
        ]);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.05},
            {t: 35, x: Math.PI * 0.05},
            {t: INFTY, x: 0}
        ], easeInOutSine);
        let r = 10;
        this.cam4.pos.set(-r * Math.cos(theta), 0, 0, r * Math.sin(theta));
        this.cam4.lookAt(new Vector4(0, 0, 0, 0));
    }

    setGridObject(t: number) {
        if (t < 8 || (27 < t && t < 35)) {
            let l = pwl(t, [
                {t: 4, x: 0},
                {t: 5, x: 8.9},
                {t: INFTY, x: 8.9}
            ], easeInOutSine)
            const dim = [
                l, l, l, 0.1
            ];
            const grid = new Grid4('grid', dim);
            grid.beta = pwl(t, [
                {t: 0, x: 0.5},
                {t: 28, x: 0.5},
                {t: 31, x: 2},
                {t: 32, x: 2},
                {t: 35, x: 0.5},
                {t: INFTY, x: 0}
            ], easeInOutCubic);

            let X = grid.getX(RED);
            let Y = grid.getY(GREEN);
            let Z = grid.getZ(BLUE);

            this.scene4.objects = [
                X, Y, Z
            ]
        }

        if (20 < t && t < 26) {
            this.scene4.find('grid-Y-axis').hidden = true;
            this.scene4.find('grid-Z-axis').hidden = true;
        } else {
            this.scene4.find('grid-Y-axis').hidden = false;
            this.scene4.find('grid-Z-axis').hidden = false;
        }
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);
        this.setCam4Pos(t);
        this.setGridObject(t);
    }
}

class GridAnimation_Part2 extends BaseAnimation {

    constructor(frameRate: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(5, 1),
            frameRate
        );

        const grid = new Grid4('grid', [8.9, 8.9, 8.9, 0.1]);
        grid.beta = 0.5;
        let X = grid.getX(RED);
        let Y = grid.getY(GREEN);
        let Z = grid.getZ(BLUE);

        this.scene4.objects.push(X, Y, Z);
        // this.advance(20)
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.9},
            {t: 7, x: Math.PI * 0.9},
            {t: 14, x: Math.PI * 1.4},
            {t: 21, x: Math.PI * 1.5},
            {t: 28, x: Math.PI * 2},
            {t: 35, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 7, x: Math.PI * 0.5-1e-4},
            {t: 14, x: Math.PI * 0.5-1e-4},
            {t: 21, x: Math.PI * 0},
            {t: 28, x: Math.PI * 0},
            {t: 35, x: Math.PI * 0.03},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.05},
            {t: 35, x: Math.PI * 0.05},
            {t: INFTY, x: 0}
        ], easeInOutSine);
        let r = 10;
        this.cam4.pos.set(-r * Math.cos(theta), 0, 0, r * Math.sin(theta));
        this.cam4.lookAt(new Vector4(0, 0, 0, 0));
    }



    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}

class GridAnimation_Part3 extends BaseAnimation {

    constructor(frameRate: number, playbackSpeed: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(20, 1),
            frameRate
        );

        const grid = new Grid4('grid', [8.9, 8.9, 8.9, 0.1]);
        grid.beta = 0.5;
        let X = grid.getX(RED);
        let Y = grid.getY(GREEN);
        let Z = grid.getZ(BLUE);

        this.scene4.objects.push(X, Y, Z);
        this.camQueue.opacityBeta = 0.3;
        this.playbackSpeed = playbackSpeed;
         this.advance(55 / playbackSpeed);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 2.1},
            {t: 15, x: Math.PI * 2.1},
            {t: 17, x: Math.PI * 2.1},
            {t: 20, x: Math.PI * 2},
            {t: 23, x: Math.PI * 2},
            {t: 26, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 20, x: Math.PI * 0.03},
            {t: 23, x: Math.PI * 0.0},
            {t: 26, x: Math.PI * 0.07},
            {t: 55, x: Math.PI * 0.07},
            {t: 60, x: Math.PI * 0},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.05},
            {t: 15, x: Math.PI * 0.5 - 1e-4},
            {t: 38, x: Math.PI * 0.5 - 1e-4},
            {t: 53, x: Math.PI * 0},
            {t: INFTY, x: 0}
        ], easeInOutSine);
        let r = pwl(t, [
            {t: 0, x: 10},
            {t: 28, x: 10},
            {t: 31, x: 6},
            {t: 33, x: 6},
            {t: 36, x: 10},
            {t: 65, x: 10},
        ], easeInOutCubic);
        this.cam4.pos.set(-r * Math.cos(theta), 0, 0, r * Math.sin(theta));
        this.cam4.lookAt(new Vector4(0, 0, 0, 0));
    }



    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}


class TesseractAnimation_Part1 extends BaseAnimation {

    tess: Tesseract;

    constructor(frameRate: number, playbackSpeed: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(24, 1),
            frameRate
        );

        const grid = new Grid4('grid', [6.9, 6.9, 6.9, 0.1]);
        grid.beta = 1.5;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined

        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        this.tess = new Tesseract('tess');
        this.tess.showFaceBorderOnly(3.5);

        this.scene4.objects.push(X, Y, Z, this.tess);
        this.camQueue.opacityBeta = 0.7;
        this.playbackSpeed = playbackSpeed;
        this.advance(144 / playbackSpeed);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: 20, x: Math.PI * -0.1},
            {t: 25, x: Math.PI * 0},
            {t: 30, x: Math.PI * 0.5},
            {t: 35, x: Math.PI * 0.1},
            {t: 55, x: Math.PI * -0.1},
            {t: 60, x: Math.PI * 0},
            {t: 65, x: Math.PI * 0.5},
            {t: 70, x: Math.PI * 0.1},
            {t: 90, x: Math.PI * -0.1},
            {t: 95, x: Math.PI * 0},
            {t: 100, x: Math.PI * 0.5},
            {t: 105, x: Math.PI * 0.1},
            {t: 120, x: Math.PI * 0.1},
            {t: 130, x: Math.PI * 0.1},
            {t: 140, x: Math.PI * -0.1},
            {t: 150, x: Math.PI * 0},
            {t: 160, x: Math.PI * 0.1},
            {t: 170, x: Math.PI * 0},
            {t: 180, x: Math.PI * 0.5},
            {t: 190, x: Math.PI * 0.1},
            {t: 200, x: Math.PI * 0.25},
            {t: INFTY, x: 0}
        ], easeInOutCubic);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 10, x: Math.PI * 0.05},
            {t: 20, x: Math.PI * 0.03},
            {t: 25, x: Math.PI * 0.5-1e-4},
            {t: 30, x: Math.PI * 0},
            {t: 35, x: Math.PI * 0.03},
            {t: 55, x: Math.PI * 0.03},
            {t: 60, x: Math.PI * 0.5 - 1e-4},
            {t: 65, x: Math.PI * 0.03},
            {t: 70, x: Math.PI * 0.03},
            {t: 90, x: Math.PI * 0.03},
            {t: 95, x: Math.PI * 0.5 - 1e-4},
            {t: 100, x: Math.PI * 0.03},
            {t: 105, x: Math.PI * 0.05},
            {t: 112, x: Math.PI * 0.07},
            {t: 120, x: Math.PI * 0.03},
            {t: 130, x: Math.PI * 0.03},
            {t: 140, x: Math.PI * 0.00},
            {t: 150, x: Math.PI * 0.5 - 1e-4},
            {t: 160, x: Math.PI * 0.03},
            {t: 170, x: Math.PI * 0.0},
            {t: 180, x: Math.PI * 0.0},
            {t: 190, x: Math.PI * 0.03},
            {t: 200, x: Math.PI * 0.5-1e-4},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: 35, x: Math.PI * 0.0},
            {t: 55, x: Math.PI * 0.25},
            {t: 70, x: Math.PI * 0.25},
            {t: 90, x: Math.PI * 0.5},
            {t: 105, x: Math.PI * 0.5},
            {t: 120, x: Math.PI * 0.6},
            {t: 130, x: Math.PI * 0},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 130, x: 0},
            {t: 160, x: Math.PI * 1},
            {t: 190, x: Math.PI * 2}
        ], easeInOutSine)

        let eta = pwl(t, [
            {t: 190, x: 0},
            {t: 220, x: Math.PI * 1},
            {t: 250, x: Math.PI * 2}
        ], easeInOutSine)

        let r = pwl(t, [
            {t: 0, x: 10},
            {t: INFTY, x: 10},
        ], easeInOutCubic);
        this.cam4.pos.set(
            -r * Math.cos(theta) * Math.cos(omega) * Math.cos(eta),
            r * Math.sin(omega),
            r * Math.sin(eta),
            r * Math.sin(theta));
        this.cam4.pos.w += 1
        this.cam4.lookAt(new Vector4(0, 0, 0, 1));
    }

    setTesseractObject(t: number) {
        if (t < 5) {
            let w = 3.5 * pwl(t*2, [
                {t: 2, x: 1},
                {t: 3, x: 0},
                {t: 4, x: 1},
                {t: 5, x: 0},
                {t: 6, x: 1},
                {t: INFTY, x: 1}
            ], Math.floor)
            this.scene4.objects.pop();
            this.tess = new Tesseract('tess');
            this.tess.showFaceBorderOnly(w)
            this.scene4.objects.push(this.tess)
        }

    }

    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);
        this.setTesseractObject(t);
    }
}


class ExerciseAnimation extends BaseAnimation {
    tess: Tesseract;

    constructor(frameRate: number, playbackSpeed: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(24, 1),
            frameRate
        );

        const grid = new Grid4('grid', [6.9, 6.9, 6.9, 0.1]);
        grid.beta = 1.5;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined

        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        this.tess = new Tesseract('tess');
        this.tess.showFaceBorderOnly(3.5);

        this.scene4.objects.push(X, Y, Z, this.tess);
        this.camQueue.opacityBeta = 0.7;
        this.playbackSpeed = playbackSpeed;
        this.advance(12/playbackSpeed);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * .1},
            {t: 6, x: Math.PI * .1},
            {t: 12, x: Math.PI * -.05},
            {t: 20, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 6, x: Math.PI * 0.5 - 1e-4},
            {t: 12, x: Math.PI * 0.03},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 1.1},
            {t: 12, x: Math.PI * 1.1},
            {t: 20, x: Math.PI * 1.5},
            {t: INFTY, x: Math.PI * 1.1}
        ], easeInOutSine)


        let r = pwl(t, [
            {t: 0, x: 10},
            {t: INFTY, x: 10},
        ], easeInOutCubic);
        this.cam4.pos.set(
            -r * Math.cos(theta) * Math.cos(omega) * Math.cos(0),
            r * Math.sin(omega),
            r * Math.sin(0),
            r * Math.sin(theta));
        this.cam4.pos.w += 1
        this.cam4.lookAt(new Vector4(0, 0, 0, 1));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}


class Ep2PreviewAnimation extends BaseAnimation {
    tess: Tesseract;

    constructor(frameRate: number, playbackSpeed: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2.5
            ),
            new CameraQueue(24, 1),
            frameRate
        );

        const grid = new Grid4('grid', [5.1, 5.1, 5.1, 0.1]);
        grid.beta = 1.5;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined

        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        this.tess = new Tesseract('tess');
        this.tess.showFaceBorderOnly(2);

        this.scene4.objects.push(X, Y, Z, this.tess);
        this.camQueue.opacityBeta = 2;
        this.playbackSpeed = playbackSpeed;
        this.advance(playbackSpeed);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * .1},
            {t: 5, x: Math.PI * .1},
            {t: 25, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.03},
            {t: 5, x: Math.PI * 0},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: 5, x: Math.PI * 0.15},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 1.1},
            {t: 5, x: Math.PI * 1.1},
            {t: INFTY, x: Math.PI * 1.1}
        ], easeInOutSine)


        let r = pwl(t, [
            {t: 0, x: 10},
            {t: INFTY, x: 10},
        ], easeInOutCubic);
        this.cam4.pos.set(
            -r * Math.cos(theta) * Math.cos(omega) * Math.cos(omega),
            r * Math.sin(omega),
            r * Math.sin(omega),
            r * Math.sin(theta));
        this.cam4.pos.w += 1
        this.cam4.lookAt(new Vector4(0.5, 0.5, 0.5, 0.5));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}


class Ep2PreviewAnimation_MultipleTesseract extends BaseAnimation {

    constructor(frameRate: number, playbackSpeed: number) {
        super(new Camera4(
            new Vector4(-10, 0, 0, 1),
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                    return new Vector4().fromArray(e);
                }),
                2
            ),
            new CameraQueue(24, 1),
            frameRate
        );

        const grid = new Grid4('grid', [5.1, 5.1, 5.1, 0.1]);
        grid.beta = 1.5;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined

        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        let tess = new Tesseract('tess');

        let tess2 = new Tesseract('tess2');
        let tess3 = new Tesseract('tess3');
        tess2.translate(new Vector4(-1, -1, -1, 0))
        tess3.translate(new Vector4(-1, -1, -1, 1))

        tess2.withMaterial(YELLOW);
        tess3.withMaterial(GREEN)

        this.scene4.objects.push(X, Y, Z, tess, tess2, tess3);
        this.camQueue.opacityBeta = 2;
        this.playbackSpeed = playbackSpeed;
        this.advance(5 / playbackSpeed);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * .1},
            {t: 5, x: Math.PI * .1},
            {t: 25, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);
        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: 5, x: Math.PI * 0.15},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: 5, x: Math.PI * 0.1},
            {t: INFTY, x: Math.PI * 1.1}
        ], easeInOutSine)


        let r = pwl(t, [
            {t: 0, x: 10},
            {t: INFTY, x: 10},
        ], easeInOutCubic);
        this.cam4.pos.set(
            -r * Math.cos(theta) * Math.cos(omega) * Math.cos( omega),
            r * Math.sin(omega),
            r * Math.sin(omega),
            r * Math.sin(theta));
        this.cam4.pos.w += 1
        this.cam4.lookAt(new Vector4(0, 0, 0, 0.5));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);
    }
}



let render_main_cam = true;

let scene3 = new Scene3WithMemoryTracker()
let grid_lw = render_main_cam ? 0.003: 0.001
let red = new LineMaterial({color: 0xff8f8f, linewidth: grid_lw, transparent: true, opacity: 0.5})
let green = new LineMaterial({color: 0x00ff00, linewidth: grid_lw, transparent: true, opacity: 0.5})
let grey = new LineMaterial({color: 0x999999, linewidth: grid_lw})

for (let i = -7; i < 8; i++) {

    scene3.addLine(new Vector3(-7, i, 0), new Vector3(7, i, 0), red);
    scene3.addLine(new Vector3(i, -7, 0), new Vector3(i, 7, 0), green);
}

let a = 1-1e-3;
const geometry = new THREE.BoxGeometry(a, a, a);
geometry.translate(a/2, a/2, a/2)
const material = new THREE.MeshStandardMaterial( { color: 0x0,} );
const cube = new THREE.Mesh( geometry, material );
var boxmat = new LineMaterial( { color: 0xffff00, linewidth: grid_lw + 0.001 } );

for (let i of [0, 1]) {
    for (let j of [0, 1]) {
        scene3.addLine(new Vector3(i, j, 0), new Vector3(i, j, 1), boxmat)
        scene3.addLine(new Vector3(i, 0, j), new Vector3(i, 1, j), boxmat)
        scene3.addLine(new Vector3(0, i, j), new Vector3(1, i, j), boxmat)
    }
}
scene3.add( cube );


let cam3 = new THREE.PerspectiveCamera(
    render_main_cam ? 30 : 30, window.innerWidth / window.innerHeight,
    render_main_cam ? 0.2 : 1, render_main_cam ? 100 : 5);
cam3.up.set(0, 0, 1);
cam3.position.set(8, 0, 1);
cam3.lookAt(0, 0, 1);
cam3.updateMatrixWorld()


const helper = new THREE.CameraHelper( cam3 );
if (!render_main_cam) {
    scene3.add( helper );
}

let godcam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 1000);
godcam.up.set(0, 0, 1)
godcam.position.set(10, 10, 5);
godcam.lookAt(-1, 0, 2)
// const control = new OrbitControls(godcam, renderer.domElement)


let time = 0;
const updateCam3_godCam = (t: number) => {
    let godcam_z = pwl(t, [
        {t: 0, x: 20},
        {t: 16, x: 0},
    ], easeInOutCubic);
    godcam.position.set(10, 10, 5 + godcam_z);
    godcam.lookAt(-1, 0, 2)

    let y = pwl(t, [
        {t: 0, x: 0},
        {t: 20, x: 0},
        {t: 25, x: -3},
        {t: 35, x: 3},
        {t: 40, x: 0},
    ], easeInOutCubic);
    cam3.position.set(8, y, 1);
    cam3.lookAt(0, 0, 1);
    cam3.updateMatrixWorld();
    helper.update();
    time += 0.5/48;
}

const updateCam3_grid = (t: number) => {
    let godcam_z = pwl(t, [
        {t: 0, x: 20},
        {t: 16, x: 0},
    ], easeInOutCubic);
    godcam.position.set(10, 10, 5 + godcam_z);
    godcam.lookAt(-1, 0, 2)

    let theta = pwl(t, [
        {t: 0, x: 0},
        {t: 20, x: 0},
        {t: 25, x: Math.PI * 0.5 - 1e-4},
        {t: 40, x: Math.PI * 0.5 - 1e-4},
        {t: 45, x: Math.PI * 0},
        {t: INFTY, x: 0},
    ], easeInOutCubic);

    let r = pwl(t, [
        {t: 0, x: 8},
        {t: 28, x: 8},
        {t: 31, x: 4},
        {t: 33, x: 4},
        {t: 36, x: 8},
        {t: INFTY, x: 0}
    ], easeInOutCubic)
    cam3.position.set(r * Math.cos(theta), 0, r * Math.sin(theta) + 1);
    cam3.lookAt(0, 0, 1);
    cam3.updateMatrixWorld();
    helper.update();
    time += 0.5/48;
}

const updateCam3_cube = (t: number) => {


    let theta = pwl(t, [
        {t: 0, x: 0},
        {t: 3, x: Math.PI * 0},
        {t: 8, x: Math.PI * 0.25},
        {t: 13, x: Math.PI * 0.25},
        {t: 18, x: Math.PI * 0.5 - 1e-4},
        {t: 23, x: Math.PI * 0.5 - 1e-4},
        {t: 28, x: Math.PI * 0.6},
        {t: 33, x: Math.PI * 0},
        {t: INFTY, x: 0},
    ], easeInOutCubic);

    if (theta >= Math.PI * 0.5) {
        cam3.up.set(0, 0, -1)
    } else {
        cam3.up.set(0, 0, 1)
    }

    godcam.position.set(10, 10, 5);
    godcam.lookAt(-1, 0, 2)

    let eta = pwl(t, [
        {t: 0, x: 0},
        {t: 38, x: Math.PI * 0},
        {t: 55, x: Math.PI * 2},
        {t: INFTY, x: 0},
    ], easeInOutCubic);

    let r = 8;
    cam3.position.set(r * Math.cos(theta) * Math.cos(eta), r * Math.sin(eta), r * Math.sin(theta) + 1);
    cam3.lookAt(0, 0, 1);
    cam3.updateMatrixWorld();
    helper.update();
    time += 0.5/48;
}

const get3DAnimationHandler = (renderer: Renderer) =>
    () => {
        updateCam3_cube(time)
        if (render_main_cam) {
            renderer.render(scene3, cam3);
        } else {
            renderer.render(scene3, godcam);
        }
    }


export {
    BaseAnimation,
    easeInOutCubic,
    easeInOutSine,
    pwl,
    impulses,
    INFTY,
    Animation_1,
    EmptyFrameAnimation,
    MovingEmptyFrameAnimation,
    GridAnimation_Part1,
    GridAnimation_Part2,
    GridAnimation_Part3,
    TesseractAnimation_Part1,
    ExerciseAnimation,
    Ep2PreviewAnimation,
    Ep2PreviewAnimation_MultipleTesseract,
    get3DAnimationHandler
}