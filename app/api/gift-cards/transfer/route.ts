import { NextRequest, NextResponse } from 'next/server';
import { transferGiftCard } from '@/app/actions/gift-cards';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { giftCardId, recipientEmail } = body;

        if (!giftCardId || !recipientEmail) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos' },
                { status: 400 }
            );
        }

        const result = await transferGiftCard(giftCardId, recipientEmail);

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en transferencia:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}