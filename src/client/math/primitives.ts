import { Vector4 } from "three";
import { Object4, getLineMaterial, MaterialSet } from "./core";

class Grid4 extends Object4 {
    public dims: number[];
    beta: number = 1;
    constructor(name: string, dims: number[]) {
        super(name);
        this.dims = dims;
    }

    getX(material: MaterialSet): Object4 {
        let ret = new Object4(`${this.name}-X-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[1]); i <= Math.floor(dims[1]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(-dims[0], i, j, k),
                        new Vector4(dims[0], i, j, k),
                        this.adjustedMaterial(material, i, j, k)
                    )
                }
            }
        }
        return ret;
    }

    getY(material: MaterialSet): Object4 {
        let ret = new Object4(`${this.name}-Y-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(i, -dims[1], j, k),
                        new Vector4(i, dims[1], j, k),
                        this.adjustedMaterial(material, i, j, k)
                    )
                }
            }
        }
        return ret;
    }

    getZ(material: MaterialSet): Object4 {
        let ret = new Object4(`${this.name}-Z-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(i, j, -dims[2], k),
                        new Vector4(i, j, dims[2], k),
                        this.adjustedMaterial(material, i, j, k)
                    )
                }
            }
        }
        return ret;
    }

    getW(material: MaterialSet): Object4 {
        let ret = new Object4(`${this.name}-W-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[2]); k <= Math.floor(dims[2]); k++) {
                    ret.addNewLine(
                        new Vector4(i, j, k, -dims[3]),
                        new Vector4(i, j, k, dims[3]),
                        this.adjustedMaterial(material, i, j, k)
                    )
                }
            }
        }
        return ret;
    }

    private adjustedMaterial(mat: MaterialSet, i: number, j: number, k: number) {
        let origin = (i==0) && (j==0) && (k==0);
        let opacity = 1/(1+this.beta*Math.max(Math.abs(i), Math.abs(j), Math.abs(k)));
        return origin ? mat.clone().withOpacity(opacity).withLinewidth(2)
                : mat.clone().withOpacity(opacity)
    }
}


class LineObject extends Object4 {
    constructor(name: string, s: Vector4, t: Vector4) {
        super(name);
        this.G0.push({pos: s}, {pos: t});
        this.G1.push({v_start: 0, v_end: 1});
    }
}

class SimplexCell extends Object4 {
    constructor(name: string, bases: Vector4[]) {
        super(name);
        this.G0.push(...bases.map(v => ({pos: v})));
        this.G1.push(
            {v_start: 0, v_end: 1}, //0
            {v_start: 0, v_end: 2},
            {v_start: 0, v_end: 3},
            {v_start: 1, v_end: 2},
            {v_start: 1, v_end: 3},
            {v_start: 2, v_end: 3},
        )
        this.G3.push({
            vertices: [0, 1, 2, 3],
        });
    }
}

export class FiveCell extends Object4 {
    constructor(name: string) {
        super(name);

        const b = 1 / Math.sqrt(5);
        let G0 = [
            {pos: new Vector4(0, 0, 0, 4 * b)},
            {pos: new Vector4(1, 1, 1, -b)},
            {pos: new Vector4(1, -1, -1, -b)},
            {pos: new Vector4(-1, 1, -1, -b)},
            {pos: new Vector4(-1, -1, 1, -b)},
        ]
        let G3 = [
            // each 4 tuple of vertices
            {vertices: [0, 1, 2, 3]},
            {vertices: [0, 1, 2, 4]},
            {vertices: [0, 1, 3, 4]},
            {vertices: [0, 2, 3, 4]},
            {vertices: [1, 2, 3, 4]},
        ]

        let G3_centers = G3.map(cell => {
            let center = new Vector4(0, 0, 0, 0);
                for (let i = 0; i < 4; i++) {
                    center = center.add(G0[cell.vertices[i]].pos);
                }
                return center.multiplyScalar(0.25);
            }
        )

        let G3_normals = G3_centers.map(center => center.clone().normalize());

        this.G0.push(...G0);
        this.G3.push(...G3);

        // for each G3 cell
        for (let i = 0; i < G3.length; i++) {
            // for each vertex of the cell
            let v_c = G3_centers[i];
            let v_n = G3_normals[i];
            for (let j = 0; j < 4; j++) {
                let v_pos = G0[G3[i].vertices[j]].pos.clone();
                let v_pos_offset = v_pos.lerp(v_c, 0.05);
                this.G0.push({pos: v_pos_offset, normal: v_n});
            }
            // add edges of the cell to this.G1
            let vertex_offset = 4 * i + 5
            this.G1.push(
                {v_start: 0 + vertex_offset, v_end: 1 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 2 + vertex_offset, v_end: 3 + vertex_offset},
            )

            // add the G3 to this.
            this.G3.push({
                vertices: [0, 1, 2, 3].map(v => v + vertex_offset),
            })
        }
        this.minThickness = 3;
    }
}

