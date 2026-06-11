import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Успешное подключение к базе данных!');
    
    // Проверим, есть ли хоть одна запись в таблице User
    const userCount = await prisma.user.count();
    console.log(`📊 Количество пользователей в БД: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();