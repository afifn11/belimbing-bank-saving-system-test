const { Account, Customer, DepositoType, Transaction } = require('../models');
const response = require('../middleware/response');

class AccountController {
  async index(req, res) {
    try {
      const accounts = await Account.findAll({
        include: [
          { association: 'customer', attributes: ['id', 'name'] },
          { association: 'deposito_type', attributes: ['id', 'name', 'yearly_return'] },
        ],
        order: [['created_at', 'DESC']],
      });
      return response.success(res, accounts);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async show(req, res) {
    try {
      const account = await Account.findByPk(req.params.id, {
        include: [
          { association: 'customer' },
          { association: 'deposito_type' },
        ],
      });
      if (!account) return response.notFound(res, 'Account not found');
      return response.success(res, account);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async byCustomer(req, res) {
    try {
      const customer = await Customer.findByPk(req.params.customerId);
      if (!customer) return response.notFound(res, 'Customer not found');

      const accounts = await Account.findAll({
        where: { customer_id: req.params.customerId },
        include: [{ association: 'deposito_type' }],
        order: [['created_at', 'DESC']],
      });
      return response.success(res, accounts);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async store(req, res) {
    try {
      const { packet, customer_id, deposito_type_id, balance } = req.body;

      const customer = await Customer.findByPk(customer_id);
      if (!customer) return response.notFound(res, 'Customer not found');

      const depositoType = await DepositoType.findByPk(deposito_type_id);
      if (!depositoType) return response.notFound(res, 'Deposito type not found');

      const account = await Account.create({ packet, customer_id, deposito_type_id, balance: balance || 0 });
      const full = await Account.findByPk(account.id, {
        include: [{ association: 'customer' }, { association: 'deposito_type' }],
      });
      return response.created(res, full, 'Account created successfully');
    } catch (err) {
      if (err.name === 'SequelizeValidationError') {
        return response.error(res, err.errors[0].message, 422);
      }
      return response.serverError(res, err);
    }
  }

  async update(req, res) {
    try {
      const account = await Account.findByPk(req.params.id);
      if (!account) return response.notFound(res, 'Account not found');

      const { packet, customer_id, deposito_type_id } = req.body;

      if (customer_id) {
        const customer = await Customer.findByPk(customer_id);
        if (!customer) return response.notFound(res, 'Customer not found');
      }
      if (deposito_type_id) {
        const depositoType = await DepositoType.findByPk(deposito_type_id);
        if (!depositoType) return response.notFound(res, 'Deposito type not found');
      }

      await account.update({ packet, customer_id, deposito_type_id });
      const updated = await Account.findByPk(account.id, {
        include: [{ association: 'customer' }, { association: 'deposito_type' }],
      });
      return response.success(res, updated, 'Account updated successfully');
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async destroy(req, res) {
    try {
      const account = await Account.findByPk(req.params.id);
      if (!account) return response.notFound(res, 'Account not found');
      await account.destroy();
      return response.success(res, null, 'Account deleted successfully');
    } catch (err) {
      return response.serverError(res, err);
    }
  }
}

module.exports = new AccountController();
