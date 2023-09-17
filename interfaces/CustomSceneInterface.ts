import { IPlayerMesh } from "./PlayerInterface";
import * as BABYLON from 'babylonjs';

export interface ICustomScene extends BABYLON.Scene {
    camera: BABYLON.ArcRotateCamera;
    world?: BABYLON.Mesh;
    player?: IPlayerMesh;
    ready: boolean;
    keyInputMap: { [key: string]: boolean };
    keyPointMap: { [key: string]: number };
}