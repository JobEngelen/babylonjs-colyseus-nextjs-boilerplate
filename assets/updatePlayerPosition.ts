import { IPlayerData } from "@/interfaces/PlayerDataInterface";
import { MyRoomState } from "@/server/src/rooms/schema/MyRoomState";
import * as BABYLON from 'babylonjs';
import { Room } from "colyseus.js";

// Update the player position in the room state
export const updatePlayerPosition = (newPosition: BABYLON.Vector3, client_id: string, room: Room<MyRoomState>) => {
    const playerData: IPlayerData = {
        id: client_id,
        position: {
            x: newPosition.x,
            y: newPosition.y + 1.5,
            z: newPosition.z,
        },
        lastPosition: {
            x: newPosition.x,
            y: newPosition.y + 1.5,
            z: newPosition.z,
        },
    };
    movePlayer(playerData, room);
};

// Send the player position to the server
const movePlayer = (playerData: IPlayerData, room: Room<MyRoomState>) => {
    room.send('move_player', playerData);
};