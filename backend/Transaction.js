const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  wallet_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('top-up', 'withdraw', 'transfer-in', 'transfer-out'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  // Optional: add a description or related wallet for transfers
  related_wallet_id: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Transaction;
