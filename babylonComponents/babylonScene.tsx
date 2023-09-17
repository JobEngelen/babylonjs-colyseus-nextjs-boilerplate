import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import { createScene } from '@/assets/createScene';
import { Room } from 'colyseus.js';
import { MyRoomState, Player } from '@/server/src/rooms/schema/MyRoomState';
import { ICustomScene } from '@/interfaces/CustomSceneInterface';
import { createExistingPlayers } from '@/assets/createExistingPlayers';
import { createNewPlayers } from '@/assets/createNewPlayer';
import { createGUI } from '@/assets/createGUI';

interface BabylonSceneProps {
    room: Room<MyRoomState>;
    players: Player[];
    client_id: string;
    newestPlayer: Player | null;
    playerLeft: string;
    chatMessages: string[];
}

export default function BabylonScene(
    {
        room,
        players,
        client_id,
        newestPlayer,
        playerLeft,
        chatMessages
    }: BabylonSceneProps) {

    const canvasRef = useRef(null);
    const mounted = useRef(false);
    const mountedExistingPlayers = useRef(false);
    const sceneRef = useRef<ICustomScene | null>(null);

    // Create the scene
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            canvasRef.current &&
            players.length > 0 &&
            client_id &&
            !mounted.current
        ) {

            const clientPlayer = players.find((player) => player.id === client_id);
            if (!clientPlayer) return;

            // Set the flag to indicate that the component has mounted
            mounted.current = true;

            const engine = new BABYLON.Engine(canvasRef.current, true);
            const renderScene = createScene(room, client_id, engine, canvasRef.current, clientPlayer);

            engine.runRenderLoop(() => renderScene.render());

            sceneRef.current = renderScene;

            window.addEventListener('resize', function () {
                engine.resize();
            });
        }

        // Create the existing players/update player positions
        if (sceneRef.current &&
            players.length > 1 &&
            client_id &&
            !mountedExistingPlayers.current
        ) {
            createExistingPlayers(players, client_id, sceneRef.current);
            mountedExistingPlayers.current = true;
        }

        // Update player positions in a smooth way
        if (sceneRef.current && players.length > 1) {
            movePlayers()
        }
    }, [players, client_id]);

    // Move players in a smooth way
    const movePlayers = () => {
        players.forEach((player) => {
            if (player.id !== client_id) {
                const playerMesh = sceneRef.current?.getMeshByName(player.id);

                if (playerMesh) {
                    const playerPosition = new BABYLON.Vector3(player.position.x, player.position.y, player.position.z);
                    const animation = new BABYLON.Animation("playerAnimation", "position", 1, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    const keys = [];
                    keys.push({
                        frame: 0,
                        value: playerMesh.position
                    });
                    keys.push({
                        frame: 1,
                        value: playerPosition
                    });
                    animation.setKeys(keys);
                    playerMesh.animations = [];
                    playerMesh.animations.push(animation);
                    sceneRef.current?.beginAnimation(playerMesh, 0, 1, false, 4); // 4 indicates animation speed
                }
            }
        });
    }

    // Create new players
    useEffect(() => {
        if (mountedExistingPlayers.current && newestPlayer) {
            createNewPlayers(newestPlayer, client_id, sceneRef.current);
        }
    }, [mountedExistingPlayers.current, newestPlayer]);

    // Update the GUI when a player joins or leaves
    useEffect(() => {
        if (sceneRef.current) createGUI({ room, players, client_id, chatMessages });
    }, [players, chatMessages]);

    // Remove player
    useEffect(() => {
        if (playerLeft !== '') {
            const playerToRemove = sceneRef.current?.getMeshByName(playerLeft);
            if (playerToRemove) {
                playerToRemove.dispose();
            }
        }
    }, [playerLeft]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
}