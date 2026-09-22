// server/middleware/role.js
module.exports = {
  requireRole: function(role) {
    return function(req, res, next) {
      if (req.isAuthenticated() && req.user && req.user.role === role) {
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized user.' });
    };
  }
};
