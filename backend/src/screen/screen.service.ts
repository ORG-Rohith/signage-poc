import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScreenService {

    constructor(private prisma:PrismaService){}

    async generateUniqueCode(): Promise<string> {
    let code= '';
    let exists = true;

    while (exists) {
       code =
        'SCR-' +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const screen = await this.prisma.screen.findUnique({
        where: { uniqueCode: code },
      });

      if (!screen) exists = false;
    }

    return code;
  }

  async createScreen() {
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

    return screen;
  }

   async getAllScreens() {
    return this.prisma.screen.findMany({
      orderBy: { id: 'desc' },
    });
    
  }

  async getScreenUniqueCode(id: number) {
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
      throw new NotFoundException('Screen not found');
    }

    return screen;
  }

  async updatefileStatus(id: any) {
  return await this.prisma.screen.update({
    where: { id: Number(id) },
    data: { fileStatus: "offline" },
  });
}




async verifyAndAssign(code: string, folderId: number) {
  const screen = await this.prisma.screen.findUnique({
    where: { uniqueCode: code },
  });

  if (!screen) {
    return {
      verified: false,
      message: 'Invalid screen code',
    };
  }

  const folder = await this.prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
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
    return {
      verified: false,
      message: 'No file available in this folder',
    };
  }

  const updatedScreen = await this.prisma.screen.update({
    where: { id: screen.id },
    data: {
      fileId: file.id,
      filePath: file.path,
      fileStatus: 'offline',
      folderId:folderId,
    },
  });

  return {
    verified: true,
    message: 'Screen verified and file assigned',
    screen: updatedScreen,
  };
}

async updateStatus(id: number, status: string) {
  return this.prisma.screen.update({
    where: { id },
    data: {
      fileStatus: status,
    },
  });
}



async clearScreensByFileId(fileId: number) {
    return this.prisma.screen.updateMany({
      where: {
        fileId: fileId,
      },
      data: {
        fileId: null,
        filePath: null,
        fileStatus: 'offline',
      },
    });
  }
}

