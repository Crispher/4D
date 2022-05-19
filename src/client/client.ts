import * as THREE from 'three'
import { LineBasicMaterial, Plane, Scene, Vector3, Vector4 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Camera4, CameraQueue,  Object4, Scene3WithMemoryTracker, Scene4 } from './math/core'
import { Grid4, Tesseract, RED, GREEN, BLUE, YELLOW, WHITE, ParallelepipedCell, LineObject, TessearctFaces } from './math/primitives'
import { test } from './test'

// const tesseract = new Tesseract('tesseract').withMaterial(WHITE);
const tesseract = new TessearctFaces('tesseract');
const facet = new ParallelepipedCell('facet-0',
    [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    })
)

const grid = new Grid4('tess', [1.1, 1.1, 1.1, 0.1]);
const line = new LineObject('line',
    new Vector4(1, 1.1, 1, 0),
    new Vector4(1, -1.1, 1, 0));
const camera4 = new Camera4(
    new Vector4(-5, 0, 0, 0),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]].map((e: number[]) => {
        return new Vector4().fromArray(e);
    }),
    1
);


let camQueue = new CameraQueue(150, camera4, 10);

tesseract.generateFacetBorder(2, 0.05, YELLOW);

const scene4 = new Scene4([
    tesseract,
    // facet,
    grid.getX().withMaterial(RED),
    grid.getY().withMaterial(GREEN),
    grid.getZ().withMaterial(BLUE),
    grid.getW().withMaterial(YELLOW)
    // line
])


let Y = grid.getY();

let I = facet.computeOcclusion(camera4.pos,
    new Vector4(1, -1.1, 1, 0),
    new Vector4(1, 1.1, 1, 0));

// let I1 = facet.computeOcclusion(camera4.pos,
//     Y.G0[16], Y.G0[17]);
console.log('I0 = ', I, Y.G0[16], Y.G0[17])

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2


const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.setClearColor(0xff99c7)
renderer.clippingPlanes = [
    new Plane(new Vector3(0, 0, 1), 0.8)
]
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)



window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const scene = new Scene3WithMemoryTracker();

var sceneUpdated = true;

window.addEventListener('keydown', (e) => {
    camera4.keyboardEventHandler(e);
    sceneUpdated = true;
}, false);


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
    if (sceneUpdated) {
        scene.clearScene();
        // camera4.tilt(1, 0.005);
        // camera4.move(0, -0.005)
        camQueue.pushCamera(camera4);
        scene4.render(scene, camQueue);
        // frame.renderToScene3(scene);
        renderer.render(scene, camera);
        sceneUpdated = false;
    } else {
        renderer.render(scene, camera);
    }
}
animate()
// test()