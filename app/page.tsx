'use client';
import { client } from "@/Instances/ColyseusClient";
import { useEffect, useState } from "react";


const Home = () => {
  const [rooms, setRooms] = useState([]);

  const fetchRooms = async () => {
    const availableRooms: any = await client.getAvailableRooms('your-room-type');
    setRooms(availableRooms);
  };

  useEffect(() => {
    fetchRooms();

    const interval = setInterval(() => {
      fetchRooms();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const createRoom = async () => {
    const room = await client.create('your-room-type');
    window.open(`/room/${room.id}`);
  };

  const joinRoom = (roomId: string) => {
    window.open(`/room/${roomId}`);
  };

  return (
    <>
      <h1>WIP</h1>
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