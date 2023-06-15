import { BaseAnimation, easeInOutSine, INFTY, pwl, easeInOutCubic } from "../animations";
import {Camera4, Object4, CameraQueue, Scene4} from "../math/core";
import { Vector4 } from "three";
import {  FiveCell, getConicalCylinder, getCubinder, getDuocylinder, getSphericalCone, getSphericalCylinder, getTesseractCells, SimplexCell, SixteenCell, ThreeManifoldMesh, TwentyFourCell } from "../math/primitives";
import { cos, sin } from "mathjs";

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


export class EightCellAnimation extends BaseAnimation {
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

        // this.scene4 = new Scene4(getTesseractCells());
        this.scene4 = new Scene4([new SixteenCell("sixteen-cell")])

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0},
            {t: 10, x: Math.PI * 2.1},
            {t: 20, x: Math.PI * 2.15},
            {t: 22, x: Math.PI * 2.15},
            {t: 32, x: Math.PI * 4.1},
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 10, x: Math.PI * 0.06},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 0, 0, 0).normalize(),
                new Vector4(1, 1, 1, 1).normalize(),
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                10,
                20,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(7));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 35) {
            this.animation_ended = true;
        }
    }
}

export class FiveCellAnimation extends BaseAnimation {
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

        this.scene4 = new Scene4([new FiveCell("five-cell")])

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0}, //3d rotate start
            {t: 10, x: Math.PI * 2.1}, // 3d rotate end
            {t: 20, x: Math.PI * 2.15}, // 4d rotate end
            {t: 22, x: Math.PI * 2.15}, // new angle 3d rotate start
            {t: 32, x: Math.PI * 4.1}, // new angle 3d rotate end
            {t: 42, x: Math.PI * 4.15}, // new angle 4d rotate end
            {t: 44, x: Math.PI * 4.15}, // new angle 3d rotate start
            {t: 54, x: Math.PI * 6.1}, // new angle 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 10, x: Math.PI * 0.06},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 1, -1, 0).normalize(), // start
                new Vector4(1, 1, -1, 0).normalize(), // 4d rotate start
                new Vector4(1, 1, 1, 0).normalize(), // 4d rotate end
                new Vector4(1, 1, 1, 0).normalize(), // new angle 3d rotate end
                new Vector4(1e-3, 1e-3, 1e-3, 1).normalize(), // 4d rotate end
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                10,
                20,
                32,
                42,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(15));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 55) {
            this.animation_ended = true;
        }
    }
}

export class SixteenCellAnimation extends BaseAnimation {
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

        this.scene4 = new Scene4([new SixteenCell("16-cell")])

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0}, //3d rotate start
            {t: 10, x: Math.PI * 2.1}, // 3d rotate end
            {t: 20, x: Math.PI * 2.15}, // 4d rotate end
            {t: 22, x: Math.PI * 2.15}, // new angle 3d rotate start
            {t: 32, x: Math.PI * 4.1}, // new angle 3d rotate end
            {t: 42, x: Math.PI * 4.15}, // new angle 4d rotate end
            {t: 44, x: Math.PI * 4.15}, // new angle 3d rotate start
            {t: 54, x: Math.PI * 6.1}, // new angle 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 10, x: Math.PI * 0.06},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 0, 0, 0).normalize(), // start
                new Vector4(1, 0, 0, 0).normalize(), // 4d rotate start
                new Vector4(1, 1, 1, 0).normalize(), // 4d rotate end
                new Vector4(1, 1, 1, 0).normalize(), // new angle 3d rotate end
                new Vector4(1e-3, 1e-3, 1e-3, 1).normalize(), // 4d rotate end
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                10,
                20,
                32,
                42,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(8));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 55) {
            this.animation_ended = true;
        }
    }
}

export class TwentyFourCellAnimation extends BaseAnimation {
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

