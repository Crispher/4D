import { BaseAnimation, easeInOutSine, INFTY, pwl, easeInOutCubic } from "../animations";
import {Camera4, Object4, CameraQueue} from "../math/core";
import { Vector4 } from "three";
import { OneManifold, TwoManifoldMesh_2 } from "../math/primitives";
import { Complex, complex, exp, sin, tan, pow, multiply, sinh } from "mathjs";

let m = (a: number, b: number) => a * 60 + b;

function rotation_interp(x: Vector4, y: Vector4, t: number): Vector4 {
    return x.clone().lerp(y, t).normalize();
}

function rotation_interp_keyframe(x: Vector4[], samples: number[], t: number): Vector4 {
    let i = 0;
    while (i < samples.length && samples[i] < t) {
        i++;
    }
    if (i == 0) {
        return x[i];
    } else if (i == samples.length) {
        return x[i - 1];
    } else {
        let t0 = samples[i - 1];
        let t1 = samples[i];
        return rotation_interp(x[i-1], x[i], (t - t0) / (t1 - t0));
    }
}

export class FuncPlot extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            const y = multiply(exp(z), 0.1) as Complex;
            return new Vector4(z.re, z.im, y.im, y.re);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 4; // use 4
            div = 50;
        } else {
            subdiv = 1; // use 2
            div = 40;
        }
        this.scene4.objects.push(
            new TwoManifoldMesh_2(
                'plot',
                [-6, 4],
                [-10, 10],
                div,
                div,
                subdiv,
                subdiv,
                func
            ).scale(scale)
        ); // 画复函数图像

        this.scene4.objects.push(
            new OneManifold('x', [-12, 12], 1, u => new Vector4(u, 0, 0, 0)).scale(scale),
            new OneManifold('y', [-12, 12], 1, u => new Vector4(0, u, 0, 0)).scale(scale),
            new OneManifold('z', [-12, 12], 1, u => new Vector4(0, 0, u, 0)).scale(scale),
            new OneManifold('w', [-12, 12], 1, u => new Vector4(0, 0, 0, u)).scale(scale)
        );
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.5},
            {t: 10, x: Math.PI * 2.5},
            {t: 15, x: Math.PI * 2.5},
            {t: 25, x: Math.PI * 2},
            {t: 35, x: Math.PI * 1.5},
            {t: 45, x: Math.PI * 1.5},
            {t: 55, x: Math.PI * 3.5},
            {t: 65, x: Math.PI * 3.5},
            {t: 70, x: Math.PI * 4.5},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(2.5, theta, 0.1);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(0, 1, 0, 0).normalize(),
                new Vector4(0, 1, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize()
            ], [
                0,
                15,
                25,
                35,
                45,
                55,
                65,
                INFTY
            ],
            t
        )

        console.log(t, cam4_pos);

        this.cam4.pos.copy(cam4_pos.multiplyScalar(25));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0), new Vector4(0, 0, 1, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 10) {
            let l = pwl(t, [
                {t: 10, x: 0},
                {t: 15, x: 13},
                {t: INFTY, x: 13}
            ], easeInOutCubic)
            if (this.scene4.objects.length > 5) {
                this.scene4.objects.pop();
            }
            this.scene4.objects.push(new OneManifold("exp-real", [-8, -8+l], 200, (u: number) => {
                return new Vector4(u, 0, 0, Math.exp(u)/10);
            }).scale(0.5));
        }
        if (t > 70) {
            this.animation_ended = true;
        }
    }
}

