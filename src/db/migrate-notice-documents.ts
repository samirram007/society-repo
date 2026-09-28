/**
 * One-off additive migration for the Notice Document Management System.
 * Creates notice_documents, notice_shares, notice_document_folders
 * and adds the visibility column to notices.
 * Idempotent — safe to re-run.
 */
import mysql from 'mysql2/promise'

const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'priyanshuadmin',
  database: 'society_erp',
  multipleStatements: true,
})

const statements = [
  `ALTER TABLE notices
     ADD COLUMN visibility ENUM('private','public') NOT NULL DEFAULT 'private'`,
  `ALTER TABLE notice_documents
     ADD COLUMN thumbnail_data LONGTEXT`,
  `CREATE TABLE IF NOT EXISTS notice_document_folders (
     id INT AUTO_INCREMENT PRIMARY KEY,
     society_id INT NOT NULL,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     parent_id INT,
     color VARCHAR(7) DEFAULT '#3b82f6',
     icon VARCHAR(50) DEFAULT 'folder',
     sort_order INT DEFAULT 0,
     is_active BOOLEAN DEFAULT TRUE,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX notice_document_folders_society_id_idx (society_id),
     INDEX notice_document_folders_parent_id_idx (parent_id),
     CONSTRAINT fk_ndf_society FOREIGN KEY (society_id) REFERENCES societies(id)
   )`,
  `CREATE TABLE IF NOT EXISTS notice_documents (
     id INT AUTO_INCREMENT PRIMARY KEY,
     society_id INT NOT NULL,
     notice_id INT NOT NULL,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     folder_id INT,
     folder_path VARCHAR(1024) DEFAULT '/',
     file_name VARCHAR(255),
     file_url VARCHAR(500),
     mime_type VARCHAR(150),
     file_extension VARCHAR(20),
     file_size BIGINT,
     file_data LONGTEXT,
     cloud_public_id VARCHAR(255),
     storage_type ENUM('local','cloudinary') DEFAULT 'local',
     doc_type ENUM('file','photo','link','note') DEFAULT 'file',
     category ENUM('circular','invoice','receipt','agreement','id_proof','photo_gallery','announcement','other') DEFAULT 'other',
     tags VARCHAR(500),
     version INT DEFAULT 1,
     download_count INT DEFAULT 0,
     view_count INT DEFAULT 0,
     is_starred BOOLEAN DEFAULT FALSE,
     is_active BOOLEAN DEFAULT TRUE,
     visibility ENUM('private','public') DEFAULT 'private',
     uploaded_by INT NOT NULL,
     last_accessed_at DATETIME,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX notice_documents_notice_id_idx (notice_id),
     INDEX notice_documents_society_id_idx (society_id),
     INDEX notice_documents_folder_id_idx (folder_id),
     INDEX notice_documents_uploaded_by_idx (uploaded_by),
     INDEX notice_documents_visibility_idx (society_id, visibility),
     CONSTRAINT fk_nd_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
     CONSTRAINT fk_nd_society FOREIGN KEY (society_id) REFERENCES societies(id),
     CONSTRAINT fk_nd_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
   )`,
  `CREATE TABLE IF NOT EXISTS notice_shares (
     id INT AUTO_INCREMENT PRIMARY KEY,
     notice_id INT NOT NULL,
     society_id INT NOT NULL,
     token VARCHAR(64) NOT NULL UNIQUE,
     shared_by INT NOT NULL,
     expires_at DATETIME,
     max_views INT,
     view_count INT DEFAULT 0,
     is_revoked BOOLEAN DEFAULT FALSE,
     is_active BOOLEAN DEFAULT TRUE,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     INDEX notice_shares_notice_id_idx (notice_id),
     INDEX notice_shares_token_idx (token),
     INDEX notice_shares_society_id_idx (society_id),
     CONSTRAINT fk_ns_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
     CONSTRAINT fk_ns_society FOREIGN KEY (society_id) REFERENCES societies(id),
     CONSTRAINT fk_ns_user FOREIGN KEY (shared_by) REFERENCES users(id)
   )`,
]

for (const stmt of statements) {
  try {
    await connection.query(stmt)
    const label = stmt.replace(/\s+/g, ' ').slice(0, 60)
    console.log(`OK: ${label}...`)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'ER_DUP_FIELDNAME' || code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`SKIP (already applied): ${stmt.slice(0, 50)}...`)
    } else {
      console.error('FAILED:', (err as Error).message)
      process.exitCode = 1
    }
  }
}

await connection.end()
console.log('Notice DMS migration complete.')
