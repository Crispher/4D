import { BaseAnimation, easeInOutSine, INFTY, pwl, easeInOutCubic } from "../animations";
import {Camera4, Object4, CameraQueue, Scene4} from "../math/core";
import { Vector4 } from "three";
import {  getTesseractCells, ThreeManifoldMesh } from "../math/primitives";
import { Complex, complex, exp, sin, tan, pow, multiply, sinh, cos } from "mathjs";

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

function bend1(x: number, curvature: number) {
    let phi = x * curvature;
    return 1 - (1 - Math.cos(phi)) / curvature;
}

function bend2(x: number, curvature: number) {
    let phi = x * curvature;
    return Math.sin(phi) / curvature;
}

export class CubinderAnimation extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(0, 0, 0, 7),
            [[0, 0, 0, -1], [0, 1, 0, 0], [-1, 0, 0, 0], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3.5
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: 22, x: Math.PI * 0.1},
            {t: 42, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        // this.setCam3PosAngles(6, theta, phi);
        this.setCam3PosAngles(6, 0, 0);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 1, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                45,
                65,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(7));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        console.log(t);

        if (t < 1 || (t > 10 && t < 22)) {
            let curv = pwl(t, [
                {t: 0, x: 1e-4},
                {t: 12, x: 1e-4},
                {t: 20, x: 1},
                {t: INFTY, x: 1},
            ]);
            let surface = new ThreeManifoldMesh(
                'f',
                [-0.5*Math.PI, 0.5*Math.PI],
                [-1,1],
                [-1,1],
                10, 3, 3,
                (u, v, w) => new Vector4(
                    bend1(u, curv),
                    bend2(u, curv),
                    v,
                    w
                ),
                (u:number, v:number, w: number) => new Vector4(
                    cos(u * curv),
                    sin(u * curv),
                    0,
                    0
                ),
                [false, false, false]
            ).scale(0.5);
            surface.thicknessRange=1;
            this.scene4 = new Scene4([surface]);
        }


        this.setCam3Pos(t);
        // this.setCam4Pos(t);

        if (t > 25) {
            this.animation_ended = true;
        }

    }
}

export class SpherinderAnimation extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 0),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3.5
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: 22, x: Math.PI * 0.1},
            {t: 42, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, 0, 0.5 * Math.PI - 1e-4);
        // this.setCam3PosAngles(6, 0, 0);

    }


    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0.5, 0, 0).normalize(),
                new Vector4(1, -0.5, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                45,
                55,
                65,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(7));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        console.log(t);

        if (this.scene4.objects.length == 0 || (t > 10 && t < 22)) {
            let curv = pwl(t, [
                {t: 0, x: 1e-4},
                {t: 12, x: 1e-4},
                {t: 20, x: 1},
                {t: INFTY, x: 1},
            ]);
            let surface = new ThreeManifoldMesh(
                'f',
                [-Math.PI, 1*Math.PI],
                [-0.5*Math.PI, 0.5*Math.PI],
                [-1,1],
                14, 8, 3,
                (u, v, w) => new Vector4(
                    cos(u) * bend1(v, curv),
                    sin(u) * bend1(v, curv),
                    bend2(v, curv),
                    w
                ),
                (u:number, v:number, w: number) => new Vector4(
                    cos(u) * cos(v * curv),
                    sin(u) * cos(v * curv),
                    sin(v * curv),
                    0
                ),
                [false, false, false]
            ).scale(0.5);
            surface.thicknessRange=1;
            this.scene4 = new Scene4([surface]);
        }


        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 70) {
            this.animation_ended = true;
        }

    }
}

