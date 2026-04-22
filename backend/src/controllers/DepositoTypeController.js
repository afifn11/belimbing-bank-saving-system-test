const { DepositoType, Account, Op } = require('../models');
const response = require('../middleware/response');

class DepositoTypeController {
  async index(req, res) {
    try {
      const types = await DepositoType.findAll({ order: [['yearly_return', 'ASC']] });
      return response.success(res, types);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async show(req, res) {
    try {
      const type = await DepositoType.findByPk(req.params.id);
      if (!type) return response.notFound(res, 'Deposito type not found');
      return response.success(res, type);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  async store(req, res) {
    try {
      const { name, yearly_return } = req.body;

      // Explicit duplicate check (case-insensitive)
      const existing = await DepositoType.findOne({
        where: { name: name.trim() },
      });
      if (existing) {
        return response.error(res, 'Deposito type name already exists', 400);
      }

      const type = await DepositoType.create({ name: name.trim(), yearly_return });
      return response.created(res, type, 'Deposito type created successfully');
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return response.error(res, 'Deposito type name already exists', 400);
      }
      if (err.name === 'SequelizeValidationError') {
        return response.error(res, err.errors[0].message, 422);
      }
      return response.serverError(res, err);
    }
  }

  async update(req, res) {
    try {
      const type = await DepositoType.findByPk(req.params.id);
      if (!type) return response.notFound(res, 'Deposito type not found');

      const { name, yearly_return } = req.body;

      // Check duplicate name — exclude the current record itself
      if (name && name.trim() !== type.name) {
        const { Op } = require('sequelize');
        const duplicate = await DepositoType.findOne({
          where: {
            name: name.trim(),
            id: { [Op.ne]: type.id },
          },
        });
        if (duplicate) {
          return response.error(res, 'Deposito type name already exists', 400);
        }
      }

      await type.update({
        name: name ? name.trim() : type.name,
        yearly_return: yearly_return !== undefined ? yearly_return : type.yearly_return,
      });

      return response.success(res, type, 'Deposito type updated successfully');
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return response.error(res, 'Deposito type name already exists', 400);
      }
      if (err.name === 'SequelizeValidationError') {
        return response.error(res, err.errors[0].message, 422);
      }
      return response.serverError(res, err);
    }
  }

  async destroy(req, res) {
    try {
      const type = await DepositoType.findByPk(req.params.id);
      if (!type) return response.notFound(res, 'Deposito type not found');

      const accountCount = await Account.count({ where: { deposito_type_id: type.id } });
      if (accountCount > 0) {
        return response.error(
          res,
          `Cannot delete deposito type that is currently used by ${accountCount} account(s).`,
          400
        );
      }

      await type.destroy();
      return response.success(res, null, 'Deposito type deleted successfully');
    } catch (err) {
      return response.serverError(res, err);
    }
  }
}

module.exports = new DepositoTypeController();