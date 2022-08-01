function i2ia(i: number) {
    let ret = new Array(4);
    ret[0] = Math.floor(i / 27);
    ret[1] = Math.floor((i % 27) / 9);
    ret[2] = Math.floor((i % 9) / 3);
    ret[3] = i % 3;
    return ret;
}

function ia2i(i: number, j: number, k: number, l: number) {
    return i * 27 + j * 9 + k * 3 + l
}

function generate_boxes(p: number) {
    let range = 3
    let grid = new Array<boolean>(range ** 4);
    for (let i = 0; i < range; i++) {
        for (let j = 0; j < range; j++) {
            for (let k = 0; k < range; k++) {
                for (let l = 0; l < range; l++) {
                    // generate random number between 0 and 1
                    let r = Math.random();
                    if (r < p) {
                        grid[ia2i(i, j, k, l)] = true;
                    } else {
                        grid[ia2i(i, j, k, l)] = false;
                    }
                }
            }
        }
    }
    grid[0] = true;
    apply_gravity(grid, 0);
    apply_gravity(grid, 1);
    apply_gravity(grid, 2);
    apply_gravity(grid, 3);
    return grid;
}

function apply_gravity(grid: Array<boolean>, axis: number) {
    let range = 3
    // for i, j, k, l in range
    for (let i = 0; i < range; i++) {
        for (let j = 0; j < range; j++) {
            for (let k = 0; k < range; k++) {
                for (let l = 0; l < range; l++) {
                    let ia = [i, j, k, l];
                    if (ia[axis] == 0) {
                        continue;
                    } else {
                        let ia_below = [ia[0], ia[1], ia[2], ia[3]];
                        ia_below[axis]--;
                        while (grid[ia2i(ia_below[0], ia_below[1], ia_below[2], ia_below[3])] == false && ia_below[axis] >= 0) {
                            // swap
                            let temp = grid[ia2i(ia[0], ia[1], ia[2], ia[3])];
                            grid[ia2i(ia[0], ia[1], ia[2], ia[3])] = grid[ia2i(ia_below[0], ia_below[1], ia_below[2], ia_below[3])];
                            grid[ia2i(ia_below[0], ia_below[1], ia_below[2], ia_below[3])] = temp;
                            ia[axis] --;
                            ia_below[axis] --;
                        }
                    }
                }
            }
        }
    }
    return grid;
}

// export all the functions
export {
    i2ia,
    ia2i,
    generate_boxes,
    apply_gravity
}