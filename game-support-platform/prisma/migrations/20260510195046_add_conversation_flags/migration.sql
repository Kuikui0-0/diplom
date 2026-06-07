-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedByUser1" BOOLEAN NOT NULL DEFAULT false,
    "clearedByUser2" BOOLEAN NOT NULL DEFAULT false,
    "deletedByUser1" BOOLEAN NOT NULL DEFAULT false,
    "deletedByUser2" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Conversation_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("id", "lastMessageAt", "user1Id", "user2Id") SELECT "id", "lastMessageAt", "user1Id", "user2Id" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE UNIQUE INDEX "Conversation_user1Id_user2Id_key" ON "Conversation"("user1Id", "user2Id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