        this.scene4 = new Scene4([new TwentyFourCell("five-cell")])

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0}, //3d rotate start
            {t: 10, x: Math.PI * 2.1}, // 3d rotate end
            {t: 20, x: Math.PI * 2.15}, // 4d rotate end
            {t: 22, x: Math.PI * 2.15}, // new angle 3d rotate start
            {t: 32, x: Math.PI * 4.1}, // new angle 3d rotate end
            {t: 42, x: Math.PI * 4.15}, // new angle 4d rotate end
            {t: 44, x: Math.PI * 4.15}, // new angle 3d rotate start
            {t: 54, x: Math.PI * 6.1}, // new angle 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutSine);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 10, x: Math.PI * 0.06},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let cam4_pos = rotation_interp_keyframe(
            [
                new Vector4(1, 1, -1, 0).normalize(), // start
                new Vector4(1, 1, -1, 0).normalize(), // 4d rotate start
                new Vector4(1, 1, 1, 0).normalize(), // 4d rotate end
                new Vector4(1, 1, 1, 0).normalize(), // new angle 3d rotate end
                new Vector4(1e-3, 1e-3, 1e-3, 1).normalize(), // 4d rotate end
                new Vector4(1, 0, 0, 0).normalize()
            ], [
                0,
                10,
                20,
                32,
                42,
                INFTY
            ],
            t
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(9));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 55) {
            this.animation_ended = true;
        }
    }
}


export class RotatingPolyCellAnimation extends BaseAnimation {
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

        // this.scene4 = new Scene4([new FiveCell("five-cell").scale(0.8).translate(new Vector4(0, 0, 0, -0.2))])
        this.scene4 = new Scene4(getTesseractCells())

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.2}, //3d rotate start
            {t: 45, x: Math.PI * 0.4}, // 3d rotate end
            {t: INFTY, x: 0}
        ]);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 10, x: Math.PI * 0.06},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let k = 0.2
        let cam4_pos = new Vector4(
            Math.cos(k * t),
            0,
            Math.sin(k * t),
            0,
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {
        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 55) {
            this.animation_ended = true;
        }
    }
}

export class SphereSweepingAnimation extends BaseAnimation {
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
            {t: 0, x: Math.PI * 0.1}, //3d rotate start
            {t: 20, x: Math.PI * 0.2}, // 3d rotate end
            {t: 30, x: Math.PI * 2.0}, // 3d rotate end
            {t: 45, x: Math.PI * 2.0}, // 3d rotate end
            {t: 55, x: Math.PI * 4.1}, // 3d rotate end
            {t: 70, x: Math.PI * 4.1}, // 3d rotate end
            {t: 75, x: Math.PI * 4.2}, // 3d rotate end
            {t: INFTY, x: 0}
        ]);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 20, x: Math.PI * 0.06},
            {t: 30, x: 0},
            {t: 35, x: 0},
            {t: 45, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0.5 * Math.PI - eps},
            {t: 5, x: 0.5 * Math.PI - eps},
            {t: 10, x: 0.15*Math.PI},
            {t: 35, x: 0.15*Math.PI},
            {t: 45, x: 0},
            {t: 58, x: 0},
            {t: 68, x: 0.5 * Math.PI - eps},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let cam4_pos = new Vector4(
            Math.cos(angle),
            0,
            0,
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        let cylinderHeight = pwl(t, [
            {t: 0, x: 0},
            {t: 10, x: 0},
            {t: 20, x: 1.5},
            {t: INFTY, x: 1.5}
        ], easeInOutCubic);
        let sphericalCylindder = getSphericalCylinder(cylinderHeight);
        for (let sc of sphericalCylindder) {
            sc.translate(new Vector4(0, 0, 0, -0.75));
        }

        if (0 <= t && t < 1) {
            this.scene4 = new Scene4(
                [sphericalCylindder[1]]
            )
        } else if (t > 9 && t < 21) {
            this.scene4 = new Scene4(
                [sphericalCylindder[1], sphericalCylindder[2]]
            )
        }

        if (t > 80) {
            this.animation_ended = true;
        }
    }
}

