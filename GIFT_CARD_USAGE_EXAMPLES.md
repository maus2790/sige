// # Ejemplos de Uso - Sistema de Códigos Seguros para Gift Cards

// ============================================
// 1. GENERAR CÓDIGO SEGURO DIRECTAMENTE
// ============================================

import { generateSecureGiftCardCode, hashGiftCardCode } from '@/lib/gift-card-code';

// Uso básico (solo en servidor - está marcado con 'use server')
const code = generateSecureGiftCardCode();
console.log(code);
// Output: A3KF-XW9M-P2QR

// Generar hash para verificación QR
const qrHash = hashGiftCardCode(code);
console.log(qrHash);
// Output: 3f7c2a9e8b4f1d5a6c8e2b9f3a7c1d5e9f4a2b8c5d1e6a9f3b7c2d8e1a4f5

// ============================================
// 2. CREAR GIFT CARD CON CÓDIGO SEGURO
// ============================================

// En app/actions/gift-cards.ts, la función purchaseGiftCard()
// automáticamente genera un código seguro:

'use server';
import { purchaseGiftCard } from '@/app/actions/gift-cards';

const result = await purchaseGiftCard({
  amount: 150,
  recipientName: 'Juan Pérez',
  recipientEmail: 'juan@example.com',
  message: 'Para tu cumpleaños',
  saveToWallet: false,
});

if (result.success) {
  console.log('Gift Card creada con éxito');
  // El código fue generado automáticamente de forma segura
  // y almacenado en la BD con su hash SHA-256
}

// ============================================
// 3. GUARDAR GIFT CARD EN BILLETERA
// ============================================

// Crea una gift card para tu propia billetera
// (el código se genera automáticamente)
const walletResult = await purchaseGiftCard({
  amount: 500,
  recipientName: 'Mi billetera',
  saveToWallet: true,
});

// ============================================
// 4. GENERAR CÓDIGO DE TIENDA
// ============================================

// Cuando un vendedor activa un template de gift card:
import { toggleStoreGiftCardTemplate } from '@/app/actions/gift-cards';

await toggleStoreGiftCardTemplate('template-id-123', true);
// Automáticamente genera un código seguro y lo asigna al template

// ============================================
// 5. USAR LA API ROUTE (Opción alternativa)
// ============================================

// Cliente:
async function generateNewGiftCardCode() {
  const response = await fetch('/api/gift-cards/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Código generado:', data.code);
    // Output: {
    //   success: true,
    //   code: "A3KF-XW9M-P2QR",
    //   qrHash: "3f7c2a9e8b4f1d5a6c8e2b9f3a7c1d5e...",
    //   format: {
    //     length: 12,
    //     blocks: 3,
    //     blockSize: 4,
    //     separator: "-",
    //     example: "A3KF-XW9M-P2QR"
    //   },
    //   alphabet: {
    //     letters: "A-Z (excluding O, I)",
    //     numbers: "2-9 (excluding 0, 1)",
    //     totalCharacters: 32
    //   },
    //   security: {
    //     generator: "crypto.randomInt() - Cryptographically secure",
    //     hash: "SHA-256 for QR verification",
    //     distribution: "Uniform random distribution"
    //   }
    // }
  }
}

// ============================================
// 6. VERIFICACIÓN EN DASHBOARD VENDEDOR
// ============================================

// Cuando vendedor activa una gift card pendiente:
import { verifyStoreGiftCardPayment } from '@/app/actions/gift-cards';

await verifyStoreGiftCardPayment(
  'gift-card-id-xyz',
  'approve', // Acción: 'approve' o 'reject'
  undefined  // Razón de rechazo (opcional)
);

// El sistema:
// 1. Cambia status a 'active'
// 2. Registra en historial
// 3. Notifica al destinatario
// 4. El código ya estaba generado en la creación

// ============================================
// 7. VALIDAR CÓDIGO EN COMPRA
// ============================================

// Cuando usuario canjea una gift card:
import { validateGiftCard } from '@/app/actions/gift-cards';

const validationResult = await validateGiftCard('A3KF-XW9M-P2QR');

if (validationResult.success) {
  console.log('Código válido');
  console.log('Saldo disponible:', validationResult.card.currentBalance);
} else {
  console.log('Error:', validationResult.error);
}

// ============================================
// 8. FLUJO COMPLETO: CREAR, VERIFICAR, CANJEAR
// ============================================

// PASO 1: Vendedor crea gift card de tienda (cliente compra)
const createResult = await purchaseGiftCard({
  amount: 200,
  recipientName: 'Cliente',
  recipientEmail: 'cliente@example.com',
  storeGiftCardTemplateId: 'template-store-123',
  // Status será 'pending_payment' porque tiene storeGiftCardTemplateId
});

const giftCardId = createResult.id;

// En este punto:
// ✓ Código generado: "A3KF-XW9M-P2QR"
// ✓ Hash generado: "3f7c2a9e8b4f1d5a..."
// ✓ Estado: 'pending_payment'
// ✓ Se muestra en verificaciones del vendedor

// PASO 2: Vendedor verifica pago y activa en dashboard
await verifyStoreGiftCardPayment(giftCardId, 'approve');

// En este punto:
// ✓ Estado cambia a 'active'
// ✓ Se registra en historial
// ✓ Cliente recibe notificación

// PASO 3: Cliente canjea en tienda
const validateResult = await validateGiftCard('A3KF-XW9M-P2QR');
if (validateResult.success) {
  // Proceder con compra usando el saldo
}

// ============================================
// 9. SEGURIDAD - LO QUE NO HACER
// ============================================

// ❌ NO usar Math.random() (inseguro)
const badCode = 'GIFT-' + Math.random().toString(36).slice(2, 6);

// ❌ NO generar en cliente (expone lógica)
// ✓ SÍ usar API Route con autenticación

// ❌ NO almacenar código en plaintext en logs
console.log(code); // Solo en desarrollo

// ✓ SÍ usar hash para QR y verificación
const qrCodeContent = qrHash;

// ============================================
// 10. MONITOREO Y DEBUGGING
// ============================================

// Ver historial de generación
import { getGiftCardHistory } from '@/app/actions/gift-cards';

const history = await getGiftCardHistory('gift-card-id');
// Muestra: [
//   { action: 'saved', description: 'Gift card guardada en billetera', ... },
//   { action: 'sent', description: 'Gift card enviada a Cliente', ... },
//   { action: 'received', description: 'Gift card recibida de Vendedor', ... }
// ]

// Ver estadísticas
import { getGiftCardStats } from '@/app/actions/gift-cards';

const stats = await getGiftCardStats();
// {
//   totalCards: 42,
//   sentCount: 15,
//   receivedCount: 20,
//   savedCount: 7,
//   activeCount: 35,
//   totalBalance: 2500.50,
//   expiredCount: 2,
//   redeemedCount: 5,
//   directBalance: 100.00
// }
