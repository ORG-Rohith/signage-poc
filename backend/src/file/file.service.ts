import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class FileService {

  private logger = new Logger('FileService');

  constructor(private prisma: PrismaService) {}

  async saveFile(file: Express.Multer.File, folderId: number) {
    this.logger.log(`Saving file: ${file.filename} to folder ${folderId}`);
    this.logger.debug(`File size: ${file.size} bytes, mime type: ${file.mimetype}`);
    
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

    this.logger.log(`File saved successfully with ID: ${saved.id}`);
    return saved;
  }

  async getFilesByFolder(folderId: number) {
    this.logger.debug(`Fetching files for folder ${folderId}`);
    
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

    this.logger.log(`Found ${files.length} files in folder ${folderId}`);
    return files; 
  }

  async getFileById(id: number) {
    this.logger.debug(`Fetching file with ID: ${id}`);
    
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (file) {
      this.logger.log(`Found file: ${file.filename}`);
    } else {
      this.logger.warn(`File with ID ${id} not found`);
    }
    return file;
  }

  async deleteFile(id: number) {
    this.logger.log(`Attempting to delete file with ID: ${id}`);
    
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      this.logger.warn(`Delete failed: File with ID ${id} not found`);
      throw new NotFoundException('File not found');
    }

    const filePath = path.join(process.cwd(), 'uploads', file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.debug(`Deleted file from disk: ${filePath}`);
    } else {
      this.logger.warn(`File not found on disk: ${filePath}`);
    }

    await this.prisma.file.delete({
      where: { id },
    });

    this.logger.log(`File with ID ${id} (${file.filename}) deleted successfully`);
    return { message: 'File deleted successfully' };
  }
}

