import { Vector4, LineBasicMaterial } from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { Object4 } from "./core";


class Grid4 extends Object4 {
    public dims: number[];
    constructor(name: string, dims: number[]) {
        super(name);
        this.dims = dims;
    }

    getX(): Object4 {
        let ret = new Object4(`${this.name}-X-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[1]); i <= Math.floor(dims[1]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(-dims[0], i, j, k),
                        new Vector4(dims[0], i, j, k)
                    )
                }
            }
        }
        return ret;
    }

    getY(): Object4 {
        let ret = new Object4(`${this.name}-Y-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(i, -dims[1], j, k),
                        new Vector4(i, dims[1], j, k)
                    )
                }
            }
        }
        return ret;
    }

    getZ(): Object4 {
        let ret = new Object4(`${this.name}-Z-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    ret.addNewLine(
                        new Vector4(i, j, -dims[2], k),
                        new Vector4(i, j, dims[2], k)
                    )
                }
            }
        }
        return ret;
    }

    getW(): Object4 {
        let ret = new Object4(`${this.name}-W-axis`);
        const dims = this.dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[2]); k <= Math.floor(dims[2]); k++) {
                    ret.addNewLine(
                        new Vector4(i, j, k, -dims[3]),
                        new Vector4(i, j, k, dims[3])
                    )
                }
            }
        }
        return ret;
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
        for (let i = 0; i < this.G0.length; i++) {
            for (let j = i + 1; j < this.G0.length; j++) {
                if (new Vector4().copy(this.G0[i]).sub(this.G0[j]).manhattanLength() === 1) {
                    this.G1.push({v_start: i, v_end: j});
                }
            }
        }
    }
}


class TessearctFaces extends Object4 {
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
            return {vertices: v, edges: this.getFaceEdges(v)}
        })
        this.G3.push(...facets);
    }

    private getFaceEdges(v: number[]) {
        return [
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
        ].map(e => {
            return this.findEdge(v[e.v_start], v[e.v_end])
        });
    }

    private findEdge(v_start: number, v_end: number) {
        for (let i = 0; i < this.G1.length; i++)  {
            let e = this.G1[i];
            if (e.v_start === v_start && e.v_end === v_end) {
                return i;
            }
        }
        console.error("cannot find edge!")
        return -1;
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
            edges: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        });
    }
}


function getLineMaterial(color: number, width: number = 0.002, dashed: boolean = false) {
    return new LineMaterial({
        color: color,
        linewidth: width,
        dashed: dashed
    })
}


const WHITE = getLineMaterial(0xffffff);
const RED = getLineMaterial(0xff8f8f);
const GREEN = getLineMaterial(0x00ff00);
const BLUE = getLineMaterial(0x8f8fff);
const YELLOW = getLineMaterial(0xffff00);

export {
    Grid4,
    Tesseract,
    TessearctFaces,
    LineObject,
    ParallelepipedCell,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}