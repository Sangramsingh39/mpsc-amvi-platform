import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Upload, Trash2, Edit3, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export default function AdminPanel({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'questions' | 'import'
  const [settings, setSettings] = useState({
    default_negative_marking: '0.25',
    default_test_duration: '45',
    enable_marathi: 'true'
  });
  const [saveStatus, setSaveStatus] = useState('');

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  // New Question Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQ, setNewQ] = useState({
    test_id: 1,
    question_no: 1,
    section: 'POLITY_ECONOMICS_SCIENCE',
    subject: 'Polity',
    topic: 'Fundamental Rights',
    difficulty: 'Easy',
    question_en: '',
    question_mr: '',
    option_a_en: '',
    option_b_en: '',
    option_c_en: '',
    option_d_en: '',
    correct_answer: 'A',
    explanation_en: '',
    source: 'Official MPSC Reference'
  });

  useEffect(() => {
    fetchSettings();
    fetchQuestions();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const query = new URLSearchParams();
      if (subjectFilter) query.append('subject', subjectFilter);
      if (search) query.append('search', search);
      const res = await fetch(`/api/admin/questions?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('Settings updated successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed })
      });
      const data = await res.json();
      setImportStatus(data);
      if (data.success) {
        fetchQuestions();
      }
    } catch (err) {
      setImportStatus({ success: false, error: 'Invalid JSON format' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-3xl border border-borderSoft shadow-xs flex justify-between items-center">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Dashboard
          </button>
          <h1 className="text-2xl font-bold text-dark">MPSC AMVI Admin & Content Portal</h1>
        </div>

        <div className="flex items-center gap-2">
          {['settings', 'questions', 'import'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition ${
                activeTab === tab ? 'bg-primary text-white' : 'bg-slate-100 text-dark-secondary hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Global Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl border border-borderSoft shadow-xs space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-dark border-b border-slate-100 pb-3">Test Series Global Configuration</h2>

          {saveStatus && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {saveStatus}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-dark mb-1">Negative Marking Value per Wrong Answer</label>
              <select
                value={settings.default_negative_marking}
                onChange={(e) => setSettings({ ...settings, default_negative_marking: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="0.25">0.25 Marks (Standard 1/4th Deduction)</option>
                <option value="0.33">0.33 Marks (1/3rd Deduction)</option>
                <option value="0.0">No Negative Marking</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-dark mb-1">Default Test Duration (Minutes)</label>
              <input
                type="number"
                value={settings.default_test_duration}
                onChange={(e) => setSettings({ ...settings, default_test_duration: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-dark mb-1">Enable Marathi Translation Engine</label>
              <select
                value={settings.enable_marathi}
                onChange={(e) => setSettings({ ...settings, enable_marathi: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="true">Enabled (Bilingual English + Marathi)</option>
                <option value="false">Disabled (English Only)</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 bg-primary text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* 2. Questions Database Management Tab */}
      {activeTab === 'questions' && (
        <div className="bg-white p-6 rounded-3xl border border-borderSoft shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search question text or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                onClick={fetchQuestions}
                className="px-4 py-2 bg-slate-100 text-dark text-xs font-semibold rounded-xl"
              >
                Search
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Single Question
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-dark-secondary">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Test #</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Question Text</th>
                  <th className="p-3">Correct</th>
                  <th className="p-3">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-400">#{q.id}</td>
                    <td className="p-3 font-bold text-primary">Test {q.test_id}</td>
                    <td className="p-3 font-semibold">{q.subject}</td>
                    <td className="p-3 max-w-xs truncate font-medium">{q.question_en}</td>
                    <td className="p-3 font-bold text-success">{q.correct_answer}</td>
                    <td className="p-3">{q.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. JSON/CSV Bulk Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white p-8 rounded-3xl border border-borderSoft shadow-xs space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold text-dark border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Bulk Question Import Engine
          </h2>

          <p className="text-xs text-dark-secondary">
            Paste JSON or CSV structured questions. The engine will automatically validate options, correct answer keys, and filter duplicates.
          </p>

          {importStatus && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.success ? 'bg-success-light text-success' : 'bg-error-light text-error'
            }`}>
              {importStatus.success ? (
                <span>✅ Inserted {importStatus.inserted} Questions ({importStatus.duplicates} duplicates skipped)</span>
              ) : (
                <span>❌ Error: {importStatus.error}</span>
              )}
            </div>
          )}

          <textarea
            rows={10}
            placeholder={`[
  {
    "test_id": 1,
    "question_no": 1,
    "section": "POLITY_ECONOMICS_SCIENCE",
    "subject": "Polity",
    "topic": "Constitution",
    "difficulty": "Easy",
    "question_en": "Sample question...",
    "option_a_en": "Opt A",
    "option_b_en": "Opt B",
    "option_c_en": "Opt C",
    "option_d_en": "Opt D",
    "correct_answer": "A",
    "explanation_en": "Sample explanation..."
  }
]`}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-2xl border border-slate-700 focus:outline-none"
          />

          <button
            onClick={handleBulkImport}
            className="px-6 py-3 bg-primary text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Validate & Import JSON Batch
          </button>
        </div>
      )}

      {/* Add Single Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-dark/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateQuestion} className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-borderSoft text-xs">
            <h3 className="text-base font-bold text-dark border-b pb-2">Add New Question</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold">Test Number (1-100)</label>
                <input
                  type="number"
                  value={newQ.test_id}
                  onChange={(e) => setNewQ({ ...newQ, test_id: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="font-bold">Subject</label>
                <select
                  value={newQ.subject}
                  onChange={(e) => setNewQ({ ...newQ, subject: e.target.value })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  <option value="Polity">Polity</option>
                  <option value="Economics">Economics</option>
                  <option value="Science">Science</option>
                  <option value="Automobile">Automobile Engineering</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="MotorVehicleLaws">Motor Vehicle Laws</option>
                  <option value="Geography">Geography</option>
                  <option value="History">History</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="CurrentAffairs">Current Affairs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold">Question Text (English)</label>
              <textarea
                rows={2}
                value={newQ.question_en}
                onChange={(e) => setNewQ({ ...newQ, question_en: e.target.value })}
                className="w-full p-2 bg-slate-50 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Option A" value={newQ.option_a_en} onChange={(e) => setNewQ({ ...newQ, option_a_en: e.target.value })} className="p-2 border rounded-xl" required />
              <input type="text" placeholder="Option B" value={newQ.option_b_en} onChange={(e) => setNewQ({ ...newQ, option_b_en: e.target.value })} className="p-2 border rounded-xl" required />
              <input type="text" placeholder="Option C" value={newQ.option_c_en} onChange={(e) => setNewQ({ ...newQ, option_c_en: e.target.value })} className="p-2 border rounded-xl" required />
              <input type="text" placeholder="Option D" value={newQ.option_d_en} onChange={(e) => setNewQ({ ...newQ, option_d_en: e.target.value })} className="p-2 border rounded-xl" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold">Correct Answer</label>
                <select value={newQ.correct_answer} onChange={(e) => setNewQ({ ...newQ, correct_answer: e.target.value })} className="w-full p-2 border rounded-xl">
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div>
                <label className="font-bold">Difficulty</label>
                <select value={newQ.difficulty} onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })} className="w-full p-2 border rounded-xl">
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Hard">Hard</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold">Explanation</label>
              <textarea rows={2} value={newQ.explanation_en} onChange={(e) => setNewQ({ ...newQ, explanation_en: e.target.value })} className="w-full p-2 border rounded-xl" required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl">Save Question</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
