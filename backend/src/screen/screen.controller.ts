import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ScreenService } from './screen.service';

@Controller('screen')
export class ScreenController {

    constructor(private readonly screenService: ScreenService) {}

  @Post()
  createScreen() {
    return this.screenService.createScreen();
  }
   @Get('getall')
  getAllScreens() {
    return this.screenService.getAllScreens();
  }

  @Get(':id')
  getScreenUniqueCode(@Param('id') id: string) {
    return this.screenService.getScreenUniqueCode(Number(id));
  }
  @Post('verify')
verifyScreen(@Body() body: { code: string; folderId: number }) {
  return this.screenService.verifyAndAssign(body.code, body.folderId);
}

@Patch('status/:id')
updateStatus(
  @Param('id') id: number,
  @Body() body: { status: string }
) {
  return this.screenService.updateStatus(+id, body.status);
}


@Post("statusupdate")
async updatefileStatus(@Body() body: { id: number; fileStatus: string }) {
  return this.screenService.updateStatus(body.id, body.fileStatus);
}



}
