import { NextRequest, NextResponse } from "next/server";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/cloudflare";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/app/actions/auth";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const thumbBlob = formData.get("thumb") as Blob | null;
    const feedBlob = formData.get("feed") as Blob | null;
    const ogBlob = formData.get("og") as Blob | null;

    if (!feedBlob) {
      return NextResponse.json(
        { error: "Se requiere al menos la imagen principal (feed)" },
        { status: 400 }
      );
    }

    const uniqueId = randomUUID();

    const uploadVariant = async (
      blob: Blob,
      variant: "thumb" | "feed" | "og"
    ) => {
      const bytes = await blob.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Folders named by dimensions as requested
      const folderMap = {
        thumb: "400x300",
        feed: "1200x900",
        og: "1200x630"
      };
      
      const key = `products/${folderMap[variant]}/${uniqueId}.jpg`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000",
        })
      );

      return `${R2_PUBLIC_URL}/${key}`;
    };

    // Upload all variants in parallel
    const [feedUrl, thumbUrl, ogUrl] = await Promise.all([
      uploadVariant(feedBlob, "feed"),
      thumbBlob ? uploadVariant(thumbBlob, "thumb") : Promise.resolve(null),
      ogBlob ? uploadVariant(ogBlob, "og") : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      feedUrl,
      thumbUrl,
      ogUrl,
    });
  } catch (error: any) {
    console.error("Error uploading product images:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir las imágenes" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "Se requieren URLs válidas" }, { status: 400 });
    }

    const { r2Client, R2_BUCKET_NAME, extractKeyFromUrl } = await import("@/lib/cloudflare");
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    // Para cada URL, intentamos borrar sus variantes (thumb, feed, og)
    const deletePromises = urls.flatMap((url) => {
      const key = extractKeyFromUrl(url);
      if (!key) return [];

      // Extraer el ID único y la extensión (ej: products/1200x900/uuid.jpg -> uuid.jpg)
      const parts = key.split("/");
      const filename = parts[parts.length - 1];
      
      // Borrar de las 3 carpetas de dimensiones
      return ["400x300", "1200x900", "1200x630"].map((folder) => {
        return r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `products/${folder}/${filename}`,
          })
        ).catch(err => {
          console.error(`Error eliminando variante ${folder}/${filename}:`, err);
        });
      });
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product images:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar las imágenes" },
      { status: 500 }
    );
  }
}
