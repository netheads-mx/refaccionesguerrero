import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
  const client = await pool.connect()

  try {
    const { rows: ventas } = await client.query(
      'SELECT id FROM ventas ORDER BY id ASC'
    )
    console.log('Current sale IDs:', ventas.map((v: { id: number }) => v.id))

    if (ventas.length === 0) {
      await client.query(`ALTER SEQUENCE ventas_id_seq RESTART WITH 1`)
      console.log('No sales. Sequence reset to 1.')
      return
    }

    await client.query('BEGIN')

    // Temporarily drop FK constraint on venta_detalles
    await client.query(`ALTER TABLE venta_detalles DROP CONSTRAINT IF EXISTS venta_detalles_venta_id_fkey`)

    // Also drop FK on ventas.corte_id if any sales reference cortes
    // (not needed for renumbering, but just in case)

    // Renumber sales sequentially
    for (let i = 0; i < ventas.length; i++) {
      const oldId = ventas[i].id
      const newId = i + 1
      if (oldId !== newId) {
        await client.query(`UPDATE venta_detalles SET venta_id = $1 WHERE venta_id = $2`, [newId, oldId])
        await client.query(`UPDATE ventas SET id = $1 WHERE id = $2`, [newId, oldId])
        console.log(`Renumbered sale ${oldId} -> ${newId}`)
      }
    }

    // Re-add the FK constraint
    await client.query(`
      ALTER TABLE venta_detalles
      ADD CONSTRAINT venta_detalles_venta_id_fkey
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
    `)

    // Reset the sequence
    await client.query(
      `SELECT setval('ventas_id_seq', (SELECT COALESCE(MAX(id), 0) FROM ventas))`
    )

    await client.query('COMMIT')

    const { rows } = await client.query(`SELECT currval('ventas_id_seq') as val`)
    console.log(`Sequence reset. Next ticket will be #${Number(rows[0].val) + 1}`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
