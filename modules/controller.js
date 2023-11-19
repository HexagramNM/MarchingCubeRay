
export var eShape = 0.3;
export var nShape = 0.3;
export var isosurfaceValue = 7.5;
export var globalColor = new Float32Array([255.0 / 255.0, 144.0 / 255.0, 90.0 / 255.0, 1.0]);
export var lightDir = new Float32Array([1.0, 0.0, 0.0]);
export var zoom = 0.5;

const eShapeBox = document.getElementById("eShapeBox");
const eShapeSlider = document.getElementById("eShapeSlider");
const nShapeBox = document.getElementById("nShapeBox");
const nShapeSlider = document.getElementById("nShapeSlider");
const isosurfaceValueBox = document.getElementById("isosurfaceValueBox");
const isosurfaceValueSlider = document.getElementById("isosurfaceValueSlider");
const redBox = document.getElementById("redBox");
const redSlider = document.getElementById("redSlider");
const greenBox = document.getElementById("greenBox");
const greenSlider = document.getElementById("greenSlider");
const blueBox = document.getElementById("blueBox");
const blueSlider = document.getElementById("blueSlider");
const horizontalLightDirBox = document.getElementById("horizontalLightDirBox");
const horizontalLightDirSlider = document.getElementById("horizontalLightDirSlider");
const verticalLightDirBox = document.getElementById("verticalLightDirBox");
const verticalLightDirSlider = document.getElementById("verticalLightDirSlider");
const zoomSlider = document.getElementById("zoomSlider");

export function controller_init() {
  var mouseupEventName = ["mouseup", "touchend"];
  eShapeBox.addEventListener("change", (event) => {
    eShapeSlider.value = event.target.value;
    eShape = event.target.value;
  });
  for (var idx = 0; idx < mouseupEventName.length; idx++) {
    eShapeSlider.addEventListener(mouseupEventName[idx], (event) => {
      eShapeBox.value = event.target.value;
      eShape = event.target.value;
    });
  }
  nShapeBox.addEventListener("change", (event) => {
    nShapeSlider.value = event.target.value;
    nShape = event.target.value;
  });
  for (var idx = 0; idx < mouseupEventName.length; idx++) {
    nShapeSlider.addEventListener(mouseupEventName[idx], (event) => {
      nShapeBox.value = event.target.value;
      nShape = event.target.value;
    });
  }
  isosurfaceValueBox.addEventListener("change", (event) => {
    isosurfaceValueSlider.value = event.target.value;
  });
  isosurfaceValueSlider.addEventListener("change", (event) => {
    isosurfaceValueBox.value = event.target.value;
  });
  redBox.addEventListener("change", (event) => {
    redSlider.value = event.target.value;
  });
  redSlider.addEventListener("change", (event) => {
    redBox.value = event.target.value;
  });
  greenBox.addEventListener("change", (event) => {
    greenSlider.value = event.target.value;
  });
  greenSlider.addEventListener("change", (event) => {
    greenBox.value = event.target.value;
  });
  blueBox.addEventListener("change", (event) => {
    blueSlider.value = event.target.value;
  });
  blueSlider.addEventListener("change", (event) => {
    blueBox.value = event.target.value;
  });
  horizontalLightDirBox.addEventListener("change", (event) => {
    horizontalLightDirSlider.value = event.target.value;
  });
  horizontalLightDirSlider.addEventListener("change", (event) => {
    horizontalLightDirBox.value = event.target.value;
  });
  verticalLightDirBox.addEventListener("change", (event) => {
    verticalLightDirSlider.value = event.target.value;
  });
  verticalLightDirSlider.addEventListener("change", (event) => {
    verticalLightDirBox.value = event.target.value;
  });
}

export function updateParameter() {
  isosurfaceValue = isosurfaceValueSlider.value;

	globalColor[0] = redSlider.value;
	globalColor[1] = greenSlider.value;
	globalColor[2] = blueSlider.value;

	var horizontalRadian = Math.PI * horizontalLightDirSlider.value / 180.0;
	var verticalRadian = Math.PI * verticalLightDirSlider.value / 180.0;
	lightDir[0] = Math.cos(horizontalRadian) * Math.cos(verticalRadian);
	lightDir[1] = Math.sin(verticalRadian);
	lightDir[2] = Math.sin(horizontalRadian) * Math.cos(verticalRadian);

  zoom = zoomSlider.value;
}
