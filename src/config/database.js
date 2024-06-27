require('dotenv').config()

const db_environment = {
  development: {
    dialect: 'mysql',
    host: process.env.DEVELOPMENT_DB_HOST,
    username: process.env.DEVELOPMENT_DB_USERNAME,
    password: process.env.DEVELOPMENT_DB_PASSWORD,
    database: process.env.DEVELOPMENT_DB_NAME,
    define: { timestamps: true, underscored: true }
  },
  test: {
    dialect: 'mysql',
    host: process.env.TEST_DB_HOST,
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    define: { timestamps: true, underscored: true }
  },
  production: {
    dialect: 'mysql',
    host: process.env.PRODUCTION_DB_HOST,
    username: process.env.PRODUCTION_DB_USERNAME,
    password: process.env.PRODUCTION_DB_PASSWORD,
    database: process.env.PRODUCTION_DB_NAME,
    define: { timestamps: true, underscored: true },
    maxConcurrentQueries: 100,
    pool: { maxConnections: 5, maxIdleTime: 30},
    language: 'en',
  }
}

module.exports = db_environment
