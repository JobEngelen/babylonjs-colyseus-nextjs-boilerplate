import { Client } from 'colyseus.js';

// Change this URL to your Colyseus server URL
const colyseusURL = 'ws://localhost:2567';

const client = new Client(colyseusURL);

export { client };
