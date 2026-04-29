// lib/cloudflare.ts

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================
// CONFIGURACIÓN DE CLOUDFLARE R2
// ============================================

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "";

// Extraer account_id del endpoint si no está configurado directamente
function extractAccountId(endpoint: string): string {
  const match = endpoint.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
  return match ? match[1] : "";
}

const endpointFromEnv = process.env.R2_ENDPOINT || "";
const endpoint = endpointFromEnv || `https://${accountId}.r2.cloudflarestorage.com`;

// Crear cliente S3 compatible con R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true, // Necesario para R2
});

// ============================================
// COMPENSACIÓN AUTOMÁTICA DE HORA (CLOCK SKEW)
// ============================================
// Esto soluciona el error RequestTimeTooSkewed si el reloj local está desfasado.

r2Client.middlewareStack.add(
  (next) => async (args) => {
    try {
      const result = await next(args);
      
      // En cada respuesta exitosa, actualizamos el offset para futuros pedidos
      const response = result.response as any;
      if (response && response.headers && response.headers.date) {
        const serverDate = new Date(response.headers.date);
        const offset = serverDate.getTime() - Date.now();
        if (Math.abs(offset) > 2000) { // Solo si hay más de 2s de diferencia
          (r2Client.config as any).systemClockOffset = offset;
        }
      }
      return result;
    } catch (error: any) {
      // Si falla por desfase horario, intentamos sincronizar y reintentar una vez
      if (
        (error.name === "RequestTimeTooSkewed" || error.Code === "RequestTimeTooSkewed") &&
        !(args as any)._isRetry
      ) {
        console.warn("[R2] Desfase horario detectado. Sincronizando con el servidor...");
        
        // Intentar obtener la hora del servidor desde los headers del error si están disponibles
        const serverDateStr = error.$metadata?.httpHeaders?.date;
        let offset = 0;

        if (serverDateStr) {
          offset = new Date(serverDateStr).getTime() - Date.now();
        } else {
          // Si no, hacer una petición rápida al endpoint para obtener el header Date
          try {
            const res = await fetch(endpoint, { method: "HEAD" });
            const dateStr = res.headers.get("date");
            if (dateStr) {
              offset = new Date(dateStr).getTime() - Date.now();
            }
          } catch (e) {
            console.error("[R2] No se pudo obtener la hora del servidor para sincronizar.");
          }
        }

        if (offset !== 0) {
          (r2Client.config as any).systemClockOffset = offset;
          console.log(`[R2] Reloj sincronizado. Offset: ${offset}ms. Reintentando...`);
          
          // Marcar para no entrar en bucle infinito
          (args as any)._isRetry = true;
          return await next(args);
        }
      }
      throw error;
    }
  },
  {
    step: "initialize",
    name: "ClockSkewMiddleware",
    priority: "high",
  }
);

export const R2_BUCKET_NAME = bucketName;
export const R2_PUBLIC_URL = "/api/images";

// ============================================
// TIPOS
// ============================================

export interface UploadResult {
  url: string;
  key: string;
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresIn: number;
}

// ============================================
// SUBIR IMAGEN A R2
// ============================================

export async function uploadImage(
  file: File,
  folder: string = "products"
): Promise<UploadResult> {
  if (!file) {
    throw new Error("No se proporcionó ningún archivo");
  }

  // Validar tipo de archivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)");
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("El archivo es demasiado grande. Máximo 5MB");
  }

  // Generar nombre único
  const fileExtension = file.name.split(".").pop();
  const uniqueId = randomUUID();
  const key = `${folder}/${uniqueId}.${fileExtension}`;

  // Convertir File a Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Subir a R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    CacheControl: "public, max-age=31536000", // Cache por 1 año
  });

  await r2Client.send(command);

  // Construir URL pública
  const url = `${R2_PUBLIC_URL}/${key}`;

  return { url, key };
}

// ============================================
// SUBIR IMAGEN DESDE BUFFER
// ============================================

export async function uploadImageFromBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "products"
): Promise<UploadResult> {
  if (!buffer) {
    throw new Error("No se proporcionó ningún buffer");
  }

  // Validar tipo de archivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)");
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error("El archivo es demasiado grande. Máximo 5MB");
  }

  // Generar nombre único
  const fileExtension = originalName.split(".").pop();
  const uniqueId = randomUUID();
  const key = `${folder}/${uniqueId}.${fileExtension}`;

  // Subir a R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000",
  });

  await r2Client.send(command);

  // Construir URL pública
  const url = `${R2_PUBLIC_URL}/${key}`;

  return { url, key };
}

// ============================================
// SUBIR MÚLTIPLES IMÁGENES
// ============================================

export async function uploadMultipleImages(
  files: File[],
  folder: string = "products"
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    try {
      const result = await uploadImage(file, folder);
      results.push(result);
    } catch (error) {
      console.error(`Error subiendo ${file.name}:`, error);
      // Continuar con las demás imágenes
    }
  }

  return results;
}

// ============================================
// ELIMINAR IMAGEN DE R2
// ============================================

export async function deleteImage(key: string): Promise<void> {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// ============================================
// ELIMINAR MÚLTIPLES IMÁGENES
// ============================================

export async function deleteMultipleImages(keys: string[]): Promise<void> {
  const deletePromises = keys.map((key) => deleteImage(key));
  await Promise.all(deletePromises);
}

// ============================================
// ELIMINAR IMÁGENES POR PREFIJO (CARPETA)
// ============================================

export async function deleteImagesByPrefix(prefix: string): Promise<void> {
  // Esta función requiere listar objetos primero
  // Se implementará cuando sea necesario
  console.log(`Eliminando imágenes con prefijo: ${prefix}`);
  // Implementación pendiente para Fase 8.5
}

// ============================================
// GENERAR URL FIRMADA (PARA ARCHIVOS PRIVADOS)
// ============================================

export async function getSignedImageUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

// ============================================
// VERIFICAR CONEXIÓN A R2
// ============================================

export async function checkR2Connection(): Promise<boolean> {
  try {
    // Intento de subir un archivo de prueba muy pequeño
    const testKey = `test/connection-${Date.now()}.txt`;
    const testBuffer = Buffer.from("Connection test");

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: testKey,
      Body: testBuffer,
      ContentType: "text/plain",
    });

    await r2Client.send(command);

    // Limpiar archivo de prueba
    await deleteImage(testKey);

    return true;
  } catch (error) {
    console.error("Error de conexión con R2:", error);
    return false;
  }
}

// ============================================
// OBTENER URL PÚBLICA DE UN ARCHIVO
// ============================================

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

// ============================================
// EXTRAER KEY DE UNA URL PÚBLICA
// ============================================

export function extractKeyFromUrl(url: string): string | null {
  const prefix = `${R2_PUBLIC_URL}/`;
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length);
  }
  return null;
}