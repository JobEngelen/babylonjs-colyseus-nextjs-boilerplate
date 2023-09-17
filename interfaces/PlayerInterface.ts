import * as BABYLON from 'babylonjs';

export interface IPlayerMesh extends BABYLON.Mesh {
    jumpingSpeed: number;
    jumpCooldown: number;
    isJumping: boolean;
    isFalling: boolean;
    velocity: BABYLON.Vector3;
    speed: number;
    gravity: number;
    moveline: BABYLON.Vector3[];
    lastPosition: BABYLON.Vector3;
}