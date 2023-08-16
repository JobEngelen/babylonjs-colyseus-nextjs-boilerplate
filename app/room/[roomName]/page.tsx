'use client';
import { useEffect, useState } from 'react';
import { Room } from 'colyseus.js';
import { useParams } from 'next/navigation';
import { client } from '@/Instances/ColyseusClient';
import { MyRoomState, Player } from '@/server/src/rooms/schema/MyRoomState';
import BabylonScene from '@/babylonComponents/babylonScene';

const Page = () => {
  const { roomName } = useParams();
  const [room, setRoom] = useState<Room<MyRoomState> | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  // Handle the input change
  useEffect(() => {
    // Join the room when the component mounts
    joinRoom();

    return () => {
      if (room) {
        room.removeAllListeners();
        room.leave();
      }
    };
  }, [roomName]);

  // Listen for changes to the room state and update the player list
  useEffect(() => {
    if (room) {
      room.onStateChange((newState) => {
        const playersArray = Array.from(newState.players.values());
        setPlayers(playersArray);
      });
    }
  }, [room?.state.players.size]);

  // Join the room
  const joinRoom = async () => {
    const joinedRoom: Room<MyRoomState> = await client.joinById(roomName + '');
    setRoom(joinedRoom);

    // Listen for changes to the room state and update the player list
    joinedRoom.onMessage('*', (type, message) => {
      if (message.type === 'player_joined') {
        // Add player to the end of the list, but not if it's already there
        setPlayers((prevPlayers) => {
          if (prevPlayers.includes(message.playerId)) return prevPlayers;
          else return [...prevPlayers, message.playerId];
        });
        setChatMessages((prevMessages) => [
          ...prevMessages,
          `${message.playerId} joined the room.`,
        ]);
      } else if (message.type === 'player_left') {
        // Remove player from the list if they leave
        setPlayers((prevPlayers) =>
          prevPlayers.filter((player) => player !== message.playerId)
        );
        setChatMessages((prevMessages) => [
          ...prevMessages,
          `${message.playerId} left the room.`,
        ]);
      }
    });

    // Listen for chat messages and add them to the chatMessages array
    joinedRoom.onMessage('chat_message', (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message.content]);
    });

    // Listen for changes to the room state and update the player list
    joinedRoom.onStateChange((newState) => {
      const playersArray = Array.from(newState.players.values());
      setPlayers(playersArray);
    });
  };

  // Send a chat message to the server
  const sendChatMessage = (message: string) => {
    if (room) {
      // Construct a message object with the player's name and message content
      const chatMessage = `${room.sessionId}: ${message}`;

      // Broadcast the chat message to all clients
      room.send('chat_message', { content: chatMessage });
    }
  };

  // Handle the form submission
  const handleSubmitChatMessage = (e: any) => {
    e.preventDefault();
    sendChatMessage(inputValue);
    setInputValue('');
  };

  return (
    <div>
      <h1>Welcome to Room <u>{roomName}</u></h1>
      <h3>Players in room: {room?.state.players.size}</h3>

      {room && (
        <div>
          Current people in the room ({players.length}):
          <ul>
            {players.filter((player: Player) => player.position).map((player: Player, index: number) => (
              <li key={index}>
                {
                  player.id === room.sessionId ? <b>{player.id}</b>
                    : <>{player.id}</>
                }
                - {`{${player.position.x}, ${player.position.y}, ${player.position.z}}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      < hr />

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

      <hr />

      {
        room ? <BabylonScene room={room} players={players} client_id={room.sessionId} />
          : <div>loading...</div>
      }

    </div >
  );
};

export default Page;
