-- CreateTable
CREATE TABLE "Screen" (
    "id" SERIAL NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "fileId" INTEGER,
    "filePath" TEXT,
    "fileStatus" TEXT NOT NULL DEFAULT 'offline',
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Screen_uniqueCode_key" ON "Screen"("uniqueCode");
