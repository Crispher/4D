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
        this.visible = visible;
        this.occluded = occluded;
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
}

class Object4 {
    name: string;
    hidden: boolean = false;
    public G0_projected: Vector3[]; // projected vertices
    readonly G0: Vector4[];
    readonly G1: Edge[];
    readonly G2: Int32Array[];
    readonly G3: Facet[];

    materialSet: MaterialSet;

    constructor(name: string, G0:Vector4[]=[], G1:Edge[]=[], G2:Int32Array[]=[], G3:Facet[]=[]) {
        this.name = name;
        this.G0 = G0;
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
        this.G0.push(a, b);
    }

    getVerticesPos(...v: number[]) {
        return v.map(i => this.G0[i]);
    }

    scale(s: number) {
        for (let v of this.G0) {
            v.multiplyScalar(s);
        }
        return this;
    }

    computeOcclusion(viewPoint: Vector4, a: Vector4, b: Vector4) {
        const ret: Float32Array[] = [];
        for (const f of this.G3) {
            const occludedRange = computeOcclusion(
                this.getVerticesPos(f.vertices[0], f.vertices[1], f.vertices[2], f.vertices[3]),
                [a, b],
                viewPoint
            )
            if (occludedRange) {
                ret.push(new Float32Array(occludedRange));
            }
        }
        return ret;
    }

    translate(dx: Vector4) {
        for (let v of this.G0) {
            v.add(dx);
        }
    }

