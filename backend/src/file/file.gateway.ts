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

@WebSocketGateway({
  cors: { origin: '*' } 
})
export class FileGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('joinFolder')
  joinFolder(@MessageBody() folderId: string, @ConnectedSocket() client: Socket) {
    client.join(folderId);
    console.log(`Client ${client.id} joined folder ${folderId}`);
  }

  fileAdded(folderId: string, file: any) {
    this.server.to(folderId).emit('fileAdded', file);
  }

  fileDeleted(folderId: string, fileId: number) {
    this.server.to(folderId).emit('fileDeleted', fileId);
  }
}