import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FolderService {

    private logger = new Logger('FolderService');

    constructor(private prisma: PrismaService) {}

    create(name: string) {
      this.logger.log(`Creating folder with name: ${name}`);
      const folder = this.prisma.folder.create({
        data: { name },
      });
      this.logger.debug('Folder created successfully');
      return folder;
    }

    findAll() {
      this.logger.debug('Fetching all folders');
      const folders = this.prisma.folder.findMany();
      return folders;
    }

}
