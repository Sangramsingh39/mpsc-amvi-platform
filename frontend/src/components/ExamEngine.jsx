import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Bookmark, RotateCcw, Send, AlertTriangle } from 'lucide-react';

export default function ExamEngine({ test, questions, onSubmitTest, lang }) {
  const durationMinutes = test?.duration_minutes || 45;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const timerRef = useRef(null);

  // Guard against missing test or questions payload
  if (!test || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-dark">Loading MPSC AMVI Test Questions...</p>
        </div>
      </div>
    );
  }

  // Real-time Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const handleAutoSubmit = () => {
    onSubmitTest(userAnswers, (durationMinutes * 60) - timeLeft);
  };

  const currentQ = questions[currentIdx] || questions[0];
  const totalQuestions = questions.length;

  const handleOptionSelect = (opt) => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt
    }));
  };

  const handleClearAnswer = () => {
    if (!currentQ) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const toggleMarkForReview = () => {
    if (!currentQ) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const getTimerBadgeStyle = () => {
    const minutesLeft = timeLeft / 60;
    if (minutesLeft <= 3) {
      return 'bg-error-light text-error border-error/30 animate-pulse';
    }
    if (minutesLeft <= 10) {
      return 'bg-amber-50 text-amber-600 border-amber-200';
    }
    return 'bg-primary-light text-primary border-primary/20';
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = totalQuestions - answeredCount;

  // Clean title removing the word 'Full' if present
  const cleanTitle = (test?.title || 'MPSC AMVI Mock Test').replace(/\s*Full\s*/i, ' ');

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-between">
      {/* 1. Compact Header Bar */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-30 px-4 py-2 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-dark text-sm md:text-base">{cleanTitle}</span>
              <span className="text-[10px] bg-slate-100 text-dark-secondary px-2 py-0.5 rounded-full font-medium">
                {test?.difficulty || 'Standard'}
              </span>
            </div>
            <div className="text-[11px] text-dark-secondary flex items-center gap-2 mt-0.5">
              <span>Q {currentIdx + 1}/{totalQuestions}</span>
              <span>•</span>
              <span>Marks: 45</span>
            </div>
          </div>

          {/* TOP RIGHT COMPACT SINGLE-CLOCK TIMER */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${getTimerBadgeStyle()}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="w-full bg-slate-100 h-1 mt-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Examination Grid Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section: Question Card */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="bg-white p-5 rounded-2xl border border-borderSoft shadow-xs space-y-5">
            {/* Section Tag */}
            <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-md">
                {currentQ?.section === 'POLITY_ECONOMICS_SCIENCE' 
                  ? 'SECTION A — POLITY + ECONOMICS + SCIENCE' 
                  : 'SECTION B — MPSC / AMVI GENERAL + CURRENT AFFAIRS'}
              </span>
              <span className="text-[11px] font-medium text-dark-secondary">
                Subject: <strong className="text-dark">{currentQ?.subject || 'General'}</strong> ({currentQ?.topic || 'Topic'})
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h2 className="text-sm md:text-base font-bold text-dark leading-relaxed">
                Q{currentQ?.question_no || (currentIdx + 1)}. {(currentQ?.question_en || '').replace(/\[Test \d+ - Q\d+\]\s*/i, '')}
              </h2>
              {lang === 'MR' && currentQ?.question_mr && (
                <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {currentQ.question_mr}
                </p>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-1">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const isSelected = userAnswers[currentQ?.id] === optKey;
                const optTextEn = currentQ?.[`option_${optKey.toLowerCase()}_en`];
                const optTextMr = currentQ?.[`option_${optKey.toLowerCase()}_mr`];

                return (
                  <button
                    key={optKey}
                    onClick={() => handleOptionSelect(optKey)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary-light/50 text-dark shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-dark'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 text-dark-secondary'
                      }`}
                    >
                      {optKey}
                    </div>
                    <div className="text-xs md:text-sm">
                      <div className="font-semibold text-dark">{optTextEn}</div>
                      {lang === 'MR' && optTextMr && (
                        <div className="text-[11px] text-slate-600 mt-0.5">{optTextMr}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-borderSoft flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMarkForReview}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                  markedForReview.has(currentQ?.id)
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-dark-secondary border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {markedForReview.has(currentQ?.id) ? 'Marked' : 'Mark for Review'}
              </button>

              <button
                onClick={handleClearAnswer}
                disabled={!userAnswers[currentQ?.id]}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-dark-secondary text-xs font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Answer
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-dark text-xs font-semibold rounded-xl transition disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <button
                onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIdx === totalQuestions - 1}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right / Below Section: Question Navigation Panel */}
        <div className="bg-white p-4 rounded-2xl border border-borderSoft space-y-3">
          <h3 className="font-bold text-dark text-xs border-b border-slate-100 pb-2">
            Question Palette ({answeredCount}/{totalQuestions} Answered)
          </h3>

          {/* Status Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium text-dark-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span> Unanswered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span> Answered
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Marked
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Current
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-1.5 pt-1 max-h-[340px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[q.id];
              const isMarked = markedForReview.has(q.id);
              const isCurrent = idx === currentIdx;

              let bgStyle = 'bg-slate-100 text-dark hover:bg-slate-200';
              if (isCurrent) {
                bgStyle = 'bg-primary text-white ring-2 ring-primary/40 font-bold';
              } else if (isMarked) {
                bgStyle = 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
              } else if (isAns) {
                bgStyle = 'bg-success text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-8 rounded-lg text-xs flex items-center justify-center transition ${bgStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-success hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Submit Test
            </button>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-dark/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-borderSoft space-y-6">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-dark text-sm">Are you sure you want to submit?</h4>
                <p className="text-xs text-dark-secondary mt-0.5">You will not be able to modify your answers after submission.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-success">{answeredCount}</div>
                <div className="text-xs text-dark-secondary font-medium">Answered</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-amber-600">{markedCount}</div>
                <div className="text-xs text-dark-secondary font-medium">Marked</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-lg font-bold text-slate-500">{unansweredCount}</div>
                <div className="text-xs text-dark-secondary font-medium">Unanswered</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-dark text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoSubmit}
                className="flex-1 py-2.5 bg-success hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
