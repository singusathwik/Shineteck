export const COMPANIES = Object.freeze([
  { id: 'shineteck-inc', name: 'Shineteck Inc' },
  { id: 'techgrow-systems', name: 'Techgrow Systems LLC' },
  { id: 'reliability-sciences', name: 'Reliability Sciences Inc' },
  { id: 'infinity-asset-group', name: 'Infinity Asset Group LLC' },
  { id: 'shineteck-software', name: 'Shineteck Software Solutions Pvt Ltd' }
]);
export const companyName = id => COMPANIES.find(company => company.id === id)?.name || 'Unassigned';
