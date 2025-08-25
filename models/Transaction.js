const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Transaction = sequelize.define('Transaction', {
  transactionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'transaction_id'
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'wallet_id'
  },
  type: {
    type: DataTypes.ENUM('top-up', 'withdraw', 'transfer-in', 'transfer-out'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  relatedWalletId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'related_wallet_id'
  }
}, {
  tableName: 'Transactions',
  timestamps: true,
  underscored: false // camelCase timestamps
});

module.exports = Transaction;
