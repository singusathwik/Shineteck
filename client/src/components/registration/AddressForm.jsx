import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { MapPin, Globe, Building2, Navigation, AlertCircle, CheckCircle2, Home } from 'lucide-react';

export function AddressForm({ values, onChange, errors = {}, setErrors }) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zipExample, setZipExample] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [zipValidationStatus, setZipValidationStatus] = useState(null);

  // Load countries on mount
  useEffect(() => {
    async function loadCountries() {
      try {
        const data = await api.getCountries();
        setCountries(data.countries || []);
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    }
    loadCountries();
  }, []);

  // When country changes, fetch states
  useEffect(() => {
    if (!values.country) {
      setStates([]);
      setCities([]);
      return;
    }

    async function loadStates() {
      setIsLoadingStates(true);
      try {
        const data = await api.getStates(values.country);
        setStates(data.states || []);
        setZipExample(data.zipExample || '');
      } catch (err) {
        console.error('Failed to load states:', err);
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    }

    loadStates();
  }, [values.country]);

  // When state changes, fetch cities
  useEffect(() => {
    if (!values.country || !values.state) {
      setCities([]);
      return;
    }

    async function loadCities() {
      setIsLoadingCities(true);
      try {
        const data = await api.getCities(values.country, values.state);
        setCities(data.cities || []);
      } catch (err) {
        console.error('Failed to load cities:', err);
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    }

    loadCities();
  }, [values.country, values.state]);

  // Validate ZIP code in real-time
  const handleZipChange = (e) => {
    const zip = e.target.value;
    onChange('zipCode', zip);

    if (!zip.trim()) {
      setZipValidationStatus(null);
      return;
    }

    if (values.country === 'United States') {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (usZipRegex.test(zip.trim())) {
        setZipValidationStatus('valid');
        if (setErrors) setErrors(prev => ({ ...prev, zipCode: null }));
      } else {
        setZipValidationStatus('invalid');
      }
    } else if (values.country === 'Canada') {
      const caZipRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      setZipValidationStatus(caZipRegex.test(zip.trim()) ? 'valid' : 'invalid');
    } else if (values.country === 'India') {
      const inZipRegex = /^\d{6}$/;
      setZipValidationStatus(inZipRegex.test(zip.trim()) ? 'valid' : 'invalid');
    } else {
      setZipValidationStatus(zip.trim().length >= 3 ? 'valid' : 'invalid');
    }
  };

  const inputCls = (hasErr) =>
    `w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
      hasErr ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
    }`;

  const selectCls = (hasErr) =>
    `w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all disabled:bg-slate-100 disabled:text-slate-400 shadow-2xs ${
      hasErr ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
    }`;

  return (
    <div className="space-y-5">
      {/* Section 1: Country & State / Province */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Country & Legal Jurisdiction</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Select your primary country and state/province for employment tax compliance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Country */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Country <span className="text-rose-500">*</span>
            </label>
            <select
              value={values.country || ''}
              onChange={(e) => {
                onChange('country', e.target.value);
                onChange('state', '');
                onChange('city', '');
              }}
              className={selectCls(errors.country)}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.country}
              </p>
            )}
          </div>

          {/* State / Province */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              State / Province <span className="text-rose-500">*</span>
            </label>
            {states.length > 0 ? (
              <select
                value={values.state || ''}
                onChange={(e) => {
                  onChange('state', e.target.value);
                  onChange('city', '');
                }}
                disabled={isLoadingStates || !values.country}
                className={selectCls(errors.state)}
              >
                <option value="">Select State / Province</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={isLoadingStates ? 'Loading states...' : 'Enter State / Province'}
                value={values.state || ''}
                onChange={(e) => onChange('state', e.target.value)}
                disabled={!values.country}
                className={inputCls(errors.state)}
              />
            )}
            {errors.state && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: City & Postal Code */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">City & Postal Verification</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">City location and verified postal code formatting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              City <span className="text-rose-500">*</span>
            </label>
            {cities.length > 0 ? (
              <select
                value={values.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                disabled={isLoadingCities || !values.state}
                className={selectCls(errors.city)}
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={isLoadingCities ? 'Loading cities...' : 'Enter City'}
                value={values.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                disabled={!values.country}
                className={inputCls(errors.city)}
              />
            )}
            {errors.city && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.city}
              </p>
            )}
          </div>

          {/* ZIP / Postal Code */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              ZIP / Postal Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={zipExample ? `e.g. ${zipExample}` : 'Postal Code'}
                value={values.zipCode || ''}
                onChange={handleZipChange}
                className={`w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 pr-10 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
                  errors.zipCode || zipValidationStatus === 'invalid'
                    ? 'border-rose-400 bg-rose-50/30'
                    : zipValidationStatus === 'valid'
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              <div className="absolute right-3.5 top-3 pointer-events-none">
                {zipValidationStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {zipValidationStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-rose-500" />}
              </div>
            </div>
            {errors.zipCode && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.zipCode}
              </p>
            )}
            {zipValidationStatus === 'invalid' && !errors.zipCode && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />Please enter a valid postal code format for {values.country}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Street Address */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Residential Street Address</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Physical street address, apartment, or suite number</p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Street Address / Suite / Apartment <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. 100 Corporate Plaza, Suite 400"
            value={values.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            className={`w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
              errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
            }`}
          />
          {errors.address && (
            <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />{errors.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
