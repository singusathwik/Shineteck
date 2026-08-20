// Address Database with Country -> State -> City mapping and Postal/ZIP regex rules

export const addressDatabase = {
  "United States": {
    code: "US",
    zipRegex: /^\d{5}(-\d{4})?$/,
    zipExample: "90001 or 90001-1234",
    states: {
      "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno", "Irvine", "Pasadena"],
      "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "White Plains"],
      "Texas": ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Plano"],
      "Washington": ["Seattle", "Bellevue", "Redmond", "Spokane", "Tacoma", "Vancouver", "Olympia"],
      "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Peoria"],
      "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee", "St. Petersburg"],
      "Georgia": ["Atlanta", "Savannah", "Augusta", "Athens", "Columbus", "Macon", "Roswell"],
      "Massachusetts": ["Boston", "Cambridge", "Worcester", "Springfield", "Lowell", "Newton", "Somerville"],
      "New Jersey": ["Jersey City", "Newark", "Paterson", "Elizabeth", "Edison", "Princeton", "Trenton"],
      "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Cary"],
      "Virginia": ["Richmond", "Virginia Beach", "Norfolk", "Alexandria", "Arlington", "Reston", "McLean"],
      "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem"]
    }
  },
  "Canada": {
    code: "CA",
    zipRegex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    zipExample: "K1A 0B1",
    states: {
      "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham"],
      "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna"],
      "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke"],
      "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert"]
    }
  },
  "United Kingdom": {
    code: "GB",
    zipRegex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    zipExample: "SW1A 1AA",
    states: {
      "Greater London": ["London", "Westminster", "Camden", "Greenwich", "Hackney"],
      "Greater Manchester": ["Manchester", "Salford", "Bolton", "Stockport"],
      "West Midlands": ["Birmingham", "Coventry", "Wolverhampton", "Solihull"],
      "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"]
    }
  },
  "India": {
    code: "IN",
    zipRegex: /^\d{6}$/,
    zipExample: "500081 or 560001",
    states: {
      "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
      "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
      "Delhi NCR": ["New Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad"]
    }
  },
  "Australia": {
    code: "AU",
    zipRegex: /^\d{4}$/,
    zipExample: "2000 or 3000",
    states: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast"],
      "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
      "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Cairns"],
      "Western Australia": ["Perth", "Fremantle", "Mandurah", "Bunbury"]
    }
  }
};

export function validateAddressInfo(country, state, city, zipCode) {
  const errors = [];
  if (!country) errors.push("Country is required.");
  if (!state) errors.push("State/Province is required.");
  if (!city) errors.push("City is required.");
  if (!zipCode) errors.push("ZIP / Postal code is required.");

  const countryData = addressDatabase[country];
  if (countryData) {
    if (!countryData.states[state]) {
      errors.push(`Selected state '${state}' is not valid for country '${country}'.`);
    }
    if (zipCode && !countryData.zipRegex.test(zipCode.trim())) {
      errors.push(`Invalid postal code format for ${country}. Example: ${countryData.zipExample}`);
    }
  } else if (zipCode && zipCode.trim().length < 3) {
    errors.push("Postal code must be at least 3 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