export class FuncPlot_sin extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            const y = multiply(sin(z), 1) as Complex;
            return new Vector4(z.re, z.im, y.im, y.re);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 4; // use 4
            div = 60;
        } else {
            subdiv = 4; // use 2
            div = 60;
        }
        this.scene4.objects.push(
            new TwoManifoldMesh_2(
                'plot',
                [-3*Math.PI, 3*Math.PI],
                [-3*Math.PI, 3*Math.PI],
                div,
                div,
                subdiv,
                subdiv,
                func
            ).scale(scale)
        ); // 画复函数图像

        this.scene4.objects.push(
            new OneManifold('x', [-12, 12], 1, u => new Vector4(u, 0, 0, 0)).scale(scale),
            new OneManifold('y', [-12, 12], 1, u => new Vector4(0, u, 0, 0)).scale(scale),
            new OneManifold('z', [-12, 12], 1, u => new Vector4(0, 0, u, 0)).scale(scale),
            new OneManifold('w', [-12, 12], 1, u => new Vector4(0, 0, 0, u)).scale(scale)
        );
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.5},
            {t: 10, x: Math.PI * 2.5},
            {t: 15, x: Math.PI * 2.5},
            {t: 25, x: Math.PI * 2},
            {t: 35, x: Math.PI * 1.5},
            {t: 45, x: Math.PI * 1.5},
            {t: 55, x: Math.PI * 2},
            {t: 65, x: Math.PI * 2},
            {t: 70, x: Math.PI * 2.6},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(5, theta, 0);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(0, 1, 0, 0).normalize(),
                new Vector4(0, 1, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize()
            ], [
                0,
                15,
                25,
                35,
                45,
                55,
                65,
                INFTY
            ],
            t
        )

        console.log(t, cam4_pos);

        this.cam4.pos.copy(cam4_pos.multiplyScalar(20));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0), new Vector4(0, 0, 1, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 10) {
            let l = pwl(t, [
                {t: 10, x: 0},
                {t: 15, x: 6 * Math.PI},
                {t: INFTY, x: 6 * Math.PI}
            ], easeInOutCubic)
            if (this.scene4.objects.length > 5) {
                this.scene4.objects.pop();
            }
            this.scene4.objects.push(new OneManifold("exp-real", [-3 * Math.PI, -3 * Math.PI + l], 200, (u: number) => {
                return new Vector4(u, 0, 0, Math.sin(u));
            }).scale(0.5));
        }
        if (t > 70) {
            this.animation_ended = true;
        }
    }
}

export class FuncPlot_tan extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            const y = multiply(tan(z), 1) as Complex;
            return new Vector4(z.re, z.im, y.im, y.re);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 5; // use 4
            div = 60;
        } else {
            subdiv = 4; // use 2
            div = 60;
        }
        this.scene4.objects.push(
            new TwoManifoldMesh_2(
                'plot',
                [-1*Math.PI, 1*Math.PI],
                [-1.5*Math.PI, 1.5*Math.PI],
                div,
                div,
                subdiv,
                subdiv,
                func
            ).scale(scale)
        ); // 画复函数图像

        this.scene4.objects.push(
            new OneManifold('x', [-12, 12], 1, u => new Vector4(u, 0, 0, 0)).scale(scale),
            new OneManifold('y', [-12, 12], 1, u => new Vector4(0, u, 0, 0)).scale(scale),
            new OneManifold('z', [-12, 12], 1, u => new Vector4(0, 0, u, 0)).scale(scale),
            new OneManifold('w', [-12, 12], 1, u => new Vector4(0, 0, 0, u)).scale(scale)
        );
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.5},
            {t: 10, x: Math.PI * 2.5},
            {t: 15, x: Math.PI * 2.5},
            {t: 25, x: Math.PI * 2},
            {t: 35, x: Math.PI * 1.5},
            {t: 45, x: Math.PI * 1.5},
            {t: 55, x: Math.PI * 2},
            {t: 65, x: Math.PI * 2},
            {t: 70, x: Math.PI * 2.6},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: 0.1},
            {t: 15, x: 0.1},
            {t: 25, x: 0},
            {t: 35, x: 0},
            {t: 45, x: 0.5},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        this.setCam3PosAngles(5, theta, phi);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),//15
                new Vector4(0, 1, 0, 0).normalize(),//25
                new Vector4(0, 1, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),//45
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(-20, 3, 5, 7).normalize(),
                new Vector4(-20, 3, 5, 7).normalize()
            ], [
                0,
                15,
                25,
                35,
                45,
                55,
                65,
                INFTY
            ],
            t
        )

        console.log(t, cam4_pos);

        this.cam4.pos.copy(cam4_pos.multiplyScalar(12));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0), new Vector4(0, 0, 1, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 10) {
            let l = pwl(t, [
                {t: 10, x: 0},
                {t: 15, x: 0.49 * Math.PI},
                {t: INFTY, x: 0}
            ], easeInOutCubic)
            if (this.scene4.objects.length > 5) {
                this.scene4.objects.pop();
            }
            this.scene4.objects.push(new OneManifold("exp-real", [-l, l], 200, (u: number) => {
                return new Vector4(u, 0, 0, Math.tan(u));
            }).scale(0.5));
        }
        if (t > 70) {
            this.animation_ended = true;
        }
    }
}

