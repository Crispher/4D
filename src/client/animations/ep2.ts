import {BaseAnimation, easeInOutCubic, easeInOutSine, pwl, impulses, INFTY} from '../animations'

import * as THREE from 'three'
import { Camera, Renderer, Vector3, Vector4, WebGLRenderer } from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { lerp } from 'three/src/math/MathUtils';
import { Camera4, CameraQueue,  getLineMaterial,  MaterialSet,  Object4,  Scene3WithMemoryTracker, Scene4 } from '../math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject } from '../math/primitives'


let m = (a: number, b: number) => a * 60 + b;



let render_main_cam = true;

let save_animation = true;
let animation_started = false;
let animation_ended = false;
let animation_saved = false;
// let end_time = m(2, 0);

let scene3 = new Scene3WithMemoryTracker()
let empty = new Scene3WithMemoryTracker()
let grid_lw = render_main_cam ? 0.003: 0.001
let red = new LineMaterial({color: 0xff8f8f, linewidth: grid_lw, transparent: true, opacity: 0.5})
let green = new LineMaterial({color: 0x00ff00, linewidth: grid_lw, transparent: true, opacity: 0.5})
let grey = new LineMaterial({color: 0x999999, linewidth: grid_lw})


let time = 0;
let end_time = m(2, 0);

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
    50, window.innerWidth / window.innerHeight,
    render_main_cam ? 0.2 : 1, render_main_cam ? 100 : 5);
cam3.up.set(0, 0, 1);
cam3.position.set(8, 0, 1);
cam3.lookAt(0, 0, 0.5);
cam3.updateMatrixWorld()



const updateCam3_cube = (t: number) => {
    let theta = pwl(t, [
        {t: 0, x: Math.PI * 0.1},
        {t: 5, x: Math.PI * 0.1},
        {t: 12, x: Math.PI * 0},
        {t: m(1, 11), x: Math.PI * 0},
        {t: m(1, 16), x: Math.PI * 0.1},
        {t: INFTY, x: 0},
    ], easeInOutCubic);

    let eta = pwl(t, [
        {t: 0, x: Math.PI * 0.2},
        {t: 5, x: Math.PI * 0.2},
        {t: 12, x: Math.PI * 0},
        {t: m(1, 0), x: Math.PI * 0},
        {t: m(1, 6), x: Math.PI * 0.2},
        {t: INFTY, x: 0},
    ], easeInOutCubic);

    let r = 5;
    cam3.position.set(r * Math.cos(theta) * Math.cos(eta), r * Math.sin(eta), r * Math.sin(theta) + 1);
    cam3.lookAt(0, 0, 1);
    cam3.updateMatrixWorld();
    time += 1/48;

    if (time > end_time && !animation_ended) {
        // capturer.stop();
        console.log("saving");
        animation_ended = true;
    }
}

const get3DAnimationHandler = (renderer: Renderer, capturer: CCapture) =>
    () => {
        updateCam3_cube(time);
        if (time < 5) {
            renderer.render(empty, cam3);
        } else {
            renderer.render(scene3, cam3);
        }

        if (save_animation) {
            if (!animation_started) {
                console.log("capturer started");
                capturer.start();
                animation_started = true;
            }
            if (animation_ended && !animation_saved) {
                capturer.save();
                animation_saved = true
            }
            capturer.capture(renderer.domElement);
        }
    }











function getColor(color: number, brightness: number): number {
    // convert color to rgb
    let r = (color & 0xFF0000) >> 16;
    let g = (color & 0x00FF00) >> 8;
    let b = (color & 0x0000FF);
    r *= brightness;
    g *= brightness;
    b *= brightness;
    return (r << 16) | (g << 8) | b;
}

function interpolateColor(color1: number, color2: number, blendCoeff:number): number {
    let r1 = (color1 & 0xFF0000) >> 16;
    let g1 = (color1 & 0x00FF00) >> 8;
    let b1 = (color1 & 0x0000FF);
    let r2 = (color2 & 0xFF0000) >> 16;
    let g2 = (color2 & 0x00FF00) >> 8;
    let b2 = (color2 & 0x0000FF);
    let r = r1 + (r2 - r1) * blendCoeff;
    let g = g1 + (g2 - g1) * blendCoeff;
    let b = b1 + (b2 - b1) * blendCoeff;
    return (r << 16) | (g << 8) | b;
}




class P1 extends BaseAnimation {


    end_time: number;


