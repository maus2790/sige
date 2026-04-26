const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({
  url: "libsql://sige-db-maus2790.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcwNjcwNTUsImlkIjoiMDE5ZGMxNmQtNGYwMS03ODI4LTkzNTEtZjE2YzE5OTkzZTg3IiwicmlkIjoiMjBjMzcwYzMtNTFkNi00NjQ2LWI2NmMtZDZjYjdjMDdkNzBhIn0.3ofXhakcSZ7U0cwcGV2loLgUa4XMa_nFUgjlxB9GSTriZJ5Q4ouG3oqHaK8FYdE-udpyu0Q94wN9FNsqKyUHAg"
});

async function seed() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Insertar categorías
  console.log("📂 Insertando categorías...");
  
  const categorias = [
    ["cat-1", "Electrónicos", "electronicos", "📱"],
    ["cat-2", "Ropa", "ropa", "👕"],
    ["cat-3", "Hogar", "hogar", "🏠"],
    ["cat-4", "Deportes", "deportes", "⚽"],
    ["cat-5", "Libros", "libros", "📚"],
    ["cat-6", "Juguetes", "juguetes", "🧸"]
  ];

  for (const [id, name, slug, icon] of categorias) {
    try {
      await client.execute({
        sql: `INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)`,
        args: [id, name, slug, icon]
      });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log(`  ⚠️ ${name} ya existe`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }

  // 2. Insertar usuario de prueba
  console.log("\n👤 Insertando usuario de prueba...");
  
  const hashedPassword = await bcrypt.hash("test123", 10);
  
  try {
    await client.execute({
      sql: `INSERT INTO users (id, email, password, name, role, phone, video_plan) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "user-test-1",
        "vendedor@test.com",
        hashedPassword,
        "Vendedor Test",
        "seller",
        "123456789",
        "free"
      ]
    });
    console.log("  ✅ Usuario creado: vendedor@test.com / test123");
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log("  ⚠️ Usuario ya existe");
    } else {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  // 3. Insertar tienda para el usuario
  console.log("\n🏪 Insertando tienda...");
  
  try {
    await client.execute({
      sql: `INSERT INTO stores (id, user_id, name, description, phone, verified) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        "store-test-1",
        "user-test-1",
        "Tienda Test",
        "Esta es una tienda de prueba",
        "123456789",
        1
      ]
    });
    console.log("  ✅ Tienda creada");
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log("  ⚠️ Tienda ya existe");
    } else {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Seed completado!");
}

seed().catch(console.error);