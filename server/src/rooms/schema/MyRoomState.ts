import { Schema, type, MapSchema } from '@colyseus/schema';

export class Position extends Schema {
  @type('number') x: number;
  @type('number') y: number;
  @type('number') z: number;
}

export class Player extends Schema {
  @type('string') id: string;
  @type(Position) position: Position;
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
