import React, { useState, useEffect } from 'react';
import TestDashboard from './components/TestDashboard';
import ExamEngine from './components/ExamEngine';
import TestResultView from './components/TestResultView';
import LearningMode from './components/LearningMode';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [view, setView] = useState('DASHBOARD'); // 'DASHBOARD' | 'EXAM' | 'RESULT' | 'LEARNING' | 'ADMIN' | 'PRACTICE'
  const [lang, setLang] = useState('EN'); // 'EN' | 'MR'
  const [tests, setTests] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [reviewedAttempt, setReviewedAttempt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (data.success) {
        setTests(data.tests);
        setOverallStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    }
  };

  const handleStartTest = async (testId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}`);
      const data = await res.json();
      if (data.success) {
        setActiveTest(data.test);
        setQuestions(data.questions);
        setView('EXAM');
      }
    } catch (err) {
      console.error('Error starting test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTest = async (userAnswers, timeSpentSeconds) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${activeTest.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers, timeSpentSeconds })
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data);
        // Load attempt review details
        const attRes = await fetch(`/api/attempts/${data.attemptId}`);
        const attData = await attRes.json();
        if (attData.success) {
          setReviewedAttempt(attData);
        }
        setView('RESULT');
        fetchTests();
      }
    } catch (err) {
      console.error('Error submitting test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeWrong = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/practice/wrong-questions');
      const data = await res.json();
      if (data.success && data.questions.length > 0) {
        setActiveTest({
          id: 999,
          title: 'Practice Wrong Questions Mini-Test',
          difficulty: 'Revision',
          duration_minutes: 30,
          total_questions: data.questions.length
        });
        setQuestions(data.questions);
        setView('EXAM');
      }
    } catch (err) {
      console.error('Error starting wrong questions practice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-semibold text-dark">Loading MPSC AMVI Question Engine...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#263238]">
      {view === 'DASHBOARD' && (
        <TestDashboard
          tests={tests}
          stats={overallStats}
          onStartTest={handleStartTest}
          onOpenAdmin={() => setView('ADMIN')}
          lang={lang}
          setLang={setLang}
        />
      )}

      {view === 'EXAM' && activeTest && (
        <ExamEngine
          test={activeTest}
          questions={questions}
          onSubmitTest={handleSubmitTest}
          lang={lang}
        />
      )}

      {view === 'RESULT' && lastResult && (
        <TestResultView
          resultData={lastResult}
          onReviewAnswers={() => setView('LEARNING')}
          onPracticeWrong={handlePracticeWrong}
          onBackToDashboard={() => setView('DASHBOARD')}
        />
      )}

      {view === 'LEARNING' && reviewedAttempt && (
        <LearningMode
          test={reviewedAttempt.test}
          questions={reviewedAttempt.questions}
          onBackToDashboard={() => setView('DASHBOARD')}
          onPracticeWrong={handlePracticeWrong}
          lang={lang}
        />
      )}

      {view === 'ADMIN' && (
        <AdminPanel
          onBackToDashboard={() => {
            fetchTests();
            setView('DASHBOARD');
          }}
        />
      )}
    </div>
  );
}
