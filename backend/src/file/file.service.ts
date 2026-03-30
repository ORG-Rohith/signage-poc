import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from 'src/config/s3.config';

@Injectable()
export class FileService {
  private logger = new Logger('FileService');

  constructor(private prisma: PrismaService) {}

  async saveFile(file: Express.Multer.File, folderId: number) {
    this.logger.log(`Saving file: ${file.filename} to folder ${folderId}`);
    this.logger.debug(
      `File size: ${file.size} bytes, mime type: ${file.mimetype}`,
    );

    const key = `${Date.now()}-${file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    const saved = await this.prisma.file.create({
      data: {
        filename: key,
        path: fileUrl, // 🔥 store S3 URL
        folderId: folderId,
      },
      select: {
        id: true,
        filename: true,
        folderId: true,
        path: true,
      },
    });

    // const saved = await this.prisma.file.create({
    //   data: {
    //     filename: file.filename,
    //     path: file.path,
    //     folderId: folderId,
    //   },
    //   select: {
    //     id: true,
    //     filename: true,
    //     folderId: true,
    //   },
    // });

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
        path: true,
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

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.filename,
      }),
    );

    // const filePath = path.join(process.cwd(), 'uploads', file.filename);

    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    //   this.logger.debug(`Deleted file from disk: ${filePath}`);
    // } else {
    //   this.logger.warn(`File not found on disk: ${filePath}`);
    // }

    await this.prisma.file.delete({
      where: { id },
    });

    this.logger.log(
      `File with ID ${id} (${file.filename}) deleted successfully`,
    );
    return { message: 'File deleted successfully' };
  }
}
