import React from 'react';
import { MapPin, Building, Building2, Navigation, AlertCircle, Home, Globe } from 'lucide-react';

export function AddressForm({ values, onChange, errors = {}, setErrors }) {
  const inputCls = (hasErr) =>
    `w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
      hasErr ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
    }`;

  // Update Zip code parts and combined zip
  const handleZipPartChange = (part, value) => {
    const cleanVal = value.trim();
    if (part === 1) {
      onChange('zipCodePart1', cleanVal);
      const combined = cleanVal && values.zipCodePart2 ? `${cleanVal}-${values.zipCodePart2}` : (cleanVal || values.zipCodePart2 || '');
      onChange('zipCode', combined);
    } else {
      onChange('zipCodePart2', cleanVal);
      const combined = values.zipCodePart1 && cleanVal ? `${values.zipCodePart1}-${cleanVal}` : (values.zipCodePart1 || cleanVal || '');
      onChange('zipCode', combined);
    }
    if (setErrors && errors.zipCode) {
      setErrors(prev => ({ ...prev, zipCode: null }));
    }
  };

  const handleAddressLineChange = (field, value) => {
    onChange(field, value);
    // Sync combined address
    const addr1 = field === 'addressLine1' ? value : (values.addressLine1 || '');
    const addr2 = field === 'addressLine2' ? value : (values.addressLine2 || '');
    const suite = field === 'suiteApt' ? value : (values.suiteApt || '');
    const combined = [addr1, addr2, suite].filter(Boolean).map(s => s.trim()).join(', ');
    onChange('address', combined);
  };

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

          {/* Suite / Apartment in the same section below Address 1 & Address 2 */}
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

      {/* ── Section 2: City, State, Split ZIP Code & Country ── */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">City, State, Postal Code & Country</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Enter your municipality, state/region, split postal code, and country
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City - Text Input (NO dropdown) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, Los Angeles, Hyderabad, Bengaluru"
              value={values.city || ''}
              onChange={(e) => {
                onChange('city', e.target.value);
                if (setErrors && errors.city) setErrors(prev => ({ ...prev, city: null }));
              }}
              className={inputCls(errors.city)}
            />
            {errors.city && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.city}
              </p>
            )}
          </div>

          {/* State - Text Input (NO dropdown) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              State / Province / Region <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Texas, California, Telangana, Karnataka"
              value={values.state || ''}
              onChange={(e) => {
                onChange('state', e.target.value);
                if (setErrors && errors.state) setErrors(prev => ({ ...prev, state: null }));
              }}
              className={inputCls(errors.state)}
            />
            {errors.state && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.state}
              </p>
            )}
          </div>

          {/* ZIP / Postal Code - Split 2-part input boxes */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              ZIP / Postal Code (Split 2-Part Format) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="text"
                  placeholder="Part 1 (e.g. 500 or 75001)"
                  value={values.zipCodePart1 || ''}
                  onChange={(e) => handleZipPartChange(1, e.target.value)}
                  className={inputCls(errors.zipCode)}
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">First section (e.g. 123)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-lg select-none">-</span>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Part 2 (e.g. 081 or 1234)"
                    value={values.zipCodePart2 || ''}
                    onChange={(e) => handleZipPartChange(2, e.target.value)}
                    className={inputCls(errors.zipCode)}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block font-medium">Second section (e.g. 456)</span>
                </div>
              </div>
            </div>

            {errors.zipCode && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.zipCode}
              </p>
            )}
          </div>

          {/* Country - Text Input at the end (NO dropdown) */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-display">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Country <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Type your country: e.g. India, United States, Canada, United Kingdom"
              value={values.country || ''}
              onChange={(e) => {
                onChange('country', e.target.value);
                if (setErrors && errors.country) setErrors(prev => ({ ...prev, country: null }));
              }}
              className={inputCls(errors.country)}
            />
            {errors.country && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />{errors.country}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              💡 Tip: Typing <strong className="text-blue-700 font-semibold">India</strong> will customize your document uploads for Indian compliance (Driver&apos;s License, Aadhaar, PAN, ACH Form, Emergency Contact Form). Typing <strong className="text-blue-700 font-semibold">United States</strong> or any other country will load US/Global employment forms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
