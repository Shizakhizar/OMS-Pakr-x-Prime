const { HttpError } = require('./errors');

function requireString(value, fieldName) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return normalized;
}

function requirePositiveNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive number.`);
  }

  return parsed;
}

function requireNonNegativeNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `${fieldName} must be a non-negative number.`);
  }

  return parsed;
}

function requireDateString(value, fieldName) {
  const normalized = requireString(value, fieldName);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpError(400, `${fieldName} must be in YYYY-MM-DD format.`);
  }

  return normalized;
}

function requireOneOf(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new HttpError(400, `${fieldName} must be one of: ${allowedValues.join(', ')}.`);
  }

  return value;
}

module.exports = {
  requireString,
  requirePositiveNumber,
  requireNonNegativeNumber,
  requireDateString,
  requireOneOf,
};