export class FuncPlot_square extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            const y = multiply(pow(z, 2), 0.5) as Complex;
            return new Vector4(z.re, z.im, y.im, y.re);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 5; // use 4
            div = 60;
        } else {
            subdiv = 1; // use 2
            div = 60;
        }
        this.scene4.objects = Array(50).fill(new Object4("x"));



    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.6},
            {t: 5, x: Math.PI * 0.65},
            {t: 10, x: Math.PI * 0.6},
            {t: 12, x: Math.PI * 0.6},
            {t: 20, x: Math.PI * 1.6},
            {t: 30, x: Math.PI * 1.6},
            {t: 45, x: Math.PI * 2.6},
            {t: 55, x: Math.PI * 2.6},
            {t: 70, x: Math.PI * 3.6},
            {t: 85, x: Math.PI * 3.6},
            {t: 100, x: Math.PI * 5.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: 0},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        this.setCam3PosAngles(5, theta, phi);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(-20, 3, 5, 7).normalize()
            ], [
                0,
                INFTY
            ],
            t
        )

        console.log(t, cam4_pos);

        this.cam4.pos.copy(cam4_pos.multiplyScalar(30));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0), new Vector4(0, 0, 1, 0));
    }


    prepareScene(t: number): void {
        if (0 < t && t < 2) {
            let l = pwl(t, [
                {t: 0, x: 0},
                {t: 2, x: 5}
            ], easeInOutCubic);
            this.scene4.objects[0] = new OneManifold("x-real", [-l, l], 1, u => new Vector4(u, 0, 0, 0))
            this.scene4.objects[1] = new OneManifold("x-real", [-l, l], 1, u => new Vector4(0, u, 0, 0))
        }
        if (3 < t && t < 8) {
            let l = pwl(t, [
                {t: 3, x: 0},
                {t: 8, x: 5}
            ], easeInOutCubic);
            this.scene4.objects[2] = new TwoManifoldMesh_2("x", [-l, l], [-l, l], 20, 20, 1, 1, (u: number, v: number) => {
                return new Vector4(u, v, 0, 0);
            });
        }

        if (10 < t && t < 12) {
            let l = pwl(t, [
                {t: 10, x: 0},
                {t: 12, x: 5}
            ], easeInOutCubic);
            this.scene4.objects[3] = new OneManifold("x-real", [-l, l], 1, u => new Vector4(0, 0, u, 0))
            this.scene4.objects[4] = new OneManifold("x-real", [-l, l], 1, u => new Vector4(0, 0, 0, u))
        // }

        // if (13 < t && t < 18) {
        //     let l = pwl(t, [
        //         {t: 13, x: 0},
        //         {t: 18, x: 5}
        //     ], easeInOutCubic);
            this.scene4.objects[5] = new TwoManifoldMesh_2("x", [-l, l], [-l, l], 20, 20, 1, 1, (u: number, v: number) => {
                return new Vector4(0, 0, u, v);
            });
        }

        if (20 < t && t < 30) {
            let vt = (t: number) => {
                let a = pwl(t, [
                    {t: 20, x: -3},
                    {t: 30, x: 3}
                ], easeInOutCubic);
                let b = 0;
                let y = multiply(pow(complex(a, b), 2), 0.5) as Complex;
                return new Vector4(a, b, y.im, y.re);
            }

            let V = vt(t);
            this.scene4.objects[6] = new OneManifold("x", [0, 1], 1, u => new Vector4(V.x, V.y, u*V.z, u*V.w));
            this.scene4.objects[7] = new OneManifold("x", [0, 1], 1, u => new Vector4(u*V.x, u*V.y, V.z, V.w));
            this.scene4.objects[8] = new OneManifold("x", [20, t], 50, vt);
        }
        if (t > 45) {
            this.scene4.objects[6] = new Object4("x");
            this.scene4.objects[7] = new Object4("x");
        }

        if (45 < t && t < 57) {
            let start = 45;
            let duration = 2;
            for (let i = 1; i < 10; i++) {
                let vt = (t: number) => {
                    let a = pwl(t, [
                        {t: start, x: -3},
                        {t: start+i, x: -3},
                        {t: start+i+duration, x: 3},
                        {t: INFTY, x: 3}
                    ], easeInOutCubic);
                    let b = i / 4;
                    let y = multiply(pow(complex(a, b), 2), 0.5) as Complex;
                    return new Vector4(a, b, y.im, y.re);
                }

                let V = vt(t);
                // this.scene4.objects[9+i*3] = new OneManifold("x", [0, 1], 1, u => new Vector4(V.x, V.y, u*V.z, u*V.w));
                // this.scene4.objects[10+i*3] = new OneManifold("x", [0, 1], 1, u => new Vector4(u*V.x, u*V.y, V.z, V.w));
                this.scene4.objects[9+i] = new OneManifold("x", [start+i, Math.min(t, start+i+duration)], 50, vt);
            }
        }

        if (70 < t && t < 82) {
            let start = 70;
            let duration = 2;
            for (let i = 1; i < 10; i++) {
                let vt = (t: number) => {
                    let a = pwl(t, [
                        {t: start, x: -3},
                        {t: start+i, x: -3},
                        {t: start+i+duration, x: 3},
                        {t: INFTY, x: 3}
                    ], easeInOutCubic);
                    let b = -i / 4;
                    let y = multiply(pow(complex(a, b), 2), 0.5) as Complex;
                    return new Vector4(a, b, y.im, y.re);
                }

                let V = vt(t);
                this.scene4.objects[18+i] = new OneManifold("x", [start+i, Math.min(t, start+i+duration)], 50, vt);
            }
        }
    }

    prepareFrame(): void {
        let t = this.getTime();

        this.prepareScene(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 100) {
            this.animation_ended = true;
        }
    }
}

