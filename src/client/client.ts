import * as THREE from 'three'
import { LineBasicMaterial, Scene, Vector3, Vector4 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Camera4, Object4, renderVectorImage3, Scene4, VectorImageComponent3 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE } from './math/primitives'

const tesseract = new Tesseract('tesseract').withMaterial(WHITE);

const grid = new Grid4('tess', [1.1, 1.1, 1.1, 0.1]);
const camera4 = new Camera4(
    new Vector4(-5, 0, 0, 0),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    1
);

camera4.move(1, 0.01);

const scene4 = new Scene4([
    tesseract,
    grid.getX().withMaterial(RED),
    grid.getY().withMaterial(GREEN),
    grid.getZ().withMaterial(BLUE),
    grid.getW().withMaterial(YELLOW)
], camera4)



const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2


const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)



window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

window.addEventListener('keydown', onKeyDown, false);
function onKeyDown(event: KeyboardEvent) {
    var keyCode = event.which;
    let speed = 0.02;
    if (event.shiftKey) {
        speed = -speed;
    }
    if (!event.ctrlKey) {
        if (keyCode === 49) { // 1
            camera4.move(0, speed);
        }
        if (keyCode === 50) { // 2
            camera4.move(1, speed);
        }
        if (keyCode === 51) { // 3
            camera4.move(2, speed);
        }
        if (keyCode === 52) { // 4
            camera4.move(3, speed);
        }
    } else {
        if (keyCode === 49) { // 1
            camera4.tilt(0, speed);
        }
        if (keyCode === 50) { // 2
            camera4.tilt(1, speed);
        }
        if (keyCode === 51) { // 3
            camera4.tilt(2, speed);
        }
        if (keyCode === 52) { // 4
            camera4.tilt(3, speed);
        }
    }
}

function animate() {
    requestAnimationFrame(animate)

    // scene.traverse(function( node ) {
    //     if ( node instanceof THREE.Mesh || node instanceof THREE.Line) {
    //         node.rotation.y += 0.001;
    //     }
    //     // camera4.move(4, 0.001);
    // });

    controls.update()
    render()
}

function render() {
    const image3 = scene4.render();
    const scene = renderVectorImage3(image3);

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
    })

    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    renderer.render(scene, camera)
}
animate()
