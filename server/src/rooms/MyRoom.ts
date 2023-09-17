import { Room, Client } from '@colyseus/core';
import { MyRoomState, Player, Position } from './schema/MyRoomState';
import { PlayerMessage } from './schema/PlayerMessage';

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.maxClients = 8;

    // Listen to chat messages from the client and broadcast them to everyone in the room
    this.onMessage('chat_message', (client, message) => {
      console.log('Chat message received: ', message);
      this.broadcast('chat_message', message); // Broadcast the message
    });

    // Listen to player movement messages from the client and broadcast them to everyone in the room
    this.onMessage('move_player', (client, playerData) => {
      // Check if the player exists in the map
      if (this.state.players.has(playerData.id)) {
        // Update the player position
        this.state.players.get(playerData.id).position.x = playerData.position.x;
        this.state.players.get(playerData.id).position.y = playerData.position.y;
        this.state.players.get(playerData.id).position.z = playerData.position.z;
        console.log('Moved player: ', playerData.id, ' to position: ', playerData.position);
      }
    });
  }

  // This method is called when a client tries to join the room
  onJoin(client: Client, options: any) {
    if (options.isCreator) {
      // Only the creator joins the room automatically upon creation
      return;
    }

    // Generate a consistent random position for the new player
    const randomX = Math.random() * 4 - 2; // Replace with your desired range
    const randomZ = Math.random() * 4 - 2; // Replace with your desired range

    // Create a new player instance
    const player = new Player();
    player.id = client.sessionId;

    // Set the player position
    const position = new Position();
    position.x = randomX;
    position.y = 1.7; // You can set the Y position here
    position.z = randomZ;

    player.position = position;
    player.lastPosition = position;
    // Add the player to the state
    this.state.players.set(player.id, player);

    // Send a message to the new player with the current state
    const message = new PlayerMessage();
    message.type = 'player_joined';
    message.playerId = client.sessionId;

    console.log('Player joined: ', client.sessionId);
    console.log('Total players: ', this.state.players.size);

    this.broadcast(message);
  }

  // This method is called when a client leaves the room
  onLeave(client: Client, consented: boolean) {
    // Check if the player exists in the map
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);

      const playerLeftMessage = new PlayerMessage();
      playerLeftMessage.type = 'player_left';
      playerLeftMessage.playerId = client.sessionId;

      console.log('Player left: ', client.sessionId);

      this.broadcast('player_left', playerLeftMessage); // Broadcast the message
    }
  }

  // This method is called when the last client leaves the room
  onDispose() {
    console.log('Room disposed.');
  }
}
