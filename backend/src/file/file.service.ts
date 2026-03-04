import { Injectable, NotFoundException } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class FileService {

   
  constructor(private prisma: PrismaService) {}

  async saveFile(file: Express.Multer.File, folderId: number) {
    const saved = await this.prisma.file.create({
      data: {
        filename: file.filename,
        path: file.path,
        folderId: folderId,
      },
      select: {
        id: true,
        filename: true,
        folderId: true,
      },
    });

    return saved;
  }

  async getFilesByFolder(folderId: number) {
    const files = await this.prisma.file.findMany({
      where: {
        folderId: folderId,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        filename: true,
      },
    });

    return files; 
  }

  async getFileById(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    return file;
  }

  async deleteFile(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = path.join(process.cwd(), 'uploads', file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.file.delete({
      where: { id },
    });

    return { message: 'File deleted successfully' };
  }
}