    constructor(frameRate: number, start: number=m(1, 0), end: number=m(4, 10)) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);


        this.time = start;
        this.end_time = end;
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * -4},
            {t: 20, x: Math.PI * -4},
            {t: 32, x: Math.PI * -1.9},
            {t: m(1, 6), x: Math.PI * -1.9},
            {t: m(1, 9), x: Math.PI * -2},
            {t: m(1, 19), x: Math.PI * 0.1},
            {t: m(1, 30), x: Math.PI * 0.1},
            {t: m(1, 33), x: Math.PI * 0},
            {t: m(1, 48), x: Math.PI * 1.65},
            {t: m(2, 7), x: Math.PI * 1.65},
            {t: m(2, 10), x: Math.PI * 2},
            {t: m(2, 25), x: Math.PI * 4},
            {t: m(2, 45), x: Math.PI * 6},
            {t: m(2, 50), x: Math.PI * 6},
            {t: m(3, 5), x: Math.PI * 8},
            {t: m(3, 25), x: Math.PI * 10},
            {t: m(3, 30), x: Math.PI * 10}, // finish counting faces


            {t: m(3, 45), x: Math.PI * 10.5},
            {t: m(4, 5), x: Math.PI * 10.4},
            {t: m(4, 10), x: Math.PI * 10.4},
            {t: m(4, 30), x: Math.PI * 10.6},
            {t: m(4, 45), x: Math.PI * 11.9},

            {t: INFTY, x: Math.PI * 0.1},
        ], easeInOutCubic);
        let phi = t = pwl(t, [
            {t: 0, x: Math.PI * 0.02},
            {t: 18, x: Math.PI * 0.1},
            {t: 52, x: Math.PI * 0.1},
            {t: m(1, 6), x: Math.PI * 0.1},
            {t: m(1, 9), x: Math.PI * 0},
            {t: m(1, 24), x: Math.PI * 0.15},
            {t: m(1, 30), x: Math.PI * 0.15},
            {t: m(1, 33), x: Math.PI * 0},
            {t: m(1, 48), x: Math.PI * 0.15},
            {t: m(1, 58), x: Math.PI * 0.15},
            {t: m(2, 7), x: Math.PI * 0.15},
            {t: m(2, 10), x: Math.PI * 0.1},

            {t: m(3, 0 + 5), x: Math.PI * 0.1},
            {t: m(3, 10 + 5), x: Math.PI * 0.1},
            {t: m(4, 30), x: Math.PI * 0.1},
            {t: m(4, 45), x: Math.PI * 0.06},
            {t: INFTY, x: Math.PI * 0}
        ], easeInOutCubic);
        this.setCam3PosAngles(2.5, theta, phi);
    }


    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: m(1, 24), x: Math.PI * 0},
            {t: m(1, 30), x: Math.PI * 0.2},
            // {t: INFTY, x: Math.PI * 0.2},

            {t: m(3, 30), x: Math.PI * 0.2},
            {t: m(3, 45), x: Math.PI * 0},
            {t: m(4, 30), x: Math.PI * 0},
            {t: m(4, 40), x: Math.PI * 0.25},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: m(1, 0), x: Math.PI * 0},
            {t: m(1, 6), x: Math.PI * 0.2},
            // {t: INFTY, x: Math.PI * 0.2},

            {t: m(3, 30), x: Math.PI * 0.2},
            {t: m(3, 45), x: Math.PI * 0},
            {t: m(4, 5), x: Math.PI * 0},
            {t: m(4, 30), x: Math.PI * 0},
            {t: m(4, 35), x: Math.PI * 1.25},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let psi = pwl(t, [
            {t: 0, x: Math.PI * 0.0},
            {t: m(2, 2), x: Math.PI * 0},
            {t: m(2, 7), x: Math.PI * 0.2},

            {t: m(3, 45), x: Math.PI * 0.2},
            {t: m(4, 5), x: Math.PI * 2},
            {t: m(4, 10), x: Math.PI * 2},
            {t: m(4, 30), x: Math.PI * 4},
            {t: m(4, 35), x: Math.PI * 4},
            {t: m(4, 40), x: Math.PI * 3.25},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let r = pwl(t, [
            {t: 0, x: 10},
            {t: m(2, 7), x: 10},
            {t: m(2, 10), x: 6},
            {t: m(4, 30), x: 6},
            {t: m(4, 45), x: 12},
            {t: INFTY, x: 0}
        ], easeInOutSine);


        this.cam4.pos.set(
            0.5 + -r * Math.cos(theta) * Math.cos(omega) * Math.cos(psi),
            0.5 + r * Math.sin(omega),
            0.5 + r * Math.sin(psi),
            0.5 + r * Math.sin(theta));

        this.cam4.lookAt_w_as_up(new Vector4(0.5, 0.5, 0.5, 0.5));
    }

    setFrame(t: number) {
        this.camQueue.frameGap = 0.05;
        this.camQueue.frameLinewidth = [
            3 + 8 * impulses(t, [36], 1),
            3 + 8 * impulses(t, [36], 1),
            3 + 8 * impulses(t, [35], 1), // up
            3 + 8 * impulses(t, [35], 1), // down
            3 + 8 * impulses(t, [37], 1),
            3 + 8 * impulses(t, [37], 1)
        ];
    }

    setScene(t: number) {
        const grid = new Grid4('grid', [3.1, 3.1, 3.1, 0.1]);



        let tess = new Tesseract('tess');
        let base_linewidth = pwl(t, [
            {t: 0, x: 4},
            {t: m(2, 24), x: 4},
            {t: m(2, 25), x: 1},
            {t: m(2, 44), x: 1},
            {t: m(2, 45), x: 4},
            {t: m(3, 4), x: 4},
            {t: m(3, 5), x: 1},
            {t: m(3, 24), x: 1},
            {t: m(3, 25), x: 4},
            {t: INFTY, x: 4},
        ], easeInOutSine);

        let show_hidden = t > m(2, 50) && t < m(4, 7);

        let bold = 10
        tess.showFaceBorderOnly_2([
            base_linewidth + bold * impulses(t, [m(2,25), m(2,27)], 2),
            base_linewidth + bold * impulses(t, [m(3,5), m(3,7)], 2),
            base_linewidth + bold * impulses(t, [m(3,15), m(3,17)], 2),
            base_linewidth + bold * impulses(t, [m(2,30), m(2,32)], 2),
            base_linewidth + bold * impulses(t, [m(3,10), m(3,12)], 2),
            base_linewidth + bold * impulses(t, [m(2,40), m(2,42)], 2),
            base_linewidth + bold * impulses(t, [m(3,20), m(3,22)], 2),
            base_linewidth + bold * impulses(t, [m(2,35), m(2,37)], 2),
        ], show_hidden);


        if (base_linewidth < 2) {
            grid.beta = 5
        } else {
            grid.beta = 1
        }
        grid.beta = 5 - base_linewidth

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined

        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);


        this.scene4.objects = [X, Y, Z, tess];
    }

    prepareFrame(): void {
        let t = this.getTime();
        this.setScene(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);
        this.setFrame(t);

        if (t > this.end_time) {
            this.animation_ended = true;
        }
    }
}


