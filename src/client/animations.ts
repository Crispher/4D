import * as THREE from 'three'
import { Camera, LineBasicMaterial, Plane, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Camera4, CameraQueue,  computeOcclusion,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from './math/primitives'


abstract class BaseAnimation {
    scene4: Scene4;
    cam4: Camera4;
    camQueue: CameraQueue;
    scene3: Scene3WithMemoryTracker;
    cam3: Camera;

    nSteps = 0;
    frameRate = 60;
    time = 0;

    constructor(cam4: Camera4, camQueue: CameraQueue, cam3: Camera) {
        this.scene4 = new Scene4([]);
        this.scene3 = new Scene3WithMemoryTracker();

        this.cam4 = cam4;
        this.camQueue = camQueue;
        this.cam3 = cam3;
    }

    advance = () => {
        this.nSteps++;
        this.time = this.nSteps * this.frameRate;
    }

    abstract prepareFrame(): void;

    abstract transform(): void;

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
        let cam3 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 1000);
        cam3.position.z = 2;
        super(cam4, camQueue, cam3);

        let tess = new Tesseract('tess');
        this.scene4.objects.push(tess);
    }

    prepareFrame(): void {
        let t = this.time * 0.0001;
        // this.cam4.pos.x += 0.01;
        this.cam3.position.z = 2 * Math.sin(t);
        this.cam3.position.x = 2 * Math.cos(t);
        this.cam3.lookAt(0, 0, 0);
    }

    transform(): void {

    }
}

export {
    Animation_1
}