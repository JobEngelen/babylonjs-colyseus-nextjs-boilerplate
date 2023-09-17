import { Player } from "@/server/src/rooms/schema/MyRoomState";

export const createExistingPlayers = (players: Player[], client_id: string, scene: any) => {

    players.forEach((player) => {
        if (player.id !== client_id && player.position) {
            // Create a new cylinder mesh for each player and add it to the scene
            const cylinder = BABYLON.MeshBuilder.CreateCylinder(
                player.id,
                {
                    diameterTop: 2,
                    diameterBottom: 2,
                    height: 3.5,
                    tessellation: 16,
                    subdivisions: 1
                },
                scene
            );

            // Set the position of the cylinder mesh based on player's position
            cylinder.position = new BABYLON.Vector3(
                player.position.x,
                player.position.y,
                player.position.z
            );

            cylinder.checkCollisions = true;
        }
    });
};