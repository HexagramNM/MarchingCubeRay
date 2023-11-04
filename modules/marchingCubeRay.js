
import {matIV} from "./minMatrix.js";
import {create_vbo,
	create_ibo,
	create_shader,
	create_program} from "./createWebGLObj.js";
import {isosurfaceValue,
	globalColor,
	lightDir,
	updateParameter} from "./controller.js";

import normalVshaderSrc from "./../shaders/normalVshader.vert.js";
import normalFshaderSrc from "./../shaders/normalFshader.frag.js";

var timeInfo = {
	count: 0,
	fps: 60.0,
	previousTimeStep: null,
	performaceStartTime: null,
	frameCount: 0
};
var canvasSize = {
	width: 1280,
	height: 720
};
var cubeInfo = {
	size: 0.2,
	num: 64
};
var bufferInfo = {
	position_vbo: null,
	position_data: null,
	cubePos_vbo: null,
	cubePos_data:null,
	cubeBase_vbo: null,
	cubeBase_data: null,
	index_ibo: null,
	index_num: 0,
	functionValue_tex: null,
	functionValue_data: null
};
var normalShaderInfo = {
	program: null,
	attLocation: new Array(),
	attStride: new Array(),
	uniLocation: new Array()
};

var m = new matIV();
var mMatrix = m.identity(m.create());
var vMatrix = m.identity(m.create());
var pMatrix = m.identity(m.create());
var vpMatrix = m.identity(m.create());
var mvMatrix = m.identity(m.create());
var mvMatrixTranspose = m.identity(m.create());
var mvpMatrix = m.identity(m.create());

var cubeBasePosition = [
	0.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	0.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	0.0, 0.0, 1.0,
	1.0, 0.0, 1.0,
	0.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
];

var cubeBaseIndex = [
	1, 3, 7,
	1, 7, 5,
	2, 0, 6,
	6, 0, 4,
	2, 7, 3,
	2, 6, 7,
	0, 1, 5,
	0, 5, 4,
	0, 2, 1,
	1, 2, 3,
	4, 5, 6,
	5, 7, 6
];

function functionValue(x, y, z) {
	var se_e = 0.5;
	var se_n = 0.5;
	var superElipsoid = Math.pow(Math.pow(Math.abs(x), 2.0 / se_e) + Math.pow(Math.abs(y), 2.0 / se_e), se_e / se_n)
		+ Math.pow(Math.abs(z), 2.0 / se_n);
	return superElipsoid;
}

function createCubeBuffer() {
	const maxCubeNumInOneVbo = 64 * 64;
	const vboNum = Math.round(Math.pow(cubeInfo.num, 3)) / maxCubeNumInOneVbo;
	const positionNum = maxCubeNumInOneVbo * cubeBasePosition.length;
	const cubeBasePositionNum = cubeBasePosition.length / 3;
	bufferInfo.index_num = maxCubeNumInOneVbo * cubeBaseIndex.length;
	const entireSize = cubeInfo.num * cubeInfo.size;
	bufferInfo.position_data = new Array(vboNum);
	bufferInfo.cubePos_data = new Array(vboNum);
	bufferInfo.cubeBase_data = new Array(vboNum);

	for (var vboIdx = 0; vboIdx < vboNum; vboIdx++) {
		bufferInfo.position_data[vboIdx] = new Float32Array(positionNum);
		bufferInfo.cubePos_data[vboIdx] = new Float32Array(positionNum);
		bufferInfo.cubeBase_data[vboIdx] = new Float32Array(positionNum);
	}

	var cubeIdx = 0;
	var vboIdx = 0;
	for (var z = 0; z < cubeInfo.num; z++) {
		for (var y = 0; y < cubeInfo.num; y++) {
			for (var x = 0; x < cubeInfo.num; x++) {
				var basePos = [
					x * cubeInfo.size - entireSize * 0.5,
					y * cubeInfo.size - entireSize * 0.5,
					z * cubeInfo.size - entireSize * 0.5
				];

				// position
				for (var idx = 0; idx < cubeBasePosition.length; idx++) {
					bufferInfo.position_data[vboIdx][cubeIdx * cubeBasePosition.length + idx]
						= basePos[idx % 3] + cubeBasePosition[idx] * cubeInfo.size;
				}

				// cubePos
				for (var idx = 0; idx < cubeBasePosition.length; idx++) {
					bufferInfo.cubePos_data[vboIdx][cubeIdx * cubeBasePosition.length + idx] = cubeBasePosition[idx];
				}

				// cubeBase
				for (var idx = 0; idx < cubeBasePositionNum; idx++) {
					bufferInfo.cubeBase_data[vboIdx][cubeIdx * cubeBasePosition.length + idx * 3 + 0] = x / cubeInfo.num;
					bufferInfo.cubeBase_data[vboIdx][cubeIdx * cubeBasePosition.length + idx * 3 + 1] = y / cubeInfo.num;
					bufferInfo.cubeBase_data[vboIdx][cubeIdx * cubeBasePosition.length + idx * 3 + 2] = z / cubeInfo.num;
				}

				cubeIdx++;
				if (cubeIdx >= maxCubeNumInOneVbo) {
					cubeIdx = 0;
					vboIdx++;
				}
			}
		}
	}
	bufferInfo.position_vbo = create_vbo(bufferInfo.position_data[0], true);
	bufferInfo.cubePos_vbo = create_vbo(bufferInfo.cubePos_data[0], true);
	bufferInfo.cubeBase_vbo = create_vbo(bufferInfo.cubeBase_data[0], true);

	// ibo
	var index = new Uint16Array(bufferInfo.index_num);
	for (cubeIdx = 0; cubeIdx < maxCubeNumInOneVbo; cubeIdx++) {
			for (var idx = 0; idx < cubeBaseIndex.length; idx++) {
				index[cubeIdx * cubeBaseIndex.length + idx]
					= 8 * cubeIdx + cubeBaseIndex[idx];
			}
	}
	bufferInfo.index_ibo = create_ibo(index);
}