export class HypersphereAnimation extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 0),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3.5
        );
        let camQueue = new CameraQueue(24, 1);

        super(cam4, camQueue, frameRate);

        this.time = 40
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: 22, x: Math.PI * 0.1},
            {t: 42, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0},
            {t: 10, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);
        // this.setCam3PosAngles(6, 0.3 * Math.PI, 0);
        // this.setCam3PosAngles(6, 0, 0);

    }


    setCam4Pos(t: number) {
        // let cam4_pos = rotation_interp_keyframe(
        //     [
        //         new Vector4(1, 0, 0, 0).normalize(),
        //         new Vector4(1, 0, 0, 0).normalize(),
        //         new Vector4(1, 0.5, 0, 0).normalize(),
        //         new Vector4(1, -0.5, 0, 0).normalize(),
        //         new Vector4(1, 0, 0, 0).normalize()
        //     ], [
        //         0,
        //         45,
        //         55,
        //         65,
        //         INFTY
        //     ],
        //     t
        // )
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 5, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                45,
                65,
                INFTY
            ],
            t
        )

        let r = pwl(t, [
            {t: 0, x: 7},
            {t: 20, x: 7},
            {t: 22, x: 4},
            {t: INFTY, x: 4}
        ], easeInOutCubic);

        this.cam4.pos.copy(cam4_pos.multiplyScalar(r));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.getTime();

        console.log(t);

        if (this.scene4.objects.length == 0 || (t > 10 && t < 22)) {
            let curv = pwl(t, [
                {t: 0, x: 1e-4},
                {t: 12, x: 1e-4},
                {t: 20, x: 1},
                {t: INFTY, x: 1},
            ]);
            let surface = new ThreeManifoldMesh(
                'f',
                [-Math.PI, 1*Math.PI],
                [-0.5*Math.PI, 0.5*Math.PI],
                [-0.5*Math.PI, 0.5*Math.PI],
                12, 8, 8,
                (u, v, w) => new Vector4(
                    cos(u) * cos(v) * bend1(w, curv),
                    sin(u) * cos(v) * bend1(w, curv),
                    sin(v) * bend1(w, curv),
                    bend2(w, curv)
                ),
                (u:number, v:number, w: number) => new Vector4(
                    cos(u) * cos(v) * cos(w * curv),
                    sin(u) * cos(v) * cos(w * curv),
                    sin(v) * cos(w * curv),
                    sin(w * curv)
                ),
                [false, false, false]
            ).scale(0.5);
            surface.minThickness = 0.3;
            surface.thicknessRange=2.7;

            // let surface = getTesseractCells();
            // surface.forEach((e: ThreeManifoldMesh) => {
            //     e.scale(0.5);
            //     e.minThickness = 1.7;
            //     e.thicknessRange = 2.7;
            // });
            this.scene4 = new Scene4([surface]);
        }


        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 70) {
            this.animation_ended = true;
        }

    }
}

export class HypersphereAnimation2 extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 0),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3.5
        );
        let camQueue = new CameraQueue(24, 1);



        super(cam4, camQueue, frameRate);

        // let curv = 1;
        // let surface = new ThreeManifoldMesh(
        //     'f',
        //     [-Math.PI, 1*Math.PI],
        //     [-0.5*Math.PI, 0.5*Math.PI],
        //     [-0.5*Math.PI, 0.5*Math.PI],
        //     12, 8, 8,
        //     (u, v, w) => new Vector4(
        //         cos(u) * cos(v) * cos(w),
        //         sin(u) * cos(v) * cos(w),
        //         sin(v) * cos(w),
        //         sin(w)
        //     ),
        //     (u:number, v:number, w: number) => new Vector4(
        //         cos(u) * cos(v) * cos(w),
        //         sin(u) * cos(v) * cos(w),
        //         sin(v) * cos(w),
        //         sin(w)
        //     ),
        //     [false, false, false]
        // ).scale(0.5);
        // surface.minThickness = 0.3;
        // surface.thicknessRange=2.7;
        // this.scene4 = new Scene4([surface]);

        let surface = getTesseractCells();
            surface.forEach((e: ThreeManifoldMesh) => {
                e.scale(0.5);
                e.minThickness = 1.3;
                e.thicknessRange = 2.7;
            });
            this.scene4 = new Scene4([...surface]);

        this.time = 5;
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 5, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, -0.3 * Math.PI, 0);
        // this.setCam3PosAngles(6, theta, phi);
        // this.setCam3PosAngles(6, 0, 0.5 * Math.PI - 1e-4);
        //this.setCam3PosAngles(6, 0, 0);

    }


    setCam4Pos(t: number) {

        let theta = pwl(t, [
            {t: 5, x: Math.PI * 0},
            {t: 30, x: Math.PI * 2}
        ], easeInOutCubic);


        let c = cos(theta);
        let s = sin(theta);
        let cam4_pos = new Vector4(
            c,
            0,
            0,
            s
        )

        let r = 4;

        // this.cam4 = new Camera4(
        //     cam4_pos.multiplyScalar(r),
        //     [[-c, -s, 0, 0], [-s, c, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        //         return new Vector4().fromArray(e);
        //     }
        //     ),
        //     3.5
        // );


        this.cam4 = new Camera4(
            cam4_pos.multiplyScalar(r),
            [[-c, 0, 0, -s], [0, 1, 0, 0], [-s, 0, 0, c], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }
            ),
            3.5
        );
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 32) {
            this.animation_ended = true;
        }
    }
}