    generateFacetBorder(facet: number, negativeMargin: number, materialSet?: MaterialSet) {
        let f_vertices = this.G3[facet].vertices.map(v => this.G0[v]);
        let f_center = average(f_vertices);
        let f_new = f_vertices.map(
            v => v.clone().lerp(f_center, negativeMargin)
        );

        let s = this.G0.length;
        let e = this.G1.length;
        this.G0.push(...f_new);
        this.G1.push(
            {v_start: s+0, v_end: s+1, materialSet}, //0
            {v_start: s+0, v_end: s+2, materialSet},
            {v_start: s+0, v_end: s+3, materialSet},
            {v_start: s+1, v_end: s+4, materialSet},
            {v_start: s+1, v_end: s+5, materialSet},
            {v_start: s+2, v_end: s+4, materialSet},
            {v_start: s+2, v_end: s+6, materialSet},
            {v_start: s+3, v_end: s+5, materialSet},
            {v_start: s+3, v_end: s+6, materialSet},
            {v_start: s+4, v_end: s+7, materialSet},
            {v_start: s+5, v_end: s+7, materialSet},
            {v_start: s+6, v_end: s+7, materialSet},
        );
        this.G3.push({
            vertices: [s, s+1, s+2, s+3, s+4, s+5, s+6, s+7]
        });
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
    }

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
        // this.clearOcclusion();
        // this.computeOcclusion(current_cam);
        for (const obj of this.objects) {
            if (obj.hidden) {
                continue;
            }

            if (obj.G0_projected.length != obj.G0.length) {
                console.log('allocate G0_projected');

                obj.G0_projected = obj.G0.map(p => current_cam.project(p));
            } else {
                for (let i = 0; i < obj.G0.length; i++) {
                    obj.G0_projected[i] = current_cam.project(obj.G0[i], obj.G0_projected[i]);
                }
            }

            let V = obj.G0_projected;


            for (const e of obj.G1) {
                let localMaterial;

                if (obj.materialSet.isDirectional && !e.materialSet) {
                    e.materialSet = obj.materialSet.clone();
                }

                if (e.materialSet) {
                    localMaterial = e.materialSet;
                } else {
                    localMaterial = obj.materialSet;
                }

                if (e.occludedIntervals) {

                    e.occludedIntervals.push(1);
                    let occluded = false;
                    let start = 0;
                    let s = obj.G0[e.v_start];
                    let t = obj.G0[e.v_end];

                    for (let switchPoint of e.occludedIntervals) {
                        if (switchPoint - start > 1e-5) {
                            let vi = s.clone();
                            vi.lerp(t, start);
                            let vj = s.clone();
                            vj.lerp(t, switchPoint);


                            let vi3 = current_cam.project(vi);
                            let vj3 = current_cam.project(vj);
                            if (occluded) {
                                scene3.addLine(vi3, vj3, localMaterial.occluded);
                            } else {
                                // scene3.addLine(vi3, vj3, localMaterial.visible);
                                if (localMaterial.isDirectional) {
                                    let mat = this.getDirectionalLighting(obj.G0[e.v_start], obj.G0[e.v_end], localMaterial!);

                                    scene3.addLine(V[e.v_start], V[e.v_end], mat);
                                } else {
                                    scene3.addLine(V[e.v_start], V[e.v_end], localMaterial.visible);
                                }
                            }
                        }

                        start = switchPoint;
                        occluded = !occluded;
                    }
                } else {
                    if (localMaterial.isDirectional) {
                        let mat = this.getDirectionalLighting(obj.G0[e.v_start], obj.G0[e.v_end], localMaterial!);

                        scene3.addLine(V[e.v_start], V[e.v_end], mat);
                    } else {
                        scene3.addLine(V[e.v_start], V[e.v_end], localMaterial.visible);
                    }
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
                    let V = obj.G0.map(p => current_cam.project(p));
                    for (const e of obj.G1) {
                        scene3.addLine(V[e.v_start], V[e.v_end], obj.materialSet.visible);
                    }
                }
            }
        }
    }


    computeOcclusion(cam: Camera4) {
        for (const obj of this.objects) {
            if (obj.hidden) {
                continue;
            }
            for (let e of obj.G1) {
                e.occludedIntervalSet = [];
                for (const occluder of this.objects) {
                    if (occluder.hidden) {
                        continue;
                    }
                    let I = occluder.computeOcclusion(cam.pos, obj.G0[e.v_start], obj.G0[e.v_end])
                    e.occludedIntervalSet.push(...I);
                }
            }
        }

        for (const obj of this.objects) {
            if (obj.hidden) {
                continue;
            }
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

    getDirectionalLighting(a: Vector4, b: Vector4, localMaterial: MaterialSet) : LineMaterial {
        let n = b.clone().sub(a).normalize();
        let real = n.x * n.x + n.w * n.w;
        let input = n.x * n.x + n.y * n.y;

        let dist = Math.max(a.lengthSq(), b.lengthSq());
        let alpha = 1;
        const cap = 20;
        if (dist > cap && localMaterial.visible!.linewidth < 2 * 0.001) {
            alpha = Math.pow(cap / dist, 2);
        }

        let color = this.hsvToRgb(0.6 * input, 0.8, 1);

        let dash = 0.005;
        // let gap = (1-real) * dash * 3;
        let gap = 0;

        let linewidth = localMaterial.visible!.linewidth;

        if (localMaterial.local) {
            localMaterial.local.linewidth = linewidth;
            localMaterial.local.color = new Color(color);
            localMaterial.local.dashSize = dash;
            localMaterial.local.gapSize = gap;
            localMaterial.local.opacity = alpha;
            return localMaterial.local;
        } else {
            localMaterial.local = new LineMaterial({color: color, linewidth: linewidth, dashed: true, dashSize: dash, gapSize: gap, transparent: true, opacity: alpha});
        }
        return localMaterial.local;
    }
}


class Scene3WithMemoryTracker extends Scene {
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

    addLine(a: Vector3, b: Vector3, material: Material | undefined) {
        if (material) {
            const geo = new LineGeometry();
            geo.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
            this.addLineGeometry(geo, material);
        }
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

function computeOcclusion(f: Vector4[], lineSegment: Vector4[], viewpoint: Vector4) {
    // A * [f0, f1, f2, v] = [e0, e1, e2, e3];
    // A * [v1, v2]
    // console.log("Before normalization", f, lineSegment, viewpoint)

    let offset = f[0]

    let f0 = sub(f[1], offset);
    let f1 = sub(f[2], offset);
    let f2 = sub(f[3], offset);
    let view = sub(viewpoint, offset);


    const A_data: number[] = [];
    A_data.push(...f0.toArray());
    A_data.push(...f1.toArray());
    A_data.push(...f2.toArray());
    A_data.push(...view.toArray());

    const A = new Matrix4().fromArray(A_data);

    if (Math.abs(A.determinant()) < 1e-7 ) {
        return null;
    }
    A.invert();

    // console.log("A=", A, new Vector4(0, 0, 0, 1).applyMatrix4(A));
    return computeOcclusionOnNormalizedGeometry([
        sub(lineSegment[0], offset).applyMatrix4(A),
        sub(lineSegment[1], offset).applyMatrix4(A)
    ])
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


function getLineIntersection(a0: Vector4, a1: Vector4, b0: Vector4, b1: Vector4) {
    // returns lambda s.t. b0.lerp(b1, lambda) is along the line a0-a1
    // a0*x + a1*(1-x) = b0*y + b1*(1-y)
    // (a0-a1)*x + (b1-b0)y = b1 - a1
    // [(a0-a1), (b1-b0)] @ [x; y] = [b1-a1]
    // A@x = b;
    // A'A@x = A'b;
    const a0_a1 = sub(a0, a1);
    const b1_b0 = sub(b1, b0);
    const b1_a1 = sub(b1, a1);

    const G = [
        a0_a1.lengthSq(), a0_a1.dot(b1_b0), b1_b0.lengthSq()
    ]
    const b = [
        a0_a1.dot(b1_a1), b1_b0.dot(b1_a1)
    ]
    // Cramer's rule, lambda = 1-y
    const lambda = 1 - (G[0]*b[1] - b[0]*G[1]) / (G[0]*G[2] - G[1]*G[1]);
    if (isNaN(lambda)) {
        console.log("NaN", a0, a1, b0, b1);
    }

    return lambda;
}

function computeOcclusionOnNormalizedGeometry(lineSegment: Vector4[]) {
    // assume the facet is the unit cube determined by e1, e2, e3;
    // and the view point is at e4 (0, 0, 0, 1);

    const a = lineSegment[0];
    const b = lineSegment[1];
    if (a.w >= 0 && b.w >= 0) {
        return null;
    }

    // console.log("normalized input", lineSegment)
    const project = (p: Vector4) => {
        if (Math.abs(1-p.w) < 1e-7) {
            return p.clone()
        }
        const s=1 / (1-p.w);
        return new Vector4(p.x*s, p.y*s, p.z*s, 0);
    }

    // get the {x} s.t. lerp(a, b, x) is in [0, 1]
    const getRange = (a: number, b: number) => {
        // console.log('R', a, b);

        if (a < 0) {
            if (b <= 0) {
                return null;
            } else if (b <= 1) { // 0 < b
                return [a/(a-b), 1];
            } else { // 1 < b
                return [a/(a-b), (1-a)/(b-a)];
            }
        } else if (a <= 1) { // 0 <= a
            if (b < 0) {
                return [0, a/(a-b)];
            } else if (b <= 1) {
                return [0, 1];
            } else {
                return [0, (1-a)/(b-a)];
            }
        } else { // 1 < a
            if (b < 0) {
                return [(a-1)/(a-b), a/(a-b)];
            } else if (b < 1) {
                return [(a-1)/(a-b), 1];
            } else {
                return null;
            }
        }
    }

    const getCommonRange = (a: Vector4, b: Vector4) => {
        const rx = getRange(a.x, b.x);
        const ry = getRange(a.y, b.y);
        const rz = getRange(a.z, b.z);
        if (ry) {
            if (isNaN(ry[1])) {
                console.log("Ry NaN", a, b);
            }
        }

        if (rx === null || ry === null || rz === null) {
            return null;
        } else {
            let ret = [
                Math.max(rx[0], ry[0], rz[0]),
                Math.min(rx[1], ry[1], rz[1])
            ];
            if (ret[0] >= ret[1]) {
                return null;
            }
            return ret;
        }
    }

    if (a.w < 0 && b.w >= 0) {
        const min = 0;
        const max = a.w / (a.w - b.w);
        const pa = project(a);
        const pb = project(b);
        if (sub(pa, pb).length() < 1e-5) {
            return null;
        }
        const range = getCommonRange(pa, pb);
        if (range === null) {
            return null;
        }
        const pr0 = pa.clone().lerp(pb, range[0]);
        const pr1 = pa.clone().lerp(pb, range[1]);

        const e_w = new Vector4(0, 0, 0, 1);
        const lambda0 = getLineIntersection(e_w, pr0, a, b);
        const lambda1 = getLineIntersection(e_w, pr1, a, b);
        //  console.log("B", lineSegment, lambda0, lambda1, min, max);
        let ret = [
            Math.max(min, lambda0),
            Math.min(max, lambda1)
        ];
        if (isNaN(ret[0]) || isNaN(ret[1])) {
            console.log("B", lineSegment, lambda0, lambda1, min, max, range);
        }
        return ret
    }
    if (a.w >= 0 && b.w < 0) {


        const min = a.w / (a.w - b.w);
        const max = 1;
        const pa = project(a);
        const pb = project(b);
        if (sub(pa, pb).length() < 1e-5) {
            return null;
        }
        const range = getCommonRange(pa, pb);

        if (range === null) {
            return null;
        }
        const pr0 = pa.clone().lerp(pb, range[0]);
        const pr1 = pa.clone().lerp(pb, range[1]);
        // console.log("C", min, max, pa, pb, range);
        const e_w = new Vector4(0, 0, 0, 1);
        const lambda0 = getLineIntersection(e_w, pr0, a, b);
        const lambda1 = getLineIntersection(e_w, pr1, a, b);
        let ret = [
            Math.max(min, lambda0),
            Math.min(max, lambda1)
        ];
        if (isNaN(ret[0]) || isNaN(ret[1])) {
            console.log("C", lineSegment, lambda0, lambda1, min, max, range);
        }
        return ret
    }
    if (a.w < 0 && b.w < 0) {
        const min = 0;
        const max = 1;
        const pa = project(a);
        const pb = project(b);
        if (sub(pa, pb).length() < 1e-5) {
            return null;
        }
        const range = getCommonRange(pa, pb);

        if (range === null) {
            return null;
        }
        const pr0 = pa.clone().lerp(pb, range[0]);
        const pr1 = pa.clone().lerp(pb, range[1]);

        const e_w = new Vector4(0, 0, 0, 1);
        const lambda0 = getLineIntersection(e_w, pr0, a, b);
        const lambda1 = getLineIntersection(e_w, pr1, a, b);
        //  console.log("D", lambda0, lambda1, pa, pb, range);
        let ret = [
            Math.max(min, lambda0),
            Math.min(max, lambda1)
        ];
        if (isNaN(ret[0]) || isNaN(ret[1])) {
            console.log("D", lineSegment, lambda0, lambda1, min, max);
        }
        return ret
    }
}

export {
    Object4,
    Camera4,
    CameraQueue,
    MaterialSet,
    Scene4,
    Scene3WithMemoryTracker,
    getLineMaterial,
    getLineIntersection,
    computeOcclusionOnNormalizedGeometry,
    computeOcclusion,
    getVisibleIntervals
}