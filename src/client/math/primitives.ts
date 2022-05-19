import { Vector4 } from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { Object4, getLineMaterial, MaterialSet } from "./core";


class Grid4 extends Object4 {
    public dims: number[];
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
        let opacity = 2/(2+Math.max(Math.abs(i), Math.abs(j), Math.abs(k)));
        return origin ? mat.clone().withOpacity(opacity).withLinewidth(3)
                : mat.clone().withOpacity(opacity)
    }
}
class Tesseract extends Object4 {
    constructor(name: string) {
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
    }

    showFaceBorderOnly() {
        this.materialSet = INVISIBLE;
        let colors = [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff, 0xffff00, 0xff00ff, 0xffffff, 0xff7f00];
        for (let i = 0; i < 8; i++) {
            this.generateFacetBorder(i, 0.02, getLineMaterial(colors[i], 2));
        }
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



const INVISIBLE = new MaterialSet()
const WHITE = getLineMaterial(0xffffff);
const RED = getLineMaterial(0xff8f8f, 1, true);
const GREEN = getLineMaterial(0x00ff00);
const BLUE = getLineMaterial(0x8f8fff);
const YELLOW = getLineMaterial(0xffff00);

export {
    Grid4,
    Tesseract,
    LineObject,
    ParallelepipedCell,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}