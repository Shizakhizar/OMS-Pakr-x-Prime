const allowedEmails = new Set([
  'shizakhizarf22@nutech.edu.pk',
  'shizakhizar20@gmail.com',
]);

function isAllowedEmail(email) {
  return allowedEmails.has(String(email || '').trim().toLowerCase());
}

module.exports = {
  allowedEmails,
  isAllowedEmail,
};
