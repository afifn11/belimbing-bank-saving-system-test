const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  packet: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Packet name cannot be empty' },
    },
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deposito_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Balance cannot be negative' },
    },
  },
}, {
  tableName: 'accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

/**
 * Calculate ending balance on withdrawal
 * Formula: starting_balance + (starting_balance * months * (yearly_return / 12 / 100))
 */
Account.prototype.calculateEndingBalance = function (startingBalance, months, yearlyReturn) {
  const monthlyReturnRate = parseFloat(yearlyReturn) / 12 / 100;
  const interest = parseFloat(startingBalance) * months * monthlyReturnRate;
  return parseFloat(startingBalance) + interest;
};

module.exports = Account;