export class SixteenCell extends Object4 {
    constructor(name: string) {
        super(name);
        let G0 = [
            {pos: new Vector4(1, 0, 0, 0)},
            {pos: new Vector4(-1, 0, 0, 0)},
            {pos: new Vector4(0, 1, 0, 0)},
            {pos: new Vector4(0, -1, 0, 0)},
            {pos: new Vector4(0, 0, 1, 0)},
            {pos: new Vector4(0, 0, -1, 0)},
            {pos: new Vector4(0, 0, 0, 1)},
            {pos: new Vector4(0, 0, 0, -1)},
        ]

        let G3 = [
            {vertices: [0, 2, 4, 6]},
            {vertices: [0, 2, 4, 7]},
            {vertices: [0, 2, 5, 6]},
            {vertices: [0, 2, 5, 7]},
            {vertices: [0, 3, 4, 6]},
            {vertices: [0, 3, 4, 7]},
            {vertices: [0, 3, 5, 6]},
            {vertices: [0, 3, 5, 7]},
            {vertices: [1, 2, 4, 6]},
            {vertices: [1, 2, 4, 7]},
            {vertices: [1, 2, 5, 6]},
            {vertices: [1, 2, 5, 7]},
            {vertices: [1, 3, 4, 6]},
            {vertices: [1, 3, 4, 7]},
            {vertices: [1, 3, 5, 6]},
            {vertices: [1, 3, 5, 7]},
        ]

        let G3_centers = G3.map(cell => {
            let center = new Vector4(0, 0, 0, 0);
            for (let i = 0; i < 4; i++) {
                center = center.add(G0[cell.vertices[i]].pos);
            }
            return center.multiplyScalar(0.25);
        })

        let G3_normals = G3_centers.map(center => center.clone().normalize());

        this.G0.push(...G0);
        this.G3.push(...G3);

        // for each G3 cell
        for (let i = 0; i < G3.length; i++) {
            // for each vertex of the cell
            let v_c = G3_centers[i];
            let v_n = G3_normals[i];
            for (let j = 0; j < 4; j++) {
                let v_pos = G0[G3[i].vertices[j]].pos.clone();
                let v_pos_offset = v_pos.lerp(v_c, 0.05);
                this.G0.push({pos: v_pos_offset, normal: v_n});
            }
            // add edges of the cell to this.G1
            let vertex_offset = 4 * i + 8
            this.G1.push(
                {v_start: 0 + vertex_offset, v_end: 1 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 2 + vertex_offset, v_end: 3 + vertex_offset},
            )

            // add the G3 to this.
            this.G3.push({
                vertices: [0, 1, 2, 3].map(v => v + vertex_offset),
            })
        }
        this.minThickness = 3;
    }
}

