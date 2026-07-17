// src/components/PropertyDivider/modules/ExportReport.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ExportReport = ({ 
  darkMode = false,
  divisionResults = null,
  persons = [],
  properties = [],
  propositusId = null,
  onClose
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  if (!divisionResults) return null;

  const { heirs, totalEstate, deathEvents } = divisionResults;

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPropositusName = () => {
    if (!propositusId) return 'Unknown';
    const person = persons.find(p => p.id === propositusId);
    return person ? person.name : 'Unknown';
  };

  const getPersonName = (id) => {
    if (!id) return 'Unknown';
    const person = persons.find(p => p.id === id);
    return person ? person.name : 'Unknown';
  };

  const handleExport = () => {
    setExporting(true);

    // Generate HTML report
    const htmlContent = generateHTMLReport();

    if (exportFormat === 'pdf') {
      // Open in new window for printing/PDF
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        alert('Please allow popups to export the report.');
        setExporting(false);
      }
    } else {
      // Copy to clipboard
      const textContent = generateTextReport();
      navigator.clipboard.writeText(textContent)
        .then(() => {
          alert('Report copied to clipboard!');
        })
        .catch(() => {
          alert('Failed to copy report. Please try again.');
        })
        .finally(() => {
          setExporting(false);
        });
    }

    // Reset exporting after a delay if not handled by print
    setTimeout(() => {
      setExporting(false);
    }, 2000);
  };

  const generateHTMLReport = () => {
    const propositusName = getPropositusName();
    const now = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Build heirs table rows
    let heirsRows = '';
    heirs.forEach((heir, index) => {
      const pct = (heir.total / totalEstate) * 100;
      const sources = heir.inheritanceHistory && heir.inheritanceHistory.length > 0
        ? heir.inheritanceHistory.map(item => {
            let source = item.source
              .replace('Inherited from ', '')
              .replace('Own Exclusive Property: ', '');
            const throughIndex = source.indexOf(' (through ');
            if (throughIndex > -1) {
              source = source.substring(0, throughIndex);
            }
            return `${source} (${formatNumber(item.amount)} sqm)`;
          }).join(' + ')
        : 'No sources';

      heirsRows += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${heir.person.name}</strong></td>
          <td>${formatNumber(heir.total)} sqm</td>
          <td>${pct.toFixed(1)}%</td>
          <td style="font-size: 11px; color: #64748b;">${sources}</td>
        </tr>
      `;
    });

    // Build death events table
    let deathRows = '';
    deathEvents.forEach((event, index) => {
      const isRepresented = event.isRepresented === true;
      const status = event.isExcluded ? 'Excluded' : isRepresented ? 'Represented' : event.isAbandoned ? 'Abandoned' : 'Processed';
      
      deathRows += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${event.person.name}</strong></td>
          <td>${formatDate(event.person.dateOfDeath)}</td>
          <td>${formatNumber(event.totalEstate)} sqm</td>
          <td>${event.heirs?.length || 0}</td>
          <td><span style="background: ${status === 'Represented' ? '#8b5cf6' : status === 'Excluded' ? '#dc2626' : status === 'Abandoned' ? '#f59e0b' : '#10b981'}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 10px;">${status}</span></td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estate Division Report - ${propositusName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8fafc;
              padding: 40px 20px;
              color: #0f172a;
            }
            .report-container {
              max-width: 1100px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 24px rgba(0,0,0,0.08);
              padding: 40px;
            }
            .report-header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .report-title {
              font-size: 28px;
              font-weight: 800;
              color: #0f172a;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .report-subtitle {
              font-size: 14px;
              color: #64748b;
              margin-top: 4px;
            }
            .report-meta {
              display: flex;
              gap: 24px;
              flex-wrap: wrap;
              margin-top: 12px;
              font-size: 13px;
              color: #475569;
            }
            .report-meta span {
              background: #f1f5f9;
              padding: 4px 14px;
              border-radius: 20px;
            }
            .section {
              margin-top: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 14px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-subtitle {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            thead {
              background: #f1f5f9;
            }
            th {
              text-align: left;
              padding: 10px 14px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 10px 14px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .total-row {
              background: #f8fafc;
              font-weight: 700;
            }
            .total-row td {
              border-top: 2px solid #e2e8f0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            .badge {
              display: inline-block;
              padding: 2px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
            }
            .badge-exclusive {
              background: #eff6ff;
              color: #3b82f6;
            }
            .badge-conjugal {
              background: #f0fdf4;
              color: #16a34a;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f8fafc;
              border-radius: 12px;
              padding: 16px 20px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .summary-value {
              font-size: 24px;
              font-weight: 700;
              color: #0f172a;
            }
            .summary-label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .summary-value.purple { color: #8b5cf6; }
            .summary-value.blue { color: #3b82f6; }
            .summary-value.green { color: #10b981; }
            .summary-value.orange { color: #f59e0b; }
            @media print {
              body { background: white; padding: 20px; }
              .report-container { box-shadow: none; padding: 20px; }
              .no-print { display: none; }
            }
            @media (max-width: 768px) {
              .summary-grid { grid-template-columns: 1fr 1fr; }
              .report-container { padding: 20px; }
              table { font-size: 12px; }
              th, td { padding: 6px 10px; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header -->
            <div class="report-header">
              <div class="report-title">
                ⚖️ Estate Division Report
              </div>
              <div class="report-subtitle">
                Philippine Intestate Succession System
              </div>
              <div class="report-meta">
                <span>👤 Decedent: <strong>${propositusName}</strong></span>
                <span>📅 Generated: ${now}</span>
                <span>📦 ${properties.length} Properties</span>
                <span>👥 ${heirs.length} Heirs</span>
                <span>⚖️ Intestate Succession</span>
              </div>
            </div>

            <!-- Summary -->
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value purple">${formatNumber(totalEstate)}</div>
                <div class="summary-label">Total Estate (sqm)</div>
              </div>
              <div class="summary-card">
                <div class="summary-value blue">${heirs.length}</div>
                <div class="summary-label">Total Heirs</div>
              </div>
              <div class="summary-card">
                <div class="summary-value green">${deathEvents.length}</div>
                <div class="summary-label">Death Events</div>
              </div>
              <div class="summary-card">
                <div class="summary-value orange">${properties.filter(p => p.classification === 'Conjugal').length}</div>
                <div class="summary-label">Conjugal Properties</div>
              </div>
            </div>

            <!-- Heirs Table -->
            <div class="section">
              <div class="section-title">👥 Heirs & Their Shares</div>
              <div class="section-subtitle">Distribution of the estate among the legal heirs</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Heir Name</th>
                    <th>Share</th>
                    <th>Percentage</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  ${heirsRows}
                  <tr class="total-row">
                    <td colspan="2"><strong>Total Estate</strong></td>
                    <td><strong>${formatNumber(totalEstate)} sqm</strong></td>
                    <td><strong>100%</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Death Timeline -->
            <div class="section">
              <div class="section-title">📅 Death Timeline</div>
              <div class="section-subtitle">Chronological order of deaths in the succession</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Person</th>
                    <th>Date of Death</th>
                    <th>Estate</th>
                    <th>Heirs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${deathRows}
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>This report is generated by the Estate Division Engine.</p>
              <p style="margin-top: 4px;">For official use only. ⚖️</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateTextReport = () => {
    const propositusName = getPropositusName();
    const now = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `⚖️ ESTATE DIVISION REPORT
${'='.repeat(50)}
Decedent: ${propositusName}
Generated: ${now}
Total Estate: ${formatNumber(totalEstate)} sqm
Total Heirs: ${heirs.length}
${'='.repeat(50)}

👥 HEIRS & THEIR SHARES
${'-'.repeat(50)}
`;

    heirs.forEach((heir, index) => {
      const pct = (heir.total / totalEstate) * 100;
      report += `\n${index + 1}. ${heir.person.name}
   Share: ${formatNumber(heir.total)} sqm (${pct.toFixed(1)}%)
`;
      if (heir.inheritanceHistory && heir.inheritanceHistory.length > 0) {
        report += `   Sources:\n`;
        heir.inheritanceHistory.forEach(item => {
          let source = item.source
            .replace('Inherited from ', '')
            .replace('Own Exclusive Property: ', '');
          const throughIndex = source.indexOf(' (through ');
          if (throughIndex > -1) {
            source = source.substring(0, throughIndex);
          }
          report += `     - ${source}: ${formatNumber(item.amount)} sqm\n`;
        });
      }
    });

    report += `\n${'='.repeat(50)}
📅 DEATH TIMELINE
${'-'.repeat(50)}
`;

    deathEvents.forEach((event, index) => {
      const isRepresented = event.isRepresented === true;
      const status = event.isExcluded ? 'Excluded' : isRepresented ? 'Represented' : event.isAbandoned ? 'Abandoned' : 'Processed';
      report += `\n${index + 1}. ${event.person.name}
   Died: ${formatDate(event.person.dateOfDeath)}
   Estate: ${formatNumber(event.totalEstate)} sqm
   Heirs: ${event.heirs?.length || 0}
   Status: ${status}
`;
    });

    report += `\n${'='.repeat(50)}
Report generated by Estate Division Engine.
For official use only. ⚖️
`;

    return report;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="export-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="export-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="export-header">
          <div className="export-header-left">
            <span className="export-icon">📄</span>
            <div>
              <h2 className="export-title">Export Report</h2>
              <p className="export-subtitle">Generate a professional report of the estate division</p>
            </div>
          </div>
          <button className="export-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-body">
          <div className="export-summary">
            <div className="export-summary-item">
              <span className="export-summary-label">Decedent</span>
              <span className="export-summary-value">{getPropositusName()}</span>
            </div>
            <div className="export-summary-item">
              <span className="export-summary-label">Total Estate</span>
              <span className="export-summary-value">{formatNumber(totalEstate)} sqm</span>
            </div>
            <div className="export-summary-item">
              <span className="export-summary-label">Heirs</span>
              <span className="export-summary-value">{heirs.length}</span>
            </div>
            <div className="export-summary-item">
              <span className="export-summary-label">Properties</span>
              <span className="export-summary-value">{properties.length}</span>
            </div>
          </div>

          <div className="export-format">
            <label className="export-format-label">Export Format</label>
            <div className="export-format-options">
              <button
                className={`export-format-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                onClick={() => setExportFormat('pdf')}
              >
                📄 PDF / Print
              </button>
              <button
                className={`export-format-btn ${exportFormat === 'text' ? 'active' : ''}`}
                onClick={() => setExportFormat('text')}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          </div>

          <div className="export-preview">
            <p className="export-preview-label">📋 Report Preview</p>
            <div className="export-preview-content">
              <div className="export-preview-header">
                <span>⚖️ Estate Division Report</span>
                <span>{getPropositusName()}</span>
              </div>
              <div className="export-preview-stats">
                <span>Total: {formatNumber(totalEstate)} sqm</span>
                <span>Heirs: {heirs.length}</span>
                <span>Events: {deathEvents.length}</span>
              </div>
              <div className="export-preview-heirs">
                {heirs.slice(0, 3).map((heir, idx) => {
                  const pct = (heir.total / totalEstate) * 100;
                  return (
                    <div key={idx} className="export-preview-heir">
                      <span>{heir.person.name}</span>
                      <span>{formatNumber(heir.total)} sqm ({pct.toFixed(1)}%)</span>
                    </div>
                  );
                })}
                {heirs.length > 3 && (
                  <div className="export-preview-more">+ {heirs.length - 3} more heirs</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="export-footer">
          <button className="export-btn export-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="export-btn export-btn-primary" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="export-spinner" />
                Exporting...
              </>
            ) : (
              exportFormat === 'pdf' ? '📄 Generate Report' : '📋 Copy to Clipboard'
            )}
          </button>
        </div>

        <style>{`
          .export-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            padding: 20px;
          }

          .export-modal {
            background: var(--card-bg, #ffffff);
            border-radius: 16px;
            max-width: 560px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color, #e2e8f0);
            display: flex;
            flex-direction: column;
          }

          .export-header {
            padding: 18px 24px;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: var(--bg-secondary, #f8fafc);
            flex-shrink: 0;
          }

          .export-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .export-icon {
            font-size: 28px;
          }

          .export-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--text-primary, #0f172a);
            margin: 0;
          }

          .export-subtitle {
            font-size: 13px;
            color: var(--text-secondary, #64748b);
            margin: 2px 0 0 0;
          }

          .export-close {
            background: none;
            border: none;
            font-size: 20px;
            color: var(--text-secondary, #64748b);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .export-close:hover {
            background: var(--border-color, #e2e8f0);
          }

          .export-body {
            padding: 20px 24px;
            overflow-y: auto;
            flex: 1;
          }

          .export-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }

          .export-summary-item {
            background: var(--bg-secondary, #f8fafc);
            border-radius: 10px;
            padding: 10px 14px;
            border: 1px solid var(--border-color, #e2e8f0);
            display: flex;
            flex-direction: column;
          }

          .export-summary-label {
            font-size: 10px;
            font-weight: 600;
            color: var(--text-secondary, #64748b);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .export-summary-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary, #0f172a);
            margin-top: 2px;
          }

          .export-format {
            margin-bottom: 20px;
          }

          .export-format-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary, #0f172a);
            display: block;
            margin-bottom: 8px;
          }

          .export-format-options {
            display: flex;
            gap: 8px;
          }

          .export-format-btn {
            padding: 8px 18px;
            border-radius: 8px;
            border: 2px solid var(--border-color, #e2e8f0);
            background: transparent;
            color: var(--text-secondary, #64748b);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
            flex: 1;
          }

          .export-format-btn.active {
            border-color: #6366f1;
            background: rgba(99, 102, 241, 0.06);
            color: #6366f1;
          }

          .export-format-btn:hover:not(.active) {
            background: var(--border-color, #e2e8f0);
          }

          .export-preview {
            background: var(--bg-secondary, #f8fafc);
            border-radius: 10px;
            padding: 14px 16px;
            border: 1px solid var(--border-color, #e2e8f0);
          }

          .export-preview-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary, #64748b);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .export-preview-content {
            background: var(--card-bg, #ffffff);
            border-radius: 8px;
            padding: 12px 14px;
            border: 1px solid var(--border-color, #e2e8f0);
          }

          .export-preview-header {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary, #0f172a);
            padding-bottom: 6px;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
          }

          .export-preview-stats {
            display: flex;
            gap: 16px;
            font-size: 11px;
            color: var(--text-secondary, #64748b);
            padding: 6px 0;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
          }

          .export-preview-heirs {
            padding-top: 6px;
          }

          .export-preview-heir {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-primary, #0f172a);
            padding: 2px 0;
          }

          .export-preview-more {
            font-size: 11px;
            color: var(--text-secondary, #64748b);
            text-align: center;
            padding-top: 4px;
          }

          .export-footer {
            padding: 14px 24px;
            border-top: 1px solid var(--border-color, #e2e8f0);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-shrink: 0;
            background: var(--bg-secondary, #f8fafc);
          }

          .export-btn {
            padding: 8px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .export-btn-secondary {
            background: transparent;
            color: var(--text-primary, #0f172a);
            border: 1px solid var(--border-color, #e2e8f0);
          }

          .export-btn-secondary:hover {
            background: var(--border-color, #e2e8f0);
          }

          .export-btn-primary {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff;
          }

          .export-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
          }

          .export-btn-primary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .export-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #ffffff;
            border-radius: 50%;
            animation: export-spin 0.8s linear infinite;
          }

          @keyframes export-spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 480px) {
            .export-summary {
              grid-template-columns: 1fr 1fr;
            }
            .export-modal {
              max-width: 100%;
              max-height: 95vh;
            }
            .export-body {
              padding: 14px 16px;
            }
            .export-footer {
              flex-direction: column;
            }
            .export-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default ExportReport;