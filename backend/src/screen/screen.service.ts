import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScreenService {

    private logger = new Logger('ScreenService');

    constructor(private prisma:PrismaService){}

    async generateUniqueCode(): Promise<string> {
    this.logger.debug('Generating unique screen code');
    let code= '';
    let exists = true;
    let attempts = 0;

    while (exists) {
       code =
        'SCR-' +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const screen = await this.prisma.screen.findUnique({
        where: { uniqueCode: code },
      });

      attempts++;
      if (!screen) exists = false;
    }

    this.logger.debug(`Generated unique code: ${code} (attempts: ${attempts})`);
    return code;
  }

  async createScreen() {
    this.logger.log('Creating new screen');
    const uniqueCode = await this.generateUniqueCode();

    const screen = await this.prisma.screen.create({
      data: {
        uniqueCode,
        fileId: null,
        filePath: null,
        fileStatus: 'offline',
        createdBy: null,
      },
    });

    this.logger.log(`Screen created successfully - ID: ${screen.id}, Code: ${screen.uniqueCode}`);
    return screen;
  }

   async getAllScreens() {
    this.logger.debug('Fetching all screens');
    const screens = await this.prisma.screen.findMany({
      orderBy: { id: 'desc' },
    });
    
    this.logger.log(`Retrieved ${screens.length} screens`);
    return screens;
  }

  async getScreenUniqueCode(id: number) {
    this.logger.debug(`Fetching screen with ID: ${id}`);
    const screen = await this.prisma.screen.findUnique({
      where: { id },
      select: {
        uniqueCode: true,
        filePath: true,
      fileStatus: true,
      fileId:true,
      folderId:true,
      },
    });

    if (!screen) {
      this.logger.warn(`Screen with ID ${id} not found`);
      throw new NotFoundException('Screen not found');
    }

    this.logger.log(`Found screen - Code: ${screen.uniqueCode}, Status: ${screen.fileStatus}`);
    return screen;
  }

  async updatefileStatus(id: any) {
    this.logger.debug(`Updating file status to offline for screen ${id}`);
    const updated = await this.prisma.screen.update({
      where: { id: Number(id) },
      data: { fileStatus: "offline" },
    });
    this.logger.log(`Screen ${id} status updated to offline`);
    return updated;
  }

  async verifyAndAssign(code: string, folderId: number) {
    this.logger.log(`Verifying screen code: ${code} for folder: ${folderId}`);
    
    const screen = await this.prisma.screen.findUnique({
      where: { uniqueCode: code },
    });

    if (!screen) {
      this.logger.warn(`Screen verification failed: Invalid code ${code}`);
      return {
        verified: false,
        message: 'Invalid screen code',
      };
    }

    this.logger.debug(`Screen found - ID: ${screen.id}`);

    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      this.logger.warn(`Folder not found - ID: ${folderId}`);
      return {
        verified: false,
        message: 'Folder not found',
      };
    }

    const file = await this.prisma.file.findFirst({
      where: { folderId: folderId},
      orderBy: { id: 'desc' }, 
    });

    if (!file) {
      this.logger.warn(`No file available in folder ${folderId}`);
      return {
        verified: false,
        message: 'No file available in this folder',
      };
    }

    this.logger.debug(`Assigning file ${file.id} to screen ${screen.id}`);

    const updatedScreen = await this.prisma.screen.update({
      where: { id: screen.id },
      data: {
        fileId: file.id,
        filePath: file.path,
        fileStatus: 'offline',
        folderId:folderId,
      },
    });

    this.logger.log(`Screen ${code} verified and assigned - File: ${file.filename}`);

    return {
      verified: true,
      message: 'Screen verified and file assigned',
      screen: updatedScreen,
    };
  }

  async updateStatus(id: number, status: string) {
    this.logger.log(`Updating screen ${id} status to: ${status}`);
    const updated = await this.prisma.screen.update({
      where: { id },
      data: {
        fileStatus: status,
      },
    });
    this.logger.debug(`Screen ${id} status updated successfully`);
    return updated;
  }

  async clearScreensByFileId(fileId: number) {
    this.logger.log(`Clearing screens assigned to file ${fileId}`);
    const result = await this.prisma.screen.updateMany({
      where: {
        fileId: fileId,
      },
      data: {
        fileId: null,
        filePath: null,
        fileStatus: 'offline',
      },
    });
    this.logger.log(`Cleared ${result.count} screens assigned to file ${fileId}`);
    return result;
  }
}

