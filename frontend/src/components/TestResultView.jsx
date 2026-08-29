import React from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, Clock, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function TestResultView({ resultData, onReviewAnswers, onPracticeWrong, onBackToDashboard }) {
  const { score, totalMarks, percentage, correctCount, wrongCount, unattemptedCount, timeSpentSeconds, subjectStats } = resultData;

  const getPerformanceBadge = (pct) => {
    if (pct >= 80) return { label: '🌟 Excellent Performance!', color: 'bg-emerald-100 text-emerald-800' };
    if (pct >= 65) return { label: '👍 Very Good Performance!', color: 'bg-blue-100 text-blue-800' };
    if (pct >= 50) return { label: '👌 Good Attempt', color: 'bg-amber-100 text-amber-800' };
    return { label: '📖 Needs Revision & Practice', color: 'bg-rose-100 text-rose-800' };
  };

  const badge = getPerformanceBadge(percentage);

  const formatMinutes = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Format data for Recharts chart
  const chartData = Object.keys(subjectStats || {}).map((subKey) => {
    const s = subjectStats[subKey];
    const acc = s.total > 0 ? parseFloat(((s.correct / s.total) * 100).toFixed(1)) : 0;
    return {
      subject: subKey,
      accuracy: acc,
      correct: s.correct,
      wrong: s.wrong,
      total: s.total
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Result Header Score Banner */}
      <div className="bg-white p-8 rounded-3xl border border-borderSoft shadow-xs text-center space-y-6">
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${badge.color}`}>
          {badge.label}
        </span>

        <div className="space-y-2">
          <div className="text-4xl md:text-5xl font-black text-dark">
            {score} <span className="text-xl text-dark-secondary font-medium">/ {totalMarks} Marks</span>
          </div>
          <div className="text-sm font-semibold text-primary">
            Score Percentage: {percentage}%
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-success-softBg p-4 rounded-2xl border border-success/20">
            <div className="flex items-center justify-center gap-1.5 text-success font-bold text-lg">
              <CheckCircle2 className="w-5 h-5" /> {correctCount}
            </div>
            <div className="text-xs text-dark-secondary font-medium mt-1">Correct (+1.0)</div>
          </div>

          <div className="bg-error-softBg p-4 rounded-2xl border border-error/20">
            <div className="flex items-center justify-center gap-1.5 text-error font-bold text-lg">
              <XCircle className="w-5 h-5" /> {wrongCount}
            </div>
            <div className="text-xs text-dark-secondary font-medium mt-1">Wrong (-0.25)</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold text-lg">
              <HelpCircle className="w-5 h-5" /> {unattemptedCount}
            </div>
            <div className="text-xs text-dark-secondary font-medium mt-1">Unattempted</div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-bold text-lg">
              <Clock className="w-5 h-5" /> {formatMinutes(timeSpentSeconds)}
            </div>
            <div className="text-xs text-dark-secondary font-medium mt-1">Time Taken</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onReviewAnswers}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <BookOpen className="w-4 h-4" /> Review Full Answer Explanations
          </button>

          {wrongCount > 0 && (
            <button
              onClick={onPracticeWrong}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Practice Wrong Questions
            </button>
          )}

          <button
            onClick={onBackToDashboard}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-dark text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Subject Performance Analytics Chart & Breakdown */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-borderSoft space-y-6">
        <h3 className="text-lg font-bold text-dark flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Subject-wise Performance Analysis
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.accuracy >= 70 ? '#3FA66B' : entry.accuracy >= 45 ? '#5B6EE1' : '#D9534F'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {chartData.map((s) => (
            <div key={s.subject} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-dark">{s.subject}</div>
                <div className="text-xs text-dark-secondary mt-0.5">
                  {s.correct} Correct out of {s.total} Questions
                </div>
              </div>
              <div className="text-right">
                <div className={`text-base font-bold ${s.accuracy >= 70 ? 'text-success' : s.accuracy >= 45 ? 'text-primary' : 'text-error'}`}>
                  {s.accuracy}%
                </div>
                <div className="text-xs text-slate-400">Accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