export class CylinderSweepingAnimation extends BaseAnimation {
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
            {t: 0, x: Math.PI * 0.1}, //3d rotate start
            {t: 20, x: Math.PI * 0.2}, // 3d rotate end
            {t: 30, x: Math.PI * 1.6}, // 3d rotate end
            {t: 45, x: Math.PI * 1.6}, // 3d rotate end
            {t: 65, x: Math.PI * 2.6}, // 3d rotate end
            {t: 70, x: Math.PI * 2.7}, // 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 20, x: Math.PI * 0.06},
            {t: 30, x: 0},
            {t: 35, x: 0},
            {t: 45, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0.5 * Math.PI - eps},
            {t: 5, x: 0.5 * Math.PI - eps},
            {t: 10, x: 0.15*Math.PI},
            {t: 35, x: 0.15*Math.PI},
            {t: 45, x: 0.15 * Math.PI},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0}, //3d rotate start
            {t: 35, x: Math.PI * 0}, // 3d rotate end
            {t: 45, x: Math.PI * 0.2}, // 3d rotate end
            {t: INFTY, x: Math.PI * 0.2}, // 3d rotate end
        ], easeInOutCubic);

        let cam4_pos = new Vector4(
            Math.cos(angle) * Math.cos(theta),
            0,
            Math.cos(angle) * Math.sin(theta),
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(12));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        let cylinderHeight = pwl(t, [
            {t: 0, x: 0},
            {t: 10, x: 0},
            {t: 20, x: 1.5},
            {t: INFTY, x: 1.5}
        ], easeInOutCubic);
        let cubinder = getCubinder(cylinderHeight);
        for (let sc of cubinder) {
            sc.translate(new Vector4(0, 0, 0, -0.75));
        }

        if (0 <= t && t < 1) {
            this.scene4 = new Scene4(
                [cubinder[3]]
            )
        } else if (t > 9 && t < 21) {
            this.scene4 = new Scene4(
                [cubinder[4], cubinder[1], cubinder[2], cubinder[3]]
            )
        }

        if (t > 80) {
            this.animation_ended = true;
        }
    }
}

export class ConeSweepingAnimation extends BaseAnimation {
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
            {t: 0, x: Math.PI * 0.6}, //3d rotate start
            {t: 20, x: Math.PI * 0.6}, // 3d rotate end
            {t: 50, x: Math.PI * 4.6}, // 3d rotate end
            {t: 45, x: Math.PI * 2.0}, // 3d rotate end
            {t: 55, x: Math.PI * 4.1}, // 3d rotate end
            {t: 70, x: Math.PI * 4.1}, // 3d rotate end
            {t: 75, x: Math.PI * 4.2}, // 3d rotate end
            {t: INFTY, x: 0}
        ]);

        let phi = Math.PI * 0.06;

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0.5 * Math.PI - eps},
            {t: 5, x: 0.5 * Math.PI - eps},
            {t: 10, x: 0.15*Math.PI},
            {t: 35, x: 0.15*Math.PI},
            {t: 45, x: 0},
            {t: 58, x: 0},
            {t: 68, x: 0.5 * Math.PI - eps},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        angle = 0.15*Math.PI;

        let theta = -0.7

        let cam4_pos = new Vector4(
            Math.cos(angle) * Math.cos(theta),
            0,
            Math.cos(angle) * Math.sin(theta),
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        let cylinderHeight = pwl(t, [
            {t: 0, x: 0},
            {t: 10, x: 0},
            {t: 20, x: 1.5},
            {t: INFTY, x: 1.5}
        ], easeInOutCubic);
        let cubinder = getConicalCylinder(cylinderHeight);
        for (let sc of cubinder) {
            sc.translate(new Vector4(0, 0, 0, -0.75));
        }

        if (0 <= t && t < 1) {
            this.scene4 = new Scene4(
                [cubinder[3]]
            )
        } else if (t > 9 && t < 21) {
            this.scene4 = new Scene4(
                [cubinder[0], cubinder[1], cubinder[3]]
            )
        }

        if (t > 52) {
            this.animation_ended = true;
        }
    }
}

export class SphericalConeAnimation extends BaseAnimation {
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
            {t: 0, x: Math.PI * 0.1}, //3d rotate start
            {t: 20, x: Math.PI * 0.2}, // 3d rotate end
            {t: 30, x: Math.PI * 2.0}, // 3d rotate end
            {t: 45, x: Math.PI * 2.0}, // 3d rotate end
            {t: 55, x: Math.PI * 4.1}, // 3d rotate end
            {t: 70, x: Math.PI * 4.1}, // 3d rotate end
            {t: 78, x: Math.PI * 4.6}, // 3d rotate end
            {t: INFTY, x: 0}
        ]);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 20, x: Math.PI * 0.06},
            {t: 30, x: 0},
            {t: 35, x: 0},
            {t: 45, x: Math.PI * 0.1},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0.5 * Math.PI - eps},
            {t: 5, x: 0.5 * Math.PI - eps},
            {t: 10, x: 0.15*Math.PI},
            {t: 35, x: 0.15*Math.PI},
            {t: 45, x: 0},
            {t: 58, x: 0},
            {t: 68, x: 0.5 * Math.PI - eps},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let cam4_pos = new Vector4(
            Math.cos(angle),
            0,
            0,
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        let cone_parameter = pwl(t, [
            {t: 0, x: 0},
            {t: 10, x: 0},
            {t: 20, x: 1},
            {t: INFTY, x: 1.5}
        ], easeInOutCubic);
        let cone = getSphericalCone(cone_parameter);
        for (let sc of cone) {
            sc.translate(new Vector4(0, 0, 0, -0.75));
        }

        if (0 <= t && t < 1) {
            this.scene4 = new Scene4(
                [cone[0]]
            )
        } else if (t > 9 && t < 21) {
            if (t > 19) {
                cone[0].isExactNormal = true;
            }
            this.scene4 = new Scene4(
                cone
            )
        }

        if (t > 80) {
            this.animation_ended = true;
        }
    }
}

