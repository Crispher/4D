import {
    BufferGeometry,
    Vector3,
    Vector4,
    Line,
    LineBasicMaterial,
    LineDashedMaterial,
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
    public center: Vector4;

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


export {
    Object4,
    Camera4,
    Scene4,
    VectorImageComponent3,
    renderVectorImage3
}