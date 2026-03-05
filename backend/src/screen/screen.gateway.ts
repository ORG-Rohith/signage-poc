import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ScreenGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ScreenGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}, Total connected: ${this.server.engine.clientsCount}`);
    this.logger.debug(`Connection details - Address: ${client.handshake.address}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}, Total connected: ${this.server.engine.clientsCount}`);
  }

  @SubscribeMessage('joinScreen')
  handleJoin(client: Socket, screenId: number) {
    const roomName = `screen-${screenId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined screen ${screenId}`);
    this.logger.debug(`Room members for screen ${screenId}: ${this.server.sockets.adapter.rooms.get(roomName)?.size || 0}`);
  }

  sendScreenUpdate(screenId: number, data: any) {
    const roomName = `screen-${screenId}`;
    this.logger.debug(`Broadcasting screenUpdated event to screen ${screenId}:`, JSON.stringify(data));
    this.server.to(roomName).emit('screenUpdated', data);
  }
}