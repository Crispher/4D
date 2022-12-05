import { Vector4 } from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { Object4, getLineMaterial, MaterialSet } from "./core";
import {complex, exp} from 'mathjs';

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
    constructor(name: string, offset?: Vector4) {
        super(name);
        for (let i of [0, 1]) {
            for (let j of [0, 1]) {
                for (let k of [0, 1]) {
                    for (let l of [0, 1]) {
                        this.G0.push(new Vector4(i, j, k, l));
                    }
                }
            }
        }

        this.G1.push(
            {v_start: 0b0000, v_end: 0b0001},
            {v_start: 0b0010, v_end: 0b0011},
            {v_start: 0b0100, v_end: 0b0101},
            {v_start: 0b0110, v_end: 0b0111},
            {v_start: 0b1000, v_end: 0b1001},
            {v_start: 0b1010, v_end: 0b1011},
            {v_start: 0b1100, v_end: 0b1101},
            {v_start: 0b1110, v_end: 0b1111},

            {v_start: 0b0000, v_end: 0b0010}, // 8
            {v_start: 0b0001, v_end: 0b0011},
            {v_start: 0b0100, v_end: 0b0110},
            {v_start: 0b0101, v_end: 0b0111},
            {v_start: 0b1000, v_end: 0b1010},
            {v_start: 0b1001, v_end: 0b1011},
            {v_start: 0b1100, v_end: 0b1110},
            {v_start: 0b1101, v_end: 0b1111},

            {v_start: 0b0000, v_end: 0b0100}, // 16
            {v_start: 0b0001, v_end: 0b0101},
            {v_start: 0b0010, v_end: 0b0110},
            {v_start: 0b0011, v_end: 0b0111},
            {v_start: 0b1000, v_end: 0b1100}, // 20
            {v_start: 0b1001, v_end: 0b1101},
            {v_start: 0b1010, v_end: 0b1110},
            {v_start: 0b1011, v_end: 0b1111},

            {v_start: 0b0000, v_end: 0b1000}, // 24
            {v_start: 0b0001, v_end: 0b1001},
            {v_start: 0b0010, v_end: 0b1010},
            {v_start: 0b0011, v_end: 0b1011},
            {v_start: 0b0100, v_end: 0b1100}, // 28
            {v_start: 0b0101, v_end: 0b1101},
            {v_start: 0b0110, v_end: 0b1110},
            {v_start: 0b0111, v_end: 0b1111},
        )

        let X0 = [0, 1, 2, 4, 3, 5, 6, 7];
        let X1 = [8, 9, 10, 12, 0b1011, 0b1101, 0b1110, 0b1111];

        let Y0 = [0b0000, 0b0001, 0b0010, 0b1000, 0b0011, 0b1001, 0b1010, 0b1011];
        let Y1 = [0b0100, 0b0101, 0b0110, 0b1100, 0b0111, 0b1101, 0b1110, 0b1111];

        let Z0 = [0b0000, 0b0001, 0b0100, 0b1000, 0b0101, 0b1001, 0b1100, 0b1101];
        let Z1 = [0b0010, 0b0011, 0b0110, 0b1010, 0b0111, 0b1011, 0b1110, 0b1111];

        let W0 = [0b0000, 0b0010, 0b0100, 0b1000, 0b0110, 0b1010, 0b1100, 0b1110];
        let W1 = [0b0001, 0b0011, 0b0101, 0b1001, 0b0111, 0b1011, 0b1101, 0b1111];

        let facets = [X0, X1, Y0, Y1, Z0, Z1, W0, W1].map(v => {
            return {vertices: v}
        })
        this.G3.push(...facets);

        if (offset) {
            this.translate(offset);
        }
    }

    showFaceBorderOnly(faceBorderLinewidth: number=3.5, showHidden?: boolean) {
        this.materialSet = INVISIBLE;
        let colors = [0xff2020, 0xffff00, 0x7B68EE, 0x00ffff, 0x80FF00, 0x3399ff, 0xffffff, 0xff7f00];
        for (let i = 0; i < 8; i++) {
            this.generateFacetBorder(i, 0.05, getLineMaterial(colors[i], faceBorderLinewidth, showHidden));
        }
        return this
    }
    showFaceBorderOnly_2(faceBorderLinewidth: number[], showHidden?: boolean) {
        this.materialSet = INVISIBLE;
        let colors = [0xff2020, 0xffff00, 0x7B68EE, 0x00ffff, 0x80FF00, 0x3399ff, 0xffffff, 0xff7f00];
        for (let i = 0; i < 8; i++) {
            this.generateFacetBorder(i, 0.05, getLineMaterial(colors[i], faceBorderLinewidth[i], showHidden));
        }
        return this
    }
}


