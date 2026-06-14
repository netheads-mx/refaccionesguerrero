import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const catalogue = [
  {
    marca: 'Toyota', pais: 'Japón',
    modelos: [
      {
        nombre: 'Corolla',
        versiones: [
          { nombre: 'LE', anioInicio: 2019, anioFin: 2023, motor: '2.0L 4cil 152hp', transmision: 'CVT' },
          { nombre: 'SE', anioInicio: 2019, anioFin: 2023, motor: '2.0L 4cil 169hp', transmision: 'Manual 6v' },
          { nombre: 'XLE', anioInicio: 2020, anioFin: null,  motor: '2.0L 4cil 169hp', transmision: 'CVT' },
        ],
      },
      {
        nombre: 'Camry',
        versiones: [
          { nombre: 'LE', anioInicio: 2018, anioFin: 2023, motor: '2.5L 4cil 203hp', transmision: 'Automático 8v' },
          { nombre: 'XSE V6', anioInicio: 2018, anioFin: 2023, motor: '3.5L V6 301hp', transmision: 'Automático 8v' },
        ],
      },
    ],
  },
  {
    marca: 'Honda', pais: 'Japón',
    modelos: [
      {
        nombre: 'Civic',
        versiones: [
          { nombre: 'LX', anioInicio: 2018, anioFin: 2022, motor: '2.0L 4cil 158hp', transmision: 'CVT' },
          { nombre: 'Sport', anioInicio: 2018, anioFin: 2022, motor: '1.5L Turbo 174hp', transmision: 'Manual 6v' },
          { nombre: 'EX-L', anioInicio: 2019, anioFin: 2022, motor: '1.5L Turbo 174hp', transmision: 'CVT' },
          { nombre: 'Si', anioInicio: 2020, anioFin: 2023, motor: '1.5L Turbo 200hp', transmision: 'Manual 6v' },
        ],
      },
      {
        nombre: 'CR-V',
        versiones: [
          { nombre: 'LX AWD', anioInicio: 2017, anioFin: 2022, motor: '2.4L 4cil 185hp', transmision: 'CVT' },
          { nombre: 'EX-L Turbo', anioInicio: 2017, anioFin: 2022, motor: '1.5L Turbo 190hp', transmision: 'CVT' },
        ],
      },
    ],
  },
  {
    marca: 'Nissan', pais: 'Japón',
    modelos: [
      {
        nombre: 'Sentra',
        versiones: [
          { nombre: 'Advance', anioInicio: 2020, anioFin: null, motor: '2.0L 4cil 149hp', transmision: 'CVT' },
          { nombre: 'Exclusive', anioInicio: 2020, anioFin: null, motor: '2.0L 4cil 149hp', transmision: 'CVT' },
        ],
      },
      {
        nombre: 'Versa',
        versiones: [
          { nombre: 'Sense', anioInicio: 2020, anioFin: null, motor: '1.6L 4cil 118hp', transmision: 'Manual 5v' },
          { nombre: 'Advance', anioInicio: 2020, anioFin: null, motor: '1.6L 4cil 118hp', transmision: 'CVT' },
          { nombre: 'Exclusive', anioInicio: 2020, anioFin: null, motor: '1.6L 4cil 118hp', transmision: 'CVT' },
        ],
      },
    ],
  },
  {
    marca: 'Volkswagen', pais: 'Alemania',
    modelos: [
      {
        nombre: 'Jetta',
        versiones: [
          { nombre: 'Trendline', anioInicio: 2016, anioFin: 2021, motor: '2.0L 4cil 115hp', transmision: 'Manual 6v' },
          { nombre: 'Highline TSI', anioInicio: 2016, anioFin: 2021, motor: '1.4L Turbo 150hp', transmision: 'DSG 7v' },
          { nombre: 'GLI', anioInicio: 2019, anioFin: 2023, motor: '2.0L Turbo 228hp', transmision: 'DSG 7v' },
        ],
      },
      {
        nombre: 'Tiguan',
        versiones: [
          { nombre: 'Trendline', anioInicio: 2018, anioFin: null, motor: '1.4L Turbo 150hp', transmision: 'Automático 6v' },
          { nombre: 'Comfortline', anioInicio: 2018, anioFin: null, motor: '2.0L Turbo 220hp', transmision: 'DSG 7v' },
        ],
      },
    ],
  },
  {
    marca: 'Chevrolet', pais: 'Estados Unidos',
    modelos: [
      {
        nombre: 'Aveo',
        versiones: [
          { nombre: 'LS', anioInicio: 2012, anioFin: 2019, motor: '1.6L 4cil 98hp', transmision: 'Manual 5v' },
          { nombre: 'LT', anioInicio: 2012, anioFin: 2019, motor: '1.6L 4cil 98hp', transmision: 'Automático 4v' },
        ],
      },
      {
        nombre: 'Spark',
        versiones: [
          { nombre: 'LT', anioInicio: 2016, anioFin: 2022, motor: '1.4L 4cil 98hp', transmision: 'CVT' },
          { nombre: 'Premier', anioInicio: 2016, anioFin: 2022, motor: '1.4L 4cil 98hp', transmision: 'CVT' },
        ],
      },
    ],
  },
  {
    marca: 'Ford', pais: 'Estados Unidos',
    modelos: [
      {
        nombre: 'F-150',
        versiones: [
          { nombre: 'XL V8', anioInicio: 2011, anioFin: 2017, motor: '5.0L V8 360hp', transmision: 'Automático 6v' },
          { nombre: 'XLT EcoBoost', anioInicio: 2015, anioFin: 2020, motor: '2.7L V6 Turbo 325hp', transmision: 'Automático 10v' },
          { nombre: 'Lariat EcoBoost', anioInicio: 2017, anioFin: 2022, motor: '3.5L V6 Turbo 400hp', transmision: 'Automático 10v' },
        ],
      },
      {
        nombre: 'Escape',
        versiones: [
          { nombre: 'SE', anioInicio: 2017, anioFin: 2022, motor: '1.5L Turbo 181hp', transmision: 'Automático 8v' },
          { nombre: 'Titanium', anioInicio: 2017, anioFin: 2022, motor: '2.0L Turbo 250hp', transmision: 'Automático 8v' },
        ],
      },
    ],
  },
  {
    marca: 'Mazda', pais: 'Japón',
    modelos: [
      {
        nombre: 'Mazda 3',
        versiones: [
          { nombre: 'i Touring', anioInicio: 2014, anioFin: 2018, motor: '2.0L 4cil 155hp', transmision: 'Automático 6v' },
          { nombre: 's Grand Touring', anioInicio: 2014, anioFin: 2018, motor: '2.5L 4cil 184hp', transmision: 'Automático 6v' },
          { nombre: 'Carbon Edition', anioInicio: 2019, anioFin: 2023, motor: '2.5L 4cil 191hp', transmision: 'Automático 6v' },
        ],
      },
      {
        nombre: 'CX-5',
        versiones: [
          { nombre: 'Touring', anioInicio: 2017, anioFin: null, motor: '2.5L 4cil 187hp', transmision: 'Automático 6v' },
          { nombre: 'Grand Touring AWD', anioInicio: 2017, anioFin: null, motor: '2.5L Turbo 256hp', transmision: 'Automático 6v' },
        ],
      },
    ],
  },
  {
    marca: 'Kia', pais: 'Corea del Sur',
    modelos: [
      {
        nombre: 'Sportage',
        versiones: [
          { nombre: 'LX', anioInicio: 2016, anioFin: 2022, motor: '2.0L 4cil 187hp', transmision: 'Automático 6v' },
          { nombre: 'EX', anioInicio: 2016, anioFin: 2022, motor: '2.0L 4cil 187hp', transmision: 'Automático 6v' },
          { nombre: 'SX Turbo', anioInicio: 2017, anioFin: 2022, motor: '2.0L Turbo 240hp', transmision: 'Automático 6v' },
        ],
      },
      {
        nombre: 'Rio',
        versiones: [
          { nombre: 'LX', anioInicio: 2018, anioFin: null, motor: '1.6L 4cil 120hp', transmision: 'CVT' },
          { nombre: 'EX', anioInicio: 2018, anioFin: null, motor: '1.6L 4cil 120hp', transmision: 'CVT' },
        ],
      },
    ],
  },
  {
    marca: 'Hyundai', pais: 'Corea del Sur',
    modelos: [
      {
        nombre: 'Elantra',
        versiones: [
          { nombre: 'GLS', anioInicio: 2017, anioFin: 2022, motor: '2.0L 4cil 147hp', transmision: 'Automático 6v' },
          { nombre: 'Limited', anioInicio: 2017, anioFin: 2022, motor: '1.6L Turbo 201hp', transmision: 'DCT 7v' },
          { nombre: 'N Line', anioInicio: 2021, anioFin: null, motor: '1.6L Turbo 201hp', transmision: 'DCT 7v' },
        ],
      },
      {
        nombre: 'Tucson',
        versiones: [
          { nombre: 'GLS', anioInicio: 2016, anioFin: 2021, motor: '2.0L 4cil 164hp', transmision: 'Automático 6v' },
          { nombre: 'Limited AWD', anioInicio: 2019, anioFin: 2022, motor: '1.6L Turbo 175hp', transmision: 'DCT 7v' },
        ],
      },
    ],
  },
  {
    marca: 'Audi', pais: 'Alemania',
    modelos: [
      {
        nombre: 'A3',
        versiones: [
          { nombre: '35 TFSI', anioInicio: 2020, anioFin: null, motor: '1.5L Turbo 150hp', transmision: 'S-Tronic 7v' },
          { nombre: '40 TFSI quattro', anioInicio: 2020, anioFin: null, motor: '2.0L Turbo 201hp', transmision: 'S-Tronic 7v' },
        ],
      },
      {
        nombre: 'Q5',
        versiones: [
          { nombre: '45 TFSI', anioInicio: 2018, anioFin: null, motor: '2.0L Turbo 261hp', transmision: 'S-Tronic 7v' },
          { nombre: 'SQ5 TFSI', anioInicio: 2018, anioFin: null, motor: '3.0L V6 Turbo 354hp', transmision: 'Tiptronic 8v' },
        ],
      },
    ],
  },
]

async function main() {
  let totalMarcas = 0, totalModelos = 0, totalVersiones = 0

  for (const entry of catalogue) {
    const marca = await prisma.marcaAuto.upsert({
      where: { nombre: entry.marca },
      update: { pais: entry.pais },
      create: { nombre: entry.marca, pais: entry.pais },
    })
    totalMarcas++

    for (const m of entry.modelos) {
      const modelo = await prisma.modeloAuto.upsert({
        where: { marcaId_nombre: { marcaId: marca.id, nombre: m.nombre } },
        update: {},
        create: { nombre: m.nombre, marcaId: marca.id },
      })
      totalModelos++

      for (const v of m.versiones) {
        await prisma.versionAuto.create({
          data: {
            nombre: v.nombre,
            modeloId: modelo.id,
            anioInicio: v.anioInicio,
            anioFin: v.anioFin ?? null,
            motor: v.motor ?? null,
            transmision: v.transmision ?? null,
          },
        })
        totalVersiones++
      }
    }
  }

  console.log(`✅ Catálogo de autos insertado`)
  console.log(`   • ${totalMarcas} marcas`)
  console.log(`   • ${totalModelos} modelos`)
  console.log(`   • ${totalVersiones} versiones`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
