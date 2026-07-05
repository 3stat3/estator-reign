import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon, 
  XCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  HashtagIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CircleStackIcon,
  FunnelIcon,
  XMarkIcon as XIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useSupabaseEncryption } from '../../hooks/useSupabaseEncryption';

const ONNETeLATracker = () => {
  const { user } = useAuth();
  
  // Philippine Holidays for 2024-2026
  const getPhilippineHolidays = () => {
    const holidays = {};
    
    const holidays2024 = [
      '2024-01-01', '2024-03-28', '2024-03-29', '2024-04-09',
      '2024-05-01', '2024-06-12', '2024-08-21', '2024-08-26',
      '2024-11-30', '2024-12-25', '2024-12-30', '2024-02-25',
      '2024-04-10', '2024-11-01', '2024-12-08', '2024-11-04'
    ];
    
    const holidays2025 = [
      '2025-01-01', '2025-04-17', '2025-04-18', '2025-04-09',
      '2025-05-01', '2025-06-12', '2025-08-25', '2025-11-30',
      '2025-12-25', '2025-12-30', '2025-02-25', '2025-11-01',
      '2025-12-08'
    ];
    
    const holidays2026 = [
      '2026-01-01', '2026-04-02', '2026-04-03', '2026-04-09',
      '2026-05-01', '2026-06-12', '2026-08-31', '2026-11-30',
      '2026-12-25', '2026-12-30', '2026-02-25', '2026-11-01',
      '2026-12-08'
    ];
    
    [...holidays2024, ...holidays2025, ...holidays2026].forEach(date => {
      holidays[date] = true;
    });
    
    return holidays;
  };

  // INITIAL ROWS - EMPTY
  const getInitialRows = () => {
    return [];
  };

  const [rows, setRows] = useState(getInitialRows());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRowId, setModalRowId] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Filter states
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  // Encryption hook
  const {
    encryptionKey,
    isLoading,
    syncStatus,
    loadRecords,
    saveRecords,
    deleteRecord
  } = useSupabaseEncryption(user);

  // Philippine holidays
  const philippineHolidays = getPhilippineHolidays();

  // Load records on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (user && encryptionKey && !isInitialized) {
        const records = await loadRecords();
        if (records && records.length > 0) {
          setRows(records);
        }
        setIsInitialized(true);
      }
    };

    loadInitialData();
  }, [user, encryptionKey, loadRecords, isInitialized]);

  // Check if a date is a holiday
  const isHoliday = (dateStr) => {
    return philippineHolidays[dateStr] || false;
  };

  // Check if a date is a weekend (Saturday or Sunday)
  const isWeekend = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Check if a date is a working day (not weekend and not holiday)
  const isWorkingDay = (dateStr) => {
    if (!dateStr) return false;
    return !isWeekend(dateStr) && !isHoliday(dateStr);
  };

  // Get working hours between two dates
  const getWorkingHours = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !startTime || !endDate || !endTime) return 0;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (start >= end) return 0;
    
    let totalHours = 0;
    let current = new Date(start);
    const endDay = new Date(end);
    
    const workStartHour = 8;
    const workEndHour = 17;
    
    while (current < endDay) {
      const dateStr = current.toISOString().split('T')[0];
      
      if (!isWorkingDay(dateStr)) {
        current.setDate(current.getDate() + 1);
        current.setHours(workStartHour, 0, 0, 0);
        continue;
      }
      
      const dayStart = new Date(current);
      dayStart.setHours(workStartHour, 0, 0, 0);
      
      const dayEnd = new Date(current);
      dayEnd.setHours(workEndHour, 0, 0, 0);
      
      let segmentStart = new Date(Math.max(current, dayStart));
      let segmentEnd = new Date(Math.min(endDay, dayEnd));
      
      if (segmentStart < segmentEnd) {
        const hours = (segmentEnd - segmentStart) / (1000 * 60 * 60);
        totalHours += hours;
      }
      
      current.setDate(current.getDate() + 1);
      current.setHours(workStartHour, 0, 0, 0);
    }
    
    return totalHours;
  };

  // Calculate score based on given, target, and submitted dates
  const calculateScore = (givenDate, givenTime, targetDate, targetTime, submittedDate, submittedTime) => {
    if (!givenDate || !givenTime || !targetDate || !targetTime || !submittedDate || !submittedTime) {
      return { score: null, error: 'All date and time fields are required' };
    }
    
    const totalWorkingHours = getWorkingHours(givenDate, givenTime, targetDate, targetTime);
    
    if (totalWorkingHours === 0) {
      return { score: null, error: 'Invalid date range or no working hours' };
    }
    
    const submittedWorkingHours = getWorkingHours(givenDate, givenTime, submittedDate, submittedTime);
    
    // If submitted outside the target range, score is 4
    if (submittedWorkingHours < 0 || submittedWorkingHours > totalWorkingHours) {
      return { score: 4, message: 'Submitted outside the target range' };
    }
    
    // Score is 5 if submitted at or before the halfway point
    const halfwayPoint = totalWorkingHours / 2;
    const tolerance = 1 / 60;
    const isAtOrBeforeHalfway = submittedWorkingHours <= halfwayPoint + tolerance;
    
    if (isAtOrBeforeHalfway) {
      return { score: 5, message: 'Submitted at or before the halfway point' };
    } else {
      return { score: 4, message: 'Submitted after the halfway point' };
    }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Calculate ONNET and eLA totals
  const calculateTotals = () => {
    let onnetTotal = 0;
    let elaTotal = 0;
    
    rows.forEach(row => {
      const qty = parseInt(row.quantity) || 0;
      if (row.caseType === 'ONNET') {
        onnetTotal += qty;
      } else if (row.caseType === 'eLA') {
        elaTotal += qty;
      }
    });
    
    return { onnetTotal, elaTotal };
  };

  const { onnetTotal, elaTotal } = calculateTotals();

  // Auto-calculate score for all rows when data changes
  useEffect(() => {
    const updatedRows = rows.map(row => {
      const result = calculateScore(
        row.givenDate, row.givenTime,
        row.targetDate, row.targetTime,
        row.submittedDate, row.submittedTime
      );
      
      if (result.score !== null) {
        return { ...row, score: String(result.score) };
      }
      return row;
    });
    
    let scoresChanged = false;
    updatedRows.forEach((row, index) => {
      if (row.score !== rows[index]?.score) {
        scoresChanged = true;
      }
    });
    
    if (scoresChanged) {
      setRows(updatedRows);
    }
  }, [rows.map(row => `${row.givenDate}|${row.givenTime}|${row.targetDate}|${row.targetTime}|${row.submittedDate}|${row.submittedTime}`).join('||')]);

  // Get all column keys for checking if row is filled
  const getAllColumnKeys = () => {
    return ['no', 'givenDate', 'givenTime', 'targetDate', 'targetTime', 'submittedDate', 'submittedTime', 'score', 'caseType', 'whatKind', 'quantity', 'rdoNo', 'adAssignedControlNumber', 'tin', 'taxpayer'];
  };

  // Filter rows based on selected filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filterYear) {
        const yearMatch = 
          (row.givenDate && row.givenDate.startsWith(filterYear)) ||
          (row.targetDate && row.targetDate.startsWith(filterYear)) ||
          (row.submittedDate && row.submittedDate.startsWith(filterYear));
        if (!yearMatch) return false;
      }
      
      if (filterMonth) {
        const monthMatch = 
          (row.givenDate && row.givenDate.substring(5, 7) === filterMonth) ||
          (row.targetDate && row.targetDate.substring(5, 7) === filterMonth) ||
          (row.submittedDate && row.submittedDate.substring(5, 7) === filterMonth);
        if (!monthMatch) return false;
      }
      
      if (filterDay) {
        const dayMatch = 
          (row.givenDate && row.givenDate.substring(8, 10) === filterDay) ||
          (row.targetDate && row.targetDate.substring(8, 10) === filterDay) ||
          (row.submittedDate && row.submittedDate.substring(8, 10) === filterDay);
        if (!dayMatch) return false;
      }
      
      return true;
    });
  }, [rows, filterYear, filterMonth, filterDay]);

  // Get unique years, months, days from data
  const getUniqueYears = () => {
    const years = new Set();
    rows.forEach(row => {
      if (row.givenDate) years.add(row.givenDate.substring(0, 4));
      if (row.targetDate) years.add(row.targetDate.substring(0, 4));
      if (row.submittedDate) years.add(row.submittedDate.substring(0, 4));
    });
    return Array.from(years).sort();
  };

  const getUniqueMonths = () => {
    const months = new Set();
    rows.forEach(row => {
      if (row.givenDate) months.add(row.givenDate.substring(5, 7));
      if (row.targetDate) months.add(row.targetDate.substring(5, 7));
      if (row.submittedDate) months.add(row.submittedDate.substring(5, 7));
    });
    return Array.from(months).sort();
  };

  const getUniqueDays = () => {
    const days = new Set();
    rows.forEach(row => {
      if (row.givenDate) days.add(row.givenDate.substring(8, 10));
      if (row.targetDate) days.add(row.targetDate.substring(8, 10));
      if (row.submittedDate) days.add(row.submittedDate.substring(8, 10));
    });
    return Array.from(days).sort();
  };

  const uniqueYears = getUniqueYears();
  const uniqueMonths = getUniqueMonths();
  const uniqueDays = getUniqueDays();

  // Clear all filters
  const clearFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterDay('');
  };

  const hasActiveFilters = filterYear || filterMonth || filterDay;

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredRows.map(row => ({
      'No.': row.no,
      'Given Date': row.givenDate || '',
      'Given Time': row.givenTime ? formatTime(row.givenTime) : '',
      'Target Date': row.targetDate || '',
      'Target Time': row.targetTime ? formatTime(row.targetTime) : '',
      'Submitted Date': row.submittedDate || '',
      'Submitted Time': row.submittedTime ? formatTime(row.submittedTime) : '',
      'Score': row.score || '',
      'Case Type': row.caseType || '',
      'What Kind?': row.whatKind || '',
      'Quantity': row.quantity || '',
      'RDO No.': row.rdoNo || '',
      'AD Assigned Control Number': row.adAssignedControlNumber || '',
      'TIN': row.tin || '',
      'Taxpayer': row.taxpayer || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 6 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'ONNET_eLA_Tracker');
    
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const filename = `ONNET_eLA_Tracker_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  };

  // Update row numbers when rows change
  const updateRowNumbers = (updatedRows) => {
    return updatedRows.map((row, index) => ({
      ...row,
      no: String(index + 1)
    }));
  };

  // Execute delete (called from confirm modal)
  const executeDelete = async (id) => {
    // Find the row by _id (database ID)
    const rowToDelete = rows.find(row => row._id === id);
    
    if (!rowToDelete) {
      alert('❌ Record not found. Please refresh and try again.');
      return;
    }
    
    // Remove from local state first (optimistic update)
    const filteredRows = rows.filter(row => row._id !== id);
    const renumberedRows = updateRowNumbers(filteredRows);
    setRows(renumberedRows);
    if (selectedRowId === id) setSelectedRowId(null);
    
    // Then delete from Supabase
    try {
      const success = await deleteRecord(id);
      
      if (!success) {
        // Re-add the row if deletion fails
        setRows(prevRows => {
          const restoredRows = [...prevRows, rowToDelete];
          return updateRowNumbers(restoredRows);
        });
        alert('❌ Failed to delete record from cloud. The record has been restored locally. Please try again.');
      }
    } catch (error) {
      // Re-add the row on error
      setRows(prevRows => {
        const restoredRows = [...prevRows, rowToDelete];
        return updateRowNumbers(restoredRows);
      });
      alert(`❌ Error deleting record: ${error.message || 'Unknown error'}. The record has been restored locally.`);
    }
  };

  // Delete row function - opens confirmation modal
  const deleteRow = (id) => {
    const rowToDelete = rows.find(row => row._id === id);
    
    if (!rowToDelete) {
      alert('❌ Record not found. Please refresh and try again.');
      return;
    }
    
    setPendingDeleteId(id);
    setConfirmModalOpen(true);
  };

  // Handle row click to select
  const handleRowClick = (id) => {
    setSelectedRowId(id === selectedRowId ? null : id);
  };

  // Render Date & Time display cell
  const renderDateTimeDisplay = (row) => {
    const given = row.givenDate && row.givenTime ? `${row.givenDate} ${formatTime(row.givenTime)}` : '-';
    const target = row.targetDate && row.targetTime ? `${row.targetDate} ${formatTime(row.targetTime)}` : '-';
    const submitted = row.submittedDate && row.submittedTime ? `${row.submittedDate} ${formatTime(row.submittedTime)}` : '-';

    const hasGiven = given !== '-';
    const hasTarget = target !== '-';
    const hasSubmitted = submitted !== '-';

    return (
      <div className="date-time-display">
        <div className={`date-time-row-display ${hasGiven ? 'has-value' : ''}`}>
          <ClockIcon className="date-time-icon given-icon" />
          <span className="date-label-display given-label">GIVEN</span>
          <span className={`date-value-display ${hasGiven ? 'filled' : 'empty'}`}>
            {given}
          </span>
          {hasGiven && <CheckCircleIcon className="date-status-icon" />}
        </div>
        <div className={`date-time-row-display ${hasTarget ? 'has-value' : ''}`}>
          <ArrowTrendingUpIcon className="date-time-icon target-icon" />
          <span className="date-label-display target-label">TARGET</span>
          <span className={`date-value-display ${hasTarget ? 'filled' : 'empty'}`}>
            {target}
          </span>
          {hasTarget && <CheckCircleIcon className="date-status-icon" />}
        </div>
        <div className={`date-time-row-display ${hasSubmitted ? 'has-value' : ''}`}>
          <CheckCircleIcon className="date-time-icon submitted-icon" />
          <span className="date-label-display submitted-label">SUBMITTED</span>
          <span className={`date-value-display ${hasSubmitted ? 'filled' : 'empty'}`}>
            {submitted}
          </span>
          {hasSubmitted && <CheckCircleIcon className="date-status-icon submitted-status" />}
        </div>
      </div>
    );
  };

  // Render display cell (read-only)
  const renderDisplayCell = (value) => {
    return (
      <span className="display-cell">
        {value || '-'}
      </span>
    );
  };

  // Render score cell with special styling
  const renderScoreCell = (score) => {
    const scoreValue = score || '-';
    const scoreClass = score === '5' ? 'score-high' : score === '4' ? 'score-medium' : 'score-empty';
    
    return (
      <span className={`score-cell ${scoreClass}`}>
        {scoreValue}
      </span>
    );
  };

  // Modal close
  const closeModal = () => {
    setModalOpen(false);
    setModalRowId(null);
    setModalData({});
    setIsAddMode(false);
  };

  // Save modal data (for both add and edit) - NOW SAVES INSTANTLY
  const saveModalData = async () => {
    setIsSaving(true);
    
    try {
      if (isAddMode) {
        // Add new row with modal data - generate UUID
        const newUuid = crypto.randomUUID();
        const newRow = {
          id: newUuid,
          no: String(rows.length + 1),
          ...modalData,
          _id: undefined
        };
        
        // Add to local state immediately
        setRows(prevRows => [...prevRows, newRow]);
        
        // Save to Supabase immediately
        try {
          // Prepare data for saving - remove the _id if it's undefined
          const rowToSave = { ...newRow };
          delete rowToSave._id;
          
          const savedRow = await saveRecords([rowToSave]);
          if (savedRow && savedRow.length > 0) {
            // Update the row with the returned _id from database
            setRows(prevRows => 
              prevRows.map(row => 
                row.id === newUuid 
                  ? { ...row, _id: savedRow[0]._id } 
                  : row
              )
            );
          }
        } catch (error) {
          alert('❌ Failed to save record to cloud. The record is saved locally and will sync later.');
        }
      } else {
        // Update existing row - PRESERVE the _id
        const updatedRows = rows.map(row => {
          if (row.id === modalRowId) {
            // Keep the _id from the original row
            return { 
              ...modalData, 
              _id: row._id,  // Preserve the database ID
              id: row.id     // Preserve the UUID ID
            };
          }
          return row;
        });
        const renumberedRows = updateRowNumbers(updatedRows);
        setRows(renumberedRows);
        
        // Save updated record to Supabase immediately
        try {
          const updatedRow = renumberedRows.find(row => row.id === modalRowId);
          if (updatedRow && updatedRow._id) {
            await saveRecords([updatedRow]);
          }
        } catch (error) {
          alert('❌ Failed to save updated record to cloud. The record is saved locally and will sync later.');
        }
      }
    } finally {
      setIsSaving(false);
    }
    
    closeModal();
  };

  // Update modal data
  const updateModalData = (field, value) => {
    const newData = { ...modalData, [field]: value };
    setModalData(newData);
  };

  // Open add modal
  const openAddModal = () => {
    setIsAddMode(true);
    setModalData({
      givenDate: '',
      givenTime: '',
      targetDate: '',
      targetTime: '',
      submittedDate: '',
      submittedTime: '',
      score: '',
      caseType: '',
      whatKind: '',
      quantity: '',
      rdoNo: '',
      adAssignedControlNumber: '',
      tin: '',
      taxpayer: ''
    });
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (row) => {
    setIsAddMode(false);
    setModalData({ ...row });
    setModalRowId(row.id);
    setModalOpen(true);
  };

  // Render professional confirmation modal
  const renderConfirmModal = () => {
    if (!confirmModalOpen || !pendingDeleteId) return null;
    
    const rowToDelete = rows.find(row => row._id === pendingDeleteId || row.id === pendingDeleteId);
    if (!rowToDelete) return null;

    return (
      <div className="modal-overlay" onClick={() => {
        setConfirmModalOpen(false);
        setPendingDeleteId(null);
      }}>
        <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header confirm-header">
            <div className="modal-header-left">
              <div className="modal-header-icon confirm-icon">
                <TrashIcon className="modal-header-icon-svg" />
              </div>
              <div>
                <h2 className="modal-title confirm-title">Delete Record</h2>
                <p className="modal-subtitle">This action cannot be undone</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={() => {
              setConfirmModalOpen(false);
              setPendingDeleteId(null);
            }}>
              <XCircleIcon className="modal-close-icon" />
            </button>
          </div>

          <div className="modal-body confirm-body">
            <div className="confirm-warning">
              <div className="confirm-warning-icon">⚠️</div>
              <p className="confirm-warning-text">
                You are about to permanently delete <strong>Record #{rowToDelete.no}</strong>
              </p>
            </div>

            <div className="confirm-details">
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Case Type</span>
                <span className="confirm-detail-value">{rowToDelete.caseType || '—'}</span>
              </div>
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Taxpayer</span>
                <span className="confirm-detail-value">{rowToDelete.taxpayer || '—'}</span>
              </div>
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Given Date</span>
                <span className="confirm-detail-value">{rowToDelete.givenDate || '—'}</span>
              </div>
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Target Date</span>
                <span className="confirm-detail-value">{rowToDelete.targetDate || '—'}</span>
              </div>
            </div>

            <div className="confirm-note">
              <p>This record will be permanently removed from both your local storage and the cloud. Are you sure you want to continue?</p>
            </div>
          </div>

          <div className="modal-footer confirm-footer">
            <button 
              className="modal-btn modal-btn-cancel" 
              onClick={() => {
                setConfirmModalOpen(false);
                setPendingDeleteId(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="modal-btn modal-btn-delete-confirm" 
              onClick={() => {
                const idToDelete = pendingDeleteId;
                setConfirmModalOpen(false);
                setPendingDeleteId(null);
                executeDelete(idToDelete);
              }}
            >
              <TrashIcon className="modal-btn-icon" />
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render modal
  const renderModal = () => {
    if (!modalOpen) {
      return null;
    }

    const modalTitle = isAddMode ? 'Add New Record' : `Edit Record #${modalData.no}`;
    const modalSubtitle = isAddMode 
      ? 'Fill in all the details for the new record (Score will be auto-calculated)' 
      : 'Update all fields including date, time and case details (Score will be auto-calculated)';

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-left">
              <div className="modal-header-icon">
                {isAddMode ? (
                  <PlusIcon className="modal-header-icon-svg" />
                ) : (
                  <PencilSquareIcon className="modal-header-icon-svg" />
                )}
              </div>
              <div>
                <h2 className="modal-title">{modalTitle}</h2>
                <p className="modal-subtitle">{modalSubtitle}</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>
              <XCircleIcon className="modal-close-icon" />
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <h3 className="modal-section-title">
                <CalendarIcon className="modal-section-icon" />
                Date & Time Details
              </h3>
              <div className="modal-section-content">
                <div className="modal-field-group">
                  <label className="modal-label">
                    <span className="modal-label-badge given-badge">G</span>
                    GIVEN <span className="required-field">*</span>
                  </label>
                  <div className="modal-date-time-group">
                    <input
                      type="date"
                      className="modal-input modal-date-input"
                      value={modalData.givenDate || ''}
                      onChange={(e) => updateModalData('givenDate', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      className="modal-input modal-time-input"
                      value={modalData.givenTime || ''}
                      onChange={(e) => updateModalData('givenTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <span className="modal-label-badge target-badge">T</span>
                    TARGET <span className="required-field">*</span>
                  </label>
                  <div className="modal-date-time-group">
                    <input
                      type="date"
                      className="modal-input modal-date-input"
                      value={modalData.targetDate || ''}
                      onChange={(e) => updateModalData('targetDate', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      className="modal-input modal-time-input"
                      value={modalData.targetTime || ''}
                      onChange={(e) => updateModalData('targetTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <span className="modal-label-badge submitted-badge">S</span>
                    SUBMITTED <span className="required-field">*</span>
                  </label>
                  <div className="modal-date-time-group">
                    <input
                      type="date"
                      className="modal-input modal-date-input"
                      value={modalData.submittedDate || ''}
                      onChange={(e) => updateModalData('submittedDate', e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      className="modal-input modal-time-input"
                      value={modalData.submittedTime || ''}
                      onChange={(e) => updateModalData('submittedTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field-group score-preview">
                  <label className="modal-label">
                    <ChartBarIcon className="modal-label-icon" />
                    SCORE (Auto-calculated)
                  </label>
                  <div className="score-preview-box">
                    {modalData.givenDate && modalData.givenTime && modalData.targetDate && modalData.targetTime && modalData.submittedDate && modalData.submittedTime ? (
                      (() => {
                        const result = calculateScore(
                          modalData.givenDate, modalData.givenTime,
                          modalData.targetDate, modalData.targetTime,
                          modalData.submittedDate, modalData.submittedTime
                        );
                        return (
                          <div className="score-preview-result">
                            <span className={`score-preview-value ${result.score === 5 ? 'score-5' : result.score === 4 ? 'score-4' : ''}`}>
                              {result.score !== null ? result.score : '?'}
                            </span>
                            <span className="score-preview-message">{result.message || ''}</span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="score-preview-placeholder">Fill in all date/time fields to calculate score</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">
                <DocumentTextIcon className="modal-section-icon" />
                Case Details
              </h3>
              <div className="modal-section-content two-column">
                <div className="modal-field-group">
                  <label className="modal-label">
                    <TagIcon className="modal-label-icon" />
                    CASE TYPE
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.caseType || ''}
                    onChange={(e) => updateModalData('caseType', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <BuildingOfficeIcon className="modal-label-icon" />
                    WHAT KIND?
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.whatKind || ''}
                    onChange={(e) => updateModalData('whatKind', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <ChartBarIcon className="modal-label-icon" />
                    QUANTITY
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.quantity || ''}
                    onChange={(e) => updateModalData('quantity', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <HashtagIcon className="modal-label-icon" />
                    RDO NO.
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.rdoNo || ''}
                    onChange={(e) => updateModalData('rdoNo', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <IdentificationIcon className="modal-label-icon" />
                    AD ASSIGNED CONTROL NUMBER
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.adAssignedControlNumber || ''}
                    onChange={(e) => updateModalData('adAssignedControlNumber', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <UserIcon className="modal-label-icon" />
                    TIN
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.tin || ''}
                    onChange={(e) => updateModalData('tin', e.target.value)}
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">
                    <UserIcon className="modal-label-icon" />
                    TAXPAYER
                  </label>
                  <input
                    type="text"
                    className="modal-input modal-full-input"
                    value={modalData.taxpayer || ''}
                    onChange={(e) => updateModalData('taxpayer', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={closeModal}>
              Cancel
            </button>
            <button 
              className="modal-btn modal-btn-save" 
              onClick={saveModalData}
              disabled={isSaving}
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckIcon className="modal-btn-icon" />
                  {isAddMode ? 'Add Record' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while initializing
  if (isLoading && !isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your encrypted data...</p>
      </div>
    );
  }

  return (
    <div className="onnet-tracker-container">
      <div className="tracker-header">
        <div className="header-left">
          <div className="header-badge">PREMIUM</div>
          <h1 className="tracker-title">ONNET/eLA Docket TRACKER</h1>
          <p className="tracker-subtitle">Track and manage ONNET and eLA submissions with precision</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="export-btn-premium" onClick={exportToExcel}>
              <ArrowDownTrayIcon className="btn-icon-premium" />
              Export Excel
            </button>
            <button className="add-row-btn-premium" onClick={openAddModal}>
              <PlusIcon className="btn-icon-premium" />
              Add Record
            </button>
          </div>
          <div className="mini-dashboard-premium">
            <div className="dashboard-title-premium">Dashboard</div>
            <div className="dashboard-stats">
              <div className="stat-item">
                <span className="stat-label">ONNET</span>
                <span className="stat-value">{onnetTotal}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">eLA</span>
                <span className="stat-value">{elaTotal}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item total">
                <span className="stat-label">TOTAL</span>
                <span className="stat-value">{onnetTotal + elaTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-left">
          <FunnelIcon className="filters-icon" />
          <span className="filters-label">Filters</span>
          
          <div className="filter-group">
            <select 
              className="filter-select" 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(2000, parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select" 
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="">All Days</option>
              {uniqueDays.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <XIcon className="clear-filters-icon" />
              Clear Filters
            </button>
          )}
        </div>
        
        <div className="filters-right">
          <span className="filter-result-count">
            {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'} found
          </span>
          <span className="sync-status">
            <span className={`status-dot ${syncStatus.includes('Synced') ? 'status-success' : syncStatus.includes('Failed') ? 'status-error' : 'status-idle'}`}></span>
            <span className="status-text">{syncStatus || 'Ready'}</span>
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="tracker-table">
          <thead>
            <tr>
              <th className="col-header">NO.</th>
              <th className="col-header">DATE &amp; TIME</th>
              <th className="col-header">SCORE</th>
              <th className="col-header">CASE TYPE</th>
              <th className="col-header">WHAT KIND?</th>
              <th className="col-header">QTY</th>
              <th className="col-header">RDO</th>
              <th className="col-header">AD ASSIGNED</th>
              <th className="col-header">TIN</th>
              <th className="col-header">TAXPAYER</th>
              <th className="col-header">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-state">
                  <div className="empty-state-content">
                    <DocumentTextIcon className="empty-state-icon" />
                    <p className="empty-state-text">No records found</p>
                    <p className="empty-state-subtext">Click "Add Record" to create your first entry</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const isSelected = selectedRowId === row.id;
                const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
                
                return (
                  <tr 
                    key={row.id || row._id} 
                    className={`tracker-row ${rowClass} ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => handleRowClick(row.id)}
                  >
                    <td className="col-no">
                      <span className="record-number">{row.no}</span>
                    </td>
                    <td className="date-time-cell-display">
                      {renderDateTimeDisplay(row)}
                    </td>
                    <td>{renderScoreCell(row.score)}</td>
                    <td>{renderDisplayCell(row.caseType)}</td>
                    <td>{renderDisplayCell(row.whatKind)}</td>
                    <td>{renderDisplayCell(row.quantity)}</td>
                    <td>{renderDisplayCell(row.rdoNo)}</td>
                    <td>{renderDisplayCell(row.adAssignedControlNumber)}</td>
                    <td>{renderDisplayCell(row.tin)}</td>
                    <td>{renderDisplayCell(row.taxpayer)}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="action-group">
                        <button 
                          className="action-btn action-btn-edit" 
                          onClick={() => openEditModal(row)}
                          title="Edit Record"
                        >
                          <PencilSquareIcon className="action-icon" />
                        </button>
                        <button 
                          className="action-btn action-btn-delete" 
                          onClick={() => {
                            if (row._id) {
                              deleteRow(row._id);
                            } else {
                              alert('❌ Cannot delete: Row has no ID');
                            }
                          }} 
                          title="Delete Row"
                        >
                          <TrashIcon className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {renderModal()}
      {renderConfirmModal()}

      <div className="tracker-footer">
        <div className="footer-info">
          <span className="footer-record-count">{filteredRows.length}</span>
          <span className="footer-record-label">Total Records</span>
        </div>
        <div className="legend-section">
          <span className="legend-title">Legend:</span>
          <div className="legend-items">
            <span className="legend-item legend-item-onnet">ONNET</span>
            <span className="legend-item">TIN</span>
            <span className="legend-item">Taxpayer</span>
            <span className="legend-item">TOTALS</span>
            <span className="legend-item">AD Assigned</span>
            <span className="legend-item">Sample Data</span>
          </div>
        </div>
      </div>

      <style>
        {`
        .onnet-tracker-container {
          background: var(--card-bg);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .header-left {
          flex: 1;
        }

        .header-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-size: 0.55rem;
          font-weight: 700;
          padding: 0.15rem 0.6rem;
          border-radius: 2rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .tracker-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .tracker-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
          font-weight: 400;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .export-btn-premium {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .export-btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .add-row-btn-premium {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .add-row-btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-icon-premium {
          width: 1.1rem;
          height: 1.1rem;
        }

        .mini-dashboard-premium {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          min-width: 180px;
        }

        .dashboard-title-premium {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.3rem;
        }

        .dashboard-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-item.total .stat-value {
          color: var(--gradient-start);
        }

        .stat-label {
          font-size: 0.55rem;
          color: var(--text-tertiary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-divider {
          width: 1px;
          height: 24px;
          background: var(--border-color);
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .filters-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filters-icon {
          width: 1rem;
          height: 1rem;
          color: var(--text-tertiary);
        }

        .filters-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-right: 0.5rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
        }

        .filter-select {
          padding: 0.3rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
          min-width: 100px;
        }

        .filter-select:hover {
          border-color: var(--text-tertiary);
        }

        .filter-select:focus {
          border-color: var(--gradient-start);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          font-size: 0.7rem;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-btn:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .clear-filters-icon {
          width: 0.8rem;
          height: 0.8rem;
        }

        .filters-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .filter-result-count {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-success {
          background: #10b981;
        }

        .status-error {
          background: #ef4444;
        }

        .status-idle {
          background: #6b7280;
        }

        .status-text {
          color: var(--text-secondary);
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
        }

        .tracker-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          min-width: 1100px;
        }

        .tracker-table thead {
          background: var(--bg-secondary);
        }

        .col-header {
          padding: 0.75rem 0.5rem;
          text-align: center;
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          z-index: 10;
          border-bottom: 2px solid var(--border-color);
        }

        .tracker-table td {
          padding: 0.4rem 0.3rem;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
          text-align: center;
          transition: background 0.2s;
          cursor: pointer;
        }

        .tracker-row {
          transition: all 0.2s;
        }

        .tracker-row:hover td {
          background: var(--hover-bg);
        }

        .tracker-row:hover .record-number {
          color: var(--gradient-start);
        }

        .row-even {
          background-color: #ffffff;
        }

        .row-odd {
          background-color: #f0f4ff;
        }

        .row-odd:hover td {
          background-color: #e3ebff;
        }

        .row-selected td {
          background-color: #dbeafe !important;
          border-bottom-color: #93c5fd;
        }

        .row-selected.row-odd td {
          background-color: #dbeafe !important;
        }

        .row-selected .record-number {
          color: #2563eb !important;
          font-weight: 800;
        }

        .col-no {
          font-weight: 700;
          font-size: 0.85rem;
          width: 40px;
        }

        .record-number {
          display: inline-block;
          padding: 0.2rem 0.4rem;
          border-radius: 0.4rem;
          font-weight: 700;
          color: var(--text-secondary);
          transition: color 0.2s;
        }

        .empty-state {
          padding: 3rem 1rem !important;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .empty-state-icon {
          width: 3rem;
          height: 3rem;
          color: var(--text-tertiary);
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .empty-state-subtext {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .date-time-cell-display {
          min-width: 300px;
          padding: 0.25rem 0.5rem !important;
        }

        .date-time-display {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          text-align: left;
        }

        .date-time-row-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.15rem 0.4rem;
          border-radius: 0.4rem;
          transition: all 0.15s;
          border-left: 3px solid transparent;
        }

        .date-time-row-display.has-value {
          background: rgba(255, 255, 255, 0.03);
        }

        .date-time-row-display.has-value .date-label-display {
          font-weight: 700;
        }

        .date-time-row-display:hover {
          background: var(--hover-bg);
        }

        .date-time-icon {
          width: 0.8rem;
          height: 0.8rem;
          flex-shrink: 0;
        }

        .given-icon { color: #3b82f6; }
        .target-icon { color: #f59e0b; }
        .submitted-icon { color: #10b981; }

        .date-label-display {
          font-weight: 600;
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          min-width: 60px;
          flex-shrink: 0;
          transition: font-weight 0.15s;
        }

        .given-label { color: #3b82f6; }
        .target-label { color: #f59e0b; }
        .submitted-label { color: #10b981; }

        .date-value-display {
          font-size: 0.7rem;
          font-family: 'SF Mono', 'Menlo', monospace;
          flex: 1;
          padding: 0.05rem 0.2rem;
          border-radius: 0.2rem;
        }

        .date-value-display.filled {
          color: var(--text-primary);
        }

        .date-value-display.empty {
          color: var(--text-tertiary);
          opacity: 0.4;
          font-style: italic;
        }

        .date-status-icon {
          width: 0.7rem;
          height: 0.7rem;
          color: #10b981;
          flex-shrink: 0;
          opacity: 0.6;
        }

        .date-status-icon.submitted-status {
          opacity: 1;
        }

        .score-cell {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 700;
          min-width: 30px;
        }

        .score-high {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .score-medium {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .score-empty {
          background: rgba(107, 114, 128, 0.1);
          color: var(--text-tertiary);
        }

        .display-cell {
          display: inline-block;
          padding: 0.2rem 0.3rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-primary);
          border-radius: 0.3rem;
          min-width: 30px;
        }

        .display-cell:empty::before {
          content: '-';
          color: var(--text-tertiary);
          opacity: 0.4;
        }

        .col-actions {
          min-width: 70px;
          position: sticky;
          right: 0;
          background: inherit;
          z-index: 5;
          border-left: 2px solid var(--border-color);
          pointer-events: auto;
        }

        .row-even .col-actions {
          background: #ffffff;
        }

        .row-odd .col-actions {
          background: #f0f4ff;
        }

        .row-selected .col-actions {
          background: #dbeafe !important;
        }

        .action-group {
          display: flex;
          gap: 0.2rem;
          justify-content: center;
          align-items: center;
        }

        .action-btn {
          padding: 0.3rem;
          border: none;
          border-radius: 0.4rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }

        .action-btn:hover {
          transform: scale(1.1);
          background: rgba(0, 0, 0, 0.04);
        }

        .action-icon {
          width: 0.9rem;
          height: 0.9rem;
        }

        .action-btn-edit .action-icon {
          color: #8b5cf6;
        }
        .action-btn-edit:hover {
          background: rgba(139, 92, 246, 0.08);
        }

        .action-btn-delete .action-icon {
          color: #ef4444;
        }
        .action-btn-delete:hover {
          background: rgba(239, 68, 68, 0.08);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 1.5rem;
          max-width: 700px;
          width: 92%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          animation: slideUp 0.3s ease;
          position: relative;
          z-index: 10000;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-header-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(102, 126, 234, 0.15));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-header-icon-svg {
          width: 1.3rem;
          height: 1.3rem;
          color: #8b5cf6;
        }

        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0.1rem 0 0 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-tertiary);
          transition: color 0.2s;
        }

        .modal-close-btn:hover {
          color: var(--text-primary);
        }

        .modal-close-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .modal-body {
          padding: 1.75rem;
          overflow-y: auto;
          max-height: calc(90vh - 160px);
        }

        .modal-section {
          margin-bottom: 1.75rem;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-section-icon {
          width: 1rem;
          height: 1rem;
          color: var(--gradient-start);
        }

        .modal-section-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .modal-section-content.two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .modal-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .modal-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .modal-label-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.2rem;
          height: 1.2rem;
          border-radius: 0.3rem;
          font-size: 0.6rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .given-badge { background: #3b82f6; }
        .target-badge { background: #f59e0b; }
        .submitted-badge { background: #10b981; }

        .modal-label-icon {
          width: 0.85rem;
          height: 0.85rem;
          color: var(--text-tertiary);
        }

        .modal-date-time-group {
          display: flex;
          gap: 0.5rem;
        }

        .modal-input {
          padding: 0.5rem 0.7rem;
          border: 1.5px solid var(--border-color);
          border-radius: 0.6rem;
          font-size: 0.85rem;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: all 0.2s;
          outline: none;
          width: 100%;
        }

        .modal-input:focus {
          border-color: var(--gradient-start);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-input:hover {
          border-color: var(--text-tertiary);
        }

        .modal-date-input {
          flex: 2;
        }

        .modal-time-input {
          flex: 1;
        }

        .modal-full-input {
          width: 100%;
        }

        .required-field {
          color: #ef4444;
          font-weight: 700;
          margin-left: 0.2rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.75rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .modal-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.5rem;
          border: none;
          border-radius: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn:hover {
          transform: translateY(-1px);
        }

        .modal-btn-cancel {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1.5px solid var(--border-color);
        }

        .modal-btn-cancel:hover {
          background: var(--hover-bg);
        }

        .modal-btn-save {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .modal-btn-save:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .modal-btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-btn-icon {
          width: 1rem;
          height: 1rem;
        }

        .score-preview {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--border-color);
        }

        .score-preview-box {
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          min-height: 60px;
          display: flex;
          align-items: center;
        }

        .score-preview-result {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }

        .score-preview-value {
          font-size: 2rem;
          font-weight: 800;
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          min-width: 50px;
          text-align: center;
        }

        .score-preview-value.score-5 {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .score-preview-value.score-4 {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .score-preview-message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          flex: 1;
        }

        .score-preview-placeholder {
          color: var(--text-tertiary);
          font-size: 0.8rem;
          font-style: italic;
        }

        /* Confirm Modal Styles */
        .confirm-modal {
          max-width: 480px;
        }

        .confirm-header {
          border-bottom-color: #fca5a5 !important;
          background: linear-gradient(135deg, #fef2f2, #fee2e2) !important;
        }

        .confirm-icon {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15)) !important;
        }

        .confirm-icon .modal-header-icon-svg {
          color: #ef4444 !important;
        }

        .confirm-title {
          color: #dc2626 !important;
        }

        .confirm-body {
          padding: 1.5rem 1.75rem !important;
        }

        .confirm-warning {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border-radius: 0.75rem;
          border: 1px solid #fca5a5;
          margin-bottom: 1.25rem;
        }

        .confirm-warning-icon {
          font-size: 1.75rem;
        }

        .confirm-warning-text {
          font-size: 0.95rem;
          color: #991b1b;
          margin: 0;
        }

        .confirm-warning-text strong {
          color: #dc2626;
        }

        .confirm-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .confirm-detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .confirm-detail-label {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .confirm-detail-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .confirm-note {
          padding: 0.75rem;
          background: #fefce8;
          border-radius: 0.5rem;
          border: 1px solid #fde68a;
        }

        .confirm-note p {
          font-size: 0.8rem;
          color: #78350f;
          margin: 0;
          line-height: 1.5;
        }

        .confirm-footer {
          border-top-color: #fca5a5 !important;
          background: #fef2f2 !important;
        }

        .modal-btn-delete-confirm {
          background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
        }

        .modal-btn-delete-confirm:hover {
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4) !important;
          transform: translateY(-2px);
        }

        .tracker-footer {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-record-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gradient-start);
        }

        .footer-record-label {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .legend-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .legend-title {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .legend-items {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .legend-item {
          padding: 0.2rem 0.7rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 2rem;
          font-size: 0.65rem;
          color: var(--text-secondary);
          white-space: nowrap;
          font-weight: 500;
        }

        .legend-item-onnet {
          background: rgba(59, 130, 246, 0.08);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.2);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--gradient-start);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .onnet-tracker-container {
            padding: 1rem;
            border-radius: 1rem;
          }

          .tracker-header {
            flex-direction: column;
            align-items: stretch;
          }

          .tracker-title {
            font-size: 1.35rem;
          }

          .header-right {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .export-btn-premium,
          .add-row-btn-premium {
            justify-content: center;
            width: 100%;
          }

          .mini-dashboard-premium {
            width: 100%;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filters-left {
            flex-wrap: wrap;
          }

          .filter-select {
            min-width: 80px;
            flex: 1;
          }

          .filters-right {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .modal-content {
            width: 95%;
            max-width: 95%;
          }

          .modal-section-content.two-column {
            grid-template-columns: 1fr;
          }

          .modal-date-time-group {
            flex-direction: column;
          }

          .modal-body {
            padding: 1rem;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-footer {
            padding: 1rem;
          }

          .legend-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .dashboard-stats {
            flex-wrap: wrap;
          }

          .date-time-cell-display {
            min-width: 200px;
          }

          .date-time-row-display {
            flex-wrap: wrap;
            gap: 0.25rem;
          }

          .date-label-display {
            min-width: 45px;
            font-size: 0.5rem;
          }

          .date-value-display {
            font-size: 0.6rem;
          }

          .score-preview-result {
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }

          .score-preview-message {
            text-align: center;
          }

          .confirm-details {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .tracker-title {
            font-size: 1.1rem;
          }

          .date-time-cell-display {
            min-width: 160px;
          }

          .date-value-display {
            font-size: 0.55rem;
          }

          .date-label-display {
            font-size: 0.45rem;
            min-width: 35px;
          }

          .confirm-warning {
            flex-direction: column;
            text-align: center;
          }

          .confirm-warning-text {
            font-size: 0.85rem;
          }
        }
      `}
      </style>
    </div>
  );
};

export default ONNETeLATracker;