class LineObject extends Object4 {
    constructor(name: string, s: Vector4, t: Vector4) {
        super(name);
        this.G0.push(s, t);
        this.G1.push({v_start: 0, v_end: 1});
    }
}

class ParallelepipedCell extends Object4 {
    constructor(name: string, bases: Vector4[]) {
        super(name);
        this.G0.push(...bases);
        this.G0.push(
            bases[1].clone().add(bases[2]).sub(bases[0]),
            bases[1].clone().add(bases[3]).sub(bases[0]),
            bases[2].clone().add(bases[3]).sub(bases[0])
        )
        this.G0.push(
            this.G0[4].clone().add(bases[3]).sub(this.G0[0])
        );
        this.G1.push(
            {v_start: 0, v_end: 1}, //0
            {v_start: 0, v_end: 2},
            {v_start: 0, v_end: 3},
            {v_start: 1, v_end: 4},
            {v_start: 1, v_end: 5},
            {v_start: 2, v_end: 4},
            {v_start: 2, v_end: 6},
            {v_start: 3, v_end: 5},
            {v_start: 3, v_end: 6},
            {v_start: 4, v_end: 7},
            {v_start: 5, v_end: 7},
            {v_start: 6, v_end: 7},
        )
        this.G3.push({
            vertices: [0, 1, 2, 3, 4, 5, 6, 7],
        });
    }
}


class TwoManifoldMesh extends Object4 {
    constructor(name: string, u_range: number[], v_range: number[], f: (u: number, v: number)=>Vector4) {
        super(name);
        for (let u of u_range) {
            for (let i = 0; i < v_range.length - 1; i++) {
                let v = v_range[i];
                let v_next = v_range[i + 1];
                this.G0.push(f(u, v), f(u, v_next));
                this.G1.push({v_start: this.G0.length - 2, v_end: this.G0.length - 1});
            }
        }

        for (let v of v_range) {
            for (let i = 0; i < u_range.length - 1; i++) {
                let u = u_range[i];
                let u_next = u_range[i + 1];
                // this.G0.push(f(u, v), f(u_next, v));
                // this.G1.push({v_start: this.G0.length - 2, v_end: this.G0.length - 1});
            }
        }
        this.materialSet.isDirectional = true

    }
}

export class OneManifold extends Object4 {
    constructor(name: string, u_interval: number[], u_division: number, f: (u: number)=>Vector4) {
        super(name);
        let du = (u_interval[1] - u_interval[0]) / u_division;
        for (let i = 0; i <= u_division; i++) {
            let u = u_interval[0] + i * du;
            this.G0.push(f(u));
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
                    this.G0.push(f(u, v), f(u, v_next));
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
                    this.G0.push(f(u, v), f(u_next, v));
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

let getRange = (N: number, r: number=1) => {
    let range = [];
    for (let i = 0; i < N*r; i++) {
        range.push(i / N);
    }
    return range;
}
class KleinBottle extends TwoManifoldMesh {
    constructor(name: string, N: number, R: number, P: number, eps: number = 0.1) {
        super(name, getRange(N, 0.4), getRange(N), (u, v) => {
            return new Vector4(
                R * (Math.cos(u / 2) * Math.cos(v) - Math.sin(u / 2) * Math.sin(2 * v)),
                R * (Math.cos(u / 2) * Math.sin(v) + Math.sin(u / 2) * Math.cos(2 * v)),
                P * Math.cos(u) * (1 + eps * Math.sin(v)),
                P * Math.sin(u) * (1 + eps * Math.sin(v)) + 2
            )
        });
    }
}


class ComplexFunctionPlot extends TwoManifoldMesh {
    constructor(name: string, N: number, range: number, func: (t: any) => any) {
        super(name, getRange(N), getRange(N), (u, v) => {
            let x = (2 * u - 1) * range;
            let y = (2 * v - 1) * range;
            let z = func(complex(x, y));
            return new Vector4(x, y, z.re, z.im);
        });
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
    ParallelepipedCell,
    TwoManifoldMesh,
    KleinBottle,
    ComplexFunctionPlot,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}