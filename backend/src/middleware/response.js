const response = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
  },
  created: (res, data, message = 'Created successfully') => {
    return res.status(201).json({ success: true, message, data });
  },
  error: (res, message = 'An error occurred', statusCode = 400, errors = null) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  },
  notFound: (res, message = 'Resource not found') => {
    return res.status(404).json({ success: false, message });
  },
  serverError: (res, err) => {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  },
};

module.exports = response;
