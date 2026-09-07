// Comprehensive location dataset for global employee addresses

export const COUNTRIES = [
  "United States",
  "India",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "Singapore",
  "Japan",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

// Rich States/Provinces for Major Countries
export const COUNTRY_STATES = {
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
  ],
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi NCR", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland", "Greater London", "West Midlands",
    "Greater Manchester", "West Yorkshire", "Merseyside", "South Yorkshire", "Hampshire", "Kent", "Essex"
  ],
  "Australia": [
    "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia",
    "Tasmania", "Australian Capital Territory", "Northern Territory"
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
  ],
  "Germany": [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse",
    "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate",
    "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
  ],
  "Singapore": [
    "Central Region", "East Region", "North Region", "North-East Region", "West Region"
  ]
};

// Major Cities per State / Region
export const STATE_CITIES = {
  // United States
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Plano", "Irving", "Frisco", "Garland", "McKinney", "Grand Prairie", "Amarillo", "Lubbock", "Denton"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Irvine", "Pasadena", "Fremont", "Sunnyvale", "Santa Clara"],
  "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "White Plains", "New Rochelle", "Mount Vernon", "Schenectady", "Ithaca", "Utica"],
  "Washington": ["Seattle", "Bellevue", "Redmond", "Kirkland", "Tacoma", "Spokane", "Vancouver", "Olympia", "Renton", "Everett", "Kent", "Federal Way", "Bellingham"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St. Petersburg", "Tallahassee", "Hialeah", "Cape Coral", "Pembroke Pines", "Hollywood", "Gainesville", "Boca Raton"],
  "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Peoria", "Elgin", "Waukegan", "Champaign", "Bloomington", "Evanston"],
  "New Jersey": ["Jersey City", "Newark", "Edison", "Princeton", "Paterson", "Elizabeth", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton", "Hoboken"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Cary", "Winston-Salem", "Wilmington", "Fayetteville", "High Point", "Asheville", "Concord", "Gastonia"],
  "Georgia": ["Atlanta", "Savannah", "Augusta", "Athens", "Columbus", "Macon", "Roswell", "Sandy Springs", "Johns Creek", "Alpharetta", "Marietta"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "York"],
  "Massachusetts": ["Boston", "Cambridge", "Worcester", "Springfield", "Lowell", "Newton", "Somerville", "Quincy", "Lynn", "Waltham"],
  "Virginia": ["Richmond", "Virginia Beach", "Norfolk", "Alexandria", "Arlington", "Reston", "McLean", "Chesapeake", "Newport News", "Hampton", "Roanoke"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton"],
  "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Dearborn", "Troy"],
  "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria"],
  "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Boulder"],

  // India
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Kalaburagi", "Udupi", "Bidar", "Hosapete", "Hassan"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad (Chhatrapati Sambhaji Nagar)", "Solapur", "Navi Mumbai", "Amravati", "Kolhapur", "Akola", "Panvel", "Ulhasnagar", "Sangli", "Jalgaon"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Tirunelveli", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Nagercoil", "Kanchipuram", "Hosur"],
  "Delhi NCR": ["New Delhi", "Delhi", "Noida", "Greater Noida", "Gurugram", "Faridabad", "Ghaziabad"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Bharuch"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Noida", "Meerut", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Jhansi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Kharagpur", "Baharampur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sikar", "Sri Ganganagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali (SAS Nagar)", "Hoshiarpur", "Pathankot"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"],

  // Canada
  "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor", "Richmond Hill", "Oakville", "Burlington"],
  "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna", "Abbotsford", "Coquitlam", "Saanich", "Langley", "Nanaimo"],
  "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Levis"],
  "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Wood Buffalo"],

  // United Kingdom
  "Greater London": ["London", "Westminster", "Camden", "Greenwich", "Hackney", "Croydon", "Islington", "Tower Hamlets", "Ealing"],
  "West Midlands": ["Birmingham", "Coventry", "Wolverhampton", "Solihull", "Dudley", "Walsall"],
  "Greater Manchester": ["Manchester", "Salford", "Bolton", "Stockport", "Oldham", "Rochdale", "Wigan"],
  "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Stirling", "Perth"],
  "West Yorkshire": ["Leeds", "Bradford", "Wakefield", "Huddersfield", "Halifax"],

  // Australia
  "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Maitland", "Tweed Heads", "Wagga Wagga"],
  "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Mildura", "Warrnambool"],
  "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Cairns", "Townsville", "Toowoomba", "Mackay"],
  "Western Australia": ["Perth", "Fremantle", "Mandurah", "Bunbury", "Kalgoorlie", "Geraldton"],

  // United Arab Emirates
  "Dubai": ["Dubai", "Downtown Dubai", "Dubai Marina", "Deira", "Bur Dubai", "Jumeirah", "Business Bay"],
  "Abu Dhabi": ["Abu Dhabi City", "Al Ain", "Al Dhafra", "Madinat Zayed"],
  "Sharjah": ["Sharjah City", "Khor Fakkan", "Kalba"]
};

// Global fallback cities if no state-level list exists
export const COMMON_GLOBAL_CITIES = [
  "London", "Paris", "Berlin", "Tokyo", "Singapore", "Sydney", "Toronto", "Dubai",
  "New York", "San Francisco", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chicago",
  "Amsterdam", "Madrid", "Rome", "Seoul", "Hong Kong", "Zurich", "Dublin", "Melbourne"
];

/**
 * Filter items with priority given to strings STARTING with the query,
 * followed by items that CONTAIN the query elsewhere.
 */
export function filterWithPrefixPriority(items, query = '') {
  if (!items || !Array.isArray(items)) return [];
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const startsWith = [];
  const contains = [];

  for (const item of items) {
    const itemStr = typeof item === 'string' ? item : (item.name || item.label || '');
    const lower = itemStr.toLowerCase();
    if (lower.startsWith(q)) {
      startsWith.push(item);
    } else if (lower.includes(q)) {
      contains.push(item);
    }
  }

  // Natural case-insensitive alphabetical sort for the prefix matches
  startsWith.sort((a, b) => {
    const strA = typeof a === 'string' ? a : (a.name || a.label || '');
    const strB = typeof b === 'string' ? b : (b.name || b.label || '');
    return strA.localeCompare(strB);
  });

  contains.sort((a, b) => {
    const strA = typeof a === 'string' ? a : (a.name || a.label || '');
    const strB = typeof b === 'string' ? b : (b.name || b.label || '');
    return strA.localeCompare(strB);
  });

  return [...startsWith, ...contains];
}

/**
 * Get available states for a selected country.
 */
export function getStatesForCountry(countryName) {
  if (!countryName) return [];
  const normalized = countryName.trim();
  // Direct match or case-insensitive match
  if (COUNTRY_STATES[normalized]) return COUNTRY_STATES[normalized];
  const foundKey = Object.keys(COUNTRY_STATES).find(k => k.toLowerCase() === normalized.toLowerCase());
  return foundKey ? COUNTRY_STATES[foundKey] : [];
}

/**
 * Get available cities for a selected state & country.
 */
export function getCitiesForState(countryName, stateName) {
  if (!stateName) return [];
  const normalizedState = stateName.trim();
  if (STATE_CITIES[normalizedState]) return STATE_CITIES[normalizedState];
  const foundKey = Object.keys(STATE_CITIES).find(k => k.toLowerCase() === normalizedState.toLowerCase());
  if (foundKey) return STATE_CITIES[foundKey];

  return [];
}
