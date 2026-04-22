const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DepositoType = sequelize.define('DepositoType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: 'Deposito type name already exists' },
    validate: {
      notEmpty: { msg: 'Name cannot be empty' },
    },
  },
  yearly_return: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Yearly return must be greater than 0' },
      max: { args: [100], msg: 'Yearly return cannot exceed 100%' },
    },
  },
}, {
  tableName: 'deposito_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Virtual getter for monthly return
DepositoType.prototype.getMonthlyReturn = function () {
  return parseFloat(this.yearly_return) / 12;
};

module.exports = DepositoType;
