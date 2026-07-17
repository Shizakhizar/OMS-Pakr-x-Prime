const defaultAllowedEmails = [
  'shizakhizarf22@nutech.edu.pk',
  'shizakhizar20@gmail.com',
];

function parseAllowedEmails(rawValue) {
  if (!rawValue || !String(rawValue).trim()) {
    return defaultAllowedEmails;
  }

  return String(rawValue)
    .split(',')
    .map(function (email) {
      return email.trim().toLowerCase();
    })
    .filter(Boolean);
}

const allowedEmails = new Set(parseAllowedEmails(process.env.ALLOWED_EMAILS));

function isAllowedEmail(email) {
  return allowedEmails.has(String(email || '').trim().toLowerCase());
}

module.exports = {
  allowedEmails,
  isAllowedEmail,
};
