const { db } = require('./index');
const { categories, users } = require('./schema');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

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
    try {
      await db.insert(categories).values(categoria);
      console.log(`✅ Categoría insertada: ${categoria.name}`);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log(`⚠️ Categoría ya existe: ${categoria.name}`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }

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

  try {
    await db.insert(users).values(testUser);
    console.log("✅ Usuario de prueba creado (email: vendedor@test.com, contraseña: test123)");
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log("⚠️ Usuario ya existe");
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log("🎉 Seed completado!");
}

seed().catch(console.error);