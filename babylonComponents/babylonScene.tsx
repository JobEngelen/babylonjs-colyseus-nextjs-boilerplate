import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { Room } from 'colyseus.js';
import { MyRoomState, Player } from '@/server/src/rooms/schema/MyRoomState';
import { IPlayerData } from '@/interfaces/PlayerDataInterface';

interface BabylonSceneProps {
  room: Room<MyRoomState>;
  players: Player[];
  client_id: string;
}

const BabylonScene = ({ room, players, client_id }: BabylonSceneProps) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const instanceMeshesRef = useRef<Map<string, BABYLON.InstancedMesh>>(new Map());
  const groundRef = useRef<BABYLON.Mesh | null>(null);
  const cylinderMeshRef = useRef<BABYLON.Mesh | null>(null);

  // Initialize the scene when the component mounts
  const initializeScene = () => {
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    sceneRef.current = scene;
    setupCamera(scene);
    setupLight(scene);
    setupGround(scene);
    setupCylinderMesh(scene);

    const animate = () => {
      scene.render();
    };

    engine.runRenderLoop(animate);

    const resize = () => {
      engine.resize();
    };

    window.addEventListener('resize', resize);

    return () => {
      cleanupScene(engine);
      window.removeEventListener('resize', resize);
    };
  };

  // Setup the camera
  const setupCamera = (scene: BABYLON.Scene) => {
    const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
  };

  // Setup the light
  const setupLight = (scene: BABYLON.Scene) => {
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  };

  // Setup the ground
  const setupGround = (scene: BABYLON.Scene) => {
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green color
    ground.material = groundMaterial;
    groundRef.current = ground;
  };

  // Setup the cylinder (player) mesh
  const setupCylinderMesh = (scene: BABYLON.Scene) => {
    const cylinderMesh = BABYLON.MeshBuilder.CreateCylinder(
      'cylinder',
      { diameterTop: 0.5, diameterBottom: 0.5, height: 1 },
      scene
    );
    cylinderMesh.setEnabled(false);
    cylinderMeshRef.current = cylinderMesh; // Store the reference to the cylinder mesh
  };

  // Cleanup the scene when the component unmounts
  const cleanupScene = (engine: BABYLON.Engine) => {
    if (sceneRef.current) {
      sceneRef.current.dispose();
    }
    engine.dispose();
  };

  // Move the player when the ground is clicked to the clicked position
  const handleGroundClick = (event: BABYLON.PointerInfo) => {
    if (sceneRef.current && event.event.button === 0) {
      const pickResult = sceneRef.current.pick(sceneRef.current.pointerX, sceneRef.current.pointerY);
      if (pickResult && pickResult.hit && pickResult.pickedMesh === groundRef.current && client_id) {
        const newPosition = pickResult.pickedPoint;
        if (newPosition) {
          newPosition.y = 0.5;
          updatePlayerPosition(newPosition);
        }
      }
    }
  };

  // Update the player position in the room state
  const updatePlayerPosition = (newPosition: BABYLON.Vector3) => {
    const playerData: IPlayerData = {
      id: client_id,
      position: {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
      },
    };
    movePlayer(playerData);
  };

  // Send the player position to the server
  const movePlayer = (playerData: IPlayerData) => {
    room.send('move_player', playerData);
  };

  // Call the initializeScene function only once (when the component mounts)
  useEffect(() => {
    initializeScene();
  }, []);

  // Update the player meshes when the players array changes
  useEffect(() => {
    if (sceneRef.current && groundRef.current) {
      updatePlayerMeshes(players);
    }
  }, [players]);

  // Update the player meshes when the client_id changes
  const updatePlayerMeshes = (players: Player[]) => {
    const activePlayerIds = new Set<string>();

    players.forEach((player) => {
      if (player.position && sceneRef.current) {
        activePlayerIds.add(player.id);

        let cloneMesh = instanceMeshesRef.current.get(player.id) as unknown as BABYLON.Mesh;

        if (!cloneMesh) {
          cloneMesh = createNewPlayerMesh(player.id, cylinderMeshRef.current!);
        }

        cloneMesh.position = new BABYLON.Vector3(player.position.x, player.position.y, player.position.z);

        if (player.id === client_id) {
          customizeClientMesh(cloneMesh);
          sceneRef.current.onPointerObservable.add(handleGroundClick, BABYLON.PointerEventTypes.POINTERDOWN);
        }

        cloneMesh.setEnabled(true);
      }
    });

    // Remove the meshes of inactive players (that left the room)
    removeInactivePlayerMeshes(activePlayerIds);
  };

  // Create a new player (cylinder) mesh
  const createNewPlayerMesh = (playerId: string, cylinderMesh: BABYLON.Mesh) => {
    const cloneMesh = cylinderMesh.clone(playerId);
    instanceMeshesRef.current.set(playerId, cloneMesh as unknown as BABYLON.InstancedMesh);
    return cloneMesh;
  };

  // Customize the client player mesh to make it red
  const customizeClientMesh = (cloneMesh: BABYLON.Mesh) => {
    const material = new BABYLON.StandardMaterial('material', sceneRef.current!);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    cloneMesh.material = material;
  };

  // Remove the meshes of inactive players (that left the room)
  const removeInactivePlayerMeshes = (activePlayerIds: Set<string>) => {
    instanceMeshesRef.current.forEach((instanceMesh, playerId) => {
      if (!activePlayerIds.has(playerId)) {
        instanceMesh.dispose();
        instanceMeshesRef.current.delete(playerId);
      }
    });
  };

  // Render the canvas html element
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default BabylonScene;
