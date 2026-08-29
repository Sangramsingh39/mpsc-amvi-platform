import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files in production if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// --- API ROUTES ---

// 1. Get List of 100 Tests with User Stats
app.get('/api/tests', (req, res) => {
  try {
    const tests = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as attempts_count,
        (SELECT MAX(score) FROM test_attempts WHERE test_id = t.id) as best_score,
        (SELECT score FROM test_attempts WHERE test_id = t.id ORDER BY completed_at DESC LIMIT 1) as last_score
      FROM tests t
      ORDER BY t.id ASC
    `).all();

    const overallStats = db.prepare(`
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as avg_score,
        MAX(score) as highest_score,
        AVG(percentage) as avg_accuracy
      FROM test_attempts
    `).get();

    res.json({
      success: true,
      tests,
      stats: overallStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Load Single Test Questions (SECURITY: Sanitized without correct_answer/explanation)
app.get('/api/tests/:id', (req, res) => {
  try {
    const testId = req.params.id;
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    // Fetch questions without revealing correct answer & explanation before submit
    const questions = db.prepare(`
      SELECT id, test_id, question_no, section, subject, topic, difficulty,
             question_en, question_mr,
             option_a_en, option_a_mr,
             option_b_en, option_b_mr,
             option_c_en, option_c_mr,
             option_d_en, option_d_mr,
             current_affair, current_affair_date
      FROM questions
      WHERE test_id = ?
      ORDER BY question_no ASC
    `).all(testId);

    // Get current global settings
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json({
      success: true,
      test: {
        ...test,
        negative_marks: parseFloat(settingsObj.default_negative_marking || test.negative_marks),
        duration_minutes: parseInt(settingsObj.default_test_duration || test.duration_minutes)
      },
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Submit Test & Server-Side Evaluation
app.post('/api/tests/:id/submit', (req, res) => {
  try {
    const testId = req.params.id;
    const { userAnswers, timeSpentSeconds } = req.body; // userAnswers: { [questionId]: 'A' | 'B' | 'C' | 'D' }

    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const posMark = parseFloat(test.positive_marks || 1.0);
    const negMark = parseFloat(settingsObj.default_negative_marking || test.negative_marks || 0.25);

    const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(testId);

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    const subjectStats = {};

    questions.forEach((q) => {
      const userAns = userAnswers ? userAnswers[q.id] : null;

      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { total: 0, correct: 0, wrong: 0, unattempted: 0 };
      }
      subjectStats[q.subject].total += 1;

      if (!userAns) {
        unattemptedCount += 1;
        subjectStats[q.subject].unattempted += 1;
      } else if (userAns.toUpperCase() === q.correct_answer.toUpperCase()) {
        score += posMark;
        correctCount += 1;
        subjectStats[q.subject].correct += 1;
      } else {
        score -= negMark;
        wrongCount += 1;
        subjectStats[q.subject].wrong += 1;
      }
    });

    const totalMarks = questions.length * posMark;
    const finalScore = Math.max(0, parseFloat(score.toFixed(2)));
    const percentage = parseFloat(((finalScore / totalMarks) * 100).toFixed(2));

    // Save Attempt to DB
    const stmt = db.prepare(`
      INSERT INTO test_attempts (
        test_id, user_id, score, total_marks, percentage,
        correct_count, wrong_count, unattempted_count,
        time_spent_seconds, user_answers, section_breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      testId,
      'student_1',
      finalScore,
      totalMarks,
      percentage,
      correctCount,
      wrongCount,
      unattemptedCount,
      timeSpentSeconds || 0,
      JSON.stringify(userAnswers || {}),
      JSON.stringify(subjectStats)
    );

    res.json({
      success: true,
      attemptId: result.lastInsertRowid,
      score: finalScore,
      totalMarks,
      percentage,
      correctCount,
      wrongCount,
      unattemptedCount,
      timeSpentSeconds,
      subjectStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Attempt Details for Review (with Full Explanations & Soft Red/Green Indicators)
app.get('/api/attempts/:id', (req, res) => {
  try {
    const attemptId = req.params.id;
    const attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(attempt.test_id);
    const questions = db.prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY question_no ASC').all(attempt.test_id);

    const userAnswers = JSON.parse(attempt.user_answers || '{}');
    const subjectBreakdown = JSON.parse(attempt.section_breakdown || '{}');

    // Combine questions with user selection & status
    const reviewedQuestions = questions.map((q) => {
      const userAns = userAnswers[q.id] || null;
      let status = 'UNATTEMPTED';
      if (userAns) {
        status = userAns.toUpperCase() === q.correct_answer.toUpperCase() ? 'CORRECT' : 'WRONG';
      }
      return {
        ...q,
        user_selected: userAns,
        status
      };
    });

    res.json({
      success: true,
      attempt: {
        ...attempt,
        user_answers: userAnswers,
        section_breakdown: subjectBreakdown
      },
      test,
      questions: reviewedQuestions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Practice Wrong Questions Generator
app.get('/api/practice/wrong-questions', (req, res) => {
  try {
    const wrongAttempts = db.prepare(`
      SELECT user_answers FROM test_attempts ORDER BY id DESC LIMIT 20
    `).all();

    const wrongQIds = new Set();
    wrongAttempts.forEach((att) => {
      const answers = JSON.parse(att.user_answers || '{}');
      Object.keys(answers).forEach((qId) => {
        const q = db.prepare('SELECT id, correct_answer FROM questions WHERE id = ?').get(qId);
        if (q && answers[qId].toUpperCase() !== q.correct_answer.toUpperCase()) {
          wrongQIds.add(q.id);
        }
      });
    });

    const idsArray = Array.from(wrongQIds).slice(0, 30);
    if (idsArray.length === 0) {
      // Fallback: Pick random questions
      const randomQs = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT 20').all();
      return res.json({ success: true, questions: randomQs });
    }

    const placeholders = idsArray.map(() => '?').join(',');
    const wrongQs = db.prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`).all(...idsArray);

    res.json({ success: true, questions: wrongQs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. ADMIN API ROUTES
// Admin: Fetch all questions
app.get('/api/admin/questions', (req, res) => {
  try {
    const { test_id, subject, search } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (test_id) {
      query += ' AND test_id = ?';
      params.push(test_id);
    }
    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }
    if (search) {
      query += ' AND (question_en LIKE ? OR topic LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC LIMIT 200';
    const questions = db.prepare(query).all(...params);

    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Add Single Question
app.post('/api/admin/questions', (req, res) => {
  try {
    const q = req.body;
    const stmt = db.prepare(`
      INSERT INTO questions (
        test_id, question_no, section, subject, topic, difficulty,
        question_en, question_mr, option_a_en, option_a_mr, option_b_en, option_b_mr,
        option_c_en, option_c_mr, option_d_en, option_d_mr, correct_answer, explanation_en,
        explanation_mr, source, source_url, current_affair, current_affair_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      q.test_id || 1,
      q.question_no || 1,
      q.section || 'POLITY_ECONOMICS_SCIENCE',
      q.subject || 'Polity',
      q.topic || 'General',
      q.difficulty || 'Easy',
      q.question_en,
      q.question_mr || '',
      q.option_a_en,
      q.option_a_mr || '',
      q.option_b_en,
      q.option_b_mr || '',
      q.option_c_en,
      q.option_c_mr || '',
      q.option_d_en,
      q.option_d_mr || '',
      q.correct_answer,
      q.explanation_en,
      q.explanation_mr || '',
      q.source || 'Official Reference',
      q.source_url || '',
      q.current_affair ? 1 : 0,
      q.current_affair_date || ''
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Bulk CSV/JSON Import
app.post('/api/admin/import', (req, res) => {
  try {
    const { questions } = req.body; // Array of question objects
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid questions payload' });
    }

    let inserted = 0;
    let duplicates = 0;

    const checkDuplicateStmt = db.prepare('SELECT id FROM questions WHERE question_en = ?');
    const insertStmt = db.prepare(`
      INSERT INTO questions (
        test_id, question_no, section, subject, topic, difficulty,
        question_en, question_mr, option_a_en, option_a_mr, option_b_en, option_b_mr,
        option_c_en, option_c_mr, option_d_en, option_d_mr, correct_answer, explanation_en,
        explanation_mr, source, source_url, current_affair, current_affair_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      questions.forEach((q) => {
        const dup = checkDuplicateStmt.get(q.question_en);
        if (dup) {
          duplicates += 1;
        } else {
          insertStmt.run(
            q.test_id || 1,
            q.question_no || 1,
            q.section || 'POLITY_ECONOMICS_SCIENCE',
            q.subject || 'Polity',
            q.topic || 'General',
            q.difficulty || 'Easy',
            q.question_en,
            q.question_mr || '',
            q.option_a_en || q.option_a,
            q.option_a_mr || '',
            q.option_b_en || q.option_b,
            q.option_b_mr || '',
            q.option_c_en || q.option_c,
            q.option_c_mr || '',
            q.option_d_en || q.option_d,
            q.option_d_mr || '',
            q.correct_answer,
            q.explanation_en || q.explanation,
            q.explanation_mr || '',
            q.source || 'Official Source',
            q.source_url || '',
            q.current_affair ? 1 : 0,
            q.current_affair_date || ''
          );
          inserted += 1;
        }
      });
    })();

    res.json({ success: true, inserted, duplicates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Settings GET & POST
app.get('/api/admin/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const { default_negative_marking, default_test_duration, enable_marathi } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    if (default_negative_marking !== undefined) stmt.run('default_negative_marking', String(default_negative_marking));
    if (default_test_duration !== undefined) stmt.run('default_test_duration', String(default_test_duration));
    if (enable_marathi !== undefined) stmt.run('enable_marathi', String(enable_marathi));

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all route to serve React frontend app
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ MPSC AMVI Backend API Server running on port ${PORT}`);
});
