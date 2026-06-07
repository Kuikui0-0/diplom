import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const ticketId = Number(id);

  try {
    const body = await request.json();
    const { status, resolution, closeReason } = body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Для закрытия обязательно указать причину
    if (status === 'closed' && !closeReason?.trim()) {
      return NextResponse.json({ error: 'Причина закрытия обязательна' }, { status: 400 });
    }

    // Подготавливаем данные для обновления
    const data: any = {
      status,
      assigneeId: session.userId,
    };

    // Если переводим в решён, сохраняем описание (если передано)
    if (status === 'resolved') {
      data.resolution = resolution?.trim() || null;
    }

    // Если переводим в закрыт, сохраняем причину
    if (status === 'closed') {
      data.closeReason = closeReason?.trim();
    }

    // При возврате из закрытого/решённого в другой статус – сбрасываем соответствующие поля (опционально)
    if (status !== 'resolved' && status !== 'closed') {
      data.resolution = null;
      data.closeReason = null;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: { author: true },
    });

    // Уведомление автору
    if (updatedTicket.authorId !== session.userId) {
  const statusText = statusLabels[status] || status;
  await prisma.notification.create({
    data: {
      userId: updatedTicket.authorId,
      type: 'ticket_status',
      message: `Статус вашего тикета «${updatedTicket.title}» изменён на «${statusText}»`,
      relatedId: updatedTicket.id,
    },
  });
}

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Ошибка обновления тикета:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.ticket.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}