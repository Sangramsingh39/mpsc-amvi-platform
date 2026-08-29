import React, { useState } from 'react';
import { Play, CheckCircle2, Award, Clock, BarChart3, Filter, Search, BookOpen } from 'lucide-react';

export default function TestDashboard({ tests, stats, onStartTest, onReviewAttempt, onOpenAdmin, lang, setLang }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTests = tests.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || `Test ${t.id}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'All') return true;
    if (filter === 'Completed') return t.attempts_count > 0;
    if (filter === 'Not Attempted') return t.attempts_count === 0;
    return t.difficulty.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Language Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-borderSoft">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full mb-2">
            MPSC AMVI Group-C Examination 2026
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark">
            {lang === 'EN' ? 'Online Mock Test Series Platform' : 'ऑनलाइन मॉक टेस्ट सिरीज प्लॅटफॉर्म'}
          </h1>
          <p className="text-dark-secondary text-sm mt-1">
            {lang === 'EN' 
              ? '100 Complete Mock Tests • 4,500+ Objective Questions • Instant Analysis & Detailed Review' 
              : '१०० संपूर्ण मोक चाचण्या • ४,५००+ प्रश्न • तात्काळ निकाल व स्पष्टीकरण'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'EN' ? 'MR' : 'EN')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-dark font-medium text-sm rounded-xl transition flex items-center gap-2 border border-slate-200"
          >
            🌐 {lang === 'EN' ? 'मराठी मध्ये पहा' : 'Switch to English'}
          </button>

          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 bg-dark hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition"
          >
            ⚙️ Admin Panel
          </button>
        </div>
      </div>

      {/* Progress & Overall Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-borderSoft flex items-center gap-4">
          <div className="p-3 bg-primary-light text-primary rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-dark">{stats?.total_attempts || 0} / 100</div>
            <div className="text-xs text-dark-secondary font-medium">Tests Attempted</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderSoft flex items-center gap-4">
          <div className="p-3 bg-success-light text-success rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-dark">
              {stats?.highest_score ? `${stats.highest_score.toFixed(1)} / 45` : '0 / 45'}
            </div>
            <div className="text-xs text-dark-secondary font-medium">Best Score</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderSoft flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-dark">
              {stats?.avg_accuracy ? `${stats.avg_accuracy.toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs text-dark-secondary font-medium">Average Accuracy</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderSoft flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-dark">45 Mins</div>
            <div className="text-xs text-dark-secondary font-medium">Standard Test Duration</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-borderSoft">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['All', 'Easy', 'Moderate', 'Hard', 'Advanced', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                filter === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 text-dark-secondary hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary" />
          <input
            type="text"
            placeholder="Search test name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* 100 Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => {
          const isCompleted = test.attempts_count > 0;
          return (
            <div
              key={test.id}
              className="test-card bg-white rounded-2xl p-6 border border-borderSoft flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-dark rounded-md">
                    Test #{test.id.toString().padStart(2, '0')}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      test.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-600'
                        : test.difficulty.includes('Moderate')
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {test.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-bold text-dark mb-2">{test.title}</h3>

                <div className="text-xs text-dark-secondary space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>45 Questions • 45 Marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {test.duration_minutes} Minutes</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {isCompleted ? (
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Last Score</div>
                    <div className="text-sm font-bold text-success">{test.last_score} / 45</div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Not Attempted Yet</div>
                )}

                <button
                  onClick={() => onStartTest(test.id)}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isCompleted ? 'Re-take Test' : 'Start Test'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