export class TwentyFourCell extends Object4 {
    constructor(name: string) {
        super(name);
        let h = 1/2;
        let G0 = [
            {pos: new Vector4(1, 0, 0, 0)},
            {pos: new Vector4(-1, 0, 0, 0)},
            {pos: new Vector4(0, 1, 0, 0)},
            {pos: new Vector4(0, -1, 0, 0)},
            {pos: new Vector4(0, 0, 1, 0)}, // 4
            {pos: new Vector4(0, 0, -1, 0)},
            {pos: new Vector4(0, 0, 0, 1)},
            {pos: new Vector4(0, 0, 0, -1)}
        ]

        let pairs = [
            [0, 2],
            [0, 3],
            [0, 4],
            [0, 5],
            [0, 6],
            [0, 7],
            [1, 2],
            [1, 3],
            [1, 4],
            [1, 5],
            [1, 6],
            [1, 7],
            [2, 4],
            [2, 5],
            [2, 6],
            [2, 7],
            [3, 4],
            [3, 5],
            [3, 6],
            [3, 7],
            [4, 6],
            [4, 7],
            [5, 6],
            [5, 7],
        ]
        // for (const pair of pairs.slice(16, 24)) {
        for (const pair of pairs) {
            let v1 = G0[pair[0]].pos;
            let v2 = G0[pair[1]].pos;

            // get the center of the edge
            let center = v1.clone().add(v2).multiplyScalar(0.5);
            let normal = center.clone().normalize();

            // get the 2 zero components of the center
            let zero_components = [];
            for (let i = 0; i < 4; i++) {
                if (center.getComponent(i) == 0) {
                    zero_components.push(i);
                }
            }

            let j = zero_components[0];
            let k = zero_components[1];

            // get octahedron vertices
            let octahedron_vertices = [
                v1.clone(),
                v2.clone(),
                center.clone().setComponent(j, h).setComponent(k, h),
                center.clone().setComponent(j, -h).setComponent(k, -h),
                center.clone().setComponent(j, -h).setComponent(k, h),
                center.clone().setComponent(j, h).setComponent(k, -h),
            ];

            // lerp the octahedron vertices to the center
            octahedron_vertices.forEach(v => v.lerp(center, 0.05));

            let vertex_offset = this.G0.length;

            // add the octahedron vertices to G0
            this.G0.push(...octahedron_vertices.map(v => ({pos: v, normal: normal})));

            // add the octahedron edges to G1
            this.G1.push(
                {v_start: 0 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 4 + vertex_offset},
                {v_start: 0 + vertex_offset, v_end: 5 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 2 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 3 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 4 + vertex_offset},
                {v_start: 1 + vertex_offset, v_end: 5 + vertex_offset},
                {v_start: 2 + vertex_offset, v_end: 4 + vertex_offset},
                {v_start: 2 + vertex_offset, v_end: 5 + vertex_offset},
                {v_start: 3 + vertex_offset, v_end: 4 + vertex_offset},
                {v_start: 3 + vertex_offset, v_end: 5 + vertex_offset}
            )

            // add the octahedron cells to G3
            this.G3.push(
                {vertices: [0, 1, 2, 4].map(v => v + vertex_offset)},
                {vertices: [0, 1, 2, 5].map(v => v + vertex_offset)},
                {vertices: [0, 1, 3, 4].map(v => v + vertex_offset)},
                {vertices: [0, 1, 3, 5].map(v => v + vertex_offset)},
            )
        }
        this.minThickness = 3;
        this.isExactNormal = true;
    }
}

export function getDuocylinder() {
    let u_div = 14, v_div = 14, r_div = 2;
    let m1 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 2*Math.PI], [0,1], u_div, v_div, r_div,
        (u, v, w) => new Vector4(Math.cos(u), Math.sin(u), Math.cos(v) * w, Math.sin(v) * w),
        (u, v, w) => new Vector4(Math.cos(u), Math.sin(u), 0, 0),
        [true, true, false],
        [true, true, true]
    )

    let m2 = new ThreeManifoldMesh("m2", [0, 2*Math.PI], [0, 2*Math.PI], [0,1], u_div, v_div, r_div,
        (u, v, w) => new Vector4(w * Math.cos(u), w * Math.sin(u), Math.cos(v), Math.sin(v)),
        (u, v, w) => new Vector4(0, 0, Math.cos(v), Math.sin(v)),
        [true, true, false],
        [true, true, true]
    )

    m1.isExactNormal = true;
    m2.isExactNormal = true;

    return [m1, m2];
}

