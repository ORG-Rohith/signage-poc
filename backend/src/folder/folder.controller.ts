import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FolderService } from './folder.service';

@Controller('api')
export class FolderController {
    constructor(private folderService:FolderService){}

    @Post('folders')
create(@Body() body: { name: string }) {
  return this.folderService.create(body.name);
}

@Get('folders')
findAll() {
  return this.folderService.findAll();
}


}
