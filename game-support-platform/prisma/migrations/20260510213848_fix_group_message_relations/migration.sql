-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageMedia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "messageId" INTEGER,
    "groupMessageId" INTEGER,
    CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageMedia_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "GroupMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MessageMedia" ("id", "messageId", "type", "url") SELECT "id", "messageId", "type", "url" FROM "MessageMedia";
DROP TABLE "MessageMedia";
ALTER TABLE "new_MessageMedia" RENAME TO "MessageMedia";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
