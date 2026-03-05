import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Logger } from '@nestjs/common';
import { ScreenService } from './screen.service';

@Controller('api/screen')
export class ScreenController {
    private logger = new Logger('ScreenController');

    constructor(private readonly screenService: ScreenService) {}

  @Post()
  createScreen() {
    this.logger.log('POST request to create new screen');
    return this.screenService.createScreen();
  }
   @Get('getall')
  getAllScreens() {
    this.logger.debug('GET request to retrieve all screens');
    return this.screenService.getAllScreens();
  }

  @Get(':id')
  getScreenUniqueCode(@Param('id') id: string) {
    this.logger.debug(`GET request to retrieve screen ${id}`);
    return this.screenService.getScreenUniqueCode(Number(id));
  }
  @Post('verify')
verifyScreen(@Body() body: { code: string; folderId: number }) {
  this.logger.log(`POST verify request - Code: ${body.code}, Folder: ${body.folderId}`);
  return this.screenService.verifyAndAssign(body.code, body.folderId);
}

@Patch('status/:id')
updateStatus(
  @Param('id') id: number,
  @Body() body: { status: string }
) {
  this.logger.log(`PATCH request to update screen ${id} status to: ${body.status}`);
  return this.screenService.updateStatus(+id, body.status);
}


@Post("statusupdate")
async updatefileStatus(@Body() body: { id: number; fileStatus: string }) {
  this.logger.log(`POST request to update screen ${body.id} status to: ${body.fileStatus}`);
  return this.screenService.updateStatus(body.id, body.fileStatus);
}



}
