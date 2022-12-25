import {
    Vector3,
    Vector4,
    Scene,
    Matrix4,
    Plane,
    Color
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';


function add(a: Vector4, b: Vector4): Vector4 {
    return new Vector4().copy(a).add(b);
}

function sub(a: Vector4, b: Vector4): Vector4 {
    return new Vector4().copy(a).sub(b);
}

function multiplyScalar(a: Vector4, b: number): Vector4 {
    return new Vector4().copy(a).multiplyScalar(b);
}

function removeComponent(a: Vector4, b: Vector4) {
    // remove the b component from a
    a.addScaledVector(b, -a.dot(b));
}

function average(vec_array: Vector4[]) {
    let ret = new Vector4(0, 0, 0, 0);
    for (let vec of vec_array) {
        ret.add(vec);
    }
    ret.multiplyScalar(1.0/vec_array.length);
    return ret;
}

type Material = LineMaterial;

function getLineMaterial(color: number, width: number = 1, dashedWhenOccluded: boolean = false) {
    let size = 0.5;
    let d = 1 + 1e-4;
    const clippingPlanes = [
        new Plane(new Vector3(0, 0, d), size),
        new Plane(new Vector3(0, 0, -d), size),
        new Plane(new Vector3(0, d, 0), size),
        new Plane(new Vector3(0, -d, 0), size),
        new Plane(new Vector3(d, 0, 0), size),
        new Plane(new Vector3(-d, 0, 0), size),
    ];
    return new MaterialSet(
        new LineMaterial({color: color, linewidth: width*0.001, clippingPlanes: clippingPlanes}),
        dashedWhenOccluded ? new LineMaterial({color: color, linewidth: width/2*0.001, dashed: true, dashScale: 50, clippingPlanes: clippingPlanes}) : undefined
    );
}

function getFrameMaterial(color: number, linewidth: number) {
    return new MaterialSet(new LineMaterial({color: color, linewidth: linewidth*0.001}));
}

class MaterialSet {
    visible: Material | undefined;
    occluded: Material | undefined;
    local: Material | undefined;
    isDirectional: boolean = false;

    constructor(visible?: Material, occluded?: Material, isDirectional?: boolean) {
        this.visible = visible || new LineMaterial({color: 0xffffff, linewidth: 0.001, vertexColors: true});
        this.occluded = occluded || new LineMaterial({color: 0xffffff, linewidth: 0.001, dashed: true, dashScale: 50});
        this.isDirectional = isDirectional || false;
    }

    clone() {
        return new MaterialSet(
            this.visible? this.visible.clone() : undefined,
            this.occluded? this.occluded.clone() : undefined,
            this.isDirectional
        );
    }

    withOpacity(opacity: number) {
        if (this.visible) {
            this.visible.transparent = true;
            this.visible.opacity = opacity;
        }
        if (this.occluded) {
            this.occluded.transparent = true;
            this.occluded.opacity = opacity;
        }
        return this;
    }

    withLinewidth(width: number) {
        if (this.visible) {
            this.visible.linewidth = width * 0.001;
        }
        if (this.occluded) {
            this.occluded.linewidth = width * 0.001;
        }
        return this;
    }
}

interface Edge {
    v_start: number,
    v_end: number,
    occludedIntervalSet?: Float32Array[],
    occludedIntervals?: number[],
    materialSet?: MaterialSet
}


interface Facet {
    vertices: number[] // of length 8
    cached_inv_A?: Matrix4
}


interface Vertex {
    pos: Vector4,
    normal?: Vector4,
    cached_rpos?: Vector4,
    cached_color?: number[]
    angle?: number
}


class Object4 {
    name: string;
    public G0_projected: Vector3[]; // projected vertices
    readonly G0: Vertex[];
    readonly G1: Edge[];
    readonly G2: Int32Array[];
    readonly G3: Facet[];

    materialSet: MaterialSet;

    constructor(name: string, G0:(Vector4|Vertex)[]=[], G1:Edge[]=[], G2:Int32Array[]=[], G3:Facet[]=[]) {
        this.name = name;
        if (G0.length > 0 && G0[0] instanceof Vector4) {
            this.G0 = (G0 as Vector4[]).map(v => {return {pos: v}});
        } else {
            this.G0 = G0 as Vertex[];
        }
        this.G1 = G1;
        this.G2 = G2;
        this.G3 = G3;
        this.G0_projected = []
        this.materialSet = getLineMaterial(0xffffff, 1, false);
    }

    withMaterial(m: MaterialSet) {
        this.materialSet = m;
        return this;
    }

    withAlpha(a: number) {
        if (this.materialSet.visible) {
            this.materialSet.visible.transparent = true;
            this.materialSet.visible.opacity = a;
        }
        return this;
    }

    addNewLine(a: Vector4, b: Vector4, materialSet?: MaterialSet) {
        this.G1.push({
            v_start: this.G0.length,
            v_end: this.G0.length + 1,
            materialSet: materialSet
        });
        this.G0.push({pos:a}, {pos:b});
    }

    getVerticesPos(...v: number[]) {
        return v.map(i => this.G0[i]);
    }

    scale(s: number) {
        for (let v of this.G0) {
            v.pos.multiplyScalar(s);
        }
        return this;
    }

    computeOcclusion(a: Vector4, b: Vector4) {
        const ret: Float32Array[] = [];
        for (const f of this.G3) {
            if (f.cached_inv_A === undefined) continue;
            const occludedRange = computeOcclusionWithPrecomputedInvA(
                f.cached_inv_A,
                [a, b]
            )
            if (occludedRange) {
                if (occludedRange.length == 2) {
                    ret.push(new Float32Array(occludedRange));
                }
            }
        }
        return ret;
    }

    translate(dx: Vector4) {
        for (let v of this.G0) {
            v.pos.add(dx);
        }
    }
}


class Camera4 {
    readonly pos: Vector4;
    readonly f: number;
    readonly orientation: Vector4[];
    private center: Vector4;
    private windowSize: number;

    private updateCenter() {
        this.center = add(this.pos, multiplyScalar(this.orientation[0], this.f));
    }

    constructor(pos: Vector4, orientation: Vector4[], focalLength: number) {
        this.pos = pos;
        this.f = focalLength;
        this.orientation = orientation;
        this.center = add(this.pos, multiplyScalar(this.orientation[0], this.f));
        this.windowSize = 1;
    }

    project(p: Vector4, projected?: Vector3): Vector3 {
        const relPos = sub(p, this.pos);
        const d = relPos.dot(this.orientation[0]);
        const focalPlanePos = add(this.pos, multiplyScalar(relPos, this.f/d));
        const focalPlaneRelPos = sub(focalPlanePos, this.center);
        if (projected) {
            projected.set(
                focalPlaneRelPos.dot(this.orientation[1]),
                focalPlaneRelPos.dot(this.orientation[2]),
                focalPlaneRelPos.dot(this.orientation[3])
            ).multiplyScalar(this.windowSize);
            return projected;
        } else {
            return new Vector3(
                focalPlaneRelPos.dot(this.orientation[1]),
                focalPlaneRelPos.dot(this.orientation[2]),
                focalPlaneRelPos.dot(this.orientation[3])
            ).multiplyScalar(this.windowSize);
        }
    }

    move(i: number, ds: number) {
        this.pos.add(multiplyScalar(this.orientation[i], ds));
        this.updateCenter();
    }

    tilt(i: number, ds: number) {
        if (i === 0) {
            return;
        }
        this.orientation[0].addScaledVector(this.orientation[i], ds);
        this.orientation[0].normalize();
        removeComponent(this.orientation[i], this.orientation[0]);
        this.orientation[i].normalize();
        this.updateCenter();
    }

    lookAt(p: Vector4) {
        this.orientation[0] = sub(p, this.pos).normalize();
        removeComponent(this.orientation[1], this.orientation[0]);
        this.orientation[1].normalize();
        removeComponent(this.orientation[2], this.orientation[0]);
        removeComponent(this.orientation[2], this.orientation[1]);
        this.orientation[2].normalize();
        removeComponent(this.orientation[3], this.orientation[0]);
        removeComponent(this.orientation[3], this.orientation[1]);
        removeComponent(this.orientation[3], this.orientation[2]);
        this.orientation[3].normalize();
        this.updateCenter();
    }

    lookAt_w_as_up(p: Vector4, ref?: Vector4) {
        this.orientation[0] = sub(p, this.pos).normalize();

        this.orientation[2].set(0, 0, 0, 1);
        removeComponent(this.orientation[2], this.orientation[0]);
        this.orientation[2].normalize();

        if (ref) {
            this.orientation[1].copy(ref);
        } else {
            let theta = this.orientation[1].dot(new Vector4(0, 1, 0, 0));
            if (theta < 0) {
                this.orientation[1].set(0, -1, 0, 0);
            } else {
                this.orientation[1].set(0, 1, 0, 0);
            }
        }
        removeComponent(this.orientation[1], this.orientation[0]);
        removeComponent(this.orientation[1], this.orientation[2]);
        this.orientation[1].normalize();

        removeComponent(this.orientation[3], this.orientation[0]);
        removeComponent(this.orientation[3], this.orientation[1]);
        removeComponent(this.orientation[3], this.orientation[2]);
        this.orientation[3].normalize();
        this.updateCenter();
    }

    keyboardEventHandler(event: KeyboardEvent, accelerate: number = 1, tilt_accelerate: number = 1) {
        const keyCode = event.which;
        const keyMap = getKeyMap(keyCode);
        console.log(keyMap, keyCode)
        if (keyMap === undefined) {
            return;
        }

        if (event.ctrlKey) {
            const s = 0.01 * tilt_accelerate;
            const speed = keyMap.status === MotionStatus.POSITIVE ? s: -s;
            this.tilt(keyMap.axis, speed);
        } else {
            const s = 0.02 * accelerate;
            const speed = keyMap.status === MotionStatus.POSITIVE ? s: -s;
            this.move(keyMap.axis, speed);
        }
    }

    clone() {
        return new Camera4(
            this.pos.clone(),
            this.orientation.map(a => a.clone()),
            this.f
        );
    }

    copy(cam: Camera4) {
        this.pos.copy(cam.pos);
        for (let i = 0; i < 4; i++) {
            this.orientation[i].copy(cam.orientation[i]);
        }
        this.center = add(this.pos, multiplyScalar(this.orientation[0], this.f));
    }

    getFrame(size: number, opacity: number, eps: number, linewidth: number[]): Object4[] {
        size = size / this.windowSize;
        const dA = multiplyScalar(this.orientation[1], size*(1-eps));
        const dB = multiplyScalar(this.orientation[2], size*(1-eps));
        const dC = multiplyScalar(this.orientation[3], size*(1-eps));

        const DA = multiplyScalar(this.orientation[1], size);
        const DB = multiplyScalar(this.orientation[2], size);
        const DC = multiplyScalar(this.orientation[3], size);
        return [
            new Object4(
                'cam-frame-0', [
                    this.center.clone().add(DA).add(dB).add(dC),
                    this.center.clone().add(DA).sub(dB).add(dC),
                    this.center.clone().add(DA).sub(dB).sub(dC),
                    this.center.clone().add(DA).add(dB).sub(dC),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0x0046ad, linewidth[0])).withAlpha(opacity),
            new Object4(
                'cam-frame-1', [
                    this.center.clone().sub(DA).add(dB).add(dC),
                    this.center.clone().sub(DA).sub(dB).add(dC),
                    this.center.clone().sub(DA).sub(dB).sub(dC),
                    this.center.clone().sub(DA).add(dB).sub(dC),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0x009b48, linewidth[1])).withAlpha(opacity),
            new Object4(
                'cam-frame-0', [
                    this.center.clone().add(DB).add(dA).add(dC),
                    this.center.clone().add(DB).sub(dA).add(dC),
                    this.center.clone().add(DB).sub(dA).sub(dC),
                    this.center.clone().add(DB).add(dA).sub(dC),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0xffffff, linewidth[2])).withAlpha(opacity),
            new Object4(
                'cam-frame-1', [
                    this.center.clone().sub(DB).add(dA).add(dC),
                    this.center.clone().sub(DB).sub(dA).add(dC),
                    this.center.clone().sub(DB).sub(dA).sub(dC),
                    this.center.clone().sub(DB).add(dA).sub(dC),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0xffd500, linewidth[3])).withAlpha(opacity),
            new Object4(
                'cam-frame-0', [
                    this.center.clone().add(DC).add(dA).add(dB),
                    this.center.clone().add(DC).sub(dA).add(dB),
                    this.center.clone().add(DC).sub(dA).sub(dB),
                    this.center.clone().add(DC).add(dA).sub(dB),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0xb71234, linewidth[4])).withAlpha(opacity),
            new Object4(
                'cam-frame-1', [
                    this.center.clone().sub(DC).add(dA).add(dB),
                    this.center.clone().sub(DC).sub(dA).add(dB),
                    this.center.clone().sub(DC).sub(dA).sub(dB),
                    this.center.clone().sub(DC).add(dA).sub(dB),
                ],
                [0,1,2,3].map(i=>({v_start: i, v_end: (i+1)%4}))
            ).withMaterial(getFrameMaterial(0xff5800, linewidth[5])).withAlpha(opacity)
        ]
    }
}


class CameraQueue {
    queue: (Camera4|null)[] = [];
    current: number = 0;
    sampleRate: number;
    totalFrames: number;
    frameGap: number = 0.05;
    frameLinewidth: number[] = [3, 3, 3, 3, 3, 3];

    opacityBeta = 1;

    constructor(totalFrames: number, sampleRate: number) {
        this.totalFrames = totalFrames;
        for (let i = 0; i < totalFrames; i++) {
            this.queue.push(null);
        }
        this.sampleRate = sampleRate;
    }

    isActiveFrame(i: number) {
        try {
            this.getPastCamera(i);
            return i == 0 || (this.current-i) % this.sampleRate == 0
        } catch {
            return false;
        }
    }

    getPastCamera(i: number) : Camera4 {
        let index = (this.current+this.totalFrames-i) % this.totalFrames;
        let cam = this.queue[index];
        if (cam) {
            return cam;
        } else {
            throw 'camera undefined';
        }
    }

    getOpacity(i : number)  {
        return 1 / (1 + i * this.opacityBeta);
    }

    pushCamera(cam: Camera4) {
        let prev = this.current;
        this.current = (prev + 1) % this.totalFrames;
        this.queue[this.current] = cam.clone();
    }
}

class Scene4 {
    objects: Object4[];

    constructor(objects: Object4[]) {
        this.objects = objects;
        this.directionalShading_v = this.directionalShading.map(
            (colors) => colors.map(this.numberToRgb)
        );
        console.log(this.directionalShading_v);

        // compute cached color for each object
        for (const obj of this.objects) {
            // for each vertex
            for (let i = 0; i < obj.G0.length; i++) {
                let v = obj.G0[i];
                v.cached_color = this.getDirectionalLighting(v.normal);
            }
        }
    }


    directionalShading: number[][] = [
        [0xff2020, 0xffff00],
        [0x7B68EE, 0x00ffff],
        [0x80FF00, 0x3399ff],
        [0xffffff, 0xff7f00]
    ];

    directionalShading_v: Vector3[][];

    find(name: string) {
        for (let obj of this.objects) {
            if (obj.name === name) {
                return obj;
            }
        }
        throw 'obj not found';
    }

    render(scene3: Scene3WithMemoryTracker, camera: CameraQueue) {
        let current_cam = camera.getPastCamera(0);

        // render objects
        this.clearOcclusion();
        this.computeOcclusion(current_cam);
        for (const obj of this.objects) {

            if (obj.G0_projected.length != obj.G0.length) {
                obj.G0_projected = obj.G0.map(p => current_cam.project(p.pos));
            } else {
                for (let i = 0; i < obj.G0.length; i++) {
                    obj.G0_projected[i] = current_cam.project(obj.G0[i].pos, obj.G0_projected[i]);
                }
            }

            let V = obj.G0_projected;


            for (const e of obj.G1) {
                let color_1 = obj.G0[e.v_start].cached_color;
                let color_2 = obj.G0[e.v_end].cached_color;

                if (e.occludedIntervals) {

                    e.occludedIntervals.push(1);
                    let occluded = false;
                    let start = 0;
                    let s = obj.G0[e.v_start];
                    let t = obj.G0[e.v_end];

                    for (let switchPoint of e.occludedIntervals) {
                        if (switchPoint - start > 1e-5) {
                            let vi = s.pos.clone();
                            vi.lerp(t.pos, start);
                            let vj = s.pos.clone();
                            vj.lerp(t.pos, switchPoint);

                            let vi3 = current_cam.project(vi);
                            let vj3 = current_cam.project(vj);
                            if (occluded) {
                                // scene3.addLine(vi3, vj3, [...color_1!, ...color_2!]);
                            } else {

                                scene3.addLine(vi3, vj3, [...color_1!, ...color_2!], e.materialSet!.visible!);
                            }
                        }

                        start = switchPoint;
                        occluded = !occluded;
                    }
                } else {

                    scene3.addLine(V[e.v_start], V[e.v_end], [...color_1!, ...color_2!], e.materialSet!.visible!);
                }
            }
        }

        // render camera


        if (true) {
            for (let i = 0; i < camera.totalFrames; i++) {
                if (!camera.isActiveFrame(i)) {
                    continue;
                }
                let cam_i = camera.getPastCamera(i);
                if (!cam_i) {
                    continue;
                }
                let opacity = camera.getOpacity(i)
                for (const obj of cam_i.getFrame(0.5, opacity, camera.frameGap, camera.frameLinewidth)) {
                    let V = obj.G0.map(p => current_cam.project(p.pos));
                    for (const e of obj.G1) {
                        scene3.addFrame(V[e.v_start], V[e.v_end], obj.materialSet.visible!);
                    }
                }
            }
        }
    }


    computeOcclusion(cam: Camera4) {

        // precompute rpos
        for (const obj of this.objects) {
            for (let v of obj.G0) {
                v.cached_rpos = v.pos.clone().sub(cam.pos);
                v.angle = v.cached_rpos!.dot(v.normal!) / v.cached_rpos!.length();
            }
        }

        // compute edge thickness
        const max_thickness = 3;
        const min_thickness = 0.1;
        for (const obj of this.objects) {
            for (let e of obj.G1) {
                let t = Math.abs((obj.G0[e.v_start].angle! + obj.G0[e.v_end].angle!)/2);
                t = t * t * t
                if (e.materialSet) {
                    e.materialSet!.withLinewidth(t * max_thickness + min_thickness);
                } else {
                    e.materialSet = new MaterialSet();
                    e.materialSet!.withLinewidth(t * max_thickness + min_thickness);
                }
            }
        }

        // precompute inv_A
        for (const obj of this.objects) {
            for (let f of obj.G3) {
                if (f.cached_inv_A) {
                    computeInvA(f.vertices.map(i => obj.G0[i].cached_rpos!), f.cached_inv_A);
                    console.log(f.cached_inv_A);
                } else {
                    f.cached_inv_A = computeInvA(f.vertices.map(i => obj.G0[i].cached_rpos!), f.cached_inv_A);
                }
            }
        }

        for (const obj of this.objects) {
            for (let e of obj.G1) {
                e.occludedIntervalSet = [];
                for (const occluder of this.objects) {
                    let I = occluder.computeOcclusion(obj.G0[e.v_start].cached_rpos!, obj.G0[e.v_end].cached_rpos!)
                    e.occludedIntervalSet.push(...I);
                }
            }
        }

        for (const obj of this.objects) {
            for (const e of obj.G1) {
                if (e.occludedIntervalSet) {
                    e.occludedIntervals = getVisibleIntervals(e.occludedIntervalSet);
                }
            }
        }
    }

    clearOcclusion() {
        for (const obj of this.objects) {
            for (const e of obj.G1) {
                e.occludedIntervals = undefined;
            }
        }
    }

    rgbToNumber(r: number, g: number, b: number) {
        let base = 0.2
        r = Math.floor(Math.abs(r) * 255 * (1-base)) + 255 * base;
        g = Math.floor(Math.abs(g) * 255 * (1-base)) + 255 * base;
        b = Math.floor(Math.abs(b) * 255 * (1-base)) + 255 * base;
        return (r << 16) + (g << 8) + b;
    }

    numberToRgb(n: number): Vector3 {
        let r = (n >> 16) & 0xff;
        let g = (n >> 8) & 0xff;
        let b = n & 0xff;
        return new Vector3(r / 255, g / 255, b / 255);
    }

    hsvToRgb(h: number, s: number, v: number) {
        let r, g, b, i, f, p, q, t;
        r = g = b = 0;

        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return this.rgbToNumber(r, g, b);
    }

    getDirectionalLighting(normal?: Vector4) : number[] {
        if (normal) {
            let color = new Vector3(0, 0, 0);
            for (let i = 0; i < 4; i++) {
                if (normal.getComponent(i) > 0) {
                    color.addScaledVector(this.directionalShading_v[i][0], normal.getComponent(i));
                } else {
                    color.addScaledVector(this.directionalShading_v[i][1], -normal.getComponent(i));
                }
            }
            return [color.x, color.y, color.z];
        } else {
            return [1,1,1];
        }
    }
}


class Scene3WithMemoryTracker extends Scene {

    defaultLineMaterial = new LineMaterial({
        color: 0xffffff,
        linewidth:0.003, // in world units with size attenuation, pixels otherwise
        vertexColors: true,

        dashed: false,
        alphaToCoverage: true,
    })

    geometries: LineGeometry[] = [];
    lines: Line2[] = [];
    constructor() {
        super();
    }

    addLineGeometry(geo: LineGeometry, material: Material | undefined) {
        this.geometries.push(geo);
        const line = new Line2(geo, material);
        this.lines.push(line);
        line.computeLineDistances();
        line.scale.set(1, 1, 1);
        this.add(line);
    }

    addLine(a: Vector3, b: Vector3, color: number[], mat: LineMaterial) {
        const geo = new LineGeometry();
        geo.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
        geo.setColors(color);
        this.addLineGeometry(geo, mat);
    }

    addFrame(a: Vector3, b: Vector3, mat: LineMaterial) {
        const geo = new LineGeometry();
        geo.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
        this.addLineGeometry(geo, mat);
    }

    clearScene() {
        this.clear();
        for (let geo of this.geometries) {
            geo.dispose();
        }
        this.geometries = [];
        for (let line of this.lines) {
            line.clear();
        }
        this.lines = [];
    }
}

enum MotionStatus {
    STILL = 0,
    NEGATIVE,
    POSITIVE
};


function getKeyMap(keyCode: number) {
    switch(keyCode) {
        case 49: // 1
        case 97: // numpad 1
            return { axis: 1, status: MotionStatus.NEGATIVE};
        case 52: // 4
        case 100: // numpad 4
            return { axis: 1, status: MotionStatus.POSITIVE}
        case 50: // 2
        case 98: // numpad 2
            return { axis: 3, status: MotionStatus.NEGATIVE};
        case 53: // 5
        case 101: // numpad 5
            return { axis: 3, status: MotionStatus.POSITIVE};
        case 51: // 3
        case 99: // numpad 3
            return { axis: 2, status: MotionStatus.NEGATIVE};
        case 54: // 6
        case 102: // numpad 6
            return { axis: 2, status: MotionStatus.POSITIVE}
    }
    return undefined;
}


function computeInvA(f: Vector4[], A: Matrix4 | undefined) {
    if (A === undefined) {
        A = new Matrix4();
    }

    A.set(
        f[0].x, f[1].x, f[2].x, f[3].x,
        f[0].y, f[1].y, f[2].y, f[3].y,
        f[0].z, f[1].z, f[2].z, f[3].z,
        f[0].w, f[1].w, f[2].w, f[3].w
    );

    if (Math.abs(A.determinant()) < 1e-6) {
        A = undefined;
    } else {
        console.log(A.determinant());

        A.invert();
    }
    return A;
}


function computeOcclusionWithPrecomputedInvA(A: Matrix4, lineSegment: Vector4[]) {

    let l_r = [
        lineSegment[0].clone(),
        lineSegment[1].clone()
    ];

    let eps = 1e-7;

    let b_1 = l_r[1].sub(l_r[0]).applyMatrix4(A);
    let b_0 = l_r[0].applyMatrix4(A).addScalar(-eps);

    // alpha = b_0 + beta * b_1
    let min = 0, max = 1;

    // b_0 + beta * b1 >= eps
    if (b_1.x > 0) {
        min = Math.max(min, -b_0.x / b_1.x);
    } else if (b_1.x < 0) {
        max = Math.min(max, -b_0.x / b_1.x);
    } else if (b_0.x < 0) {
        return [];
    }

    if (b_1.y > 0) {
        min = Math.max(min, -b_0.y / b_1.y);
    } else if (b_1.y < 0) {
        max = Math.min(max, -b_0.y / b_1.y);
    } else if (b_0.y < 0) {
        return [];
    }

    if (b_1.z > 0) {
        min = Math.max(min, -b_0.z / b_1.z);
    } else if (b_1.z < 0) {
        max = Math.min(max, -b_0.z / b_1.z);
    } else if (b_0.z < 0) {
        return [];
    }

    if (b_1.w > 0) {
        min = Math.max(min, -b_0.w / b_1.w);
    } else if (b_1.w < 0) {
        max = Math.min(max, -b_0.w / b_1.w);
    } else if (b_0.w < 0) {
        return [];
    }

    let  s_0 = b_0.x + b_0.y + b_0.z + b_0.w;
    let  s_1 = b_1.x + b_1.y + b_1.z + b_1.w;

    // s_0 + beta * s_1 >= 1 + eps

    if (s_1 > 0) {
        min = Math.max(min, (1 - s_0) / s_1);
    } else if (s_1 < 0) {
        max = Math.min(max, (1 - s_0) / s_1);
    } else if (s_0 < 1) {
        return [];
    }

    if (min >= max) {
        return [];
    }
    return [min, max];
}

function computeOcclusion(f: Vector4[], lineSegment: Vector4[], viewpoint: Vector4) {
    let f_r = [
        f[0].clone().sub(viewpoint),
        f[1].clone().sub(viewpoint),
        f[2].clone().sub(viewpoint),
        f[3].clone().sub(viewpoint)];

    let l_r = [
        lineSegment[0].clone().sub(viewpoint),
        lineSegment[1].clone().sub(viewpoint)
    ];

    let A = new Matrix4();
    A.set(
        f_r[0].x, f_r[1].x, f_r[2].x, f_r[3].x,
        f_r[0].y, f_r[1].y, f_r[2].y, f_r[3].y,
        f_r[0].z, f_r[1].z, f_r[2].z, f_r[3].z,
        f_r[0].w, f_r[1].w, f_r[2].w, f_r[3].w
    );

    if (Math.abs(A.determinant()) < 1e-6) {
        return [];
    }

    A.invert();

    let eps = 1e-4;

    let b_1 = l_r[1].sub(l_r[0]).applyMatrix4(A);
    let b_0 = l_r[0].applyMatrix4(A).addScalar(-eps);

    // alpha = b_0 + beta * b_1

    let min = 0, max = 1;

    // b_0 + beta * b1 >= eps
    if (b_1.x > 0) {
        min = Math.max(min, -b_0.x / b_1.x);
    } else if (b_1.x < 0) {
        max = Math.min(max, -b_0.x / b_1.x);
    } else if (b_0.x < 0) {
        return [];
    }

    if (b_1.y > 0) {
        min = Math.max(min, -b_0.y / b_1.y);
    } else if (b_1.y < 0) {
        max = Math.min(max, -b_0.y / b_1.y);
    } else if (b_0.y < 0) {
        return [];
    }

    if (b_1.z > 0) {
        min = Math.max(min, -b_0.z / b_1.z);
    } else if (b_1.z < 0) {
        max = Math.min(max, -b_0.z / b_1.z);
    } else if (b_0.z < 0) {
        return [];
    }

    if (b_1.w > 0) {
        min = Math.max(min, -b_0.w / b_1.w);
    } else if (b_1.w < 0) {
        max = Math.min(max, -b_0.w / b_1.w);
    } else if (b_0.w < 0) {
        return [];
    }

    let  s_0 = b_0.x + b_0.y + b_0.z + b_0.w;
    let  s_1 = b_1.x + b_1.y + b_1.z + b_1.w;

    // s_0 + beta * s_1 >= 1 + eps

    if (s_1 > 0) {
        min = Math.max(min, (1 - s_0) / s_1);
    } else if (s_1 < 0) {
        max = Math.min(max, (1 - s_0) / s_1);
    } else if (s_0 < 1) {
        return [];
    }

    if (min >= max) {
        return [];
    }
    return [min, max];
}

function getVisibleIntervals(I: Float32Array[]): number[] | undefined {
    const eps = 1e-4;
    I.sort((a, b) => a[0] - b[0]);
    const J = [];
    if (I.length > 0) {
        let i = 0;
        let j = i + 1;
        let min = I[i][0];
        let max = I[i][1];
        while (true) {
            if (j < I.length ) if (max + eps > I[j][0]) {
                max = Math.max(max, I[j][1]);
                j++;
                continue;
            }

            J.push(min, max);
            if (j >= I.length) {
                break;
            }
            i = j;
            j = i + 1;
            min = I[i][0];
            max = I[i][1];

        }
    }
    return J;
}


export {
    Object4,
    Camera4,
    CameraQueue,
    MaterialSet,
    Scene4,
    Scene3WithMemoryTracker,
    getLineMaterial,
    // computeOcclusion,
    getVisibleIntervals
}