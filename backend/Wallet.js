const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Wallet = sequelize.define('Wallet', {
  wallet_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Wallet;