export function getConicalCylinder(cylinderHeight: number = 1.5) {
    let coneHeight = 2;

    let div = 11

    let m1 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [0,cylinderHeight], div, 3, 3,
        (u, v, w) => new Vector4(Math.cos(u) * v, Math.sin(u) * v, (1 - v) * coneHeight, w),
        (u, v, w) => new Vector4( coneHeight * Math.cos(u), coneHeight * Math.sin(u), 1, 0).normalize(),
        [true, false, false]
    ) // surface swept by cone
    let m2 = new ThreeManifoldMesh("m2", [0, 2*Math.PI], [0, 1], [0,cylinderHeight], div, 2, 3,
        (u, v, w) => new Vector4(Math.cos(u) * v, Math.sin(u) * v, 0, w),
        (u, v, w) => new Vector4(0, 0, -1, 0),
        [true, false, false]
    ); // surface swept by cap

    let m3 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [0,1], div, 3, 2,
        (u, v, r) => new Vector4(Math.cos(u) * v * r, Math.sin(u) * v * r, (1 - v) * coneHeight, 0),
        (u, v, w) => new Vector4(0, 0, 0, -1),
        [true, false, false]
    ) // lower cone

    let m4 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [0,1], div, 3, 2,
        (u, v, r) => new Vector4(Math.cos(u) * v * r, Math.sin(u) * v * r, (1 - v) * coneHeight, cylinderHeight),
        (u, v, w) => new Vector4(0, 0, 0, 1),
        [true, false, false]
    ) // lower cone

    for (let m of [m1, m2, m3, m4]) {
        m.translate(new Vector4(0, 0, -coneHeight/2 + 0.5, 0));
    }

    return [m1, m2, m3, m4];
}

export function getCubinder(cylinderHeight: number = 1.5) {

    let uSubdiv = 11;

    let m1 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [-1, 1], [0,1], uSubdiv, 2, 2,
        (u, v, w) => new Vector4(Math.cos(u), Math.sin(u), v, w * cylinderHeight),
        (u, v, w) => new Vector4(Math.cos(u), Math.sin(u), 0, 0),
        [true, false, false]
    ) // surface swept by cylindrical surface
    let m2 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [0,1], uSubdiv, 1, 2,
        (u, r, w) => new Vector4(Math.cos(u) * r, Math.sin(u) * r, -1, w * cylinderHeight),
        (u, v, w) => new Vector4(0, 0, -1, 0),
        [true, false, false]
    ) // surface swept by lower cap of cylinder surface
    let m3 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [0,1], uSubdiv, 1, 2,
        (u, r, w) => new Vector4(Math.cos(u) * r, Math.sin(u) * r, 1, w * cylinderHeight),
        (u, v, w) => new Vector4(0, 0, 1, 0),
        [true, false, false]
    ) // surface swept by upper cap of cylinder surface
    let m4 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [-1,1], uSubdiv, 1, 2,
        (u, r, w) => new Vector4(Math.cos(u) * r, Math.sin(u) * r, w, cylinderHeight),
        (u, v, w) => new Vector4(0, 0, 0, 1),
        [true, false, false]
    ) // lower cap of cubinder
    let m5 = new ThreeManifoldMesh("m1", [0, 2*Math.PI], [0, 1], [-1,1], uSubdiv, 1, 2,
        (u, r, w) => new Vector4(Math.cos(u) * r, Math.sin(u) * r, w, 0),
        (u, v, w) => new Vector4(0, 0, 0, -1),
        [true, false, false]
    ) // lower cap of cubinder

    for (let m of [m1, m2, m3, m4, m5]) {
        // m.isExactNormal = true;
    }

    return [m1, m2, m3, m4, m5];
}

