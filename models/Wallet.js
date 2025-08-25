const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Wallet = sequelize.define('Wallet', {
  walletId: {               // CamelCase for JS usage
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'wallet_id'      // maps to snake_case DB column
  },
  userId: {                 // CamelCase for JS usage
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'        // maps to snake_case DB column
  },
  balance: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',   // explicitly map to camelCase columns
  updatedAt: 'updatedAt',
  tableName: 'Wallets',
  underscored: false         // disable snake_case mapping
});

module.exports = Wallet;
