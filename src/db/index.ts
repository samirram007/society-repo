import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const connection = mysql.createPool({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Samir@007',
  database: 'society_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export const db = drizzle(connection, { schema, mode: 'default' })