export class FuncPlot_square_2 extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            const y = multiply(pow(z, 2), 0.5) as Complex;
            return new Vector4(z.re, z.im, y.im, y.re);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 2; // use 4
            div = 40;
        } else {
            subdiv = 1; // use 2
            div = 40;
        }
        let axis_length = 6
        this.scene4.objects.push(
            new OneManifold("x", [-axis_length, axis_length], 1, u => new Vector4(u, 0, 0, 0)),
            new OneManifold("x", [-axis_length, axis_length], 1, u => new Vector4(0, u, 0, 0)),
            new OneManifold("x", [-axis_length, axis_length], 1, u => new Vector4(0, 0, u, 0)),
            new OneManifold("x", [-axis_length, axis_length], 1, u => new Vector4(0, 0, 0, u)),
            new OneManifold("x", [-3, 3], 40, u => func(u, 0)),
            new TwoManifoldMesh_2("x", [-4, 4], [-4, 4], div, div, subdiv, subdiv, func),
            new Object4("x"),
            new Object4("x"),
            new Object4("x"),new Object4("x"),
        )

    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 1.1},
            {t: 10, x: Math.PI * 1.5},
            {t: 20, x: Math.PI * 1.5},
            {t: 30, x: Math.PI * 2.5},
            {t: 40, x: Math.PI * 2.5},
            {t: 50, x: Math.PI * 3.3},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: 0},
            {t: 40, x: 0},
            {t: 50, x: -1},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        this.setCam3PosAngles(5, theta, phi);
    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 2, 4).normalize(),
                new Vector4(10, -6, 0, 0).normalize(),
                new Vector4(10, -6, 0, 0).normalize(),
            ], [
                0,
                30,
                40,
                INFTY
            ],
            t
        )



        this.cam4.pos.copy(cam4_pos.multiplyScalar(30));
        if (30 < t) {
            let l = pwl(t, [
                {t: 30, x: 0},
                {t: 40, x: -0.5},
                {t: INFTY, x: -0.5},
            ], easeInOutCubic);
            this.cam4.pos.w = this.cam4.pos.w +l;
            this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, l), new Vector4(0, 0, 1, 0));
        } else {
            this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0), new Vector4(0, 0, 1, 0));
        }


        console.log(t, this.cam4.pos);
    }


    prepareScene(t: number): void {

        if (10 < t && t < 15) {
            let l = pwl(t, [
                {t: 10, x: 0},
                {t: 12, x: 0},
                {t: 15, x: -0.5},
                {t: INFTY, x: -0.5}
            ], easeInOutCubic);
            this.scene4.objects[6] = new TwoManifoldMesh_2("y", [-6, 6], [-6, 6], 20, 20, 1, 1, (u: number, v: number) => new Vector4(u, v, 0, l));
        }

        if (40 < t) {
            this.scene4.objects[7] = new OneManifold("x", [-0.1, 0.1], 1, u => new Vector4(u, 1, 0, -0.5+u));
            this.scene4.objects[8] = new OneManifold("x", [-0.1, 0.1], 1, u => new Vector4(u, -1, 0, -0.5+u));
            this.scene4.objects[9] = new OneManifold("x", [-6, 6], 1, u => new Vector4(u, -1, 0, -0.5));
        }
    }

    prepareFrame(): void {
        let t = this.getTime();

        this.prepareScene(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 55) {
            this.animation_ended = true;
        }
    }
}

