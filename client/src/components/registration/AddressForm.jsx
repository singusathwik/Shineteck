import React from 'react';
import { MapPin, Building, Building2, Navigation, AlertCircle, Home, Globe } from 'lucide-react';
import { SearchableCombobox } from '../common/SearchableCombobox.jsx';
import {
  COUNTRIES,
  getStatesForCountry,
  getCitiesForState,
  COMMON_GLOBAL_CITIES
} from '../../data/locationData.js';

export function AddressForm({ values, onChange, errors = {}, setErrors }) {
  const inputCls = (hasErr) =>
    `w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
      hasErr ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
    }`;

  // Handle single ZIP / Postal code change
  const handleZipChange = (value) => {
    onChange('zipCode', value);
    if (setErrors && errors.zipCode) {
      setErrors(prev => ({ ...prev, zipCode: null }));
    }
  };

  const handleCountryChange = (newCountry) => {
    onChange('country', newCountry);
    if (setErrors && errors.country) {
      setErrors(prev => ({ ...prev, country: null }));
    }
  };

  const handleStateChange = (newState) => {
    onChange('state', newState);
    if (setErrors && errors.state) {
      setErrors(prev => ({ ...prev, state: null }));
    }
  };

  const handleCityChange = (newCity) => {
    onChange('city', newCity);
    if (setErrors && errors.city) {
      setErrors(prev => ({ ...prev, city: null }));
    }
  };

  const handleAddressLineChange = (field, value) => {
    onChange(field, value);
    // Sync combined address string
    const addr1 = field === 'addressLine1' ? value : (values.addressLine1 || '');
    const addr2 = field === 'addressLine2' ? value : (values.addressLine2 || '');
    const suite = field === 'suiteApt' ? value : (values.suiteApt || '');
    const combined = [addr1, addr2, suite].filter(Boolean).map(s => s.trim()).join(', ');
    onChange('address', combined);
  };

  // Dynamic dropdown options based on selections
  const availableStates = getStatesForCountry(values.country);
  const stateCities = getCitiesForState(values.country, values.state);
  const availableCities = stateCities.length > 0 ? stateCities : COMMON_GLOBAL_CITIES;

  return (
    <div className="space-y-5">
      {/* ── Section 1: Street Address, Address 2 & Suite / Apartment ── */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Street & Building Address</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Provide your physical street, secondary building details, and suite or apartment number
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Address 1 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="e.g. 100 Corporate Parkway / Flat 4B, Hill View Apartments"
              value={values.addressLine1 || ''}
              onChange={(e) => handleAddressLineChange('addressLine1', e.target.value)}
              className={inputCls(errors.addressLine1 || errors.address)}
            />
            {(errors.addressLine1 || errors.address) && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.addressLine1 || errors.address}
              </p>
            )}
          </div>

          {/* Address 2 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Address Line 2
              </label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Optional
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Building C, 3rd Floor / Near Cyber Towers / Sector 5"
              value={values.addressLine2 || ''}
              onChange={(e) => handleAddressLineChange('addressLine2', e.target.value)}
              className={inputCls(errors.addressLine2)}
            />
          </div>

          {/* Suite / Apartment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Suite / Apartment / Unit
              </label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Optional
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Suite 400 / Apt 12B / Flat 301"
              value={values.suiteApt || ''}
              onChange={(e) => handleAddressLineChange('suiteApt', e.target.value)}
              className={inputCls(errors.suiteApt)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Country, State, City & Single Postal / ZIP Code ── */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Globe className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Country, State, City & Postal Code</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Search or type your country, state/region, city, and enter your postal code
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
          {/* 1. Country - Searchable Combobox (dropdown + typing) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Country <span className="text-rose-500">*</span>
            </label>
            <SearchableCombobox
              id="address-country"
              value={values.country || ''}
              onChange={handleCountryChange}
              options={COUNTRIES}
              placeholder="Select or type country (e.g. India, United States)"
              hasError={Boolean(errors.country)}
              icon={Globe}
              emptyNotice="No country matches. Type your custom country name."
            />
            {errors.country && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.country}
              </p>
            )}
          </div>

          {/* 2. State / Province / Region - Searchable Combobox */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              State / Province / Region <span className="text-rose-500">*</span>
            </label>
            <SearchableCombobox
              id="address-state"
              value={values.state || ''}
              onChange={handleStateChange}
              options={availableStates}
              placeholder="Select or type state (e.g. Texas, Telangana)"
              hasError={Boolean(errors.state)}
              icon={Navigation}
              emptyNotice="Type your custom state, province, or region."
            />
            {errors.state && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.state}
              </p>
            )}
          </div>

          {/* 3. City - Searchable Combobox */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              City <span className="text-rose-500">*</span>
            </label>
            <SearchableCombobox
              id="address-city"
              value={values.city || ''}
              onChange={handleCityChange}
              options={availableCities}
              placeholder="Select or type city (e.g. Dallas, Hyderabad)"
              hasError={Boolean(errors.city)}
              icon={Building2}
              emptyNotice="Type your custom city or municipality."
            />
            {errors.city && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.city}
              </p>
            )}
          </div>

          {/* 4. ZIP / Postal Code - Single clean input box */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              ZIP / Postal Code <span className="text-rose-500">*</span>
            </label>
            <input
              id="address-zipcode"
              type="text"
              placeholder="e.g. 75001, 500081, 90210, SW1A 1AA"
              value={values.zipCode || ''}
              onChange={(e) => handleZipChange(e.target.value)}
              className={inputCls(errors.zipCode)}
            />
            {errors.zipCode && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.zipCode}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic compliance notification tip */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <span className="text-base leading-none select-none">💡</span>
          <div className="leading-relaxed">
            <strong className="text-blue-950 font-bold">Country Compliance Tip: </strong>
            Selecting <strong className="text-blue-700 font-semibold">India</strong> will automatically configure required document uploads for Indian statutory compliance (PAN, Aadhaar, Driver&apos;s License, Bank ACH). Selecting <strong className="text-blue-700 font-semibold">United States</strong> or any other country will load US/Global employment forms (W-4, I-9, Direct Deposit).
          </div>
        </div>
      </div>
    </div>
  );
}
