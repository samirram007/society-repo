/**
 * One-off additive migration: notice_views ("seen by") + notice_reactions.
 * Idempotent — safe to re-run.
 * Run with: npx tsx src/db/migrate-notice-views-reactions.ts
 */
import mysql from 'mysql2/promise'

const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'sneha',
  database: 'society_erp',
  multipleStatements: true,
})

const statements = [
  `CREATE TABLE IF NOT EXISTS notice_views (
     id INT AUTO_INCREMENT PRIMARY KEY,
     notice_id INT NOT NULL,
     user_id INT NOT NULL,
     view_count INT DEFAULT 1,
     first_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX notice_views_notice_id_idx (notice_id),
     INDEX notice_views_user_id_idx (user_id),
     CONSTRAINT fk_nv_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
     CONSTRAINT fk_nv_user FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
  `CREATE TABLE IF NOT EXISTS notice_reactions (
     id INT AUTO_INCREMENT PRIMARY KEY,
     notice_id INT NOT NULL,
     user_id INT NOT NULL,
     reaction_type ENUM('like','love','celebrate','insightful','thanks') NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX notice_reactions_notice_id_idx (notice_id),
     INDEX notice_reactions_user_id_idx (user_id),
     CONSTRAINT fk_nr_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
     CONSTRAINT fk_nr_user FOREIGN KEY (user_id) REFERENCES users(id)
   )`,
]

for (const stmt of statements) {
  try {
    await connection.query(stmt)
    console.log(`OK: ${stmt.slice(0, 50)}...`)
  } catch (err) {
    console.error('FAILED:', (err as Error).message)
    process.exitCode = 1
  }
}

await connection.end()
console.log('Notice views & reactions migration complete.')
