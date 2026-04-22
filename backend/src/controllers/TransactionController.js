const { Account, Transaction, DepositoType } = require('../models');
const response = require('../middleware/response');
const sequelize = require('../config/sequelize');

class TransactionController {
  // GET /transactions/account/:accountId
  async history(req, res) {
    try {
      const account = await Account.findByPk(req.params.accountId);
      if (!account) return response.notFound(res, 'Account not found');

      const transactions = await Transaction.findAll({
        where: { account_id: req.params.accountId },
        order: [['transaction_date', 'DESC'], ['created_at', 'DESC']],
      });
      return response.success(res, transactions);
    } catch (err) {
      return response.serverError(res, err);
    }
  }

  // POST /transactions/deposit
  async deposit(req, res) {
    const t = await sequelize.transaction();
    try {
      const { account_id, amount, transaction_date } = req.body;

      if (amount <= 0) {
        await t.rollback();
        return response.error(res, 'Amount must be greater than 0', 400);
      }

      const account = await Account.findByPk(account_id, { transaction: t });
      if (!account) {
        await t.rollback();
        return response.notFound(res, 'Account not found');
      }

      const startingBalance = parseFloat(account.balance);
      const newBalance = startingBalance + parseFloat(amount);

      await account.update({ balance: newBalance }, { transaction: t });

      const tx = await Transaction.create({
        account_id,
        type: 'deposit',
        amount: parseFloat(amount),
        transaction_date,
        starting_balance: startingBalance,
        ending_balance: newBalance,
      }, { transaction: t });

      await t.commit();

      return response.created(res, {
        transaction_id: tx.id,
        type: 'deposit',
        amount: parseFloat(amount),
        transaction_date,
        starting_balance: startingBalance,
        new_balance: newBalance,
      }, 'Deposit successful');
    } catch (err) {
      await t.rollback();
      return response.serverError(res, err);
    }
  }

  // POST /transactions/withdraw
  async withdraw(req, res) {
    const t = await sequelize.transaction();
    try {
      const { account_id, amount, transaction_date } = req.body;

      if (amount <= 0) {
        await t.rollback();
        return response.error(res, 'Amount must be greater than 0', 400);
      }

      const account = await Account.findByPk(account_id, {
        include: [{ association: 'deposito_type' }],
        transaction: t,
      });
      if (!account) {
        await t.rollback();
        return response.notFound(res, 'Account not found');
      }

      const startingBalance = parseFloat(account.balance);
      if (parseFloat(amount) > startingBalance) {
        await t.rollback();
        return response.error(res, 'Insufficient balance', 400);
      }

      // Calculate months held from last deposit or account creation
      const lastDeposit = await Transaction.findOne({
        where: { account_id, type: 'deposit' },
        order: [['transaction_date', 'DESC']],
        transaction: t,
      });

      const startDate = lastDeposit
        ? new Date(lastDeposit.transaction_date)
        : new Date(account.created_at);
      const endDate = new Date(transaction_date);

      const monthsHeld = Math.max(
        0,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
      );

      // Formula: ending_balance = starting_balance + (starting_balance * months * monthly_return_rate)
      const yearlyReturn = parseFloat(account.deposito_type.yearly_return);
      const monthlyReturnRate = yearlyReturn / 12 / 100;
      const interestEarned = startingBalance * monthsHeld * monthlyReturnRate;
      const balanceWithInterest = startingBalance + interestEarned;
      const newBalance = balanceWithInterest - parseFloat(amount);

      await account.update({ balance: Math.max(0, newBalance) }, { transaction: t });

      const tx = await Transaction.create({
        account_id,
        type: 'withdraw',
        amount: parseFloat(amount),
        transaction_date,
        starting_balance: startingBalance,
        ending_balance: parseFloat(newBalance.toFixed(2)),
        interest_earned: parseFloat(interestEarned.toFixed(2)),
        months_held: monthsHeld,
      }, { transaction: t });

      await t.commit();

      return response.created(res, {
        transaction_id: tx.id,
        type: 'withdraw',
        transaction_date,
        starting_balance: startingBalance,
        amount_withdrawn: parseFloat(amount),
        months_held: monthsHeld,
        yearly_return: yearlyReturn,
        monthly_return_rate: parseFloat((monthlyReturnRate * 100).toFixed(4)),
        interest_earned: parseFloat(interestEarned.toFixed(2)),
        balance_before_withdrawal: parseFloat(balanceWithInterest.toFixed(2)),
        ending_balance: parseFloat(newBalance.toFixed(2)),
      }, 'Withdrawal successful');
    } catch (err) {
      await t.rollback();
      return response.serverError(res, err);
    }
  }
}

module.exports = new TransactionController();