export class FuncPlot_plane extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 1),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3
        );
        let camQueue = new CameraQueue(12, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0

        const func = (u: number, v: number): Vector4 => {
            let z = complex(u, v);
            let y = exp(z) as Complex;
            return new Vector4(u, v, 0, 0);
        }

        const scale = 0.5;
        let subdiv;
        let div;
        if (frameRate > 30) {
            subdiv = 2; // use 4
            div = 40;
        } else {
            subdiv = 1; // use 2
            div = 40;
        }
        let axis_length = 5
        this.scene4.objects.push(
            new TwoManifoldMesh_2("x", [-axis_length, axis_length], [-axis_length, axis_length], div, div, subdiv, subdiv, func),
            new Object4("x"),
        )

    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 1},
            {t: 10, x: Math.PI * 3.1},
            {t: 20, x: Math.PI * 3.1},
            {t: 25, x: Math.PI * 3.49},
            {t: 30, x: Math.PI * 3.49},
            {t: 40, x: Math.PI * 5.1},
            {t: 50, x: Math.PI * 5.1},
            {t: 60, x: Math.PI * 7.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: 0},
            {t: INFTY, x: 0},
        ], easeInOutCubic);

        this.setCam3PosAngles(5, theta, phi);
    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 4, 10).normalize(),
                new Vector4(1, 0, 4, 10).normalize(),
                new Vector4(1, 0, 0, 0.01).normalize(),
                new Vector4(1, 0, 0, 0.01).normalize(),
                new Vector4(4, 0, 4, 4).normalize(),
                new Vector4(4, 0, 4, 4).normalize(),
            ], [
                0,
                10,
                20,
                40,
                50,
                INFTY
            ],
            t
        )

        this.cam4.pos.copy(cam4_pos.multiplyScalar(20));
        this.cam4.lookAt(new Vector4(0, 0, 0, 0));

        console.log(t, this.cam4.pos, this.cam4.orientation);
    }


    prepareScene(t: number): void {
        if (27 < t) {
            let l = pwl(t, [
                {t: 27, x: 0},
                {t: 30, x: 2 * Math.PI},
                {t: INFTY, x: 2 * Math.PI}
            ], easeInOutCubic);
            this.scene4.objects[1] = new OneManifold("x", [0, l], 40, u => new Vector4(0, 0, Math.cos(u), Math.sin(u)));
        }
    }

    prepareFrame(): void {
        let t = this.getTime();

        this.prepareScene(t);
        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 62) {
            this.animation_ended = true;
        }
    }
}