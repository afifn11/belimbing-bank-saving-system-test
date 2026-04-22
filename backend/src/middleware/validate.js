const { validationResult } = require('express-validator');
const response = require('./response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.error(res, 'Validation error', 422, errors.array());
  }
  next();
};

module.exports = validate;
