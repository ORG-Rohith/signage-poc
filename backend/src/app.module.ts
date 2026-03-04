import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FolderModule } from './folder/folder.module';
import { FileModule } from './file/file.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScreenModule } from './screen/screen.module';

@Module({
  imports: [FolderModule, FileModule, PrismaModule,
     ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,   
      },
    }),
     ScreenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
