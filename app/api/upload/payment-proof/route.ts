import { NextRequest, NextResponse } from "next/server";
import { uploadImageFromBuffer } from "@/lib/cloudflare";

// Ruta pública para subir comprobantes de pago (no requiere autenticación)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes (JPEG, PNG, WEBP)" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Convertir a buffer y subir en el servidor (evita el problema de reloj del cliente)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadImageFromBuffer(
      buffer,
      file.name,
      file.type,
      "payment-proofs"
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir el comprobante" },
      { status: 500 }
    );
  }
}