export class HypersphereAnimation3 extends BaseAnimation {
    constructor(frameRate: number = 30) {
        let cam4 = new Camera4(
            new Vector4(-10, 0, 0, 0),
            [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }),
            3.5
        );
        let camQueue = new CameraQueue(24, 1);



        super(cam4, camQueue, frameRate);

        let curv = 1;
        let surface = new ThreeManifoldMesh(
            'f',
            [-Math.PI, 1*Math.PI],
            [-0.5*Math.PI, 0.5*Math.PI],
            [-0.5*Math.PI, 0.5*Math.PI],
            12, 8, 8,
            (u, v, w) => new Vector4(
                cos(u) * cos(v) * cos(w),
                sin(u) * cos(v) * cos(w),
                sin(v) * cos(w),
                sin(w)
            ),
            (u:number, v:number, w: number) => new Vector4(
                cos(u) * cos(v) * cos(w),
                sin(u) * cos(v) * cos(w),
                sin(v) * cos(w),
                sin(w)
            ),
            [false, false, false]
        ).scale(0.5);
        surface.minThickness = 0.3;
        surface.thicknessRange=2.7;
        this.scene4 = new Scene4([surface]);

        // let surface = getTesseractCells();
        //     surface.forEach((e: ThreeManifoldMesh) => {
        //         e.scale(0.5);
        //         e.minThickness = 1.3;
        //         e.thicknessRange = 2.7;
        //     });
        //     this.scene4 = new Scene4([...surface]);

        this.time = 0;
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 15, x: Math.PI * 0},
            {t: 25, x: Math.PI * 2.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.1},
            {t: 25, x: Math.PI * 0.1},
            {t: 30, x: Math.PI * .4},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        // this.setCam3PosAngles(6, -0.3 * Math.PI, 0);
        this.setCam3PosAngles(6, theta, phi);
        // this.setCam3PosAngles(6, 0, 0.5 * Math.PI - 1e-4);
        //this.setCam3PosAngles(6, 0, 0);

    }


    setCam4Pos(t: number) {

        // let theta = Math.min(t, 12) / 12 * 2 * Math.PI;

        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 12, x: Math.PI },
            {t: 30, x: Math.PI },
            {t: 40, x: Math.PI * 2}

        ], easeInOutSine);

        let c = cos(theta);
        let s = sin(theta);
        let cam4_pos = new Vector4(
            c,
            0,
            0,
            s
        )

        let r = 4;

        // this.cam4 = new Camera4(
        //     cam4_pos.multiplyScalar(r),
        //     [[-c, -s, 0, 0], [-s, c, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        //         return new Vector4().fromArray(e);
        //     }
        //     ),
        //     3.5
        // );


        this.cam4 = new Camera4(
            cam4_pos.multiplyScalar(r),
            [[-c, 0, 0, -s], [0, 1, 0, 0], [-s, 0, 0, c], [0, 0, 1, 0]].map((e: number[]) => {
                return new Vector4().fromArray(e);
            }
            ),
            3
        );
    }


    prepareFrame(): void {
        let t = this.getTime();
        this.setCam3Pos(t);
        this.setCam4Pos(t);

        if (t > 42) {
            this.animation_ended = true;
        }
    }
}
