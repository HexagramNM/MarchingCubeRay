
import {MarchingCubeRay_init} from "./modules/marchingCubeRay.js";
import {controller_init} from "./modules/controller.js";

function MarchingCubeRay_onload() {
    document.bgColor=g_backgroundColorCode;
    controller_init();
    MarchingCubeRay_init();
}

window.addEventListener("load", MarchingCubeRay_onload);
