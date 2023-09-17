import { MyRoomState, Player } from '@/server/src/rooms/schema/MyRoomState';
import * as GUI from 'babylonjs-gui';
import { Room } from 'colyseus.js';

interface GUIProps {
    room: Room<MyRoomState>;
    players: Player[];
    client_id: string;
    chatMessages: string[];
}

let advancedTexture: GUI.AdvancedDynamicTexture | null = null;
let textBlock: GUI.TextBlock | null = null;
let chatBlock: GUI.TextBlock | null = null;
let inputText: GUI.InputText | null = null;
let sendButton: GUI.Button | null = null;

export const createGUI = ({ room, players, client_id, chatMessages }: GUIProps): void => {
    if (!advancedTexture) {
        advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    }

    if (!textBlock) {
        textBlock = new GUI.TextBlock();
        textBlock.color = 'white';
        textBlock.fontSize = 14;
        textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        advancedTexture.addControl(textBlock);
    }

    if (!chatBlock) {
        chatBlock = new GUI.TextBlock();
        chatBlock.color = 'white';
        chatBlock.fontSize = 14;
        chatBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        chatBlock.top = '-30px';
        advancedTexture.addControl(chatBlock);
    }

    if (!inputText) {
        inputText = new GUI.InputText("input", "");
        inputText.width = '200px';
        inputText.height = '30px'; // Adjust the height to a single line height
        inputText.color = 'black';
        inputText.fontSize = 14;
        inputText.background = 'gray';
        inputText.focusedBackground = 'white';
        inputText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        inputText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        advancedTexture.addControl(inputText);
    }

    if (!sendButton) {
        sendButton = GUI.Button.CreateSimpleButton('sendButton', 'Send');
        sendButton.width = '60px';
        sendButton.height = '30px';
        sendButton.color = 'white';
        sendButton.background = 'black';
        sendButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        sendButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        sendButton.left = '200px';
        advancedTexture.addControl(sendButton);
    }

    const updateChatText = () => {
        // Update the upper text block with the current room and player information
        if (textBlock) {
            textBlock.text = 'Room: ' +
                room.id + '\n' +
                'Client ID: ' + client_id + '\n' +
                'Current players in room: ' + players.length + '\n\n' +
                players.map((player) => {
                    if (player.position) {
                        return '> ' + player.id + ' (x: ' + player.position.x + ', y: ' + player.position.y + ', z: ' + player.position.z + ')';
                    }
                }).join('\n');

            textBlock.height = '100%';
            textBlock.paddingLeft = 10;
            textBlock.paddingTop = 10;
        }

        // Update the lower text block with the current chat messages
        if (chatBlock) {
            chatBlock.text = chatMessages.slice(Math.max(chatMessages.length - 10, 0)).map((message) => {
                return message;
            }).join('\n');
            chatBlock.height = '100%';
            chatBlock.paddingLeft = 10;
            chatBlock.paddingBottom = 10;
        }
    };

    updateChatText();


    const sendMessage = () => {
        if (inputText) {
            const message = inputText.text;

            // Filter out all non-alphanumeric characters
            const regex = /[^a-zA-Z0-9 ]/g;
            message.replace(regex, '');

            if (message.length > 0) {
                console.log('message.length = ' + message.length, ' message = "' + message + '"')
                // Construct a message object with the player's name and message content
                const chatMessage = `${room.sessionId}: ${message}`;

                // Broadcast the chat message to all clients
                room.send('chat_message', { content: chatMessage });

                inputText.text = "";
            }
        }
    };

    // Send the message when the user presses enter
    inputText.onKeyboardEventProcessedObservable.add((kbInfo) => {
        if (kbInfo.code === 'Enter') sendMessage();
    });

    sendButton.onPointerUpObservable.add(sendMessage);
};
