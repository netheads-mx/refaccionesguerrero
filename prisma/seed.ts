import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Sucursales
  const centro = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: { nombre: 'Sucursal Centro', direccion: 'Av. Juárez 123, Centro' },
  })
  const norte = await prisma.sucursal.upsert({
    where: { id: 2 },
    update: {},
    create: { nombre: 'Sucursal Norte', direccion: 'Blvd. Díaz Ordaz 456, Zona Norte' },
  })

  console.log('✓ Sucursales creadas')

  // Hash passwords
  const hash = (p: string) => bcrypt.hash(p, 12)

  // Users
  await prisma.usuario.upsert({
    where: { email: 'admin@inventarios.com' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Ramírez',
      email: 'admin@inventarios.com',
      password: await hash('Admin123!'),
      rol: 'administrador',
      sucursalId: centro.id,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'gerente@inventarios.com' },
    update: {},
    create: {
      nombre: 'Laura',
      apellido: 'González',
      email: 'gerente@inventarios.com',
      password: await hash('Manager123!'),
      rol: 'manager',
      sucursalId: norte.id,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'cajero@inventarios.com' },
    update: {},
    create: {
      nombre: 'Andrés',
      apellido: 'Torres',
      email: 'cajero@inventarios.com',
      password: await hash('Cajero123!'),
      rol: 'cajero',
      sucursalId: centro.id,
    },
  })

  console.log('✓ Usuarios creados')

  // Products
  const products = [
    { numeroSerie: 'LP-2024-001', nombre: 'Laptop Dell Inspiron 15', descripcion: 'Laptop para uso profesional y educativo', marca: 'Dell', modelo: 'Inspiron 15-3520', color: 'Plateado', detalles: 'Intel Core i5-1235U, 8GB RAM, 512GB SSD', sucursalId: centro.id, precioUnitario: 12500.00, stock: 5 },
    { numeroSerie: 'LP-2024-002', nombre: 'Laptop HP Pavilion', descripcion: 'Laptop multimedia de alto rendimiento', marca: 'HP', modelo: 'Pavilion 15', color: 'Azul', detalles: 'AMD Ryzen 5 5500U, 16GB RAM, 1TB SSD', sucursalId: centro.id, precioUnitario: 14800.00, stock: 3 },
    { numeroSerie: 'MON-2024-001', nombre: 'Monitor LG UltraWide', descripcion: 'Monitor curvo para productividad', marca: 'LG', modelo: '34WN80C-B', color: 'Negro', detalles: '34", 3440x1440, IPS, USB-C', sucursalId: centro.id, precioUnitario: 9200.00, stock: 8 },
    { numeroSerie: 'TBL-2024-001', nombre: 'Tableta Samsung Galaxy Tab', descripcion: 'Tableta Android premium', marca: 'Samsung', modelo: 'Galaxy Tab S9', color: 'Grafito', detalles: '11", Snapdragon 8 Gen 2, 128GB', sucursalId: norte.id, precioUnitario: 11900.00, stock: 4 },
    { numeroSerie: 'CEL-2024-001', nombre: 'Smartphone iPhone 15', descripcion: 'Teléfono inteligente Apple', marca: 'Apple', modelo: 'iPhone 15', color: 'Negro', detalles: '6.1", A16 Bionic, 128GB, 48MP', sucursalId: norte.id, precioUnitario: 19990.00, stock: 6 },
    { numeroSerie: 'CEL-2024-002', nombre: 'Smartphone Samsung S24', descripcion: 'Android flagship de última generación', marca: 'Samsung', modelo: 'Galaxy S24', color: 'Violeta', detalles: '6.2", Exynos 2400, 256GB', sucursalId: norte.id, precioUnitario: 17500.00, stock: 2 },
    { numeroSerie: 'KBD-2024-001', nombre: 'Teclado Mecánico Logitech', descripcion: 'Teclado gamer con switches Cherry MX', marca: 'Logitech', modelo: 'G Pro X TKL', color: 'Negro', detalles: 'Tenkeyless, RGB, switches Blue', sucursalId: centro.id, precioUnitario: 3200.00, stock: 12 },
    { numeroSerie: 'MSE-2024-001', nombre: 'Mouse Inalámbrico MX Master 3', descripcion: 'Mouse ergonómico para productividad', marca: 'Logitech', modelo: 'MX Master 3S', color: 'Grafito', detalles: 'Bluetooth + USB, 8000 DPI, carga USB-C', sucursalId: centro.id, precioUnitario: 2100.00, stock: 15 },
    { numeroSerie: 'AUD-2024-001', nombre: 'Audífonos Sony WH-1000XM5', descripcion: 'Audífonos con cancelación de ruido', marca: 'Sony', modelo: 'WH-1000XM5', color: 'Negro', detalles: 'ANC, 30h batería, Bluetooth 5.2', sucursalId: norte.id, precioUnitario: 8900.00, stock: 7 },
    { numeroSerie: 'IMP-2024-001', nombre: 'Impresora HP LaserJet', descripcion: 'Impresora láser monocromática', marca: 'HP', modelo: 'LaserJet Pro M404dn', color: 'Blanco', detalles: 'Hasta 40 ppm, dúplex automático, LAN', sucursalId: centro.id, precioUnitario: 5600.00, stock: 3 },
  ]

  for (const p of products) {
    await prisma.producto.upsert({
      where: { numeroSerie: p.numeroSerie },
      update: {},
      create: p,
    })
  }

  console.log('✓ Productos creados')
  console.log('\n🎉 Seed completado!')
  console.log('\nCredenciales de acceso:')
  console.log('  Administrador: admin@inventarios.com  / Admin123!')
  console.log('  Manager:       gerente@inventarios.com / Manager123!')
  console.log('  Cajero:        cajero@inventarios.com  / Cajero123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
