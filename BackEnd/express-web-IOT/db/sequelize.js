const {Sequelize} = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
process.env.DB_NAME_PG,
process.env.DB_USER_PG,
process.env.DB_PASSWORD_PG,
    {
    host: process.env.DB_HOST_PG,
    dialect:process.env.DB_DIALECT
    }
);

module.exports = sequelize;
