import * as THREE from './deps/three.js/build/three.module.js';
import { OrbitControls } from './deps/three.js/examples/jsm/controls/OrbitControls.js';
import { ThreeMFLoader } from './deps/three.js/examples/jsm/loaders/3MFLoader.js';
import { AMFLoader } from './deps/three.js/examples/jsm/loaders/AMFLoader.js';
import { GCodeLoader } from './deps/three.js/examples/jsm/loaders/GCodeLoader.js';
import { STLLoader } from './deps/three.js/examples/jsm/loaders/STLLoader.js';

const SUPPORTED_FORMATS = new Map([
	["3mf", ThreeMFLoader],
	["amf", AMFLoader],
	["gcode",
		class extends GCodeLoader {
			parse(data) {
				var object = super.parse(new TextDecoder("utf-8").decode(data));
				object.rotateX(Math.PI / 2);
				return object;
			}
		}],
	["stl", STLLoader]
]);

var camera, scene, renderer, controls;
var viewer_elem, info_elem;

export function init(viewer, info) {
	viewer_elem = viewer;
	info_elem = info;
}

export function supportedFormats() {
	var extensions = Array.from(SUPPORTED_FORMATS.keys());
	extensions.push("amf.zip");
	return extensions;
}

export function view(ext, filedata) {
	renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.setClearColor(0x999999);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.domElement.addEventListener( 'dblclick', onMouseDoubleClick, false);

	const loader_type = SUPPORTED_FORMATS.get(ext);
	if (!loader_type) {
		info.innerHTML = "Unknown extension: '" + ext + "'";
		return [];
	}
	const loader = new loader_type();

	//loader.load(filename, showObject);
	showObject(loader.parse(filedata));

	window.addEventListener( 'resize', onWindowResize, false );
	viewer_elem.replaceChildren(renderer.domElement);
	onWindowResize();
}

function showObject(object) {
	if (object.type == "BufferGeometry") {
		object = new THREE.Mesh(
			object,
			new THREE.MeshPhongMaterial({color: 0xffd700, specular: 0x111111, shininess: 200})
		);
	}

	scene = new THREE.Scene();
	scene.add(new THREE.AmbientLight(0x999999));

	camera = new THREE.PerspectiveCamera(45, 1);
	camera.up.set(0, 0, 1);
	camera.add( new THREE.PointLight( 0xffffff, 0.8 ) );
	scene.add(camera);

	scene.add(object);
	const bbox = new THREE.Box3().setFromObject(object);
	console.log("min =", bbox.min);
	console.log("max =", bbox.max);
	const center = bbox.getCenter(new THREE.Vector3());
	const size = bbox.getSize(new THREE.Vector3());
	console.log("bounding box size =", size);

	// Get bounding box's max axis-aligned distance from the origin, with 10% margin
	const scale = Math.max(Math.abs(bbox.min.x), Math.abs(bbox.min.y), Math.abs(bbox.max.x), Math.abs(bbox.max.y)) * 1.1;
	console.log("scale =", scale);

	// Draw a grid at z=0 that covers the object's x/y dimensions, with 10% margin
	// Choose a power of 10 as unit, such that the grid's axes are divided in at most 100 pieces
	const gridunit = 10 ** Math.ceil(Math.log10(scale / 100));
	// Round up gridsize to multiple of the unit
	var gridsize = Math.ceil(scale / gridunit) * gridunit;
	info.innerHTML = ["grid unit size = " + gridunit].join("<br>");
	console.log("grid units =", gridsize / gridunit);
	// Double to cover positive/negative (grid is centered at origin)
	gridsize *= 2;
	const grid = new THREE.GridHelper( gridsize, gridsize / gridunit, 0xffffff, 0x555555 );
	grid.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), 90 * ( Math.PI/180 ) );
	scene.add( grid );

	// Set a reasonable distance of the far plane that still allows some proper zooming out
	camera.far = scale * 10;
	camera.updateProjectionMatrix();

	// Put camera above and to the left of the bounding box, moved back a bit
	const cam_pos = new THREE.Vector3(size.x * -1/3, size.y * -2/3, size.z * 3/2).add(bbox.min);
	console.log("cam_pos =", cam_pos);
	camera.position.set(cam_pos.x, cam_pos.y, cam_pos.z);

	// Point camera at bounding box center, limit zoom-out to prevent far-plane clipping if focus is on grid corner
	controls = new OrbitControls(camera, renderer.domElement);
	controls.maxDistance = scale * (10 - 2*Math.SQRT2);
	controls.zoomSpeed = 2/3;
	controls.addEventListener('change', render);
	controls.target.set(center.x, center.y, center.z);
	controls.update();
}

function onMouseDoubleClick(event) {
	event.preventDefault();

	var containerWidth = renderer.domElement.clientWidth;
	var containerHeight = renderer.domElement.clientHeight;
	var mouse = new THREE.Vector2();
	mouse.x = (event.clientX / containerWidth) * 2 - 1;
	mouse.y = -(event.clientY / containerHeight) * 2 + 1;
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouse, camera);
	var intersects = raycaster.intersectObjects(scene.children, true);
	if (intersects.length > 0) {
		var p = intersects[0]['point'];
		controls.target.set(p['x'], p['y'], p['z']);
		controls.update();
	}
}

function onWindowResize() {
	const canvas = renderer.domElement;
	canvas.addEventListener( 'dblclick', onMouseDoubleClick, false);
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

	render();
	console.log("rendered:", canvas.offsetWidth, "x", canvas.offsetHeight);
}

function render() {
	renderer.render(scene, camera);
}
