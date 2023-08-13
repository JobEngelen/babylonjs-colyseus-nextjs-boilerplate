import { Room, Client } from '@colyseus/core';
import { MyRoomState } from './schema/MyRoomState';
import { PlayerMessage } from './schema/PlayerMessage';

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.maxClients = 8;

    this.onMessage('chat_message', (client, message) => {
      console.log('Chat message received: ', message);
      this.broadcast('chat_message', message); // Broadcast the message
    });
  }

  onJoin(client: Client, options: any) {
    this.state.players.push(client.sessionId);
    
    const message = new PlayerMessage();
    message.type = 'player_joined';
    message.playerId = client.sessionId;

    console.log('Player joined: ', client.sessionId);
    console.log('Total players: ', this.state.players.length);

    this.broadcast(message);
  }
  
  onLeave(client: Client, consented: boolean) {
    const index = this.state.players.indexOf(client.sessionId);
    if (index !== -1) {
      this.state.players.splice(index, 1);

      const playerLeftMessage = new PlayerMessage();
      playerLeftMessage.type = 'player_left';
      playerLeftMessage.playerId = client.sessionId;

      console.log('Player left: ', client.sessionId);

      this.broadcast('player_left', playerLeftMessage); // Broadcast the message
    }
  }

  onDispose() {
    console.log('Room disposed.');
  }
}
