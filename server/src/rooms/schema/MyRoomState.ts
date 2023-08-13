import { Schema, type, ArraySchema } from '@colyseus/schema';

export class MyRoomState extends Schema {
  @type(['string']) players = new ArraySchema<string>();
}
