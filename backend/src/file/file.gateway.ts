import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' } 
})
export class FileGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('FileGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket (FileGateway) initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}, Total connected: ${this.server.engine.clientsCount}`);
    this.logger.debug(`Connection details - Address: ${client.handshake.address}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}, Total connected: ${this.server.engine.clientsCount}`);
  }

  @SubscribeMessage('joinFolder')
  joinFolder(@MessageBody() folderId: string, @ConnectedSocket() client: Socket) {
    client.join(folderId);
    this.logger.log(`Client ${client.id} joined folder ${folderId}`);
    this.logger.debug(`Room members in folder ${folderId}: ${this.server.sockets.adapter.rooms.get(folderId)?.size || 0}`);
  }

  fileAdded(folderId: string, file: any) {
    this.logger.debug(`Broadcasting fileAdded event to folder ${folderId}:`, file);
    this.server.to(folderId).emit('fileAdded', file);
  }

  fileDeleted(folderId: string, fileId: number) {
    this.logger.debug(`Broadcasting fileDeleted event to folder ${folderId}, fileId: ${fileId}`);
    this.server.to(folderId).emit('fileDeleted', fileId);
  }
}