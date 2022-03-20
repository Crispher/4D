import { Vector4, LineBasicMaterial } from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { Object4 } from "./core";


class Grid4 extends Object4 {
    public dims: number[];
    constructor(name: string, dims: number[]) {
        super(name);
        this.dims = dims;
        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[2]); k <= Math.floor(dims[2]); k++) {
                    this.G1.push(new Int32Array([this.G0.length, this.G0.length + 1]))
                    this.G0.push(
                        new Vector4(i, j, k, -dims[3]),
                        new Vector4(i, j, k, dims[3])
                    )
                }
            }
        }

        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[1]); j <= Math.floor(dims[1]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    this.G1.push(new Int32Array([this.G0.length, this.G0.length + 1]))
                    this.G0.push(
                        new Vector4(i, j, -dims[2], k),
                        new Vector4(i, j, dims[2], k)
                    )
                }
            }
        }

        for (let i = Math.ceil(-dims[0]); i <= Math.floor(dims[0]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    this.G1.push(new Int32Array([this.G0.length, this.G0.length + 1]))
                    this.G0.push(
                        new Vector4(i, -dims[1], j, k),
                        new Vector4(i, dims[1], j, k)
                    )
                }
            }
        }

        for (let i = Math.ceil(-dims[1]); i <= Math.floor(dims[1]); i++) {
            for (let j = Math.ceil(-dims[2]); j <= Math.floor(dims[2]); j++) {
                for (let k = Math.ceil(-dims[3]); k <= Math.floor(dims[3]); k++) {
                    this.G1.push(new Int32Array([this.G0.length, this.G0.length + 1]))
                    this.G0.push(
                        new Vector4(-dims[0], i, j, k),
                        new Vector4(dims[0], i, j, k)
                    )
                }
            }
        }
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
        let ret = new Object4(`${this.name}-Y-axis`);
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
        let ret = new Object4(`${this.name}-Y-axis`);
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
                    this.G1.push(new Int32Array([i, j]));
                }
            }
        }
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
    WHITE,
    RED,
    GREEN,
    BLUE,
    YELLOW
}