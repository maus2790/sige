# Sistema de Generación de Códigos Seguros para Gift Cards

## Descripción General

El sistema implementa la generación de códigos criptográficamente seguros para gift cards siguiendo especificaciones de seguridad y usabilidad. Utiliza el módulo `crypto` nativo de Node.js para garantizar aleatoriedad de distribución uniforme.

## Especificaciones Técnicas

### Alfabeto (32 caracteres)
```
Letras: A-Z (sin O, I) = 24 caracteres
Números: 2-9 (sin 0, 1) = 8 caracteres
Total: 32 caracteres
```

**Razonamiento**: Los caracteres omitidos (O, 0, I, 1) son frecuentemente confusos para usuarios, especialmente al leer o escribir manualmente códigos.

### Longitud y Formato
- **Longitud total**: 12 caracteres
- **Formato**: 3 bloques de 4 caracteres separados por guiones
- **Ejemplo**: `A3KF-XW9M-P2QR`
- **Entropía**: 32^12 ≈ 1.18 × 10^18 combinaciones posibles

### Seguridad Criptográfica
```typescript
// Generación
crypto.randomInt(0, GIFT_CARD_ALPHABET.length)
// Garantiza distribución uniforme sin sesgos de pseudoaleatoriedad

// Hash para QR
crypto.createHash('sha256').update(code).digest('hex')
// SHA-256 para verificación segura sin exponer el código original
```

## Implementación

### 1. Módulo Principal: `lib/gift-card-code.ts`

**Exporta tres funciones**:

#### `generateSecureGiftCardCode(): string`
Genera un código de 12 caracteres con distribución criptográficamente uniforme.

```typescript
const code = generateSecureGiftCardCode();
// Retorna: "A3KF-XW9M-P2QR"
```

#### `hashGiftCardCode(code: string): string`
Genera un hash SHA-256 del código para verificación en códigos QR.

```typescript
const hash = hashGiftCardCode("A3KF-XW9M-P2QR");
// Retorna: "3f7c2a9e8b4f1d5a6c8e2b9f3a7c1d5e..."
```

#### `normalizeGiftCardCode(code: string): string`
Normaliza un código para almacenamiento y comparación (trim + uppercase).

```typescript
const normalized = normalizeGiftCardCode("  a3kf-xw9m-p2qr  ");
// Retorna: "A3KF-XW9M-P2QR"
```

### 2. Integración en Server Actions: `app/actions/gift-cards.ts`

La función `generateUniqueGiftCardCode()` (línea 1690) asegura:
1. Generación criptográfica segura
2. Verificación de unicidad contra base de datos
3. Manejo de colisiones con reintentos automáticos
4. Máximo 20 intentos antes de fallar

```typescript
const uniqueCode = await generateUniqueGiftCardCode();
```

### 3. API Route: `app/api/gift-cards/generate-code/route.ts`

Endpoint POST protegido por autenticación que expone la generación segura:

**Request**:
```bash
POST /api/gift-cards/generate-code
Authorization: Bearer {session_token}
```

**Response (200)**:
```json
{
  "success": true,
  "code": "A3KF-XW9M-P2QR",
  "qrHash": "3f7c2a9e8b4f1d5a6c8e2b9f3a7c1d5e...",
  "format": {
    "length": 12,
    "blocks": 3,
    "blockSize": 4,
    "separator": "-",
    "example": "A3KF-XW9M-P2QR"
  },
  "alphabet": {
    "letters": "A-Z (excluding O, I)",
    "numbers": "2-9 (excluding 0, 1)",
    "totalCharacters": 32
  },
  "security": {
    "generator": "crypto.randomInt() - Cryptographically secure",
    "hash": "SHA-256 for QR verification",
    "distribution": "Uniform random distribution"
  }
}
```

## Flujo de Generación en Transacciones

### Compra de Gift Card (`purchaseGiftCard()`)

```
1. Usuario inicia compra
2. Sistema llama generateUniqueGiftCardCode()
   ↓
3. generateSecureGiftCardCode() produce código
4. Verificación de unicidad en BD
5. Si colisión, reintentar (máx 20 intentos)
6. Generar SHA-256 hash del código
7. Insertar en BD (código + hash + datos)
8. Si status='active': registrar en historial
9. Si status='pending_payment': esperar a verificación vendedor
```