function createFunctionValueTexture() {
	const entireSize = cubeInfo.num * cubeInfo.size;

	bufferInfo.functionValue_data = new Float32Array(Math.round(Math.pow(cubeInfo.num + 1, 3)));
	var vertIdx = 0;
	for (var z = 0; z <= cubeInfo.num; z++) {
		for (var y = 0; y <= cubeInfo.num; y++) {
			for (var x = 0; x <= cubeInfo.num; x++) {
				var basePos = [
					x * cubeInfo.size - entireSize * 0.5,
					y * cubeInfo.size - entireSize * 0.5,
					z * cubeInfo.size - entireSize * 0.5
				];

				bufferInfo.functionValue_data[vertIdx] = functionValue(basePos[0], basePos[1], basePos[2]);
				vertIdx++;
			}
		}
	}

	bufferInfo.functionValue_tex = g_gl.createTexture();
	g_gl.activeTexture(g_gl.TEXTURE0);
	g_gl.bindTexture(g_gl.TEXTURE_3D, bufferInfo.functionValue_tex);
	g_gl.texImage3D(g_gl.TEXTURE_3D, 0, g_gl.R32F, cubeInfo.num + 1, cubeInfo.num + 1,
		cubeInfo.num + 1, 0, g_gl.RED, g_gl.FLOAT, bufferInfo.functionValue_data);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_MAG_FILTER, g_gl.NEAREST);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_MIN_FILTER, g_gl.NEAREST);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_S, g_gl.CLAMP_TO_EDGE);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_T, g_gl.CLAMP_TO_EDGE);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_R, g_gl.CLAMP_TO_EDGE);
}

function adjustCanvasSize() {
	var c = document.getElementById('MarchingCubeRay_Output');
	var currentWidth = document.documentElement.clientWidth * 0.8;
	var currentHeight = document.documentElement.clientHeight;
	var widthMargin = 0;
	var heightMargin = 0;

	if (currentWidth * canvasSize.height / canvasSize.width > currentHeight) {
		currentWidth = currentHeight * canvasSize.width / canvasSize.height;
		widthMargin = (document.documentElement.clientWidth - currentWidth) * 0.5;
	}
	else {
		currentHeight = currentWidth * canvasSize.height / canvasSize.width;
		heightMargin = (document.documentElement.clientHeight - currentHeight) * 0.5;
	}

	if (c.width != currentWidth || c.height != currentHeight) {
		c.width = currentWidth;
		c.height = currentHeight;
		g_gl.viewport(0, 0, c.width, c.height);
		g_gl.blendFunc(g_gl.SRC_ALPHA, g_gl.ONE_MINUS_SRC_ALPHA);
	}
	c.style.margin = heightMargin.toString() + "px " + widthMargin.toString() + "px";
}

function setupShaderProgram(shaderInfo) {
	shaderInfo.attLocation[0]=g_gl.getAttribLocation(shaderInfo.program, 'position');
	shaderInfo.attStride[0]=3;
	shaderInfo.attLocation[1]=g_gl.getAttribLocation(shaderInfo.program, 'cubePos');
	shaderInfo.attStride[1]=3;
	shaderInfo.attLocation[2]=g_gl.getAttribLocation(shaderInfo.program, 'cubeBase');
	shaderInfo.attStride[2]=3;
	shaderInfo.uniLocation[0] = g_gl.getUniformLocation(shaderInfo.program, 'mvpMatrix');
	shaderInfo.uniLocation[1] = g_gl.getUniformLocation(shaderInfo.program, 'mvMatrix');
	shaderInfo.uniLocation[2] = g_gl.getUniformLocation(shaderInfo.program, 'mvMatrixTranspose');
	shaderInfo.uniLocation[3] = g_gl.getUniformLocation(shaderInfo.program, 'cubeNum');
	shaderInfo.uniLocation[4] = g_gl.getUniformLocation(shaderInfo.program, 'functionValueTexUnit');
	shaderInfo.uniLocation[5] = g_gl.getUniformLocation(shaderInfo.program, 'isosurfaceValue');
	shaderInfo.uniLocation[6] = g_gl.getUniformLocation(shaderInfo.program, 'globalColor');
	shaderInfo.uniLocation[7] = g_gl.getUniformLocation(shaderInfo.program, 'lightDir');
}

