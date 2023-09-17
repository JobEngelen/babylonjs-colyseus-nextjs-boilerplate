import { updatePlayerPosition } from "@/assets/updatePlayerPosition";
import { MyRoomState } from "@/server/src/rooms/schema/MyRoomState";
import { Room } from "colyseus.js";

export const PlayerMovement = (scene: any, client_id: string, room: Room<MyRoomState>) => {
    // Camera 
    if (scene.camera.radius > 40)
        scene.camera.radius = 40;
    if (scene.camera.radius < 12)
        scene.camera.radius = 12;

    // Camera FIX
    if (scene.camera.alpha >= Math.PI * 2)
        scene.camera.alpha = 0;

    if (scene.camera.alpha < 0)
        scene.camera.alpha = Math.PI * 2;

    if (scene.keyPointMap["RIGHT"] == 1)
        scene.player.rotation.y = -scene.camera.alpha - Math.PI / 2;

    // Base variables
    let rate = scene.getAnimationRatio();
    let move = false;
    let size = 1.5;
    let offset = size + 0.2;
    let climbInt = 0; // For climbing change to 1.0, 0 means no climbing
    let updateTime = (1000 / 60) * rate;
    let speed = 0.6;
    let velocity = new BABYLON.Vector3(0, 0, 0);

    // Variables for Ground and offset collision deteciton on heightmap
    let groundY, groundYA = [0, 0, 0, 0];

    if (!scene.player.isJumping && !scene.player.isFalling) {
        // Forward
        if ((scene.keyInputMap["w"] || scene.keyInputMap["W"]) || (scene.keyPointMap["LEFT"] == 1 && scene.keyPointMap["RIGHT"] == 1)) {
            velocity.addInPlace(scene.camera.getDirection(new BABYLON.Vector3(0, 0, 1)).scaleInPlace(1));
            move = true;
        };

        //Backward
        if ((scene.keyInputMap["s"] || scene.keyInputMap["S"])) {
            velocity.subtractInPlace(scene.camera.getDirection(new BABYLON.Vector3(0, 0, 1)).scaleInPlace(1));
            move = true;
        };

        // Left
        if ((scene.keyInputMap["a"] || scene.keyInputMap["A"])) {
            velocity.addInPlace(scene.camera.getDirection(new BABYLON.Vector3(-1, 0, 0)).scaleInPlace(1));
            move = true;
        };

        // right
        if ((scene.keyInputMap["d"] || scene.keyInputMap["D"])) {
            velocity.addInPlace(scene.camera.getDirection(new BABYLON.Vector3(1, 0, 0)).scaleInPlace(1));
            move = true;
        };

        // Fixes
        if ((scene.keyInputMap["w"] || scene.keyInputMap["W"]) && (scene.keyInputMap["d"] || scene.keyInputMap["D"]))
            speed = speed * 0.7;
        else if ((scene.keyInputMap["w"] || scene.keyInputMap["W"]) && (scene.keyInputMap["a"] || scene.keyInputMap["A"]))
            speed = speed * 0.7;
        if ((scene.keyInputMap["s"] || scene.keyInputMap["S"]) && (scene.keyInputMap["d"] || scene.keyInputMap["D"]) && (!scene.keyInputMap["a"] && !scene.keyInputMap["a"]))
            speed = speed * 0.7;
        if ((scene.keyInputMap["s"] || scene.keyInputMap["S"]) && (scene.keyInputMap["a"] || scene.keyInputMap["a"]) && (!scene.keyInputMap["d"] && !scene.keyInputMap["D"]))
            speed = speed * 0.7;
        if ((scene.keyInputMap["w"] || scene.keyInputMap["W"]) && (scene.keyInputMap["s"] || scene.keyInputMap["s"]))
            move = false;

        // jump
        if (scene.keyInputMap[32] && scene.player.jumpCooldown <= 0) {
            scene.player.jumpCooldown = 1000;
            scene.player.isJumping = true;
            scene.player.velocity.set(velocity.x, velocity.y, velocity.z);
            scene.player.speed = speed;
            scene.player.gravity = 0.91;
        };
    }

    // Scale and set velocity
    if (scene.player.isJumping || scene.player.isFalling) {
        velocity.set(scene.player.velocity.x, 0, scene.player.velocity.z);
        speed = scene.player.speed;
        move = false;
    }

    groundY = getGroundY(scene, scene.player.position.x, scene.player.position.z);
    groundYA[4] = getGroundY(scene, scene.player.position.x + velocity.x * rate * speed, scene.player.position.z + velocity.z * rate * speed);
    groundYA[0] = getGroundY(scene, scene.player.position.x + offset, scene.player.position.z - offset);// Forward
    groundYA[1] = getGroundY(scene, scene.player.position.x - offset, scene.player.position.z + offset); // Backward

    groundYA[2] = getGroundY(scene, scene.player.position.x + offset, scene.player.position.z + offset); // left
    groundYA[3] = getGroundY(scene, scene.player.position.x - offset, scene.player.position.z - offset); // right

    if (scene.keyInputMap["r"] || scene.keyInputMap["R"])
        console.log("Coords: X: " + scene.player.position.x, " Y: " + scene.player.position.y, " Z: " + scene.player.position.z, " GroundY: " + groundY, " GroundY0: " + groundYA[0], " GroundY1: " + groundYA[1], " GroundY2: " + groundYA[2], " GroundY3: " + groundYA[3], " groundYFW: " + groundYA[4]);

    if (!scene.player.isFalling && scene.player.gravity < 0) // 1.5 means Size/2 of object + 0.5
    {
        if ((groundY >= groundYA[0] && groundY >= groundYA[1]) || (groundY >= groundYA[2] && groundY >= groundYA[3])) {
            if (scene.player.position.y - size * climbInt > groundY) {
                scene.player.gravity = 0;
                scene.player.isJumping = false;
                scene.player.isFalling = true;
                move = false;
                if (scene.player.velocity.x == 0 && scene.player.velocity.z == 0) {
                    scene.player.velocity.set(velocity.x, velocity.y, velocity.z);
                    scene.player.speed = speed;
                }
            }
        }
        else if ((scene.player.position.y - size * climbInt > groundYA[0] && scene.player.position.y - size * climbInt > groundYA[2])
            || (scene.player.position.y - size * climbInt > groundYA[0] && scene.player.position.y - size * climbInt > groundYA[3])
            || (scene.player.position.y - size * climbInt > groundYA[1] && scene.player.position.y - size * climbInt > groundYA[2])
            || (scene.player.position.y - size * climbInt > groundYA[1] && scene.player.position.y - size * climbInt > groundYA[3])) {
            scene.player.gravity = 0;
            scene.player.isJumping = false;
            scene.player.isFalling = true;
            move = false;
            if (scene.player.velocity.x == 0 && scene.player.velocity.z == 0) {
                scene.player.velocity.set(velocity.x, velocity.y, velocity.z);
                scene.player.speed = speed;
            }
        }
    }
    // Check Falling State
    if ((scene.player.isJumping || scene.player.isFalling) && scene.player.gravity < 0) {
        // Check if player is falling
        if ((groundY >= groundYA[0] && groundY >= groundYA[1]) || (groundY >= groundYA[2] && groundY >= groundYA[3])) {
            // Check if player is on ground
            if (scene.player.position.y - 0.55 <= groundY) {
                scene.player.position.y = groundY + 0.2;
                scene.player.isFalling = false;
                scene.player.isJumping = false;
                move = false;
                scene.player.velocity.setAll(0);
                scene.player.speed = 0;
            }
        }
        else if ((scene.player.position.y - 0.55 <= groundYA[0] && scene.player.position.y - 0.55 <= groundYA[1] && scene.player.position.y - 0.55 <= groundYA[2]
            && Math.abs(groundYA[0] - groundYA[1]) < 2.5 && Math.abs(groundYA[0] - groundYA[2]) < 2.5 && Math.abs(groundYA[1] - groundYA[2]) < 2.5)
            || (scene.player.position.y - 0.55 <= groundYA[0] && scene.player.position.y - 0.55 <= groundYA[1] && scene.player.position.y - 0.55 <= groundYA[3]
                && Math.abs(groundYA[0] - groundYA[1]) < 2.5 && Math.abs(groundYA[0] - groundYA[3]) < 2.5 && Math.abs(groundYA[1] - groundYA[3]) < 2.5)
            || (scene.player.position.y - 0.55 <= groundYA[2] && scene.player.position.y - 0.55 <= groundYA[3] && scene.player.position.y - 0.55 <= groundYA[0]
                && Math.abs(groundYA[0] - groundYA[2]) < 2.5 && Math.abs(groundYA[0] - groundYA[3]) < 2.5 && Math.abs(groundYA[2] - groundYA[3]) < 2.5)
            || (scene.player.position.y - 0.55 <= groundYA[2] && scene.player.position.y - 0.55 <= groundYA[3] && scene.player.position.y - 0.55 <= groundYA[1]
                && Math.abs(groundYA[1] - groundYA[2]) < 2.5 && Math.abs(groundYA[1] - groundYA[3]) < 2.5 && Math.abs(groundYA[2] - groundYA[3]) < 2.5)) {
            scene.player.position.y = groundY + 0.2;
            scene.player.isFalling = false;
            scene.player.isJumping = false;
            move = false;
            scene.player.velocity.setAll(0);
            scene.player.speed = 0;
        }
    }

    if (move || scene.player.isJumping || scene.player.isFalling) {
        velocity.scaleInPlace(speed * rate);

        if (move) {
            if (Math.abs(groundY - groundYA[4]) < 0.8 * rate)
                scene.player.position.y = groundY + 0.2;
            else if (groundY < groundYA[4])
                move = false;
        }
        else
            velocity.y = scene.player.gravity * rate;

        if (move || scene.player.isJumping || scene.player.isFalling)
            scene.player.moveWithCollisions(velocity);
    }

    // counting
    if (scene.player.gravity > -0.91) scene.player.gravity -= 0.066 * rate;
    if (scene.player.jumpCooldown > 0) scene.player.jumpCooldown -= updateTime;

    // Only update the player position if the scene.player.position has changed
    if (scene.player.position.x !== scene.player.lastPosition.x || scene.player.position.y !== scene.player.lastPosition.y || scene.player.position.z !== scene.player.lastPosition.z) {
        updatePlayerPosition(scene.player.position, client_id, room);
        scene.player.lastPosition = scene.player.position.clone();
    }
}

// return the y value for x,z coordinates from the array quads
const getGroundY = (scene: any, x: number, z: number) => {
    let rayPick = new BABYLON.Ray(new BABYLON.Vector3(x, scene.player.position.y + 1.5, z), new BABYLON.Vector3(0, -1, 0), 10);

    let NoCollision = (item: any) => {
        return item.checkCollisions && item != scene.player && item != scene.ground;
    }

    let meshFound = scene.pickWithRay(rayPick, NoCollision);

    if (meshFound && meshFound.pickedPoint) {
        if (meshFound.pickedPoint.y > scene.world.getHeightAtCoordinates(x, z))
            return meshFound.pickedPoint.y;
        else
            return scene.world.getHeightAtCoordinates(x, z);
    }
    else
        return scene.world.getHeightAtCoordinates(x, z);
};