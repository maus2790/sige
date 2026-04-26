import { db } from "./index";
import { categories, users } from "./schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

async function seed() {
    console.log("🌱 Iniciando seed...");

    // Insertar categorías predefinidas
    const categorias = [
        { id: randomUUID(), name: "Electrónicos", slug: "electronicos", icon: "📱" },
        { id: randomUUID(), name: "Ropa", slug: "ropa", icon: "👕" },
        { id: randomUUID(), name: "Hogar", slug: "hogar", icon: "🏠" },
        { id: randomUUID(), name: "Deportes", slug: "deportes", icon: "⚽" },
        { id: randomUUID(), name: "Libros", slug: "libros", icon: "📚" },
        { id: randomUUID(), name: "Juguetes", slug: "juguetes", icon: "🧸" },
    ];

    for (const categoria of categorias) {
        await db.insert(categories).values(categoria).onConflictDoNothing();
    }
    console.log(`✅ Insertadas ${categorias.length} categorías`);

    // Insertar usuario de prueba
    const hashedPassword = await bcrypt.hash("test123", 10);

    const testUser = {
        id: randomUUID(),
        email: "vendedor@test.com",
        password: hashedPassword,
        name: "Vendedor Test",
        role: "seller",
        phone: "123456789",
        videoPlan: "free",
    };

    await db.insert(users).values(testUser).onConflictDoNothing();
    console.log("✅ Usuario de prueba creado (email: vendedor@test.com, contraseña: test123)");

    console.log("🎉 Seed completado!");
}

seed().catch(console.error);