class P2 extends BaseAnimation {


    end_time: number;


    constructor(frameRate: number, start: number=m(0, 0), end: number=m(4, 0)) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            0.5
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        const grid = new Grid4('grid', [1.8, 1.8, 1.8, 0.1]);
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

        this.scene4.objects = [X, Y, Z]
        this.time = start;
        this.end_time = end;
    }





    setTesseracts(t: number) {
        let eps = 0.03
        let pink_pos = pwl(t, [
            {t: 0, x: 5},
            {t: 5, x: 5},
            {t: 10, x: eps},
            {t: m(3, 38), x: eps},
            {t: m(3, 42), x: -1-eps},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let pink_pos_xzw = pwl(t, [
            {t: 0, x: 0},
            {t: m(3, 38), x: 0},
            {t: m(3, 42), x: -1-eps},
            {t: INFTY, x: -1-eps},
        ], easeInOutCubic);

        let pink_brightness = pwl(t, [
            {t: 0, x: 1},
            {t: m(1,30), x: 1},
            {t: m(1,32), x: 0.4},
            {t: m(1,35), x: 0.4},
            {t: m(1,37), x: 1},
            {t: m(1,40), x: 1},
            {t: m(1,42), x: 0.4},
            {t: m(1,50), x: 0.4},
            {t: m(1,55), x: 1},
            {t: m(2,6), x: 1},
            {t: m(2,8), x: 0.5},
            {t: m(2,12), x: 0.5},
            {t: m(2,14), x: 1},
            {t: INFTY, x: 1},
        ], easeInOutCubic);

        let blue_pos = pwl(t, [
            {t: 10, x: -4},
            {t: 12, x: -1 - eps},
            {t: INFTY, x: -1 - eps},
        ], easeInOutCubic);

        let blue_pos_z = pwl(t, [
            {t: 0, x: 0},
            {t: m(1, 59), x: -eps},
            {t: m(2, 2), x: -1-eps},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let blue_pos_x = pwl(t, [
            {t: 0, x: 0},
            {t: m(2, 35), x: -eps},
            {t: m(2, 38), x: -1-eps},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let blue_pos_w = pwl(t, [
            {t: 0, x: eps},
            {t: m(3, 28), x: eps},
            {t: m(3, 31), x: 1+eps},
            {t: INFTY, x: 1+eps},
        ], easeInOutCubic);


        let blue_brightness = pwl(t, [
            {t: 10, x: 1},
            {t: m(1, 35), x: 1},
            {t: m(1, 37), x: 0.4},
            {t: m(1,50), x: 0.4},
            {t: m(1,55), x: 1},
            {t: m(2,6), x: 1},
            {t: m(2,8), x: 0.5},
            {t: m(2,12), x: 0.5},
            {t: m(2,14), x: 1},
            {t: INFTY, x: 0.4},
        ], easeInOutCubic);

        // create a Tesseract
        let tess0 = new Tesseract('tess0', new Vector4(pink_pos_xzw, pink_pos, pink_pos_xzw, eps));
        tess0.materialSet = getLineMaterial(getColor(0xFF8faf, pink_brightness), 3*pink_brightness);
        let tess1 = new Tesseract('tess1', new Vector4(blue_pos_x, blue_pos, blue_pos_z, blue_pos_w));
        tess1.materialSet = getLineMaterial(getColor(0x8fbfff, blue_brightness), 3*blue_brightness);

        let n  = this.scene4.objects.length;
        this.scene4.objects.splice(0, n);
        this.scene4.objects.push(tess0, tess1);


        let g3_brightness = pwl(t, [
            {t: 0, x: 0},
            {t: m(1,40), x: 0},
            {t: m(1,42), x: 1},
            {t: m(1,51), x: 1},
            {t: m(1,52), x: 0},
            {t: m(1,53), x: 1},
            {t: m(1,54), x: 0},
            {t: m(1,55), x: 1},
            {t: m(1,56), x: 0},
            {t: m(2,6), x: 0},
            {t: m(2,8), x: 1},
            {t: m(2,10), x: 0},
            {t: m(2,12), x: 1},
            {t: m(2,14), x: 0},
            {t: m(2,40), x: 0},
            {t: m(2,41), x: 1},
            {t: m(2,42), x: 0},
            {t: m(2,43), x: 1},
            {t: m(2,44), x: 0},
            {t: m(2,45), x: 1},
            {t: m(2,46), x: 0},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        let g3_color_blend_coeff = pwl(t, [
            {t: 0, x: 0},
            {t: m(1,50), x: 0},
            {t: m(1,52), x: 1},
            {t: INFTY, x: 1},
        ], easeInOutCubic);

        let g3_color = interpolateColor(0x8fbfff, 0xffff4f, g3_color_blend_coeff);

        let common_material = getLineMaterial(getColor(g3_color, g3_brightness), 3*g3_brightness);
        common_material.occluded = common_material.visible;
        let common_g3 = new Object4('common_g3', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
            new Vector4(0, 0, 1, 0),
            new Vector4(0, 0, 1, 1),
            new Vector4(1, 0, 0, 0),
            new Vector4(1, 0, 0, 1),
            new Vector4(1, 0, 1, 0),
            new Vector4(1, 0, 1, 1),
        ], [
            {v_start: 0, v_end: 1},
            {v_start: 0, v_end: 2},
            {v_start: 0, v_end: 4},
            {v_start: 1, v_end: 3},
            {v_start: 1, v_end: 5},
            {v_start: 2, v_end: 3},
            {v_start: 2, v_end: 6},
            {v_start: 3, v_end: 7},
            {v_start: 4, v_end: 5},
            {v_start: 4, v_end: 6},
            {v_start: 5, v_end: 7},
            {v_start: 6, v_end: 7},
        ]
        );
        common_g3.materialSet = common_material;
        if (t < m(2,0)) {
            this.scene4.objects.push(common_g3);
        }

        let common_g2 = new Object4('common_g2', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
            new Vector4(1, 0, 0, 0),
            new Vector4(1, 0, 0, 1),
        ], [
            {v_start: 0, v_end: 1},
            {v_start: 0, v_end: 2},
            {v_start: 1, v_end: 3},
            {v_start: 2, v_end: 3},
        ]);

        common_g2.materialSet = common_material;
        if (t < m(2,20)) {
            this.scene4.objects.push(common_g2);
        }

        let common_g1 = new Object4('common_g1', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
        ], [
            {v_start: 0, v_end: 1},
        ]);
        common_g1.materialSet = common_material;
        this.scene4.objects.push(common_g1);
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: 26, x: Math.PI * 1.65},
            {t: 30, x: Math.PI * 1.65},
            {t: 35, x: Math.PI * 1.35},
            {t: m(1, 31), x: Math.PI * 4.1},
            {t: m(1, 41), x: Math.PI * 3.8},
            {t: m(1, 51), x: Math.PI * 4.1},
            {t: m(2, 6), x: Math.PI * 3.6},
            {t: m(2, 16), x: Math.PI * 2.9},
            {t: m(2, 48), x: Math.PI * 0},
            {t: INFTY, x: Math.PI * 0.1},
        ], easeInOutCubic);
        let phi = t = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 26, x: Math.PI * 0},
            {t: 30, x: Math.PI * 0.15},
            {t: INFTY, x: Math.PI * 0}
        ], easeInOutCubic);
        this.setCam3PosAngles(2.5, theta, phi);
    }


    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.2},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0.15},
            {t: m(2, 0), x: Math.PI * 0.15},
            {t: m(2, 6), x: Math.PI * -0.1},
            {t: m(2, 14), x: Math.PI * -0.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let psi = pwl(t, [
            {t: 0, x: Math.PI * 0.15},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let r = pwl(t, [
            {t: 0, x: 4},
            {t: INFTY, x: 0}
        ], easeInOutSine);


        this.cam4.pos.set(
            r * Math.cos(theta) * Math.cos(omega) * Math.cos(psi),
            r * Math.sin(omega),
            r * Math.sin(psi),
            0.5 + r * Math.sin(theta));

        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0.5));
    }

    setFrame(t: number) {
        this.camQueue.frameGap = 0.05;
    }

    prepareFrame(): void {
        let t = this.getTime();
        this.setTesseracts(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);
        this.setFrame(t);


        if (t > this.end_time) {
            this.animation_ended = true;
        }
    }
}


