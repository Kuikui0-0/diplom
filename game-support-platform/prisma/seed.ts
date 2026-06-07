import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Очищаем существующие данные
  await prisma.gameReview.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionTier.deleteMany();
  await prisma.gameFile.deleteMany();
  await prisma.gameMedia.deleteMany();
  await prisma.gameGenre.deleteMany();
  await prisma.gamePlatform.deleteMany();
  await prisma.articleMedia.deleteMany();
  await prisma.article.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.game.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.user.deleteMany();

  // 1. Пользователи
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', name: 'Администратор', passwordHash: '$2a$10$dummyhash', role: 'admin', age: 30 },
  });
  const dev1 = await prisma.user.create({
    data: { email: 'dev1@example.com', name: 'Разработчик Иван', passwordHash: '$2a$10$dummyhash', role: 'developer', age: 25 },
  });
  const dev2 = await prisma.user.create({
    data: { email: 'dev2@example.com', name: 'Разработчик Мария', passwordHash: '$2a$10$dummyhash', role: 'developer', age: 28 },
  });
  const user1 = await prisma.user.create({
    data: { email: 'user1@example.com', name: 'Игрок Пётр', passwordHash: '$2a$10$dummyhash', role: 'user', age: 20 },
  });

  const allUsers = [admin, dev1, dev2, user1];

  // 2. Жанры
  const genresData = [
    'RPG', 'Шутер', 'Стратегия', 'Гонки', 'Платформер',
    'Головоломки', 'Приключения', 'Хоррор', 'Аркада', 'Ритм-игра',
    'Приложение', '18+', 'Экшен', 'Симулятор', 'Файтинг'
  ];
  const genres = [];
  for (const name of genresData) {
    const genre = await prisma.genre.create({ data: { name } });
    genres.push(genre);
  }

  // 3. Платформы
  const android = await prisma.platform.upsert({ where: { name: 'Android' }, update: {}, create: { name: 'Android' } });
  const pc = await prisma.platform.upsert({ where: { name: 'PC' }, update: {}, create: { name: 'PC' } });
  const platforms = [android, pc];

  // Вспомогательные функции
  const pickRandom = <T,>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // 4. Создаём 20 игр
  const gameTitles = [
    'Космические котики', 'Подземелья Древних', 'Звёздный Десант',
    'Гонки на выживание', 'Тетрис Ultra', 'Приключения Панды',
    'Ужасы Заброшенного Дома', 'Музыкальная Битва', 'Аркада 80-х',
    'Ферма Симулятор', 'Сражения Магов', 'Полёт Дракона',
    'Тайны Океана', 'Рыцарский Турнир', 'Побег из Лабиринта',
    'Стрелок: Перезагрузка', 'Городской Симулятор', 'Реактивный Бой',
    'Кибер Квест', 'Загадки Сфинкса'
  ];

  const games = [];
  const developers = [dev1, dev2];

  for (let i = 0; i < 20; i++) {
    const title = gameTitles[i] || `Игра ${i + 1}`;
    const description = `Увлекательная игра "${title}". Погрузитесь в мир приключений и незабываемых эмоций!`;
    const author = developers[i % 2];
    const selectedGenres = pickRandom(genres, randomInt(1, 3));
    const selectedPlatforms = pickRandom(platforms, randomInt(1, 2));

    const game = await prisma.game.create({
      data: {
        title,
        description,
        authorId: author.id,
        mediaUrl: `https://picsum.photos/seed/${i}/400/300`,
        requiredTier: i % 3 === 0 ? 'bronze' : null,
        gameGenres: { create: selectedGenres.map(g => ({ genreId: g.id })) },
        gamePlatforms: { create: selectedPlatforms.map(p => ({ platformId: p.id })) },
      },
    });
    games.push(game);

    // 1-2 скриншота
    const mediaCount = randomInt(1, 2);
    for (let m = 0; m < mediaCount; m++) {
      await prisma.gameMedia.create({
        data: { gameId: game.id, url: `https://picsum.photos/seed/${i}_${m}/400/300`, type: 'image' },
      });
    }

    // Отзыв от случайного пользователя (кроме автора)
    if (i % 2 === 0) {
      await prisma.gameReview.create({
        data: {
          gameId: game.id,
          authorId: user1.id,
          rating: randomInt(1, 5),
          content: 'Отличная игра!',
        },
      });
    }
  }

  // 5. Создаём 10 новостей
  const newsTitles = [
    'Обновление движка Unity 2026', 'Новые возможности для разработчиков',
    'Релиз игры «Космические котики»', 'Интервью с создателями «Подземелий»',
    'Скидки на подписки в честь праздника', 'График обновлений на май',
    'Старт бета-тестирования «Звёздный Десант»', 'История успеха: как создавалась «Ферма»',
    'Анонс турнира по «Гонки на выживание»', 'Новые жанры на платформе'
  ];
  for (let i = 0; i < 10; i++) {
    const title = newsTitles[i] || `Новость ${i + 1}`;
    const author = allUsers[randomInt(0, allUsers.length - 1)];
    const game = Math.random() > 0.5 ? games[randomInt(0, games.length - 1)] : null;
    await prisma.article.create({
      data: {
        title,
        content: `Подробности события "${title}". Мы рады сообщить, что наша платформа развивается и предлагает новые возможности для игроков и разработчиков.`,
        category: 'news',
        authorId: author.id,
        gameId: game?.id || null,
        mediaUrl: `https://picsum.photos/seed/news${i}/400/300`,
        description: `Краткое описание новости: ${title}`,
      },
    });
  }

  // 6. Создаём 10 гайдов
  const guideTitles = [
    'Как создать свою первую игру', 'Гайд по движку Unity',
    'Советы по дизайну уровней', 'Работа с анимациями в играх',
    'Гайд по Unreal Engine для начинающих', 'Создание интерфейсов (UI)',
    'Оптимизация производительности', 'Гайд по звуковому дизайну',
    'Секреты геймдизайна', 'Гайд: как собрать команду разработчиков'
  ];
  const subcategories = ['engine', 'mechanics', 'assets'];
  for (let i = 0; i < 10; i++) {
    const title = guideTitles[i] || `Гайд ${i + 1}`;
    const author = allUsers[randomInt(0, allUsers.length - 1)];
    const game = Math.random() > 0.5 ? games[randomInt(0, games.length - 1)] : null;
    const subcategory = subcategories[randomInt(0, subcategories.length - 1)];
    await prisma.article.create({
      data: {
        title,
        content: `Подробный гайд на тему "${title}". В этом руководстве мы рассмотрим основные приёмы и лучшие практики, которые помогут вам добиться успеха.`,
        category: 'guide',
        subcategory,
        authorId: author.id,
        gameId: game?.id || null,
        mediaUrl: `https://picsum.photos/seed/guide${i}/400/300`,
        description: `Гайд: ${title}`,
      },
    });
  }

  console.log('Посев завершён: созданы пользователи, жанры, платформы, 20 игр, 10 новостей и 10 гайдов.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });