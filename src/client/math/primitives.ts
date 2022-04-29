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
            this.G0[4].clone().add(this.G0[5]).add(this.G0[6])
                .addScaledVector(this.G0[0], -2)
        );
        this.G3.push({
            vertices: [0, 1, 2, 3, 4, 5, 6, 7],
            edges: [
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
            ]
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
    ParallelepipedCell,
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}