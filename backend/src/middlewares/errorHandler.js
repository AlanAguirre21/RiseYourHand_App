const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  // MongoDB: unique index violated
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

export default errorHandler;