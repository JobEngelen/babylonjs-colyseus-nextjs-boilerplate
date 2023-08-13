'use client';
import { useEffect, useState } from 'react';
import { Room } from 'colyseus.js';
import { useParams } from 'next/navigation';
import { client } from '@/Instances/ColyseusClient';
import { MyRoomState } from '@/server/src/rooms/schema/MyRoomState';

const Page = () => {
  const { roomName } = useParams();
  const [room, setRoom] = useState<Room<MyRoomState> | null>(null);
  const [players, setPlayers] = useState<string[]>([]);

  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  const sendChatMessage = (message: string) => {
    if (room) {
      // Construct a message object with the player's name and message content
      const chatMessage = `${room.sessionId}: ${message}`;

      // Broadcast the chat message to all clients
      room.send('chat_message', { content: chatMessage });
    }
  };

  const handleSubmitChatMessage = (e: any) => {
    e.preventDefault();
    sendChatMessage(inputValue);
    setInputValue('');
  };


  useEffect(() => {
    const joinRoom = async () => {
      const joinedRoom: Room<MyRoomState> = await client.joinById(roomName + '');

      setRoom(joinedRoom);

      joinedRoom.onMessage('*', (type, message) => {
        switch (message.type) {
          case 'player_joined':
            // Add player to the end of the list, but not if it's already there
            setPlayers((prevPlayers) => {
              if (prevPlayers.includes(message.playerId)) return prevPlayers;
              else return [...prevPlayers, message.playerId];
            });
            setChatMessages((prevMessages) => [
              ...prevMessages,
              `${message.playerId} joined the room.`,
            ]);
            break;
          case 'player_left':
            setPlayers((prevPlayers) =>
              prevPlayers.filter((player) => player !== message.playerId)
            );
            setChatMessages((prevMessages) => [
              ...prevMessages,
              `${message.playerId} left the room.`,
            ]);
            break;
          default:
            break;
        }
      });

      joinedRoom.onMessage('chat_message', (message) => {
        setChatMessages((prevMessages) => [...prevMessages, message.content]);
      });
    };

    joinRoom();

    return () => {
      if (room) {
        room.removeAllListeners();
        room.leave();
      }
    };
  }, [roomName]);

  useEffect(() => {
    console.log('state changed?')
    if (room) {
      room.onStateChange((newState) => {
        setPlayers(newState.players);
      });
    }
  }, [room?.state.players.length]);


  return (
    <div>
      <h1>Welcome to Room <u>{roomName}</u></h1>
      <h3>Players in room: {room?.state.players.length}</h3>

      {room && (
        <div>
          Current people in the room ({players.length}):
          <ul>
            {players.map((player: string, index: number) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
        </div>
      )}

      <hr />

      <div>
        <h3>Chat</h3>
        {chatMessages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
        <input
          type="text"
          placeholder="Type a message..."
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendChatMessage(inputValue);
              setInputValue('');
            }
          }}
        />
        <button onClick={handleSubmitChatMessage} disabled={!inputValue}>Send</button>
      </div>

    </div>
  );
};

export default Page;
