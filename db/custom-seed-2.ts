import "dotenv/config";
import { db } from "./index";
import { categories, products, inventory, comercialConfig, stores, orders, pushSubscriptions, users } from "./schema";
import { randomUUID } from "crypto";

async function seed() {
    console.log("Limpiando la base de datos completa...");
    
    // Eliminar todo
    await db.delete(orders);
    await db.delete(pushSubscriptions);
    await db.delete(inventory);
    await db.delete(comercialConfig);
    await db.delete(products);
    await db.delete(stores);
    await db.delete(users);
    await db.delete(categories);
    
    console.log("Todas las tablas han sido limpiadas.");
    
    // Categorías con sus respectivos iconos (emojis)
    const categoriasList = [
        { name: "Tecnología", icon: "💻" },
        { name: "Moda", icon: "👕" },
        { name: "Hogar", icon: "🏠" },
        { name: "Salud y Belleza", icon: "💄" },
        { name: "Alimentos", icon: "🍎" },
        { name: "Vehículos", icon: "🚗" },
        { name: "Herramientas", icon: "🛠️" },
        { name: "Deportes", icon: "⚽" },
        { name: "Bebés y Niños", icon: "👶" },
        { name: "Mascotas", icon: "🐶" },
        { name: "Oficina", icon: "🗄️" },
        { name: "Electrodomésticos", icon: "📺" },
        { name: "Entretenimiento", icon: "🎮" },
        { name: "Servicios", icon: "🤝" },
        { name: "Inmuebles", icon: "🏢" },
        { name: "Empleos", icon: "💼" },
        { name: "Agro", icon: "🌾" },
        { name: "Industria", icon: "🏭" }
    ];
    
    console.log("Insertando categorías con iconos...");
    for (const cat of categoriasList) {
        const catId = randomUUID();
        const slug = cat.name.toLowerCase()
            .replace(/ /g, "-")
            .replace(/ñ/g, "n")
            .replace(/é/g, "e")
            .replace(/í/g, "i")
            .replace(/ó/g, "o")
            .replace(/ú/g, "u")
            .replace(/á/g, "a");
        
        await db.insert(categories).values({
            id: catId,
            name: cat.name,
            slug: slug,
            icon: cat.icon
        });
        console.log(`- ${cat.icon} ${cat.name}`);
    }
    
    console.log("✅ Proceso completado con éxito.");
}

seed().catch(console.error);
