const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('fynix_wallet_db', 'postgres', 'Tushar@10', {
  host: 'localhost',
  dialect: 'postgres',
});

sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
