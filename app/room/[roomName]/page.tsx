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
  const [newestPlayer, setNewestPlayer] = useState<Player | null>(null);
  const [playerLeft, setPlayerLeft] = useState<string>('');

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

        setPlayerLeft(message.playerId);

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

      // Look for player that is not in players array but is in playersArray
      // If found, set them as newest player
      playersArray.forEach((player: Player) => {
        if (!players.includes(player)) {
          setNewestPlayer(player);
        }
      });

      setPlayers(playersArray);
    });
  };

  return (
    <>

      {
        room ? <BabylonScene
          room={room}
          players={players}
          client_id={room.sessionId}
          newestPlayer={newestPlayer}
          playerLeft={playerLeft}
          chatMessages={chatMessages}
        />
          : <div>loading...</div>
      }

    </>
  );
};

export default Page;
