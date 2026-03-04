import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileGateway } from './file.gateway';
import { ScreenModule } from 'src/screen/screen.module';

@Module({
    imports: [PrismaModule,ScreenModule],
  controllers: [FileController],
  providers: [FileService,FileGateway]
})
export class FileModule {}
