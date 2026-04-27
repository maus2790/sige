// /app/api/images/[...key]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/cloudflare";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fileKey = key.join("/");

    if (!fileKey) {
      return new NextResponse("Falta la clave del archivo", { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return new NextResponse("Archivo no encontrado", { status: 404 });
    }

    const stream = response.Body as any;

    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(stream, {
      headers,
    });
  } catch (error) {
    console.error("Error al servir imagen desde R2:", error);
    return new NextResponse("Error al obtener la imagen", { status: 500 });
  }
}
