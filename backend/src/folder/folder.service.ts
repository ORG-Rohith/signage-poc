import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FolderService {


    constructor(private prisma: PrismaService) {}

create(name: string) {
  return this.prisma.folder.create({
    data: { name },
  });
}

findAll() {
  return this.prisma.folder.findMany();
}

}