export function getSphericalCylinder(cylinderHeight: number = .75) {
    let thetaDiv = 9, phiDiv = 10;
    let heightSubdiv = 2
    let m1 = new ThreeManifoldMesh("m1", [0, 1], [0, 2*Math.PI], [-0.5*Math.PI, 0.5*Math.PI], heightSubdiv, thetaDiv, phiDiv,
        (r, theta, phi) => new Vector4(r * Math.cos(theta) * Math.cos(phi), r * Math.sin(theta) * Math.cos(phi), r * Math.sin(phi), 0),
        (r, theta, phi) => new Vector4(0, 0, 0, -1),
        [false, true, false],
        [false, true, true]
    )

    let m2 = new ThreeManifoldMesh("m1", [0, 1], [0, 2*Math.PI], [-0.5*Math.PI, 0.5*Math.PI], heightSubdiv, thetaDiv, phiDiv,
        (r, theta, phi) => new Vector4(r * Math.cos(theta) * Math.cos(phi), r * Math.sin(theta) * Math.cos(phi), r * Math.sin(phi), cylinderHeight),
        (r, theta, phi) => new Vector4(0, 0, 0, 1),
        [false, true, false],
        [false, true, true]
    )

    let m3 = new ThreeManifoldMesh("m1", [0, 1], [0, 2*Math.PI], [-0.5*Math.PI, 0.5*Math.PI], heightSubdiv, thetaDiv, phiDiv,
        (h, theta, phi) => new Vector4(Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi), h * cylinderHeight),
        (r, theta, phi) => new Vector4(Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi), 0),
        [false, true, false]
    )

    for (let m of [m1, m2, m3]) {
        m.isExactNormal = true;
        m.isClosedSurface = true;
    }

    return [m1, m2, m3];

}

