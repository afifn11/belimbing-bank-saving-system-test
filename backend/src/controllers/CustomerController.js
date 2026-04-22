const { Customer, Account } = require('../models');
const response = require('../middleware/response');

class CustomerController {
  // GET /customers
  async index(req, res) {
    try {
      const customers = await Customer.findAll({
        include: [{ association: 'accounts', attributes: ['id', 'packet', 'balance'] }],
        order: [['created_at', 'DESC']],
      });
      return response.success(res, customers);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  // GET /customers/:id
  async show(req, res) {
    try {
      const customer = await Customer.findByPk(req.params.id, {
        include: [{ association: 'accounts', include: [{ association: 'deposito_type' }] }],
      });
      if (!customer) return response.notFound(res, 'Customer not found');
      return response.success(res, customer);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  // POST /customers
  async store(req, res) {
    try {
      const { name } = req.body;
      const customer = await Customer.create({ name });
      return response.created(res, customer, 'Customer created successfully');
    } catch (err) {
      if (err.name === 'SequelizeValidationError') {
        return response.error(res, err.errors[0].message, 422);
      }
      return response.serverError(res, err);
    }
  }

  // PUT /customers/:id
  async update(req, res) {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return response.notFound(res, 'Customer not found');
      const { name } = req.body;
      await customer.update({ name });
      return response.success(res, customer, 'Customer updated successfully');
    } catch (err) {
      if (err.name === 'SequelizeValidationError') {
        return response.error(res, err.errors[0].message, 422);
      }
      return response.serverError(res, err);
    }
  }

  // DELETE /customers/:id
  async destroy(req, res) {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return response.notFound(res, 'Customer not found');

      const accountCount = await Account.count({ where: { customer_id: customer.id } });
      if (accountCount > 0) {
        return response.error(res, 'Cannot delete customer with existing accounts. Please delete accounts first.', 400);
      }

      await customer.destroy();
      return response.success(res, null, 'Customer deleted successfully');
    } catch (err) {
      return response.serverError(res, err);
    }
  }
}

module.exports = new CustomerController();