class P2_new extends BaseAnimation {


    end_time: number;


    constructor(frameRate: number, start: number=m(0, 0), end: number=m(1, 0)) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            1.5
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        const grid = new Grid4('grid', [1.8, 1.8, 1.8, 0.1]);
        grid.beta = 2;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined
        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        this.scene4.objects = [X, Y, Z]
        this.time = start;
        this.end_time = end;
    }





    setTesseracts(t: number) {
        let eps = 0.0;
        let pink_pos = pwl(t, [
            {t: 0, x: eps},
            {t: 10, x: eps},
            {t: m(5,5), x: eps},
            {t: m(5,8), x: -1 -eps},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let pink_pos_x = pwl(t, [
            {t: 0, x: 0},
            {t: m(5, 15), x: 0},
            {t: m(5, 18), x: -1},
            {t: INFTY, x: -1-eps},
        ], easeInOutCubic);

        let pink_pos_z = pwl(t, [
            {t: 0, x: 0},
            {t: m(5,10), x: 0},
            {t: m(5, 13), x: -1-eps},
            {t: INFTY, x: -1-eps},
        ], easeInOutCubic);



        let pink_brightness = pwl(t, [
            {t: 0, x: 1},
            {t: m(1,30), x: 1},
            {t: m(1,32), x: 0.6},
            {t: m(2,35), x: 0.6},
            {t: m(2,38), x: 1},
            {t: m(3,5), x: 1},
            {t: m(3,8), x: 0.6},
            {t: m(3,30), x: 0.6},
            {t: m(3,33), x: 1},
            {t: m(4,5), x: 1},
            {t: m(4,7), x: 0.6},
            {t: m(4,8), x: 0.6},
            {t: m(4,10), x: 1},
            {t: INFTY, x: 1},
        ], easeInOutCubic);

        let blue_pos = pwl(t, [
            {t: 0, x: -4},
            {t: 10, x: -4},
            {t: 12, x: -1 - eps},
            {t: INFTY, x: -1 - eps},
        ], easeInOutCubic);

        let blue_pos_z = pwl(t, [
            {t: 0, x: 0},
            {t: m(3, 0), x: -eps},
            {t: m(3, 3), x: -1-eps},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let blue_pos_x = pwl(t, [
            {t: 0, x: 0},
            {t: m(4, 0), x: -eps},
            {t: m(4, 3), x: -1},
            {t: INFTY, x: eps},
        ], easeInOutCubic);

        let blue_pos_w = pwl(t, [
            {t: 0, x: eps},
            {t: m(5, 0), x: eps},
            {t: m(5, 3), x: 1+eps},
            {t: INFTY, x: 1+eps},
        ], easeInOutCubic);


        let blue_brightness = pwl(t, [
            {t: 0, x: 1},
            {t: m(2,0), x: 1},
            {t: m(2,3), x: 0.6},
            {t: m(2,35), x: 0.6},
            {t: m(2,38), x: 1},
            {t: m(3,5), x: 1},
            {t: m(3,8), x: 0.6},
            {t: m(3,30), x: 0.6},
            {t: m(3,33), x: 1},
            {t: m(4,5), x: 1},
            {t: m(4,7), x: 0.6},
            {t: m(4,8), x: 0.6},
            {t: m(4,10), x: 1},
            {t: INFTY, x: 0.4},
        ], easeInOutCubic);

        // create a Tesseract
        let tess0 = new Tesseract('tess0', new Vector4(pink_pos_x, pink_pos, pink_pos_z, eps));
        tess0.materialSet = getLineMaterial(getColor(0xFF8faf, pink_brightness), 6*pink_brightness-2);
        let tess1 = new Tesseract('tess1', new Vector4(blue_pos_x, blue_pos, blue_pos_z, blue_pos_w));
        tess1.materialSet = getLineMaterial(getColor(0xccadff, blue_brightness), 6*blue_brightness-2);

        let n  = this.scene4.objects.length;
        this.scene4.objects.splice(3, n-3);
        this.scene4.objects.push( tess0, tess1 );


        let g3_brightness = pwl(t, [
            {t: 0, x: 0},
            {t: m(1,35), x: 0},
            {t: m(1,37), x: 1},
            {t: m(2,35), x: 1},
            {t: m(2,37), x: 0},
            {t: m(3,5), x: 0},
            {t: m(3,8), x: 1},
            {t: m(3,30), x: 1},
            {t: m(3,33), x: 0},
            {t: m(4,5), x: 0},
            {t: m(4,7), x: 1},
            {t: m(4,8), x: 1},
            {t: m(4,10), x: 0},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        let g3_color_blend_coeff = pwl(t, [
            {t: 0, x: 0},
            {t: m(2,0), x: 0},
            {t: m(2,3), x: 1},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        let g3_color = interpolateColor(0xccadff, 0xffff4f, g3_color_blend_coeff);

        let common_material = getLineMaterial(getColor(g3_color, g3_brightness), 3*g3_brightness, true);
        //common_material.occluded = common_material.visible;
        let common_g3 = new Object4('common_g3', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
            new Vector4(0, 0, 1, 0),
            new Vector4(0, 0, 1, 1),
            new Vector4(1, 0, 0, 0),
            new Vector4(1, 0, 0, 1),
            new Vector4(1, 0, 1, 0),
            new Vector4(1, 0, 1, 1),
        ], [
            {v_start: 0, v_end: 1},
            {v_start: 0, v_end: 2},
            {v_start: 0, v_end: 4},
            {v_start: 1, v_end: 3},
            {v_start: 1, v_end: 5},
            {v_start: 2, v_end: 3},
            {v_start: 2, v_end: 6},
            {v_start: 3, v_end: 7},
            {v_start: 4, v_end: 5},
            {v_start: 4, v_end: 6},
            {v_start: 5, v_end: 7},
            {v_start: 6, v_end: 7},
        ]
        );
        common_g3.materialSet = common_material;
        if (g3_brightness > 0 && t < m(3,0)) {
             this.scene4.objects.push(common_g3);
        }

        let common_g2 = new Object4('common_g2', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
            new Vector4(1, 0, 0, 0),
            new Vector4(1, 0, 0, 1),
        ], [
            {v_start: 0, v_end: 1},
            {v_start: 0, v_end: 2},
            {v_start: 1, v_end: 3},
            {v_start: 2, v_end: 3},
        ]);

        common_g2.materialSet = common_material;
        if (g3_brightness > 0 && t < m(4,0)) {
            this.scene4.objects.push(common_g2);
        }

        let common_g1 = new Object4('common_g1', [
            new Vector4(0, 0, 0, 0),
            new Vector4(0, 0, 0, 1),
        ], [
            {v_start: 0, v_end: 1},
        ]);
        common_g1.materialSet = common_material;
        if (g3_brightness > 0 && t < m(5,0)) {
            this.scene4.objects.push(common_g1);
        }
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: 15, x: Math.PI * 0.15},
            {t: 35, x: Math.PI * 2.1},
            {t: m(1, 0), x: Math.PI * 2.1},
            {t: m(1, 40), x: Math.PI * 2.1},
            {t: m(1, 50), x: Math.PI * 4.1},
            {t: m(2, 18), x: Math.PI * 4.1},
            {t: m(2, 35), x: Math.PI * 6.1},
            {t: m(3, 0), x: Math.PI * 6.1},
            {t: m(3, 20), x: Math.PI * 7.9},
            {t: m(3, 23), x: Math.PI * 7.9},
            {t: m(3, 30), x: Math.PI * 8.1},
            {t: m(3, 35), x: Math.PI * 8.1},
            {t: m(3, 50), x: Math.PI * 9.8},
            {t: m(4, 0), x: Math.PI * 9.8},
            {t: m(4, 2), x: Math.PI * 10},
            {t: m(4, 22), x: Math.PI * 10.1},
            {t: m(4, 35), x: Math.PI * 12.1},
            {t: m(5, 5), x: Math.PI * 12.1},
            {t: m(5, 10), x: Math.PI * 12.4},
            {t: m(5, 20), x: Math.PI * 12.1},
            {t: m(5, 40), x: Math.PI * 12.1},
            {t: m(5, 55), x: Math.PI * 13.9},
            {t: INFTY, x: Math.PI * 0.1},
        ], easeInOutCubic);
        let phi = t = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: m(5, 10), x: Math.PI * 0.1},
            {t: m(5, 15), x: Math.PI * 0.05},
            {t: m(5, 40), x: Math.PI * 0.05},
            {t: m(5, 55), x: Math.PI * 0.3},
            {t: INFTY, x: Math.PI * 0.1}
        ], easeInOutCubic);
        this.setCam3PosAngles(2.5, theta, phi);
    }


    setCam4Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: m(2,10), x: Math.PI * 0},
            {t: m(2,15), x: Math.PI * 0.15},
            {t: m(4,15), x: Math.PI * 0.15},
            {t: m(4,22), x: Math.PI * 0},

            {t: m(5, 25), x: Math.PI * 0},
            {t: m(5, 30), x: Math.PI * 0.15},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: m(1,20), x: Math.PI * 0},
            {t: m(1,25), x: Math.PI * 0.2},
            {t: m(3,23), x: Math.PI * 0.2},
            {t: m(3,30), x: Math.PI * -0.2},
            {t: m(4,15), x: Math.PI * -0.2},
            {t: m(4,22), x: Math.PI * 0.000},

            {t: m(5, 20), x: Math.PI * 0},
            {t: m(5, 25), x: Math.PI * 0.2},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let psi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: m(2,5), x: Math.PI * 0},
            {t: m(2,10), x: Math.PI * 0.15},
            {t: m(4,15), x: Math.PI * 0.15},
            {t: m(4,22), x: Math.PI * 0},

            {t: m(5, 30), x: Math.PI * 0},
            {t: m(5, 35), x: Math.PI * 0.25},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let r = pwl(t, [
            {t: 0, x: 6},
            {t: INFTY, x: 0}
        ], easeInOutSine);


        this.cam4.pos.set(
            r * Math.cos(theta) * Math.cos(omega) * Math.cos(psi),
            r * Math.sin(omega),
            r * Math.sin(psi),
            0.5 + r * Math.sin(theta));

        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0.5));
    }

    setFrame(t: number) {
        this.camQueue.frameGap = 0.05;
    }

    prepareFrame(): void {
        let t = this.getTime();
        this.setTesseracts(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);
        this.setFrame(t);


        if (t > this.end_time) {
            this.animation_ended = true;
        }
    }
}

