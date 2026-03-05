import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  private logger = new Logger('AppController');

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    this.logger.debug('GET request to api root');
    return this.appService.getHello();
  }
}
