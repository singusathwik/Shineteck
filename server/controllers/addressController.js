import { addressDatabase, validateAddressInfo } from '../data/addressData.js';

export function getCountries(req, res) {
  const countries = Object.keys(addressDatabase).map(countryName => ({
    name: countryName,
    code: addressDatabase[countryName].code,
    zipExample: addressDatabase[countryName].zipExample
  }));
  res.json({ countries });
}

export function getStatesByCountry(req, res) {
  const { country } = req.params;
  const countryData = addressDatabase[country];
  if (!countryData) {
    return res.status(404).json({ error: `Country '${country}' not found in database.` });
  }

  const states = Object.keys(countryData.states);
  res.json({
    country,
    states,
    zipExample: countryData.zipExample
  });
}

export function getCitiesByState(req, res) {
  const { country, state } = req.params;
  const countryData = addressDatabase[country];
  if (!countryData) {
    return res.status(404).json({ error: `Country '${country}' not found.` });
  }

  const cities = countryData.states[state];
  if (!cities) {
    return res.status(404).json({ error: `State '${state}' not found for ${country}.` });
  }

  res.json({
    country,
    state,
    cities
  });
}

export function validateAddress(req, res) {
  const { country, state, city, zipCode } = req.body;
  const result = validateAddressInfo(country, state, city, zipCode);
  res.json(result);
}
