import { Body, Controller, Get, Param, Patch, Post, Logger } from '@nestjs/common';
import { FolderService } from './folder.service';

@Controller('api')
export class FolderController {
    private logger = new Logger('FolderController');
    
    constructor(private folderService:FolderService){}

    @Post('folders')
create(@Body() body: { name: string }) {
  this.logger.log(`POST request to create folder: ${body.name}`);
  return this.folderService.create(body.name);
}

@Get('folders')
findAll() {
  this.logger.debug('GET request to retrieve all folders');
  return this.folderService.findAll();
}


}
