import { Vector4 } from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
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
class Tesseract extends Object4 {
    // constructor(name: string, offset?: Vector4) {
    //     super(name);
    //     for (let i of [0, 1]) {
    //         for (let j of [0, 1]) {
    //             for (let k of [0, 1]) {
    //                 for (let l of [0, 1]) {
    //                     this.G0.push(new Vector4(i, j, k, l));
    //                 }
    //             }
    //         }
    //     }

    //     this.G1.push(
    //         {v_start: 0b0000, v_end: 0b0001},
    //         {v_start: 0b0010, v_end: 0b0011},
    //         {v_start: 0b0100, v_end: 0b0101},
    //         {v_start: 0b0110, v_end: 0b0111},
    //         {v_start: 0b1000, v_end: 0b1001},
    //         {v_start: 0b1010, v_end: 0b1011},
    //         {v_start: 0b1100, v_end: 0b1101},
    //         {v_start: 0b1110, v_end: 0b1111},

    //         {v_start: 0b0000, v_end: 0b0010}, // 8
    //         {v_start: 0b0001, v_end: 0b0011},
    //         {v_start: 0b0100, v_end: 0b0110},
    //         {v_start: 0b0101, v_end: 0b0111},
    //         {v_start: 0b1000, v_end: 0b1010},
    //         {v_start: 0b1001, v_end: 0b1011},
    //         {v_start: 0b1100, v_end: 0b1110},
    //         {v_start: 0b1101, v_end: 0b1111},

    //         {v_start: 0b0000, v_end: 0b0100}, // 16
    //         {v_start: 0b0001, v_end: 0b0101},
    //         {v_start: 0b0010, v_end: 0b0110},
    //         {v_start: 0b0011, v_end: 0b0111},
    //         {v_start: 0b1000, v_end: 0b1100}, // 20
    //         {v_start: 0b1001, v_end: 0b1101},
    //         {v_start: 0b1010, v_end: 0b1110},
    //         {v_start: 0b1011, v_end: 0b1111},

    //         {v_start: 0b0000, v_end: 0b1000}, // 24
    //         {v_start: 0b0001, v_end: 0b1001},
    //         {v_start: 0b0010, v_end: 0b1010},
    //         {v_start: 0b0011, v_end: 0b1011},
    //         {v_start: 0b0100, v_end: 0b1100}, // 28
    //         {v_start: 0b0101, v_end: 0b1101},
    //         {v_start: 0b0110, v_end: 0b1110},
    //         {v_start: 0b0111, v_end: 0b1111},
    //     )

    //     let X0 = [0, 1, 2, 4, 3, 5, 6, 7];
    //     let X1 = [8, 9, 10, 12, 0b1011, 0b1101, 0b1110, 0b1111];

    //     let Y0 = [0b0000, 0b0001, 0b0010, 0b1000, 0b0011, 0b1001, 0b1010, 0b1011];
    //     let Y1 = [0b0100, 0b0101, 0b0110, 0b1100, 0b0111, 0b1101, 0b1110, 0b1111];

    //     let Z0 = [0b0000, 0b0001, 0b0100, 0b1000, 0b0101, 0b1001, 0b1100, 0b1101];
    //     let Z1 = [0b0010, 0b0011, 0b0110, 0b1010, 0b0111, 0b1011, 0b1110, 0b1111];

    //     let W0 = [0b0000, 0b0010, 0b0100, 0b1000, 0b0110, 0b1010, 0b1100, 0b1110];
    //     let W1 = [0b0001, 0b0011, 0b0101, 0b1001, 0b0111, 0b1011, 0b1101, 0b1111];

    //     let facets = [X0, X1, Y0, Y1, Z0, Z1, W0, W1].map(v => {
    //         return {vertices: v}
    //     })
    //     this.G3.push(...facets);

    //     if (offset) {
    //         this.translate(offset);
    //     }
    // }

    // showFaceBorderOnly(faceBorderLinewidth: number=3.5, showHidden?: boolean) {
    //     this.materialSet = INVISIBLE;
    //     let colors = [0xff2020, 0xffff00, 0x7B68EE, 0x00ffff, 0x80FF00, 0x3399ff, 0xffffff, 0xff7f00];
    //     for (let i = 0; i < 8; i++) {
    //         this.generateFacetBorder(i, 0.05, getLineMaterial(colors[i], faceBorderLinewidth, showHidden));
    //     }
    //     return this
    // }
    // showFaceBorderOnly_2(faceBorderLinewidth: number[], showHidden?: boolean) {
    //     this.materialSet = INVISIBLE;
    //     let colors = [0xff2020, 0xffff00, 0x7B68EE, 0x00ffff, 0x80FF00, 0x3399ff, 0xffffff, 0xff7f00];
    //     for (let i = 0; i < 8; i++) {
    //         this.generateFacetBorder(i, 0.05, getLineMaterial(colors[i], faceBorderLinewidth[i], showHidden));
    //     }
    //     return this
    // }
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
        linewidth?: number) {
        super(name);

        let du = (u_interval[1] - u_interval[0]) / u_division;
        let dv = (v_interval[1] - v_interval[0]) / v_division;
        let dw = (w_interval[1] - w_interval[0]) / w_division;


        for (let i = 0; i <= u_division; i++) {
            let u = u_interval[0] + i * du;
            for (let j = 0; j <= v_division; j++) {
                let v = v_interval[0] + j * dv;
                for (let k = 0; k <= w_division; k++) {
                    let w = w_interval[0] + k * dw;
                    this.G0.push({pos:f(u, v, w), normal: n(u,v,w)});
                }
            }
        }

        const gi = (i: number, j: number, k: number) => {
            return i * (v_division + 1) * (w_division + 1) + j * (w_division + 1) + k;
        }

        for (let i = 0; i < u_division; i++) {
            for (let j = 0; j < v_division; j++) {
                for (let k = 0; k < w_division; k++) {
                    this.G1.push(
                        {v_start: gi(i, j, k), v_end: gi(i, j, k+1)},
                        {v_start: gi(i, j, k), v_end: gi(i, j+1, k)},
                        {v_start: gi(i, j, k), v_end: gi(i+1, j, k)},
                        // {v_start: gi(i, j, k+1), v_end: gi(i, j+1, k+1)},
                        // {v_start: gi(i, j, k+1), v_end: gi(i+1, j, k+1)},
                        // {v_start: gi(i, j+1, k), v_end: gi(i+1, j+1, k)},
                        // {v_start: gi(i, j+1, k), v_end: gi(i, j+1, k+1)},
                        // {v_start: gi(i+1, j, k), v_end: gi(i+1, j+1, k)},
                        // {v_start: gi(i+1, j, k), v_end: gi(i+1, j, k+1)},
                        // {v_start: gi(i+1, j+1, k), v_end: gi(i+1, j+1, k+1)},
                        // {v_start: gi(i, j+1, k+1), v_end: gi(i+1, j+1, k+1)},
                        // {v_start: gi(i+1, j, k+1), v_end: gi(i+1, j+1, k+1)}
                    )

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

const INVISIBLE = new MaterialSet()
let w = 1.5;
const WHITE = getLineMaterial(0xffffff, w);
const RED = getLineMaterial(0xff8f8f, w);
const GREEN = getLineMaterial(0x00ff00, w);
const BLUE = getLineMaterial(0x87CEFA, w);
const YELLOW = getLineMaterial(0xffff00, w);

export {
    Grid4,
    Tesseract,
    LineObject,
    SimplexCell,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}