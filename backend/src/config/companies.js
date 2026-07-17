const companyConfigs = {
  pakrose: {
    id: 'pakrose',
    name: 'Pakrose Enterprises',
    enabled: true,
  },
  prime_fabric: {
    id: 'prime_fabric',
    name: 'Prime Fabric Pakistan',
    enabled: true,
  },
};

function getCompanyConfig(companyId) {
  return companyConfigs[companyId] || null;
}

function assertEnabledCompany(companyId) {
  const company = getCompanyConfig(companyId);

  if (!company || !company.enabled) {
    const error = new Error('Company is not enabled.');
    error.statusCode = 404;
    throw error;
  }

  return company;
}

module.exports = {
  companyConfigs,
  getCompanyConfig,
  assertEnabledCompany,
};
