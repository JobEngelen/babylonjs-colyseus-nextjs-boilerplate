import { updatePlayerPosition } from '@/assets/updatePlayerPosition';
import { ICustomScene } from '@/interfaces/CustomSceneInterface';
import { MyRoomState } from '@/server/src/rooms/schema/MyRoomState';
import * as BABYLON from 'babylonjs';
import { Room } from 'colyseus.js';

// Adding input into the game
export const PlayerControls = (room: Room<MyRoomState>, scene: ICustomScene, client_id: string) => {
    scene.keyInputMap = {};

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                scene.keyInputMap[kbInfo.event.keyCode] = true;
                scene.keyInputMap[kbInfo.event.key] = true;
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                scene.keyInputMap[kbInfo.event.keyCode] = false;
                scene.keyInputMap[kbInfo.event.key] = false;
                break;
        }
    });
}


