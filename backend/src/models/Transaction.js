const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdraw'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Amount must be greater than 0' },
    },
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  starting_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  ending_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  interest_earned: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  months_held: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Transaction;
