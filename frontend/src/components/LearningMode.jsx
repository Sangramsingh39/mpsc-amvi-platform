import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, BookOpen, ExternalLink, RotateCcw } from 'lucide-react';

export default function LearningMode({ test, questions, onBackToDashboard, onPracticeWrong, lang }) {
  const [filter, setFilter] = useState('All');

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'All') return true;
    if (filter === 'Correct') return q.status === 'CORRECT';
    if (filter === 'Wrong') return q.status === 'WRONG';
    if (filter === 'Unattempted') return q.status === 'UNATTEMPTED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation & Filter */}
      <div className="bg-white p-6 rounded-3xl border border-borderSoft shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-dark">
            Question Review & Detailed Explanations
          </h2>
          <p className="text-xs text-dark-secondary">{test?.title}</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Correct', 'Wrong', 'Unattempted'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                filter === tab
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-dark-secondary hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Question Review Cards */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          const userAns = q.user_selected;
          const isCorrect = q.status === 'CORRECT';
          const isWrong = q.status === 'WRONG';
          const isUnattempted = q.status === 'UNATTEMPTED';

          return (
            <div
              key={q.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs space-y-5 transition ${
                isCorrect
                  ? 'border-success/30'
                  : isWrong
                  ? 'border-error/30'
                  : 'border-borderSoft'
              }`}
            >
              {/* Question Header Status Badge */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-dark text-sm">Question #{q.question_no}</span>
                  <span className="text-xs bg-slate-100 text-dark-secondary px-2.5 py-0.5 rounded-md font-medium">
                    {q.subject} • {q.topic}
                  </span>
                </div>

                <div>
                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-success-light text-success rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1.0)
                    </span>
                  )}
                  {isWrong && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-error-light text-error rounded-lg">
                      <XCircle className="w-3.5 h-3.5" /> Wrong (-0.25)
                    </span>
                  )}
                  {isUnattempted && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-amber-50 text-amber-600 rounded-lg">
                      <HelpCircle className="w-3.5 h-3.5" /> Not Attempted (0.0)
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-base font-bold text-dark leading-relaxed">{q.question_en}</p>
                {lang === 'MR' && q.question_mr && (
                  <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {q.question_mr}
                  </p>
                )}
              </div>

              {/* Options Review List with SOFT RED & SOFT GREEN Backgrounds */}
              <div className="space-y-2.5">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const isOptionCorrect = optKey === q.correct_answer;
                  const isUserSelection = userAns === optKey;

                  let optionStyle = 'bg-slate-50 border-slate-200 text-dark';
                  if (isOptionCorrect) {
                    optionStyle = 'bg-success-softBg border-success/40 text-dark font-semibold';
                  } else if (isUserSelection && isWrong) {
                    optionStyle = 'bg-error-softBg border-error/40 text-dark font-semibold';
                  }

                  return (
                    <div
                      key={optKey}
                      className={`p-3.5 rounded-2xl border text-sm flex items-center justify-between transition ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                            isOptionCorrect
                              ? 'bg-success text-white border-success'
                              : isUserSelection && isWrong
                              ? 'bg-error text-white border-error'
                              : 'bg-white border-slate-300 text-dark-secondary'
                          }`}
                        >
                          {optKey}
                        </span>
                        <div>
                          <div className="font-medium">{q[`option_${optKey.toLowerCase()}_en`]}</div>
                          {lang === 'MR' && q[`option_${optKey.toLowerCase()}_mr`] && (
                            <div className="text-xs text-slate-600">{q[`option_${optKey.toLowerCase()}_mr`]}</div>
                          )}
                        </div>
                      </div>

                      {/* Option Indicators */}
                      <div>
                        {isOptionCorrect && (
                          <span className="text-xs font-bold text-success flex items-center gap-1">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserSelection && isWrong && (
                          <span className="text-xs font-bold text-error flex items-center gap-1">
                            ❌ Your Selection
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Explanation Box */}
              <div className="bg-primary-light/60 border border-primary/20 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Explanation & Reference
                </div>
                <p className="text-xs text-dark leading-relaxed font-medium">
                  {q.explanation_en}
                </p>
                {lang === 'MR' && q.explanation_mr && (
                  <p className="text-xs text-slate-700 leading-relaxed font-medium border-t border-primary/10 pt-2">
                    {q.explanation_mr}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-dark-secondary pt-2 border-t border-primary/10">
                  <span className="font-semibold">Source: {q.source}</span>
                  {q.source_url && (
                    <a
                      href={q.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Verify Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {q.current_affair === 1 && (
                    <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                      Current Affair ({q.current_affair_date})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
