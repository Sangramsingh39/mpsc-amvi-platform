import db from './db.js';

console.log('🔍 Running Duplicate Question Cleanup Engine...');

// Function to normalize question text for deduplication
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/\[Test\s*\d+\s*-\s*Q\d+\]/gi, '') // Strip test prefix tags
    .replace(/\(Q-Ref:\s*#?\d+\)/gi, '')         // Strip Q-Ref tags
    .trim()
    .toLowerCase();
}

// 1. Fetch all questions from the SQLite database
const allQuestions = db.prepare('SELECT id, test_id, question_no, question_en, question_mr FROM questions ORDER BY id ASC').all();

console.log(`📊 Total Question Records in Database: ${allQuestions.length}`);

const seenMap = new Map(); // normalized_text -> first_instance_id
const idsToDelete = [];
const uniqueQuestionsList = [];

for (const q of allQuestions) {
  const normKey = normalizeText(q.question_en) || normalizeText(q.question_mr);

  if (seenMap.has(normKey)) {
    // Redundant duplicate instance -> mark for deletion
    idsToDelete.push(q.id);
  } else {
    // First instance -> KEEP THIS ITEM
    seenMap.set(normKey, q.id);
    uniqueQuestionsList.push(q.id);
  }
}

console.log(`✅ Total Unique Questions Found: ${seenMap.size}`);
console.log(`🗑️ Redundant Duplicate Instances to Remove: ${idsToDelete.length}`);

// 2. Perform DB deletion in transaction
if (idsToDelete.length > 0) {
  const deleteStmt = db.prepare('DELETE FROM questions WHERE id = ?');
  db.transaction(() => {
    for (const id of idsToDelete) {
      deleteStmt.run(id);
    }
  })();
  console.log(`🎉 Successfully deleted ${idsToDelete.length} redundant duplicate question records from SQLite database!`);
} else {
  console.log('✨ Database already contains 0 duplicate questions!');
}

// 3. Verify total remaining questions
const remainingCount = db.prepare('SELECT COUNT(*) as cnt FROM questions').get().cnt;
console.log(`📌 Total Remaining Unique Questions in Database: ${remainingCount}`);
