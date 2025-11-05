const bcrypt = require('bcrypt');
const UserRepository = require('../database/userRepository');
const imageRepository = require('../database/imageRepository');
const quizRepository = require('../database/quizRepository');
const fileStorage = require('../storage/fileStorage');

class QuizService {
  /**
   * Retrieves quiz list for a user based on their username.
   */
  async getQuizList(username) {
    const childId = await UserRepository.getUserIdByUsername(username);

    if (!childId) {
      const error = new Error("Child doesn't exist!");
      error.status = 404;
      throw error;
    }
    
    const quizList = await quizRepository.getQuizList(childId.userid);

    if (!quizList) {
      const error = new Error("Quizzes not found!");
      error.status = 404;
      throw error;
    }

    const quizTaken = await quizRepository.getQuizTaken(childId.userid);

    if (!quizTaken) {
      const error = new Error("Quizzes taken not found!");
      error.status = 404;
      throw error;
    }

    return {
        availableQuizzes: quizList,
        takenQuizzes: quizTaken
    };
  }

  /**
   * Retrieves quiz question for user based on quizId.
   */
  async getQuizQuestion(quizId) {
    const quiz = await quizRepository.getQuizDetails(quizId);

    if (!quiz) {
      const error = new Error("Child doesn't exist!");
      error.status = 404;
      throw error;
    }

    return {
        quizName: quiz[0].quizName,
        quizQuestion: quiz[0].questions
    };
  }

  /**
   * Input new quiz result.
   */
  async insertQuizResult(quizId, username, answers) {
    const childId = await UserRepository.getUserIdByUsername(username);
    if (!childId) {
      const error = new Error("Child doesn't exist!");
      error.status = 400;
      throw error;
    }

    // Insert quiz result
    await quizRepository.insertQuizResult(quizId, childId, answers);

    return true;
  }

  /**
   * Retrieves quiz review for a user based on their username and quiz selected.
   */
  async getQuizReview(username, quizId, quizDateTime) {
    const childId = await UserRepository.getUserIdByUsername(username);

    if (!childId) {
      const error = new Error("Child doesn't exist!");
      error.status = 404;
      throw error;
    }
    
    const quizDetails = await quizRepository.getQuizDetails(quizId);

    if (!quizDetails) {
      const error = new Error("Quiz not found!");
      error.status = 404;
      throw error;
    }

    const quizTakenDetails = await quizRepository.getQuizTakenDetails(quizId, childId.userid, quizDateTime);

    if (!quizTakenDetails) {
      const error = new Error("Quiz taken not found!");
      error.status = 404;
      throw error;
    }

    return {
        quizDetails: quizDetails,
        quizTakenDetails: quizTakenDetails
    };
  }

  /**
   * Retrieves image for quiz creation.
   */
  async getImages(childUsername) {
    const childId = await UserRepository.getUserIdByUsername(childUsername);

    if (!childId) {
      const error = new Error("Child doesn't exist!");
      error.status = 404;
      throw error;
    }
    
    let images = await imageRepository.getImages(childId.userid);

    if (!images) {
      const error = new Error("Image not found!");
      error.status = 404;
      throw error;
    }

    try {
      images = await Promise.all(
          images.map(async (image) => {
              const imageBuffer = await fileStorage.getImageFile(image.filePath);
              const imageBase64 = imageBuffer.toString('base64');
              const dataURL = `data:image/jpeg;base64,${imageBase64}`;
              return {
                ...image,
                filePath: dataURL
              };
          })
      );
  } catch (error) {
      console.error('Error processing images:', error);
      throw new Error('Could not retrieve image files.');
  }

    return { images };
  }

  /**
   * Insert new quiz created.
   */
  async insertQuizCreated(childUsername, quizName, quizDescription, questions) {
    const childId = await UserRepository.getUserIdByUsername(childUsername);
    if (!childId) {
      const error = new Error("Child doesn't exist!");
      error.status = 400;
      throw error;
    }

    // Insert quiz result
    await quizRepository.insertQuizCreated(childId.userid, quizName, quizDescription, questions);

    return true;
  }
}



module.exports = new QuizService();