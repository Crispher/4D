import {
    Vector3,
    Vector4,
    Scene
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

type Material = LineMaterial;

function getLineMaterial(color: number, width: number = 0.002, dashed: boolean = false) {
    return new LineMaterial({
        color: color,
        linewidth: width,
        dashed: dashed
    })
}

class Object4 {
    name: string;
    readonly G0: Vector4[];
    readonly G1: Int32Array[];
    readonly G2: Int32Array[];
    readonly G3: Int32Array[];
    material: Material = new LineMaterial({color: 0xffffff, linewidth:0.001});

    constructor(name: string, G0:Vector4[]=[], G1:Int32Array[]=[], G2:Int32Array[]=[], G3:Int32Array[]=[]) {
        this.name = name;
        this.G0 = G0;
        this.G1 = G1;
        this.G2 = G2;
        this.G3 = G3;
    }

    withMaterial(m: Material) {
        this.material = m;
        return this;
    }

    addNewLine(a: Vector4, b: Vector4) {
        this.G1.push(new Int32Array([this.G0.length, this.G0.length + 1]));
        this.G0.push(a, b);
    }
}


class Camera4 {
    readonly pos: Vector4;
    readonly f: number;
    readonly orientation: Vector4[];
    private center: Vector4;

    constructor(pos: Vector4, orientation: Vector4[], focalLength: number) {
        this.pos = pos;
        this.f = focalLength;
        this.orientation = orientation;
        this.center = add(this.pos, multiplyScalar(this.orientation[0], this.f));
    }

    project(p: Vector4): Vector3 {
        const relPos = sub(p, this.pos);
        const d = relPos.dot(this.orientation[0]);
        const focalPlanePos = add(this.pos, multiplyScalar(relPos, this.f/d));
        const focalPlaneRelPos = sub(focalPlanePos, this.center);
        return new Vector3(
            focalPlaneRelPos.dot(this.orientation[1]),
            focalPlaneRelPos.dot(this.orientation[2]),
            focalPlaneRelPos.dot(this.orientation[3])
        )
    }

    move(i: number, ds: number) {
        this.pos.add(multiplyScalar(this.orientation[i], ds));
        this.center.add(multiplyScalar(this.orientation[i], ds));
    }

    tilt(i: number, ds: number) {
        if (i === 0) {
            return;
        }
        this.orientation[0].addScaledVector(this.orientation[i], ds);
        this.orientation[0].normalize();
        removeComponent(this.orientation[i], this.orientation[0]);
        this.orientation[i].normalize();
        this.center = add(this.pos, multiplyScalar(this.orientation[0], this.f));
    }

    keyboardEventHandler(event: KeyboardEvent) {
        const keyCode = event.which;
        const keyMap = getKeyMap(keyCode);
        if (keyMap === undefined) {
            return;
        }

        if (event.ctrlKey) {
            const s = 0.01;
            const speed = keyMap.status === MotionStatus.POSITIVE ? s: -s;
            this.tilt(keyMap.axis, speed);
        } else {
            const s = 0.02;
            const speed = keyMap.status === MotionStatus.POSITIVE ? s: -s;
            this.move(keyMap.axis, speed);
        }
    }
}


interface VectorImageComponent3 {
    vertices: Vector3[];
    edges: Int32Array[];
    material: Material;
}


class Scene4 {
    objects: Object4[];
    camera: Camera4;

    constructor(objects: Object4[], camera: Camera4) {
        this.objects = objects;
        this.camera = camera;
    }

    render(): VectorImageComponent3[] {
        let vectorImage:VectorImageComponent3[] = [];
        for (const obj of this.objects) {
            let V = obj.G0.map(p => this.camera.project(p));
            vectorImage.push({
                vertices: V,
                edges: obj.G1,
                material: obj.material
            });
        }
        return vectorImage;
    }
}

function renderVectorImage3(components: VectorImageComponent3[]): Scene {
    const scene = new Scene();
    for (const component of components) {
        for (const edge of component.edges) {
            const p = [component.vertices[edge[0]], component.vertices[edge[1]]];
            const geometry = new LineGeometry();
            const positions = []
            positions.push(p[0].x, p[0].y, p[0].z, p[1].x, p[1].y, p[1].z)
            geometry.setPositions(positions);
            const line = new Line2(geometry, component.material);
            line.computeLineDistances();
            line.scale.set(1, 1, 1);
            scene.add(line);
        }
    }
    return scene;
}


enum MotionStatus {
    STILL = 0,
    NEGATIVE,
    POSITIVE
};


function getKeyMap(keyCode: number) {
    switch(keyCode) {
        case 49: // 1
            return { axis: 1, status: MotionStatus.NEGATIVE};
        case 52: // 4
            return { axis: 1, status: MotionStatus.POSITIVE}
        case 50: // 2
            return { axis: 3, status: MotionStatus.NEGATIVE};
        case 53: // 5
            return { axis: 3, status: MotionStatus.POSITIVE};
        case 51: // 3
            return { axis: 2, status: MotionStatus.NEGATIVE};
        case 54: // 6
            return { axis: 2, status: MotionStatus.POSITIVE}
    }
    return undefined;
}

class InteractiveImage3Frame {
    size: number;

    translationMotionStatus: MotionStatus[];
    rotationMotionStatus: MotionStatus[];

    constructor(size: number) {
        this.size = size;
        this.translationMotionStatus = new Array(4);
        this.translationMotionStatus.fill(MotionStatus.STILL);
        this.rotationMotionStatus = new Array(4);
        this.rotationMotionStatus.fill(MotionStatus.STILL);
    }



    keyboardEventHandler(eventType: string, event: KeyboardEvent) {
        const keyCode = event.which;
        const keyMap = getKeyMap(keyCode);
        if (keyMap === undefined) {
            return;
        }

        if (eventType === 'keydown') {
            if (event.ctrlKey) {
                this.rotationMotionStatus[keyMap.axis] = keyMap.status;
            } else {
                this.translationMotionStatus[keyMap.axis] = keyMap.status;
            }
        }

        if (eventType === 'keyup') {
            this.translationMotionStatus[keyMap.axis] = MotionStatus.STILL;
            this.rotationMotionStatus[keyMap.axis] = MotionStatus.STILL;
        }
    }

    getMaterial(axis: number, sign: number) {
        if (this.translationMotionStatus[0] === MotionStatus.POSITIVE) {
            return getLineMaterial(0x4040ff);
        } else if (this.translationMotionStatus[0] === MotionStatus.NEGATIVE) {
            return getLineMaterial(0xff0000);
        }

        const colors = [0xffff00, 0x00ffff, 0xff8f00];
        const bold = 0.008;
        if (this.translationMotionStatus[axis] === MotionStatus.POSITIVE && sign > 0) {
            return getLineMaterial(colors[axis-1], bold);
        } else if (this.translationMotionStatus[axis] === MotionStatus.NEGATIVE && sign < 0) {
            return getLineMaterial(colors[axis-1], bold);
        }

        if (this.rotationMotionStatus[axis] !== MotionStatus.STILL) {
            if ((this.rotationMotionStatus[axis] === MotionStatus.POSITIVE) === (sign > 0)) {
                return getLineMaterial(0x4040ff, bold);
            } else {
                return getLineMaterial(0xff0000, bold);
            }
        }

        return getLineMaterial(colors[axis-1]);
    }

    renderToScene3(scene: Scene) {
        let s = 0.98 * this.size;

        for (let x of [-this.size, this.size]) {
            const positions = [
                x, -s, -s,
                x, -s, s,
                x, s, s,
                x, s, -s,
                x, -s, -s
            ]
            const material = this.getMaterial(1, x);
            const geometry = new LineGeometry();
            geometry.setPositions(positions);
            const line = new Line2(geometry, material);
            line.computeLineDistances();
            line.scale.set(1, 1, 1);
            scene.add(line);
        }

        for (let y of [-this.size, this.size]) {
            const positions = [
                -s, y, -s,
                -s, y, s,
                s, y, s,
                s, y, -s,
                -s, y, -s
            ]
            const material = this.getMaterial(2, y);
            const geometry = new LineGeometry();
            geometry.setPositions(positions);
            const line = new Line2(geometry, material);
            line.computeLineDistances();
            line.scale.set(1, 1, 1);
            scene.add(line);
        }

        for (let z of [-this.size, this.size]) {
            const positions = [
                -s, -s, z,
                -s, s, z,
                s, s, z,
                s, -s, z,
                -s, -s, z,
            ]
            const material = this.getMaterial(3, z);
            const geometry = new LineGeometry();
            geometry.setPositions(positions);
            const line = new Line2(geometry, material);
            line.computeLineDistances();
            line.scale.set(1, 1, 1);
            scene.add(line);
        }
    }
}


export {
    Object4,
    Camera4,
    Scene4,
    VectorImageComponent3,
    renderVectorImage3,
    InteractiveImage3Frame
}