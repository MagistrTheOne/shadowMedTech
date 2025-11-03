import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { visits, doctors } from '@/lib/db/schema';
import { gigaChatClient } from '@/lib/gigachat/client';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ['rep']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  let doctorName = 'Врач'; // Default fallback

  try {
    const body = await request.json();
    const { message, doctorName: bodyDoctorName, conversationHistory, visitId } = body;
    doctorName = bodyDoctorName || doctorName;

    if (!message || !visitId) {
      return NextResponse.json(
        { error: 'Message and visitId are required' },
        { status: 400 }
      );
    }

    // Verify visit belongs to user
    const [visit] = await db
      .select({
        id: visits.id,
        doctor: {
          personalityType: doctors.personalityType,
          promptTemplate: doctors.promptTemplate,
        },
      })
      .from(visits)
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit || !visit.doctor) {
      return NextResponse.json({ error: 'Visit or doctor not found' }, { status: 404 });
    }

    // Build conversation context
    const context = conversationHistory
      .filter((msg: any) => !msg.isUser) // Only doctor messages for context
      .slice(-5) // Last 5 exchanges
      .map((msg: any) => `Доктор: ${msg.text}`)
      .join('\n');

    // Prepare prompt for GigaChat
    const prompt = `${visit.doctor.promptTemplate}

Ты ведешь профессиональную беседу с медицинским представителем.
Отвечай на русском языке, будь вежливым но требовательным к деталям.
Фокусируйся на медицинских аспектах препаратов и лечения.

Предыдущий контекст разговора:
${context}

Последнее сообщение представителя: "${message}"

Дай профессиональный медицинский ответ в роли доктора ${doctorName}. Ответ должен быть полезным и информативным.`;

    // Convert conversation history to GigaChat format
    const gigaChatMessages = conversationHistory.map((msg: any) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text || msg.content || '',
    }));

    // Get response from GigaChat
    const aiResponse = await gigaChatClient.sendMessage([
      {
        role: 'system',
        content: prompt,
      },
      ...gigaChatMessages.slice(-10), // Last 10 messages for context
      {
        role: 'user',
        content: message,
      },
    ]);

    // Extract the actual response text
    const responseText = aiResponse.choices?.[0]?.message?.content ||
                        `Доктор ${doctorName}: Спасибо за информацию. Расскажите подробнее.`;

    // Format as doctor response
    const formattedResponse = responseText.startsWith(`Доктор ${doctorName}:`)
      ? responseText
      : `Доктор ${doctorName}: ${responseText}`;

    return NextResponse.json({
      response: formattedResponse,
      doctorName,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate chat response error:', error);

    // Return fallback response
    return NextResponse.json({
      response: `Доктор ${doctorName}: Я внимательно слушаю ваш вопрос. Можете предоставить больше деталей?`,
      fallback: true,
      timestamp: new Date().toISOString(),
    });
  }
}
