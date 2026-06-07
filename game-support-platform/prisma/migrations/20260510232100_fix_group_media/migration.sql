/*
  Warnings:

  - You are about to drop the column `groupMessageId` on the `MessageMedia` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "GroupMessageMedia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "GroupMessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "GroupMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageMedia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "messageId" INTEGER,
    CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MessageMedia" ("id", "messageId", "type", "url") SELECT "id", "messageId", "type", "url" FROM "MessageMedia";
DROP TABLE "MessageMedia";
ALTER TABLE "new_MessageMedia" RENAME TO "MessageMedia";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
