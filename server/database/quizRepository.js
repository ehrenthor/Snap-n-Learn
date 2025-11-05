const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class QuizRepository {
  /**
   * Retrieves quizzes for a user based on child id.
   */
  async getQuizList(childId) {
    try {
      const query = `
        SELECT *
        FROM Quiz
        WHERE childId = ?
      `;

      const [rows] = await db.execute(query, [childId]);
      return rows;
    } catch (error) {
      console.error('Error retrieving quiz list:', error);
      throw new Error('Failed to retrieve quiz list');
    }
  }

  /**
   * Retrieves taken quizzes for a user based on child id.
   */
  async getQuizTaken(childId) {
    try {
      const query = `
        SELECT * 
        FROM QuizTaken
        WHERE childId = ?
        ORDER BY datetimeTaken DESC
      `;

      const [rows] = await db.execute(query, [childId]);
      return rows;
    } catch (error) {
      console.error('Error retrieving quiz taken list:', error);
      throw new Error('Failed to retrieve quiz taken list');
    }
  }

  /**
   * Retrieves quiz details for a user.
   */
  async getQuizDetails(quizId) {
    try {
      const query = `
        SELECT *
        FROM Quiz
        WHERE quizId = ?
      `;

      const [rows] = await db.execute(query, [quizId]);
      return rows;
    } catch (error) {
      console.error('Error retrieving quiz details:', error);
      throw new Error('Failed to retrieve quiz details');
    }
  }

  /**
   * Retrieves taken quiz details for a user.
   */
  async getQuizTakenDetails(quizId, childId, quizDateTime) {
    
    
    try {
      const query = `
        SELECT *
        FROM QuizTaken
        WHERE quizId = ? AND childId = ? AND CONVERT_TZ(datetimeTaken, @@session.time_zone, '+00:00') = ?
      `;

      const [rows] = await db.execute(query, [quizId, childId, quizDateTime]);
      return rows;
    } catch (error) {
      console.error('Error retrieving quiz taken details:', error);
      throw new Error('Failed to retrieve quiz taken details');
    }
  }

  /**
   * Insert new quiz result.
   */
  async insertQuizResult(quizId, childId, answers) {
    try {
      const query = `
        INSERT INTO QuizTaken (quizId, childId, answers)
        VALUES (?, ?, ?)
      `;

      await db.execute(query, [quizId, childId.userid, , JSON.stringify(answers)]);
      return true;
    } catch (error) {
      console.error('Error inserting quiz result:', error);
      throw new Error('Failed to insert quiz result');
    }
  }


 /**
 * Insert new quiz created.
 */
  async insertQuizCreated(childId, quizName, quizDescription, questions) {
    const quizId = uuidv4();
    
    try {
      const query = `
        INSERT INTO Quiz (quizId, childId, quizName, quizDescription, questions)
        VALUES (?, ?, ?, ?, ?)
      `;

      const question = JSON.stringify(questions);

      await db.execute(query, [quizId, childId, quizName, quizDescription, question]);
      return true;
    } catch (error) {
      console.error('Error inserting quiz created:', error);
      throw new Error('Failed to insert quiz created');
    }
  }
}

module.exports = new QuizRepository();