interface TesseractItem {
    offset: Vector4;
    axis: number;
}


class P3 extends BaseAnimation {
    end_time: number;

    tesseracts: TesseractItem[];
    start_at: number;
    move_in_delay: number;
    move_out_delay: number;

    stack_display_time: number;
    stack_up_time: number;
    view_transition_time: number;
    view_display_time: number;


    constructor(frameRate: number, start: number=m(0, 0), end: number=m(2, 0)) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            90
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.start_at = 1;
        this.move_in_delay = 4;
        this.move_out_delay = 1;

        const grid = new Grid4('grid', [3.5, 3.5, 3.5, 0.1]);
        grid.beta = 2;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined
        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);

        // all rendered with theta = 0.1
        // this.tesseracts = [
        //     {offset: new Vector4(0, 0, 0, 0), axis: 3},
        //     {offset: new Vector4(0, 0, 0, 1), axis: 3},
        //     {offset: new Vector4(0, 0, 0, 2), axis: 3},
        // ]

        // this.move_in_delay = 2
        // this.tesseracts = [
        //     {offset: new Vector4(0, 0, 0, 0), axis: 3},
        //     {offset: new Vector4(0, 0, 1, 0), axis: 3},
        //     {offset: new Vector4(0, 1, 0, 0), axis: 3},
        //     {offset: new Vector4(0, 1, 1, 0), axis: 3},
        //     {offset: new Vector4(1, 1, 1, 0), axis: 0},
        //     {offset: new Vector4(1, 0, 1, 0), axis: 0},
        //     {offset: new Vector4(1, 1, 0, 0), axis: 0},
        //     {offset: new Vector4(1, 0, 0, 0), axis: 0},
        // ]


        let corner_tess = new Tesseract('tess');
        corner_tess.materialSet = getLineMaterial(0xff0000, 3);
        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 2},
            {offset: new Vector4(0, 1, 0, 0), axis: 1},
            {offset: new Vector4(1, 0, 0, 0), axis: 0},
        ]
        this.start_at = 1



        this.scene4.objects = [X, Y, Z, corner_tess]
        this.time = start;


        this.stack_display_time = 10;
        this.stack_up_time = this.start_at + this.move_in_delay * (this.tesseracts.length) + this.stack_display_time;
        this.view_transition_time = 10;
        this.view_display_time = 10;

        this.end_time = Math.min(end,
            this.stack_up_time + this.view_transition_time * 5 + this.view_display_time * 4 + 10);
    }

    setTesseracts(t: number) {
        if (t < this.stack_up_time - this.stack_display_time + 1) {
            this.scene4.objects.splice(4, this.scene4.objects.length - 4);
            for (let i = 0; i < this.tesseracts.length; i++) {
                let tess_info = this.tesseracts[i];
                let offset = tess_info.offset.clone();
                offset.setComponent(tess_info.axis, offset.getComponent(tess_info.axis) + pwl(t, [
                    {t: 0, x: 10},
                    {t: this.start_at + this.move_in_delay * i, x: 10},
                    {t: this.start_at + this.move_in_delay * (i+1), x: 0},
                    {t: INFTY, x: 0},
                ], easeInOutCubic));

                this.scene4.objects.push(new Tesseract('tess', offset).showFaceBorderOnly(3));
            }
        }
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: this.start_at, x: 0},
            {t: this.start_at + this.move_in_delay * (this.tesseracts.length), x: Math.PI * 1.1},
            {t: this.start_at + this.move_in_delay * (this.tesseracts.length) + this.stack_display_time, x: Math.PI * 2.1},

            {t: this.stack_up_time + this.view_transition_time * 1 + this.view_display_time * 0, x: Math.PI * 2.1}, // stop transition to top
            {t: this.stack_up_time + this.view_transition_time * 1 + this.view_display_time * 1, x: Math.PI * 4.1}, // start transition to psi

            {t: this.stack_up_time + this.view_transition_time * 2 + this.view_display_time * 1, x: Math.PI * 4.1}, // stop transition to top
            {t: this.stack_up_time + this.view_transition_time * 2 + this.view_display_time * 2, x: Math.PI * 6.1}, // start transition to psi

            {t: this.stack_up_time + this.view_transition_time * 3 + this.view_display_time * 2, x: Math.PI * 6.1}, // stop transition to top
            {t: this.stack_up_time + this.view_transition_time * 3 + this.view_display_time * 3, x: Math.PI * 8.1}, // start transition to psi

            {t: this.stack_up_time + this.view_transition_time * 4 + this.view_display_time * 3, x: Math.PI * 8.1}, // stop transition to top
            {t: this.stack_up_time + this.view_transition_time * 4 + this.view_display_time * 4, x: Math.PI * 10.1}, // start transition to psi

            {t: INFTY, x: Math.PI * 0.1},
        ], easeInOutCubic);
        let phi = t = pwl(t, [
            {t: 0, x: Math.PI * 0.05},
            {t: INFTY, x: Math.PI * 0.1}
        ], easeInOutCubic);
        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {

        let stack_up_time = this.stack_up_time;
        let view_transition_time = this.view_transition_time;
        let view_display_time = this.view_display_time;


        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: stack_up_time, x: Math.PI * 0.1},
            {t: stack_up_time + view_transition_time, x: Math.PI * 0},
            {t: stack_up_time + view_transition_time + view_display_time, x: Math.PI * 0},
            {t: stack_up_time + view_transition_time * 2 + view_display_time, x: Math.PI * 0.5-1e-3}, // stop transition to top
            {t: stack_up_time + view_transition_time * 2 + view_display_time * 2, x: Math.PI * 0.5-1e-3}, // start transition to psi
            {t: stack_up_time + view_transition_time * 2.5 + view_display_time * 2, x: Math.PI * 0}, // stop transition to psi
            {t: stack_up_time + view_transition_time * 4.2 + view_display_time * 4, x: Math.PI * 0}, // restore initial position
            {t: stack_up_time + view_transition_time * 5 + view_display_time * 4, x: Math.PI * 0.1}, // restore initial position
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: stack_up_time, x: Math.PI * 0.1},
            {t: stack_up_time + view_transition_time, x: Math.PI * 0},
            {t: stack_up_time + view_transition_time * 3 + view_display_time * 3, x: Math.PI * 0}, // stop transition to omega
            {t: stack_up_time + view_transition_time * 4 + view_display_time * 3, x: Math.PI * 0.5-1e-3}, // stop transition to omega
            {t: stack_up_time + view_transition_time * 4 + view_display_time * 4, x: Math.PI * 0.5-1e-3}, // restore initial position
            {t: stack_up_time + view_transition_time * 5 + view_display_time * 4, x: Math.PI * 0.1}, // restore initial position
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let psi = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: stack_up_time, x: Math.PI * 0.1},
            {t: stack_up_time + view_transition_time, x: Math.PI * 0},
            {t: stack_up_time + view_transition_time * 2.1 + view_display_time * 2, x: Math.PI * 0}, // start transition to psi
            {t: stack_up_time + view_transition_time * 3 + view_display_time * 2, x: Math.PI * 0.5-1e-3}, // stop transition to psi
            {t: stack_up_time + view_transition_time * 3 + view_display_time * 3, x: Math.PI * 0.5-1e-3}, // stop transition to omega
            {t: stack_up_time + view_transition_time * 3.5 + view_display_time * 3, x: Math.PI * 0}, // stop transition to omega
            {t: stack_up_time + view_transition_time * 4.2 + view_display_time * 4, x: Math.PI * 0}, // restore initial position
            {t: stack_up_time + view_transition_time * 5 + view_display_time * 4, x: Math.PI * 0.1}, // restore initial position
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let r = pwl(t, [
            {t: 0, x: 100},
            {t: INFTY, x: 0}
        ], easeInOutSine);


        this.cam4.pos.set(
            r * Math.cos(theta) * Math.cos(omega) * Math.cos(psi),
            1 + r * Math.sin(omega),
            1 + r * Math.sin(psi),
            1 + r * Math.sin(theta));

        this.cam4.lookAt_w_as_up(new Vector4(0, 1, 1, 1));
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setTesseracts(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);


        if (t > this.end_time) {
            this.animation_ended = true;
        }
    }
}

