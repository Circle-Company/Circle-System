const Sequelize = require('sequelize')
const db_config = require('../config/database.js')

// all models imports
const User = require('../models/user/user-model.js')
const ProfilePicture = require('../models/user/profilepicture-model.js')
const Statistic = require('../models/user/statistic-model.js')


//mysql database connection
export const connection =  new Sequelize(db_config)

try{
    connection.authenticate()
    console.log('connection has been established successfully.')
} catch(err) {
    console.error('unable to connect to database: ', err)
}

//models connections
User.init(connection)
ProfilePicture.init(connection)
Statistic.init(connection)

//models associations
User.associate(connection.models)
ProfilePicture.associate(connection.models)
Statistic.associate(connection.models)