export function MarchingCubeRay_init() {
	var c = document.getElementById('MarchingCubeRay_Output');
	if (!c || !(c.getContext)) {
		return;
	}
	g_gl=c.getContext('webgl2');
	g_gl.getExtension("EXT_color_buffer_float");

	adjustCanvasSize();

	var v_shader=create_shader(normalVshaderSrc, "x-shader/x-vertex");
	var f_shader=create_shader(normalFshaderSrc, "x-shader/x-fragment");

	//normalShaderのプログラム設定
	normalShaderInfo.program = create_program(v_shader, f_shader);
	setupShaderProgram(normalShaderInfo);

	g_gl.enable(g_gl.BLEND);
	g_gl.blendFunc(g_gl.SRC_ALPHA, g_gl.ONE_MINUS_SRC_ALPHA);
	g_gl.enable(g_gl.CULL_FACE);
	g_gl.enable(g_gl.DEPTH_TEST);
	g_gl.depthFunc(g_gl.LEQUAL);

	m.lookAt([0.0, 7.0, -18.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
	m.perspective(60.0, c.width/c.height, 1.0, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, vpMatrix);

	createCubeBuffer();
	createFunctionValueTexture();

	timeInfo.previousTimestamp =  performance.now();
	requestAnimationFrame(MarchingCubeRay_main);
}

function draw() {
	g_gl.clearColor(0.0, 0.0, 0.0, 0.0);
	g_gl.clearDepth(1.0);
	g_gl.clear(g_gl.COLOR_BUFFER_BIT | g_gl.DEPTH_BUFFER_BIT);
	g_gl.useProgram(normalShaderInfo.program);

	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.position_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[0]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[0], normalShaderInfo.attStride[0], g_gl.FLOAT, false, 0, 0);
	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubePos_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[1]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[1], normalShaderInfo.attStride[1], g_gl.FLOAT, false, 0, 0);
	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubeBase_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[2]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[2], normalShaderInfo.attStride[2], g_gl.FLOAT, false, 0, 0);
	g_gl.bindBuffer(g_gl.ELEMENT_ARRAY_BUFFER, bufferInfo.index_ibo);

	var rad=(timeInfo.count - Math.floor(timeInfo.count / 720.0) * 720.0) * Math.PI/360;
	var x = Math.cos(rad);
	var y = Math.sin(rad);
	m.identity(mMatrix);
	m.rotate(mMatrix, rad, [0.0, 1.0, 0.0], mMatrix);
	m.multiply(vpMatrix, mMatrix, mvpMatrix);
	m.multiply(vMatrix, mMatrix, mvMatrix);
	m.transpose(mvMatrix, mvMatrixTranspose);

	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[0], false, mvpMatrix);
	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[1], false, mvMatrix);
	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[2], false, mvMatrixTranspose);
	g_gl.uniform1f(normalShaderInfo.uniLocation[3], cubeInfo.num);
	g_gl.uniform1i(normalShaderInfo.uniLocation[4], 0);
	g_gl.uniform1f(normalShaderInfo.uniLocation[5], isosurfaceValue);
	g_gl.uniform4fv(normalShaderInfo.uniLocation[6], globalColor);
	g_gl.uniform3fv(normalShaderInfo.uniLocation[7], lightDir);

	for (var vboIdx = 0; vboIdx < bufferInfo.position_data.length; vboIdx++) {
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.position_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.position_data[vboIdx]);
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubePos_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.cubePos_data[vboIdx]);
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubeBase_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.cubeBase_data[vboIdx]);
		g_gl.drawElements(g_gl.TRIANGLES, bufferInfo.index_num, g_gl.UNSIGNED_SHORT, 0);
	}

	g_gl.flush();
}

function MarchingCubeRay_main() {
	if (timeInfo.frameCount == 0) {
		timeInfo.performanceStartTime = performance.now();
	}
	adjustCanvasSize();
	updateParameter();
	draw();
	var endTime = performance.now();
	timeInfo.count += (endTime - timeInfo.previousTimestamp) * timeInfo.fps * 0.001;
	timeInfo.previousTimestamp = endTime;
	timeInfo.frameCount++;
	if (timeInfo.frameCount >= 60) {
		var resultFps = timeInfo.frameCount / ((endTime - timeInfo.performanceStartTime) * 0.001);
		document.getElementById("fpsText").innerHTML = Math.round(resultFps * 10.0) / 10.0;
		timeInfo.frameCount = 0;
	}
	requestAnimationFrame(MarchingCubeRay_main);
}
