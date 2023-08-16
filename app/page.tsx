'use client';
import { client } from "@/Instances/ColyseusClient";
import { useEffect, useState } from "react";

const Home = () => {
  const [rooms, setRooms] = useState([]);

  // Fetch the list of rooms on mount and every 5 seconds to keep it up to date
  useEffect(() => {
    fetchRooms();

    const interval = setInterval(() => {
      fetchRooms();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch the list of rooms from the server
  const fetchRooms = async () => {
    const availableRooms: any = await client.getAvailableRooms('your-room-type');
    setRooms(availableRooms);
  };

  // Create a new room and join it
  const createRoom = async () => {
    const room = await client.create('your-room-type', { isCreator: true });
    const updatedRooms: any = [...rooms, room]; // Add the new room to the list
    setRooms(updatedRooms);
    
    window.open(`/room/${room.id}`);
  };

  // Join a room by opening a new tab
  const joinRoom = (roomId: string) => {
    window.open(`/room/${roomId}`);
  };

  return (
    <>
      <h1><i>Next.js</i> + <i>babylon.js</i> + <i>Colyseus</i> boilerplate</h1>
      <hr />
      <button onClick={createRoom}>Create room</button>
      <hr />
      <h2>Rooms</h2>
      {rooms.length === 0 ? <p>No rooms available</p>
        :
        <ul>
          {rooms.map((room: any, index: any) => (
            <li key={index}>
              <b>Room:</b> {room.roomId} - {room.clients} / {room.maxClients}{' '}
              <button onClick={() => joinRoom(room.roomId)}>Join</button>
            </li>
          ))}
        </ul>
      }

    </>

  );
}

export default Home;