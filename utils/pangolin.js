const axios = require("axios");
const API_URL = "http://localhost:3001/api/v1";
const ORG = "bernier";
async function listDomains() {
  const res = await axios.get(`${API_URL}/org/${ORG}/domains`);
  return res.data.domains;
}
async function listSites() {
  const res = await axios.get(`${API_URL}/org/${ORG}/sites`);
  return res.data.sites;
}
async function createResource(payload) {
  const res = await axios.put(
    `${API_URL}/org/${ORG}/site/${payload.siteId}/resource`,
    payload
  );
  return res.data.data;
}
async function addTarget(resourceId, payload) {
  const res = await axios.put(
    `${API_URL}/resource/${resourceId}/target`,
    payload
  );
  return res.data.data;
}
async function fullSetup(resP, tgtP) {
  const resource = await createResource(resP);
  const target = await addTarget(resource.resourceId, tgtP);
  return { resource, target };
}
module.exports = {
  listDomains,
  listSites,
  createResource,
  addTarget,
  fullSetup,
};
