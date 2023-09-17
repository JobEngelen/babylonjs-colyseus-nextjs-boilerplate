import { PlayerControls, PlayerMovement } from '@/playerBehaviours';
import { ICustomScene } from '@/interfaces/CustomSceneInterface';
import { IPlayerMesh } from '@/interfaces/PlayerInterface';
import * as BABYLON from 'babylonjs';
import { MyRoomState, Player } from '@/server/src/rooms/schema/MyRoomState';
import { Room } from 'colyseus.js';

class CustomScene extends BABYLON.Scene implements ICustomScene {
    public camera!: BABYLON.ArcRotateCamera;
    public world?: BABYLON.Mesh;
    public player?: IPlayerMesh;
    public ready: boolean = false;
    public keyInputMap: { [key: string]: boolean } = {};
    public keyPointMap: { [key: string]: number } = {};
}

export const createScene = (room: Room<MyRoomState>, client_id: string, engine: BABYLON.Engine, canvas: BABYLON.Nullable<HTMLCanvasElement>, clientPlayer: Player): ICustomScene => {
    const scene: ICustomScene = new CustomScene(engine);
    engine.displayLoadingUI();

    scene.camera = new BABYLON.ArcRotateCamera(
        "Camera",
        0,
        Math.PI / 4,
        30,
        new BABYLON.Vector3(0, 10, 0),
        scene,
        true
    );
    scene.camera.attachControl(canvas, true);
    scene.camera.panningSensibility = 0;
    scene.camera.wheelPrecision = 20;
    scene.camera.angularSensibilityX = 200;
    scene.camera.angularSensibilityY = 350;
    scene.camera.inertia = 0.1;

    // Add light
    let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;


    scene.collisionsEnabled = true;
    scene.ready = false;

    createTerrainAndPlayer(scene, (cb: any, ground: BABYLON.Mesh) => {

        // scene.clearColor = new BABYLON.Color4(0, 0, 1 );    
        // I want the sky to be baby blue
        scene.clearColor = new BABYLON.Color4(0.529, 0.808, 0.922, 1);

        scene.world = ground;
        scene.player = BABYLON.MeshBuilder.CreateCylinder('CLIENT_PLAYER', { diameterTop: 2, diameterBottom: 2, height: 3.5, tessellation: 16, subdivisions: 1 }, scene) as IPlayerMesh;
        scene.player.position = new BABYLON.Vector3(clientPlayer.position.x, 40, clientPlayer.position.z);
        scene.player.lastPosition = new BABYLON.Vector3(0, 0, 0);
        scene.player.ellipsoid = new BABYLON.Vector3(2.5, 1.0, 2.5);
        scene.player.ellipsoidOffset = new BABYLON.Vector3(0, 1.0, 0);
        scene.player.checkCollisions = true;
        scene.player.useOctreeForCollisions = true;
        scene.player.isVisible = true;
        let material = new BABYLON.StandardMaterial("player", scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 1);
        scene.player.material = material;

        // Set pivot to stick LocalY with ground
        scene.player.setPivotMatrix(BABYLON.Matrix.Translation(0, 1.5, 0), false);

        // Custom
        scene.player.jumpingSpeed = 0; // if direction
        scene.player.jumpCooldown = 500;
        scene.player.isJumping = false;
        scene.player.isFalling = false;
        scene.player.velocity = new BABYLON.Vector3(0, 0, 0);
        scene.player.speed = 0;
        scene.player.gravity = 0;
        scene.player.isPickable = false;
        scene.player.collisionMask = 1;
        scene.player.moveline = [];

        // set camera view fixed to player
        scene.camera.alpha = scene.player.rotation.y - Math.PI / 2;
        scene.camera.lockedTarget = scene.player;

        engine.hideLoadingUI();
        PlayerControls(room, scene, client_id);
        // Start loop
        scene.ready = true;
    });

    scene.registerBeforeRender(() => {
        if (scene.ready) gameLoop(scene, client_id, room);
    });

    return scene;
};

// World Terrain Function
const createTerrainAndPlayer = (scene: ICustomScene, callback: { (cb: any, ground: BABYLON.Mesh): void; (arg0: boolean, arg1: BABYLON.GroundMesh): void; }) => {
    let ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);

    let groundMaterial = new BABYLON.StandardMaterial("ground", scene);
    // Make the color green
    groundMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    ground.material = groundMaterial;

    ground.checkCollisions = true;

    ground.freezeWorldMatrix();

    callback(true, ground);
};


// Game loop there is implentement movement and Checking Collision
const gameLoop = (scene: ICustomScene, client_id: string, room: Room<MyRoomState>) => {
    PlayerMovement(scene, client_id, room);
};