### Verificación y Activación (`verifyStoreGiftCardPayment()`)

```
1. Vendedor activa gift card en dashboard
2. Sistema cambia status a 'active'
3. Registra acción en historial
4. Notifica al destinatario
```

**Punto importante**: El código se genera UNA SOLA VEZ durante la creación, no durante la activación.

## Niveles de Seguridad

### Criptografía
- ✅ Generación: `crypto.randomInt()` (CSPRNG - Cryptographically Secure Pseudo-Random Number Generator)
- ✅ Hashing: SHA-256 para verificación QR
- ✅ Unicidad: Verificación contra base de datos

### Aplicación
- ✅ `'use server'` en `lib/gift-card-code.ts` - Ejecución garantizada en servidor
- ✅ Autenticación requerida en API route
- ✅ Manejo de transacciones BD para atomicidad

### Datos
- ✅ Código: Almacenado con restricción UNIQUE en BD
- ✅ Hash: Almacenado para verificación sin exponer código
- ✅ Historial: Registro auditable de generación y activación

## Casos de Uso

### Uso 1: Crear Gift Card Personal
```typescript
// User crea gift card para su billetera
const result = await purchaseGiftCard({
  amount: 100,
  recipientName: "Mi billetera",
  saveToWallet: true,
});
// Genera código automáticamente
```

### Uso 2: Crear Gift Card de Tienda
```typescript
// Vendedor activa template de gift card
const result = await toggleStoreGiftCardTemplate(templateId, true);
// Genera código en background
```

### Uso 3: Verificación Manual (Admin)
```bash
# Si necesita regenerar por error
curl -X POST /api/gift-cards/generate-code \
  -H "Authorization: Bearer $TOKEN"
```

## Pruebas Recomendadas

### Unitarias
```typescript
test('generateSecureGiftCardCode produces valid format', () => {
  const code = generateSecureGiftCardCode();
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  expect(code).not.toContain('O');
  expect(code).not.toContain('I');
  expect(code).not.toContain('0');
  expect(code).not.toContain('1');
});
```

### Integración
```typescript
test('generateUniqueGiftCardCode verifies uniqueness', async () => {
  const code1 = await generateUniqueGiftCardCode();
  const code2 = await generateUniqueGiftCardCode();
  expect(code1).not.toBe(code2);
});
```

### Seguridad
```typescript
test('codes have sufficient entropy (32^12 > 10^18)', () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const entropy = Math.pow(alphabet.length, 12);
  expect(entropy).toBeGreaterThan(1e18);
});
```

## Migración desde Sistema Anterior

Si había un sistema anterior, los cambios fueron:

❌ **Eliminado**:
- `generateGiftCode()` - Función insegura con `Math.random()`
- Códigos formato `GIFT-XXXX` - Formato corto y no aleatorio

✅ **Nuevo**:
- Códigos seguro formato `XXXX-XXXX-XXXX` - Criptográficamente generado
- Función `generateSecureGiftCardCode()` - Basada en `crypto`
- API Route para exposición segura - Disponible para futuras integraciones

## Mantenimiento

### Variables de Configuración
```typescript
const GIFT_CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars
const CODE_LENGTH = 12;
const BLOCK_SIZE = 4;
const BLOCKS = CODE_LENGTH / BLOCK_SIZE; // 3
```

Para cambiar formato, modificar solo `lib/gift-card-code.ts`:
- `CODE_LENGTH`: Cambiar longitud total
- `BLOCK_SIZE`: Cambiar tamaño de bloques
- `GIFT_CARD_ALPHABET`: Cambiar caracteres permitidos

### Monitoreo
- Revisar logs de `generateUniqueGiftCardCode()` para fallos después de 20 intentos
- Verificar distribución de códigos en BD (debería ser aleatoria)
- Auditar historial de activaciones en dashboard

## Referencias

- [Node.js crypto.randomInt()](https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback)
- [OWASP: Pseudorandom Number Generators](https://owasp.org/www-community/attacks/Cryptanalysis)
- [Next.js App Router Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
