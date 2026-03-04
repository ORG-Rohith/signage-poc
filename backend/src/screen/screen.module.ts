import { Module } from '@nestjs/common';
import { ScreenController } from './screen.controller';
import { ScreenService } from './screen.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScreenGateway } from './screen.gateway';

@Module({
    imports: [PrismaModule],
  controllers: [ScreenController],
  providers: [ScreenService,ScreenGateway],
   exports: [ScreenService],
})
export class ScreenModule {}
