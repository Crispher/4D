import * as e from 'express';
import * as THREE from 'three'
import { Camera, Renderer, Vector3, Vector4, WebGLRenderer } from 'three'
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { lerp } from 'three/src/math/MathUtils';
import { Camera4, CameraQueue,  getLineMaterial,  MaterialSet,  Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, RED, GREEN, BLUE, YELLOW, WHITE, LineObject } from './math/primitives'


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
        // this.cam3 = new THREE.PerspectiveCamera(12, 16/9, 0.2, 1000); // for rendering func plots
        this.cam3 = new THREE.PerspectiveCamera(16, 16/9, 0.2, 1000); // for 2 plane

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

    getCallbackHandler = (renderer: WebGLRenderer, capturer?: CCapture, effect?: StereoEffect) => {
        return () => {
            this.prepareFrame();
            this.scene3.clearScene();
            this.camQueue.pushCamera(this.cam4);
            this.scene4.render(this.scene3, this.camQueue);
            if (effect) {
                effect.render(this.scene3, this.cam3);
            }
            else {
                renderer.render(this.scene3, this.cam3);

            }    if (capturer) {
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



export {
    BaseAnimation,
    easeInOutCubic,
    easeInOutSine,
    pwl,
    impulses,
    INFTY,
}