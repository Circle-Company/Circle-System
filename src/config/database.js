require('dotenv').config()

module.exports = {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  define: {
      timestamps: true,
      underscored: true
  }
}
