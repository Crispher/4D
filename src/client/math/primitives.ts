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