export function getSphericalCone(t: number = 1) {
    let coneHeight = 1.5;

    let m1 = new ThreeManifoldMesh("m1", [0, 1], [0, 2*Math.PI], [-0.5*Math.PI, 0.5*Math.PI], 1, 8, 9,
        (r, theta, phi) => new Vector4(r * Math.cos(theta) * Math.cos(phi), r * Math.sin(theta) * Math.cos(phi), r * Math.sin(phi), 0),
        (r, theta, phi) => new Vector4(0, 0, 0, -1),
        [false, true, false],
        [false, true, true]
    )

    let m2 = new ThreeManifoldMesh("m2", [0, t], [0, 2*Math.PI], [-0.5*Math.PI, 0.5*Math.PI], 1, 8, 9,
        (r, theta, phi) => new Vector4(
            r * Math.cos(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(phi),
            coneHeight * (1 - r)
        ),
        (r, theta, phi) => new Vector4(
            Math.cos(theta) * Math.cos(phi) * coneHeight,
            Math.sin(theta) * Math.cos(phi) * coneHeight,
            Math.sin(phi) * coneHeight,
            1
        ).normalize(),
        [false, true, false]
    )

    m1.isExactNormal = true;
    m2.isExactNormal = true;

    return [m1, m2];
}


export class OneManifold extends Object4 {
    constructor(name: string, u_interval: number[], u_division: number, f: (u: number)=>Vector4) {
        super(name);
        let du = (u_interval[1] - u_interval[0]) / u_division;
        for (let i = 0; i <= u_division; i++) {
            let u = u_interval[0] + i * du;
            this.G0.push({pos:f(u)});
        }
        for (let i = 0; i < u_division; i++) {
            this.G1.push({v_start: i, v_end: i + 1});
        }
        this.materialSet.withLinewidth(5)
        this.materialSet.isDirectional = true
    }
}

export class TwoManifoldMesh_2 extends Object4 {
    constructor(name: string,
        u_interval: number[],
        v_interval: number[],
        u_division: number,
        v_division: number,
        u_subdivision: number,
        v_subdivision: number,
        f: (u: number, v: number)=>Vector4,
        linewidth?: number) {
        super(name);


        let du = (u_interval[1] - u_interval[0]) / u_division;
        let dv = (v_interval[1] - v_interval[0]) / v_division;

        let ddu = du / u_subdivision;
        let ddv = dv / v_subdivision;

        const thres = 15;
        // fix u, draw curves
        for (let i = 0; i <= u_division; i++) {
            let u = u_interval[0] + i * du;
            for (let j = 0; j < v_division * v_subdivision; j++) {
                let v = v_interval[0] + j * ddv;
                let v_next = v_interval[0] + (j + 1) * ddv;
                let p1 = f(u, v);
                let p2 = f(u, v_next);
                if (p1.length() < thres && p2.length() < thres) {
                    this.G0.push({pos:f(u, v)}, {pos:f(u, v_next)});
                    this.G1.push({v_start: this.G0.length - 2, v_end: this.G0.length - 1});
                }
            }
        }

        // fix v, draw curves
        for (let i = 0; i <= v_division; i++) {
            let v = v_interval[0] + i * dv;
            for (let j = 0; j < u_division * u_subdivision; j++) {
                let u = u_interval[0] + j * ddu;
                let u_next = u_interval[0] + (j + 1) * ddu;
                let p1 = f(u, v);
                let p2 = f(u_next, v);
                if (p1.length() < thres && p2.length() < thres) {
                    this.G0.push({pos:f(u, v)}, {pos:f(u_next, v)});
                    this.G1.push({v_start: this.G0.length - 2, v_end: this.G0.length - 1});
                }
            }
        }
        this.materialSet.isDirectional = true

        if (linewidth) {
            this.materialSet.withLinewidth(linewidth)
        }
    }
}


export class ThreeManifoldMesh extends Object4 {
    constructor(name: string,
        u_interval: number[],
        v_interval: number[],
        w_interval: number[],
        u_division: number,
        v_division: number,
        w_division: number,
        f: (u: number, v: number, w: number)=>Vector4,
        n: (u: number, v: number, w: number)=>Vector4,
        loop: boolean[] = [false, false, false],
        visible: boolean[] = [true, true, true],
        linewidth?: number) {
        super(name);

        let du, dv, dw;
        if (!loop[0]) {
            du = (u_interval[1] - u_interval[0]) / u_division;
        } else {
            du = (u_interval[1] - u_interval[0]) / (u_division + 1);
        }
        if (!loop[1]) {
            dv = (v_interval[1] - v_interval[0]) / v_division;
        } else {
            dv = (v_interval[1] - v_interval[0]) / (v_division + 1);
        }
        if (!loop[2]) {
            dw = (w_interval[1] - w_interval[0]) / w_division;
        } else {
            dw = (w_interval[1] - w_interval[0]) / (w_division + 1);
        }

        let nu = u_division + 1;
        let nv = v_division + 1;
        let nw = w_division + 1;

        for (let i = 0; i < nu; i++) {
            let u = u_interval[0] + i * du;
            for (let j = 0; j < nv; j++) {
                let v = v_interval[0] + j * dv;
                for (let k = 0; k < nw; k++) {
                    let w = w_interval[0] + k * dw;
                    this.G0.push({pos:f(u, v, w), normal: n(u,v,w)});
                }
            }
        }

        const gi = (i: number, j: number, k: number) => {
            return (i%nu) * nv * nw + (j%nv) * nw + k%nw;
        }

        for (let i = 0; i < nu; i++) {
            for (let j = 0; j < nv; j++) {
                for (let k = 0; k < nw; k++) {
                    if (visible[0]) {
                        if (loop[0]) {
                            this.G1.push(
                                {v_start: gi(i, j, k), v_end: gi((i+1)%(u_division+1), j, k)},
                            )
                        } else {
                            if (i < u_division) {
                                this.G1.push(
                                    {v_start: gi(i, j, k), v_end: gi(i+1, j, k)},
                                )
                            }
                        }
                    }

                    if (visible[1]) {
                        if (loop[1]) {
                            this.G1.push(
                                {v_start: gi(i, j, k), v_end: gi(i, (j+1)%(v_division+1), k)},
                            )
                        } else {
                            if (j < v_division) {
                                this.G1.push(
                                    {v_start: gi(i, j, k), v_end: gi(i, j+1, k)},
                                )
                            }
                        }
                    }

                    if (visible[2]) {
                        if (loop[2]) {
                            this.G1.push(
                                {v_start: gi(i, j, k), v_end: gi(i, j, (k+1)%(w_division+1))},
                            )
                        } else {
                            if (k < w_division) {
                                this.G1.push(
                                    {v_start: gi(i, j, k), v_end: gi(i, j, k+1)},
                                )
                            }
                        }
                    }

                    if (((i < u_division) || loop[0]) && ((j < v_division) || loop[1]) && ((k < w_division) || loop[2])) {

                        this.G3.push(
                            {vertices: [gi(i, j, k), gi(i, j, k+1), gi(i, j+1, k), gi(i+1, j, k)]},
                            {vertices: [gi(i, j, k+1), gi(i, j+1, k), gi(i+1, j, k), gi(i+1, j+1, k+1)]},
                            {vertices: [gi(i+1, j, k), gi(i, j+1, k), gi(i+1, j+1, k), gi(i+1, j+1, k+1)]}, // ij
                            {vertices: [gi(i, j+1, k), gi(i, j, k+1), gi(i, j+1, k+1), gi(i+1, j+1, k+1)]}, // jk
                            {vertices: [gi(i, j, k+1), gi(i+1, j, k), gi(i+1, j, k+1), gi(i+1, j+1, k+1)]}, // ki
                        );
                    }
                }
            }
        }
    }
}


export function getTesseractCells(): Object4[] {
    let cells = [];

    const gap = 0.001;
    const r = 0.5;
    const r0 = r - gap;

    for (let k of [-1, 1]) {
        cells.push(
            new ThreeManifoldMesh(
                'tesseract',
                [-r0, r0],
                [-r0, r0],
                [-r0, r0],
                1,1,1,
                (u,v,w)=>new Vector4(u,v,w,k*r),
                (u,v,w)=>new Vector4(0,0,0,k),
            ),
            new ThreeManifoldMesh(
                'tesseract',
                [-r0, r0],
                [-r0, r0],
                [-r0, r0],
                1,1,1,
                (u,v,w)=>new Vector4(u,w,k*r,v),
                (u,v,w)=>new Vector4(0,0,k,0),
            ),
            new ThreeManifoldMesh(
                'tesseract',
                [-r0, r0],
                [-r0, r0],
                [-r0, r0],
                1,1,1,
                (u,v,w)=>new Vector4(u,k*r,v,w),
                (u,v,w)=>new Vector4(0,k,0,0),
            ),
            new ThreeManifoldMesh(
                'tesseract',
                [-r0, r0],
                [-r0, r0],
                [-r0, r0],
                1,1,1,
                (u,v,w)=>new Vector4(k*r,u,v,w),
                (u,v,w)=>new Vector4(k,0,0,0),
            )
        )
    }
    for (let c of cells) {
        c.isClosedSurface = true;
        c.isExactNormal = true;
        c.minThickness = 3;
        c.thicknessRange = 1;
    }
    return cells;
}

const INVISIBLE = new MaterialSet()
let w = 1.5;
const WHITE = getLineMaterial(0xffffff, w);
const RED = getLineMaterial(0xff8f8f, w);
const GREEN = getLineMaterial(0x00ff00, w);
const BLUE = getLineMaterial(0x87CEFA, w);
const YELLOW = getLineMaterial(0xffff00, w);

export {
    Grid4,
    LineObject,
    SimplexCell,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}