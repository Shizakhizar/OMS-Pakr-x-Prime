const { HttpError } = require('../lib/errors');
const { isAllowedEmail } = require('../config/auth');

function attachAuthContext(req, res, next) {
  const email = String(req.headers['x-oms-user-email'] || '').trim().toLowerCase();
  const name = String(req.headers['x-oms-user-name'] || '').trim();

  if (!email) {
    next(new HttpError(401, 'Missing authenticated user email.'));
    return;
  }

  if (!isAllowedEmail(email)) {
    next(new HttpError(403, 'No access for this Google account.'));
    return;
  }

  req.authContext = {
    email,
    name,
  };

  next();
}

module.exports = {
  attachAuthContext,
};
