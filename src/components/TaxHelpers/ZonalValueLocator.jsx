import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ZonalValueLocator = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  const cities = [
    'Makati City',
    'Taguig City',
    'Quezon City',
    'Manila',
    'Pasig City',
    'Mandaluyong City'
  ];

  const zones = [
    { id: 1, name: 'Zonal Value Zone A', location: 'Ayala Avenue', value: 450000, type: 'commercial' },
    { id: 2, name: 'Zonal Value Zone B', location: 'Bonifacio Global City', value: 380000, type: 'commercial' },
    { id: 3, name: 'Zonal Value Zone C', location: 'Eastwood City', value: 280000, type: 'residential' },
    { id: 4, name: 'Zonal Value Zone D', location: 'Greenhills', value: 320000, type: 'residential' },
    { id: 5, name: 'Zonal Value Zone E', location: 'Binondo', value: 250000, type: 'commercial' },
    { id: 6, name: 'Zonal Value Zone F', location: 'Rockwell Center', value: 500000, type: 'commercial' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);

    setTimeout(() => {
      const filtered = zones.filter(zone => 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (selectedCity && zone.location.includes(selectedCity))
      );
      setResults(filtered);
      setIsSearching(false);
    }, 800);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'commercial':
        return <BuildingOfficeIcon className="type-icon" />;
      case 'residential':
        return <HomeIcon className="type-icon" />;
      default:
        return <ShoppingBagIcon className="type-icon" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'commercial':
        return '#3b82f6';
      case 'residential':
        return '#10b981';
      default:
        return '#f59e0b';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="zonal-value-locator">
      <div className="locator-header">
        <h3>
          <MapPinIcon className="header-icon" />
          Zonal Value Locator
        </h3>
        <p>Find property zonal values based on location and type</p>
      </div>

      <form onSubmit={handleSearch} className="search-section">
        <div className="search-input-group">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by location or zone name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="city-select"
        >
          <option value="">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <button type="submit" className="search-btn" disabled={isSearching}>
          {isSearching ? (
            <>
              <ArrowPathIcon className="btn-icon spinning" />
              Searching...
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="btn-icon" />
              Search Values
            </>
          )}
        </button>
      </form>

      <div className="results-section">
        <AnimatePresence>
          {results.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="results-grid"
            >
              {results.map((zone, index) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="zone-card"
                  onClick={() => setSelectedZone(zone)}
                  whileHover={{ y: -4 }}
                >
                  <div className="zone-header">
                    <div 
                      className="zone-type-icon"
                      style={{ backgroundColor: `${getTypeColor(zone.type)}20` }}
                    >
                      {getTypeIcon(zone.type)}
                    </div>
                    <div className="zone-type-badge" style={{ color: getTypeColor(zone.type) }}>
                      {zone.type}
                    </div>
                  </div>

                  <h4 className="zone-name">{zone.name}</h4>
                  <p className="zone-location">
                    <MapPinIcon className="location-icon" />
                    {zone.location}
                  </p>

                  <div className="zone-value">
                    <span className="value-label">Zonal Value</span>
                    <span className="value-amount">{formatCurrency(zone.value)}</span>
                    <span className="value-unit">per sqm</span>
                  </div>

                  <button className="view-details-btn">
                    <DocumentTextIcon className="btn-icon" />
                    View Details
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : results.length === 0 && !isSearching && searchQuery ? (
            <div className="no-results">
              <MapPinIcon className="no-results-icon" />
              <h4>No zones found</h4>
              <p>Try adjusting your search criteria or select a different city</p>
            </div>
          ) : (
            <div className="search-prompt">
              <MapPinIcon className="prompt-icon" />
              <h4>Search for Zonal Values</h4>
              <p>Enter a location or zone name to find zonal values</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="zone-detail-modal"
          onClick={() => setSelectedZone(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedZone(null)}>×</button>
            <h3>{selectedZone.name}</h3>
            <div className="detail-row">
              <span>Location:</span>
              <span>{selectedZone.location}</span>
            </div>
            <div className="detail-row">
              <span>Type:</span>
              <span className="detail-type">{selectedZone.type}</span>
            </div>
            <div className="detail-row">
              <span>Zonal Value:</span>
              <span className="detail-value">{formatCurrency(selectedZone.value)}</span>
            </div>
            <div className="detail-row">
              <span>Unit:</span>
              <span>per square meter</span>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        .zonal-value-locator {
          background: var(--card-bg);
          border-radius: 0.75rem;
        }

        .locator-header {
          margin-bottom: 2rem;
        }

        .locator-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .header-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #10b981;
        }

        .locator-header p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .search-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-input-group {
          flex: 2;
          position: relative;
          min-width: 200px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-tertiary);
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .city-select {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          min-width: 150px;
        }

        .city-select:focus {
          outline: none;
          border-color: #10b981;
        }

        .search-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .search-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .search-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .zone-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .zone-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .zone-type-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .type-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .zone-type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .zone-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .zone-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .location-icon {
          width: 1rem;
          height: 1rem;
        }

        .zone-value {
          display: flex;
          flex-direction: column;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .value-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .value-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #10b981;
        }

        .value-unit {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .view-details-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-details-btn:hover {
          background: var(--hover-bg);
          border-color: #10b981;
          color: #10b981;
        }

        .no-results,
        .search-prompt {
          text-align: center;
          padding: 3rem 2rem;
        }

        .no-results-icon,
        .prompt-icon {
          width: 3rem;
          height: 3rem;
          color: var(--text-tertiary);
          margin: 0 auto 1rem;
        }

        .no-results h4,
        .search-prompt h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .no-results p,
        .search-prompt p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .zone-detail-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 2rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .modal-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row span:first-child {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .detail-row span:last-child {
          color: var(--text-primary);
          font-weight: 500;
        }

        .detail-type {
          text-transform: capitalize;
        }

        .detail-value {
          color: #10b981 !important;
          font-weight: 700 !important;
        }

        @media (max-width: 768px) {
          .search-section {
            flex-direction: column;
          }

          .search-input-group,
          .city-select,
          .search-btn {
            width: 100%;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ZonalValueLocator;