class P4 extends BaseAnimation {
    end_time: number;

    tesseracts: TesseractItem[];
    start_at: number;
    move_in_delay: number;
    move_out_delay: number;

    stack_display_time: number;
    stack_up_time: number;
    stack_collapse_time: number;


    constructor(frameRate: number, start: number=m(0, 0), end: number=m(2, 20)) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            90
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.start_at = 1;
        this.move_in_delay = 0.1;
        this.move_out_delay = 1;

        const grid = new Grid4('grid', [3.5, 3.5, 3.5, 0.1]);
        grid.beta = 2;

        let red = RED.clone();
        let green = GREEN.clone();
        let blue = BLUE.clone();
        red.occluded = undefined;
        green.occluded = undefined;
        blue.occluded = undefined
        let X = grid.getX(red);
        let Y = grid.getY(green);
        let Z = grid.getZ(blue);



        // Q1
        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 0, 0, 0), axis: 3},
            {offset: new Vector4(2, 0, 0, 0), axis: 3},
        ]


        // Q2
        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(0, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 2, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 3},
        ]

        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 0, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
            {offset: new Vector4(0, 0, 0, 2), axis: 3},
        ]

        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(0, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 3},
            {offset: new Vector4(0, 1, 1, 0), axis: 3},
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
        ]

        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 0, 0, 0), axis: 3},
            {offset: new Vector4(0, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 3},
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
        ]

        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 1), axis: 3},
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
            {offset: new Vector4(0, 0, 0, 2), axis: 3},
        ]

        this.tesseracts = [
            {offset: new Vector4(0, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 0, 0, 0), axis: 3},
            {offset: new Vector4(1, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 1, 0, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 0), axis: 3},
            {offset: new Vector4(1, 0, 1, 0), axis: 3},
            {offset: new Vector4(0, 1, 1, 0), axis: 3},
            {offset: new Vector4(0, 0, 1, 1), axis: 3},
            {offset: new Vector4(0, 0, 0, 1), axis: 3},
        ]

        this.scene4.objects = [X, Y, Z]
        this.time = start;


        this.stack_display_time = 8 ;
        this.stack_up_time = this.start_at + this.move_in_delay * (this.tesseracts.length);
        this.stack_collapse_time = this.stack_up_time + 4 * this.stack_display_time;


        this.end_time = Math.min(end,
            this.stack_up_time + this.stack_display_time * 4 + this.move_out_delay * (this.tesseracts.length) + 5);
    }

    setTesseracts(t: number) {

        this.scene4.objects.splice(3, this.scene4.objects.length - 3);
        for (let i = 0; i < this.tesseracts.length; i++) {
            let tess_info = this.tesseracts[i];
            let offset = tess_info.offset.clone();
            offset.setComponent(tess_info.axis, offset.getComponent(tess_info.axis) + pwl(t, [
                {t: 0, x: 10},
                {t: this.start_at + this.move_in_delay * 0, x: 10},
                {t: this.start_at + this.move_in_delay * (i+1), x: 0},
                {t: this.stack_collapse_time + (this.tesseracts.length - i) * this.move_out_delay, x: 0},
                {t: this.stack_collapse_time + (this.tesseracts.length - i + 1) * this.move_out_delay, x: 10},
                {t: INFTY, x: 0},
            ], easeInOutCubic));

            this.scene4.objects.push(new Tesseract('tess', offset).showFaceBorderOnly(3));
        }
    }

    setCam3Pos(t: number) {

        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: this.stack_up_time, x: 0.1},
            {t: this.stack_up_time + this.stack_display_time, x: Math.PI * 0.6},
            {t: this.stack_up_time + 2 * this.stack_display_time, x: Math.PI * 1.1},
            {t: this.stack_up_time + 3 * this.stack_display_time, x: Math.PI * 1.6},
            {t: this.stack_up_time + 4 * this.stack_display_time, x: Math.PI * 2.1},
            {t: this.stack_up_time + 4 * this.stack_display_time + 10, x: Math.PI * 3.1},
            {t: INFTY, x: Math.PI * 0.1},
        ], easeInOutCubic);
        let phi = t = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: INFTY, x: Math.PI * 0.1}
        ], easeInOutCubic);
        this.setCam3PosAngles(2.5, theta, phi);
    }

    setCam4Pos(t: number) {

        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let omega = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let psi = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let r = pwl(t, [
            {t: 0, x: 100},
            {t: INFTY, x: 0}
        ], easeInOutSine);


        this.cam4.pos.set(
            r * Math.cos(theta) * Math.cos(omega) * Math.cos(psi),
            1 + r * Math.sin(omega),
            1 + r * Math.sin(psi),
            1 + r * Math.sin(theta));

        this.cam4.lookAt_w_as_up(new Vector4(0, 1, 1, 1));
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setTesseracts(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);


        if (t > this.end_time) {
            this.animation_ended = true;
        }
    }
}


export {
    get3DAnimationHandler,
    P1,
    P2,
    P2_new,
    P3,
    P4,
}