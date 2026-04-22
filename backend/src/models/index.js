const sequelize = require('../config/sequelize');
const Customer = require('./Customer');
const DepositoType = require('./DepositoType');
const Account = require('./Account');
const Transaction = require('./Transaction');

// Associations
Customer.hasMany(Account, { foreignKey: 'customer_id', as: 'accounts', onDelete: 'RESTRICT' });
Account.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

DepositoType.hasMany(Account, { foreignKey: 'deposito_type_id', as: 'accounts', onDelete: 'RESTRICT' });
Account.belongsTo(DepositoType, { foreignKey: 'deposito_type_id', as: 'deposito_type' });

Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

module.exports = { sequelize, Customer, DepositoType, Account, Transaction };
