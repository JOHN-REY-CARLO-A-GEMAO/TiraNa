const internalApiRequired = (req, res, next) => {
  const internalApiKey = req.headers['x-internal-api-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'tirana-internal-secret-key';

  if (!internalApiKey || internalApiKey !== expectedKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or missing Internal API Key',
    });
  }

  next();
};

export default internalApiRequired;
