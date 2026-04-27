import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudflare";
import { requireAuth } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const result = await uploadImage(file, folder);

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir el archivo" },
      { status: 500 }
    );
  }
}