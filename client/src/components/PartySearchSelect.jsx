import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, UserPlus, X, Check, User, Phone, MapPin } from 'lucide-react';
import API from '../api';

export default function PartySearchSelect({
  partyType = 'all', // 'Farmer' | 'Buyer' | 'Agent' | 'all'
  value = '',
  onChange,
  parties = null,
  onRefreshParties,
  placeholder = 'पार्टी खोजें (नाम / कोड)...',
  label = '',
  required = false,
  className = ''
}) {
  const [localParties, setLocalParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Party Form State
  const [newParty, setNewParty] = useState({
    name: '',
    shortCode: '',
    type: partyType !== 'all' ? partyType : 'Buyer',
    mobile: '',
    city: 'Delhi',
    openingBalance: '0',
    balanceType: 'Dr'
  });
  const [savingParty, setSavingParty] = useState(false);
  const [formError, setFormError] = useState('');

  const containerRef = useRef(null);

  // Load parties if not provided
  useEffect(() => {
    if (parties) {
      setLocalParties(parties);
    } else {
      loadParties();
    }
  }, [parties]);

  // Keep search input synced with value if closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery(value || '');
    }
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await API.getParties();
      setLocalParties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load parties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter parties by type and search query
  const filteredParties = localParties.filter(p => {
    // Type filter
    if (partyType !== 'all' && p.type && p.type.toLowerCase() !== partyType.toLowerCase()) {
      return false;
    }
    // Search query filter (matches name, short_code, mobile)
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const codeMatch = (p.short_code || '').toLowerCase().includes(q);
    const phoneMatch = (p.mobile || '').includes(q);
    return nameMatch || codeMatch || phoneMatch;
  });

  const handleSelect = (party) => {
    onChange(party.name, party);
    setSearchQuery(party.name);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const handleOpenAddModal = () => {
    setNewParty({
      name: searchQuery && !filteredParties.some(p => p.name.toLowerCase() === searchQuery.toLowerCase()) ? searchQuery : '',
      shortCode: '',
      type: partyType !== 'all' ? partyType : 'Buyer',
      mobile: '',
      city: 'Delhi',
      openingBalance: '0',
      balanceType: 'Dr'
    });
    setFormError('');
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleSaveParty = async (e) => {
    e.preventDefault();
    if (!newParty.name.trim()) {
      setFormError('पार्टी का नाम अनिवार्य है (Party Name is required)');
      return;
    }

    try {
      setSavingParty(true);
      setFormError('');
      const res = await API.addParty({
        name: newParty.name.trim(),
        type: newParty.type,
        shortCode: newParty.shortCode.trim().toUpperCase() || undefined,
        mobile: newParty.mobile.trim(),
        city: newParty.city.trim(),
        address: newParty.city.trim(),
        openingBalance: parseFloat(newParty.openingBalance) || 0,
        balanceType: newParty.balanceType
      });

      // Reload party list
      if (onRefreshParties) {
        await onRefreshParties();
      } else {
        await loadParties();
      }

      // Automatically select newly created party
      onChange(newParty.name.trim(), {
        name: newParty.name.trim(),
        type: newParty.type,
        short_code: res.shortCode || newParty.shortCode,
        mobile: newParty.mobile
      });
      setSearchQuery(newParty.name.trim());
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message || 'पार्टी जोड़ने में विफल (Failed to save party)');
    } finally {
      setSavingParty(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required && !value}
          className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-16 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow shadow-sm font-medium text-gray-800"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200 transition-colors"
            title="Add new party"
          >
            <Plus className="w-3 h-3" />
            <span>नया</span>
          </button>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {loading ? (
            <div className="p-3 text-center text-xs text-gray-400">लोड हो रहा है...</div>
          ) : filteredParties.length > 0 ? (
            filteredParties.map((p, idx) => {
              const isSelected = (p.name || '').toLowerCase() === (value || '').toLowerCase();
              return (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition-colors text-xs ${
                    isSelected ? 'bg-emerald-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    {p.short_code && (
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                        {p.short_code}
                      </span>
                    )}
                    <span className="truncate text-gray-900 font-medium">{p.name}</span>
                    {p.type && partyType === 'all' && (
                      <span className="text-[10px] text-gray-400 shrink-0">({p.type})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-gray-500">
                    {p.mobile && <span className="text-[11px] font-mono">{p.mobile}</span>}
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 mb-2">कोई पार्टी नहीं मिली (No matching party)</p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ "{searchQuery}" नया पार्टी जोड़ें</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline Quick Add Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-600 px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">नया पार्टी जोड़ें (Quick Add Party)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="p-4 space-y-3">
              {formError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {formError}
                </div>
              )}

              {/* Party Type Radio Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  पार्टी प्रकार (Party Type) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Farmer', 'Buyer', 'Agent'].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        newParty.type === type
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="partyType"
                        value={type}
                        checked={newParty.type === type}
                        onChange={(e) => setNewParty({ ...newParty, type: e.target.value })}
                        className="sr-only"
                      />
                      <span>{type === 'Farmer' ? 'किसान (Farmer)' : type === 'Buyer' ? 'खरीदार (Buyer)' : 'दलाल (Agent)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Party Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  पूरा नाम (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="उदा. रमेश कुमार / Aggarwal Wholesale"
                    value={newParty.name}
                    onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Short Code & Mobile */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    शॉर्ट कोड (Short Code)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. RMK"
                    value={newParty.shortCode}
                    onChange={(e) => setNewParty({ ...newParty, shortCode: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    मोबाइल नंबर (Mobile)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      placeholder="98100..."
                      value={newParty.mobile}
                      onChange={(e) => setNewParty({ ...newParty, mobile: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg pl-7 pr-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* City / Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  स्थान / मंडी (City / Location)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="उदा. Azadpur Mandi / Shimla"
                    value={newParty.city}
                    onChange={(e) => setNewParty({ ...newParty, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opening Balance */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    आरंभिक शेष (Opening Balance ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newParty.openingBalance}
                    onChange={(e) => setNewParty({ ...newParty, openingBalance: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dr / Cr
                  </label>
                  <select
                    value={newParty.balanceType}
                    onChange={(e) => setNewParty({ ...newParty, balanceType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Dr">Dr (लेना)</option>
                    <option value="Cr">Cr (देना)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={savingParty}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingParty ? 'जोड़ रहे हैं...' : 'पार्टी जोड़ें (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
