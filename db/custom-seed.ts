import "dotenv/config";
import { db } from "./index";
import { categories, products, inventory, comercialConfig, stores, orders, pushSubscriptions, users } from "./schema";
import { randomUUID } from "crypto";

async function seed() {
    console.log("Limpiando la base de datos (excepto usuarios)...");
    
    await db.delete(orders);
    await db.delete(pushSubscriptions);
    await db.delete(inventory);
    await db.delete(comercialConfig);
    await db.delete(products);
    await db.delete(stores);
    await db.delete(categories);
    
    console.log("Tablas limpiadas.");
    
    // Categorías ordenadas
    const cats = [
        "Tecnología", "Moda", "Hogar", "Salud y Belleza", "Alimentos", 
        "Vehículos", "Herramientas", "Deportes", "Bebés y Niños", "Mascotas", 
        "Oficina", "Electrodomésticos", "Entretenimiento", "Servicios", 
        "Inmuebles", "Empleos", "Agro", "Industria"
    ];
    
    // Obtener un usuario para asignarle la tienda
    const allUsers = await db.select().from(users).limit(1);
    let user = allUsers[0];
    if (!user) {
        console.log("No hay usuarios, creando uno...");
        const newUserId = randomUUID();
        await db.insert(users).values({
            id: newUserId,
            name: "Demo User",
            email: "demo@demo.com",
            password: "hashedpassword",
            role: "superadmin"
        });
        const usersList = await db.select().from(users).limit(1);
        user = usersList[0];
    }
    
    // Crear una tienda para el usuario
    const storeId = randomUUID();
    await db.insert(stores).values({
        id: storeId,
        userId: user.id,
        name: "Tienda Demo Principal",
        description: "Tienda principal para mostrar productos de todas las categorías."
    });
    console.log(`Tienda creada con id ${storeId} para el usuario ${user.email}`);

    // Crear categorías y productos
    for (const catName of cats) {
        const catId = randomUUID();
        const slug = catName.toLowerCase()
            .replace(/ /g, "-")
            .replace(/ñ/g, "n")
            .replace(/é/g, "e")
            .replace(/í/g, "i")
            .replace(/ó/g, "o")
            .replace(/ú/g, "u")
            .replace(/á/g, "a");
        
        await db.insert(categories).values({
            id: catId,
            name: catName,
            slug: slug
        });
        
        console.log(`Categoría creada: ${catName} (con 3 productos)`);
        
        // Crear 3 productos por categoría
        for (let i = 1; i <= 3; i++) {
            const prodId = randomUUID();
            await db.insert(products).values({
                id: prodId,
                storeId: storeId,
                name: `${catName} - Producto Modelo ${i}`,
                description: `Esta es una descripción detallada para el producto modelo ${i} de la categoría ${catName}. Ideal para pruebas de diseño y visualización en el sistema.`,
                category: slug,
                sku: `SKU-${slug.substring(0, 3).toUpperCase()}-00${i}`
            });
            
            // Crear inventory
            await db.insert(inventory).values({
                id: randomUUID(),
                productId: prodId,
                stockActual: Math.floor(Math.random() * 100) + 10,
                stockMinimo: 5
            });
            
            // Crear comercialConfig
            const price = Math.floor(Math.random() * 500) + 50;
            await db.insert(comercialConfig).values({
                id: randomUUID(),
                productId: prodId,
                precioAdquisicion: price * 0.6,
                precioVenta: price,
                isPublished: true
            });
        }
    }
    
    console.log("✅ Seed completado con éxito.");
}

seed().catch(console.error);
