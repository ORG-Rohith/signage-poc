import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Delete,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileService } from './file.service';
import { FileGateway } from './file.gateway';
import { join } from 'path';


@Controller('api/files')
export class FileController {
  private logger = new Logger('FileController');

  constructor(
    private fileService: FileService,
    private fileGateway: FileGateway, 
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string,
  ) {
    this.logger.log(`Upload request for file: ${file.originalname}, folder: ${folderId}`);
    const savedFile = await this.fileService.saveFile(file, Number(folderId));

  
    this.fileGateway.fileAdded(folderId, savedFile);

    return savedFile;
  }

  @Get(':folderId')
  async getFiles(@Param('folderId') folderId: string) {
    this.logger.debug(`GET request to retrieve files for folder: ${folderId}`);
    const result1= await this.fileService.getFilesByFolder(Number(folderId));
    this.logger.log(`Returning ${result1.length} files for folder ${folderId}`);
    return result1;
  }

@Delete(':id')
async deleteFile(@Param('id') id: string) {
  this.logger.log(`DELETE request for file: ${id}`);
  const file = await this.fileService.getFileById(Number(id));
  if (!file) {
    this.logger.warn(`Delete failed: File ${id} not found`);
    throw new NotFoundException('File not found');
  }

  const deleted = await this.fileService.deleteFile(Number(id));

  this.fileGateway.fileDeleted(String(file.folderId), Number(id));

  return deleted;
}
}