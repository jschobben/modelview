modelview
=========

This is a quick & dirty 3D model viewer, using [Three.js](https://threejs.org/) to do all the hard work.

Its main purpose is viewing colored 3MF and AMF models, as produced by [ColorSCAD](https://github.com/jschobben/colorscad). 
Besides 3MF and AMF, it also supports viewing STL models, and gcode paths.

Non-colored models (such as STL) are rendered in the "gold" color, which is shamelessly copied from [OpenSCAD](https://openscad.org/).

Requirements
------------

[A working version is hosted on GitHub pages](https://jschobben.github.io/modelview/).

To run it locally, all that's needed are some of the files from `Three.js`.
Instead of the traditional `npm install` command, a small script is included that fetches only the files needed.
Simply run it from the repo root: `./fetch_deps.sh`.

Then you'd need to point a browser at `index.htm`. But due to CORS protection in modern browsers,
that won't work using local access via a `file://` URL.
Instead, run a web server to serve the content.
If you have Python 3 installed, that can be as simple as running this from the repo root:
```
python3 -m http.server 8000 --bind 127.0.0.1
```
Then, point your browser at `http://localhost:8000`.

Usage
-----

Use the "Browse" button at the top-left to open a model.
Once loaded, the model is shown on a grid at Z=0; the size of each grid cell is mentioned below the "Browse" button.

Controls:
- Rotate: drag the mouse, or swipe
- Pan: right-button drag, or two-finger swipe
- Zoom: scrollwheel, or pinch
- Center view on a point: double-click/tap
