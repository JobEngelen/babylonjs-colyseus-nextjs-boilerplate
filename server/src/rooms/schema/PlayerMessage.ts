import { Schema, type } from '@colyseus/schema';

export class PlayerMessage extends Schema {
  @type('string') type: string;
  @type('string') playerId: string;
}
