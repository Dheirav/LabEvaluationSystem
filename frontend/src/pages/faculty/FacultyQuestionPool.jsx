import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, InputAdornment, Menu
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const PAGE_SIZE = 10;

const FacultyQuestionPool = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseParams, setCourseParams] = useState({});
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addEditDialog, setAddEditDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', expectedAnswer: '', tags: [], details: {} });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Fetch courses with parameters
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/question-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
        setError('Failed to fetch courses');
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Fetch questions for selected course
  useEffect(() => {
    if (!selectedCourse) return;
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/faculty/questions?course=${selectedCourse}&search=${search}&page=${page}&limit=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } });
        setQuestions(res.data.questions || []);
        setTotalQuestions(res.data.total || 0);
      } catch {
        setQuestions([]);
        setError('Failed to fetch questions');
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [selectedCourse, search, page]);

  // Update courseParams when course changes
  useEffect(() => {
    const course = courses.find(c => c._id === selectedCourse);
    setCourseParams(course?.parameters || {});
  }, [selectedCourse, courses]);

  // Handlers
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setPage(1);
    setSearch('');
    setQuestions([]);
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({ title: '', description: '', expectedAnswer: '', tags: [], details: {} });
    setFormErrors({});
    setAddEditDialog(true);
  };

  const handleOpenEdit = (q) => {
    setEditMode(true);
    setEditingId(q._id);
    setFormData({
      title: q.title || '',
      description: q.description || '',
      expectedAnswer: q.expectedAnswer || '',
      tags: q.tags || [],
      details: q.details || {}
    });
    setFormErrors({});
    setAddEditDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/faculty/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setQuestions(qs => qs.filter(q => q._id !== id));
      setTotalQuestions(t => t - 1);
    } catch {
      setError('Failed to delete question');
    }
  };

  const handleFormChange = (field, value) => {
    if (field in formData) setFormData({ ...formData, [field]: value });
    else setFormData({ ...formData, details: { ...formData.details, [field]: value } });
  };

  const handleFormTagAdd = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      setFormData({ ...formData, tags: [...formData.tags, e.target.value] });
      e.target.value = '';
    }
  };
  const handleFormTagDelete = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title) errors.title = 'Title required';
    // Validate dynamic fields
    Object.entries(courseParams).forEach(([key, param]) => {
      if (param.required && !formData.details[key]) errors[key] = `${param.label || key} required`;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    try {
      const token = localStorage.getItem('token');
      if (editMode) {
        await axios.put(`/api/faculty/questions/${editingId}`, {
          ...formData,
          course: selectedCourse
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/faculty/questions', {
          ...formData,
          course: selectedCourse
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setAddEditDialog(false);
      setFormData({ title: '', description: '', expectedAnswer: '', tags: [], details: {} });
      setPage(1);
      // Refresh
      const res = await axios.get(`/api/faculty/questions?course=${selectedCourse}&search=${search}&page=1&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setQuestions(res.data.questions || []);
      setTotalQuestions(res.data.total || 0);
    } catch {
      setError('Failed to save question');
    }
  };

  // Export questions as JSON
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/faculty/questions/export${selectedCourse ? `?course=${selectedCourse}` : ''}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'questions_export.json';
      link.click();
    } catch {
      setError('Failed to export questions');
    }
  };

  // Export helpers for CSV, Excel, PDF
  const handleExportFormat = async (format) => {
    try {
      const token = localStorage.getItem('token');
      let url = `/api/faculty/questions/export/${format}`;
      if (selectedCourse) url += `?course=${selectedCourse}`;
      let filename = `questions_export.${format}`;
      let contentType = {
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf'
      }[format];
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: contentType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch {
      setError(`Failed to export questions as ${format.toUpperCase()}`);
    }
  };

  // Unified export handler
  const handleExportDropdownClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportDropdownClose = () => {
    setExportAnchorEl(null);
  };
  const handleExportFormatDropdown = async (format) => {
    setExporting(true);
    handleExportDropdownClose();
    try {
      const token = localStorage.getItem('token');
      let url, filename, contentType;
      if (format === 'json') {
        url = `/api/faculty/questions/export${selectedCourse ? `?course=${selectedCourse}` : ''}`;
        filename = 'questions_export.json';
        contentType = 'application/json';
      } else {
        url = `/api/faculty/questions/export/${format}`;
        if (selectedCourse) url += `?course=${selectedCourse}`;
        filename = `questions_export.${format}`;
        contentType = {
          csv: 'text/csv',
          excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          pdf: 'application/pdf'
        }[format];
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: contentType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch {
      setError(`Failed to export questions as ${format.toUpperCase()}`);
    }
    setExporting(false);
  };

  // Bulk import questions
  const handleImportFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportResult(null);
  };
  const handleImportSubmit = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem('token');
      const text = await importFile.text();
      const questions = JSON.parse(text);
      const res = await axios.post('/api/faculty/questions/bulk-import', { questions }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImportResult({ success: true, message: res.data.message, count: res.data.count });
      setImportFile(null);
      setAddEditDialog(false);
      setPage(1);
      // Refresh
      const qres = await axios.get(`/api/faculty/questions?course=${selectedCourse}&search=${search}&page=1&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setQuestions(qres.data.questions || []);
      setTotalQuestions(qres.data.total || 0);
    } catch (err) {
      setImportResult({ success: false, message: 'Import failed. Check file format.' });
    }
    setImporting(false);
  };

  // Render dynamic fields
  const renderDynamicFields = () => {
    return Object.entries(courseParams).map(([key, param]) => (
      <TextField
        key={key}
        label={param.label || key}
        value={formData.details[key] || ''}
        onChange={e => handleFormChange(key, e.target.value)}
        fullWidth
        margin="normal"
        required={param.required}
        error={!!formErrors[key]}
        helperText={formErrors[key]}
      />
    ));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      {/* <Header title="Faculty - Question Pool" /> */}
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">Question Pool</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="course-select-label">Select Course</InputLabel>
            <Select
              labelId="course-select-label"
              value={selectedCourse}
              label="Select Course"
              onChange={handleCourseChange}
            >
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>{course.name} ({course.code})</MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedCourse && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search questions..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                size="small"
                sx={{ width: 300 }}
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Question</Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                endIcon={<ArrowDropDownIcon />}
                onClick={handleExportDropdownClick}
                disabled={exporting}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={handleExportDropdownClose}
              >
                <MenuItem onClick={() => handleExportFormatDropdown('json')}>Export as JSON</MenuItem>
                <MenuItem onClick={() => handleExportFormatDropdown('csv')}>Export as CSV</MenuItem>
                <MenuItem onClick={() => handleExportFormatDropdown('excel')}>Export as Excel</MenuItem>
                <MenuItem onClick={() => handleExportFormatDropdown('pdf')}>Export as PDF</MenuItem>
              </Menu>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportDialog(true)}>Bulk Upload</Button>
            </Box>
          )}
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : selectedCourse ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No questions found.</TableCell></TableRow>
                  ) : questions.map(q => (
                    <TableRow key={q._id}>
                      <TableCell>{q.title}</TableCell>
                      <TableCell>{q.description}</TableCell>
                      <TableCell>{q.tags && q.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />)}</TableCell>
                      <TableCell>{new Date(q.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton onClick={() => handleOpenEdit(q)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton onClick={() => handleDelete(q._id)}><DeleteIcon /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>Select a course to view questions.</Typography>
          )}
          {/* Pagination */}
          {selectedCourse && totalQuestions > PAGE_SIZE && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Typography>Page {page} of {Math.ceil(totalQuestions / PAGE_SIZE)}</Typography>
              <Button disabled={page === Math.ceil(totalQuestions / PAGE_SIZE)} onClick={() => setPage(page + 1)}>Next</Button>
            </Box>
          )}
        </Paper>
      </Box>
      {/* Add/Edit Dialog */}
      <Dialog open={addEditDialog} onClose={() => setAddEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Question' : 'Add New Question'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={formData.title}
            onChange={e => handleFormChange('title', e.target.value)}
            margin="normal"
            required
            error={!!formErrors.title}
            helperText={formErrors.title}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => handleFormChange('description', e.target.value)}
            margin="normal"
          />
          <TextField
            label="Expected Answer"
            fullWidth
            multiline
            rows={2}
            value={formData.expectedAnswer}
            onChange={e => handleFormChange('expectedAnswer', e.target.value)}
            margin="normal"
          />
          {/* Tags */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {formData.tags.map(tag => (
              <Chip key={tag} label={tag} onDelete={() => handleFormTagDelete(tag)} />
            ))}
            <TextField
              label="Add tag"
              size="small"
              onKeyDown={handleFormTagAdd}
              sx={{ width: 120 }}
            />
          </Box>
          {/* Dynamic fields */}
          {renderDynamicFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEditDialog(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">{editMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      {/* Bulk Import Dialog */}
      <Dialog open={importDialog} onClose={() => { setImportDialog(false); setImportFile(null); setImportResult(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Bulk Upload Questions</DialogTitle>
        <DialogContent>
          <input type="file" accept="application/json" onChange={handleImportFileChange} />
          {importing && <Typography sx={{ mt: 2 }}>Importing...</Typography>}
          {importResult && (
            <Typography sx={{ mt: 2 }} color={importResult.success ? 'success.main' : 'error'}>
              {importResult.message} {importResult.count ? `(${importResult.count} questions)` : ''}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportDialog(false); setImportFile(null); setImportResult(null); }}>Cancel</Button>
          <Button onClick={handleImportSubmit} variant="contained" disabled={!importFile || importing}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyQuestionPool;