export class DuocylinderAnimation extends BaseAnimation {
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

        this.scene4 = new Scene4(
            getDuocylinder()
        )

        this.time = 50
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.1}, //3d rotate start
            {t: 10, x: Math.PI * 2.1}, // 3d rotate end
            {t: 24, x: Math.PI * 2.1}, // 3d rotate end
            {t: 39, x: Math.PI * 4.1}, // 3d rotate end
            {t: 50, x: Math.PI * 4.1}, // 3d rotate end
            {t: 80, x: Math.PI * 4.1}, // 3d rotate end
            {t: 100, x: Math.PI * 4.75}, // 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 80, x: Math.PI * 0.06},
            {t: 100, x: Math.PI * 0.5 - 1e-3},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0},
            {t: 12, x: 0},
            {t: 22, x: 0.25 * Math.PI - eps},
            {t: 39, x: 0.25 * Math.PI - eps},
            {t: 49, x: 0},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: 50, x: 0},
            {t: 80, x: 0.5 * Math.PI},
            {t: INFTY, x: 2 * Math.PI}
        ], easeInOutCubic);

        let cam4_pos = new Vector4(
            Math.cos(angle) * Math.cos(theta),
            0,
            Math.cos(angle) * Math.sin(theta),
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 105) {
            this.animation_ended = true;
        }
    }
}


export class HypersphereAnimation_EP6 extends BaseAnimation {
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
            [false, false, false],
            [true, true, false]
        ).scale(1.1);
        surface.minThickness = 0.3;
        surface.thicknessRange=2.7;
        this.scene4 = new Scene4([surface]);

        this.time = 0
    }

    setCam3Pos(t: number) {
        let theta = pwl(t, [
            {t: 0, x: Math.PI * 0.1}, //3d rotate start
            {t: 12, x: Math.PI * 0.6}, // 3d rotate end
            {t: 32, x: Math.PI * 0.6}, // 3d rotate end
            {t: 44, x: Math.PI * 1.1}, // 3d rotate end
            {t: 62, x: Math.PI * 1.1}, // 3d rotate end
            {t: 75, x: Math.PI * 1.5}, // 3d rotate end
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        let phi = pwl(t, [
            {t: 0, x: Math.PI * 0.06},
            {t: 62, x: Math.PI * 0.06},
            {t: 75, x: 0},
            {t: INFTY, x: 0}
        ], easeInOutCubic);

        this.setCam3PosAngles(6, theta, phi);

    }
    setCam4Pos(t: number) {
        let eps = 1e-3;

        let angle = pwl(t, [
            {t: 0, x: 0},
            {t: 45, x: 0},
            {t: 60, x: 0.5 * Math.PI - eps},
            {t: INFTY, x: 0}

        ], easeInOutCubic);

        let theta = pwl(t, [
            {t: 0, x: 0},
            {t: 15, x: 0},
            {t: 30, x: 0.5 * Math.PI},
            {t: INFTY, x: 2 * Math.PI}
        ], easeInOutCubic);

        let cam4_pos = new Vector4(
            Math.cos(angle) * Math.cos(theta),
            0,
            Math.cos(angle) * Math.sin(theta),
            Math.sin(angle)
        )


        this.cam4.pos.copy(cam4_pos.multiplyScalar(10));
        this.cam4.lookAt_w_as_up(new Vector4(0, 0, 0, 0));
    }


    prepareFrame(): void {

        // 0-5: A 3d sphere;
        // 5-10: 3d sphere at an angle;
        // 10-20: sphere sweeping;

        let t = this.time;
        this.setCam3Pos(t)
        this.setCam4Pos(t)


        if (t > 40) {
            this.animation_ended = true;
        }
    }
}
