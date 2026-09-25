import mysql from 'mysql2/promise'

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'sneha',
    database: 'society_erp',
    multipleStatements: true,
  })

  console.log('Applying notices schema changes...\n')

  // 1. Add category enum column to notices (idempotent)
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'society_erp' AND TABLE_NAME = 'notices' AND COLUMN_NAME = 'category'`
  )
  if ((cols as any[]).length === 0) {
    await conn.query(
      `ALTER TABLE notices ADD COLUMN category ENUM('general','holiday','maintenance','event','security','rule') DEFAULT 'general' AFTER posted_by`
    )
    console.log('✅ notices.category column added')
  } else {
    console.log('⏭️  notices.category already exists')
  }

  // 2. Backfill category for existing rows (all get 'general' by default, but be safe)
  await conn.query(`UPDATE notices SET category = 'general' WHERE category IS NULL`)

  // 3. Create notice_comments table (idempotent)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notice_comments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      notice_id INT NOT NULL,
      user_id INT NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
      CONSTRAINT notice_comments_notice_id_notice_id_fk FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
      CONSTRAINT notice_comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX notice_comments_notice_id_idx (notice_id),
      INDEX notice_comments_user_id_idx (user_id)
    )
  `)
  console.log('✅ notice_comments table ready')

  await conn.end()
  console.log('\n🎉 Migration completed!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
