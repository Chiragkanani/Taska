const jwt = require('jsonwebtoken');

// Verifies the JWT from the Authorization header and attaches the decoded
// user payload to req.user. Responds 401 when the token is missing/invalid.
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided, authorization denied',
      data: {},
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid or has expired',
      data: {},
    });
  }
};
