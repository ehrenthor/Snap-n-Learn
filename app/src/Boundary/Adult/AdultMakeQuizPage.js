import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import './AdultMakeQuizPage.css';

const apiUrl = process.env.REACT_APP_API_URL;

/**
 * A utility function to shuffle an array in place using the Fisher-Yates algorithm
 * and return the index of a specific item after shuffling.
 * @param {Array<string>} array The array to shuffle.
 * @param {string} correctItem The item whose index needs to be tracked.
 * @returns {{shuffledArray: Array<string>, correctIndex: number}} The shuffled array and the new index of the correct item.
 */
const shuffleOptions = (array, correctItem) => {
  const shuffledArray = [...array]; // Create a copy to avoid mutating the original if passed directly
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
  }
  const correctIndex = shuffledArray.findIndex(item => item === correctItem);
  // Ensure array has exactly 4 elements, padding if necessary
  while (shuffledArray.length < 4) {
    shuffledArray.push('');
  }

  // Default if the correct item is not found
  const finalCorrectIndex = shuffledArray.findIndex(item => item === correctItem);

  return { shuffledArray, correctIndex: finalCorrectIndex !== -1 ? finalCorrectIndex : 0 };
};


const AdultMakeQuizPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [quizName, setQuizName] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageSerials, setSelectedImageSerials] = useState([]);
  const [generatingStates, setGeneratingStates] = useState({});

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/quiz/getImages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childUsername: Cookies.get('childUsername') })
        });
        const data = await response.json();
        if (response.ok) {
          setImages(data.images?.filter(img => img.status === 'active' && img.serial && img.filePath) || []);
        } else {
          throw new Error(data.error || 'Failed to load images');
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        Swal.fire('Error', error.message || 'An unexpected error occurred while loading images.', 'error');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const addQuestion = () => {
    const availableImagesCount = images.length - selectedImageSerials.length;
    if (availableImagesCount <= 0 || questions.length >= images.length) {
      Swal.fire('Info', 'No more available images to add a question for, or maximum questions reached.', 'info');
      return;
    }

    if (images.length < 5) {
      Swal.fire('Info', 'You need at least 5 active images uploaded before you can add questions.', 'info');
      return;
    }

    setQuestions(prev => [...prev, {
      image: null,
      question: '',
      options: ['', '', '', ''],
      correct: 0 // Default to the first option
    }]);
  };

  const handleImageSelect = (qIndex, image) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const oldImage = newQuestions[qIndex].image;

      // Update selected image serials state
      setSelectedImageSerials(prevSerials => {
        const withoutOld = oldImage ? prevSerials.filter(s => s !== oldImage.serial) : prevSerials;
        // Add new image serial only if it's a valid image and not already selected elsewhere
        return image && image.serial && !withoutOld.includes(image.serial)
          ? [...withoutOld, image.serial]
          : withoutOld;
      });

      newQuestions[qIndex] = {
        ...newQuestions[qIndex],
        image: image // image can be null if "Select Image" is chosen
      };
      return newQuestions;
    });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuestions(prev => prev.map((q, idx) =>
      idx === qIndex ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (qIndex) => {
    setQuestions(prev => {
      const questionToRemove = prev[qIndex];
      const remainingQuestions = prev.filter((_, idx) => idx !== qIndex);

      // If the removed question had an image selected, make its serial available again
      if (questionToRemove?.image?.serial) {
        setSelectedImageSerials(prevSerials =>
          prevSerials.filter(s => s !== questionToRemove.image.serial)
        );
      }
      return remainingQuestions;
    });
    // Reset generating state for the removed index if it existed
    setGeneratingStates(prev => {
      const newStates = {...prev};
      delete newStates[qIndex];
      // Adjust subsequent indices if needed (though usually re-rendering handles this implicitly)
      return newStates;
    });
  };

  // Get images that are not currently selected in other questions
  const getAvailableImages = (currentQuestionImageSerial) => {
    return images.filter(img =>
      !selectedImageSerials.includes(img.serial) ||
      img.serial === currentQuestionImageSerial
    );
  };

  // AI Question Generation Handler
  const handleGenerateQuestion = async (qIndex, imageSerial) => {
    if (!imageSerial) {
      Swal.fire('Error', 'Please select an image first.', 'error');
      return;
    }

    setGeneratingStates(prev => ({ ...prev, [qIndex]: true }));

    try {
      const response = await fetch(`${apiUrl}/quiz/generateQuiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [imageSerial] }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.quizzes || data.quizzes.length === 0 || !data.quizzes[0].question || !data.quizzes[0].choices) {
        console.error("Unexpected AI response structure:", data);
        throw new Error('Received invalid data format from AI generator.');
      }

      const generatedData = data.quizzes[0];
      const correctAnswer = generatedData.choices.correctAnswer;
      const otherChoices = Array.isArray(generatedData.choices.otherChoices) ? generatedData.choices.otherChoices : [];

      // Combine, shuffle, and find the correct index
      const allOptionsRaw = [...otherChoices, correctAnswer];
      const { shuffledArray: finalOptions, correctIndex } = shuffleOptions(allOptionsRaw, correctAnswer);

      // Update the specific question's state
      setQuestions(prev => prev.map((q, idx) =>
        idx === qIndex ? {
          ...q,
          question: generatedData.question,
          options: finalOptions,
          correct: correctIndex >= 0 ? correctIndex : 0
        } : q
      ));

      Swal.fire('Success', 'Question generated successfully!', 'success');

    } catch (error) {
      console.error("Error generating question:", error);
      Swal.fire('Error', `Failed to generate question: ${error.message}`, 'error');
    } finally {
      setGeneratingStates(prev => ({ ...prev, [qIndex]: false }));
    }
  };


  const validateQuestions = () => {
    // Require at least 5 questions and all fields filled for each
    return questions.length >= 5 && questions.every(q =>
      q.image && q.image.serial && // Ensure an image is selected
      q.question && q.question.trim() !== '' && // Ensure question text is not empty
      q.options.every(opt => opt && opt.trim() !== '') && // Ensure all options are not empty
      q.correct !== null && q.correct >= 0 && q.correct < q.options.length // Ensure correct index is valid
    );
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) {
      // Provide more specific feedback if possible
      let errorMessage = 'Please ensure you have at least 5 questions, and that each question has an image selected, a question text, four non-empty options, and a correct answer marked.';
      if (questions.length < 5) {
        errorMessage = `You need at least 5 questions to create the quiz. You currently have ${questions.length}.`;
      }
      Swal.fire('Validation Error', errorMessage, 'error');
      return;
    }

    // Format questions for the backend
    const formattedPayload = {
      childUsername: Cookies.get('childUsername'),
      quizName: quizName.trim(), // Trim whitespace
      quizDescription: quizDescription.trim(), // Trim whitespace
      questions: { // Backend expects questions nested under a 'questions' key
        questions: questions.map((q, index) => ({
          qNo: index + 1,
          text: q.question.trim(),
          imgPath: q.image.filePath, // Assuming image object has filePath
          options: q.options.map(opt => opt.trim()), // Trim options
          correct: q.correct
        }))
      }
    };

    try {
      const response = await fetch(`${apiUrl}/quiz/insertQuizCreated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Submission failed with status ${response.status}`);
      }

      // Show success message *before* navigating
      await Swal.fire({ // Use await to ensure the user sees the message
        title: "Success!",
        text: "Quiz creation successful!",
        icon: "success",
        confirmButtonText: "OK",
      });

      navigate('/adultQuizMain'); // Navigate after success confirmation

    } catch (error) {
      console.error("Error creating quiz:", error);
      Swal.fire('Error', `Failed to create quiz: ${error.message}`, 'error');
    }
  };

  if (loading) {
    return <div className="adultMakeQuiz-loading">Loading images... ( ´ ▽ ` )ﾉ</div>;
  }
  // Calculate available images count dynamically
  const availableImagesCount = images.length - selectedImageSerials.length;
  const canAddQuestion = availableImagesCount > 0 && questions.length < images.length && images.length >= 5;


  return (
    <div className="adultMakeQuiz-container">
      <button className="adultMakeQuiz-backButton" onClick={() => navigate('/adultQuizMain')}>
        ← Back to Quizzes
      </button>

      <div className="adultMakeQuiz-header">
        <button
          className={`adultMakeQuiz-addButton ${!canAddQuestion ? 'disabled' : ''}`}
          onClick={addQuestion}
          disabled={!canAddQuestion}
          title={
            images.length < 5 ? "Need at least 5 images uploaded" :
              availableImagesCount <= 0 ? "No available images left" :
                questions.length >= images.length ? "Maximum questions reached based on images" :
                  "Add a new question"
          }
        >
          + Add Question{' '}
          {images.length >= 5 ? (
            `(Available Images: ${availableImagesCount})`
          ) : (
            <span className="adultMakeQuiz-warningText">(Need ≥5 Images In Total)</span>
          )}
        </button>
      </div>

      <div className="adultMakeQuiz-initialFields">
        <input
          type="text"
          placeholder="Quiz Name (Required)"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          required // Add basic HTML5 validation
        />
        <textarea
          placeholder="Quiz Description (Optional)"
          value={quizDescription}
          onChange={(e) => setQuizDescription(e.target.value)}
        />
      </div>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="adultMakeQuiz-questionCard">
          <div className="adultMakeQuiz-questionHeader">
            <h3>Question {qIndex + 1}</h3>
            <button
              className="adultMakeQuiz-removeButton"
              onClick={() => removeQuestion(qIndex)}
              title="Remove this question"
            >
              ✕
            </button>
          </div>

          <div className="adultMakeQuiz-imageSelection">
            <select
              value={q.image?.serial || ''} // Handle case where q.image is null
              onChange={(e) => {
                const selectedSerial = e.target.value;
                const selectedImage = selectedSerial ? images.find(img => img.serial === selectedSerial) : null;
                handleImageSelect(qIndex, selectedImage);
              }}
              required // Add basic HTML5 validation
            >
              <option value="">-- Select Image --</option>
              {/* Show currently selected image first if it exists */}
              {q.image && (
                <option key={q.image.serial} value={q.image.serial}>
                  {q.image.caption?.text?.generalLabel || `Image ${q.image.serial.substring(0, 6)}...`}
                </option>
              )}
              {/* Then show other available images */}
              {getAvailableImages(q.image?.serial).map(img => (
                // Avoid duplicating the currently selected image in the list
                img.serial !== q.image?.serial && (
                  <option key={img.serial} value={img.serial}>
                    {img.caption?.text?.generalLabel || `Image ${img.serial.substring(0, 6)}...`}
                  </option>
                )
              ))}
            </select>

            {q.image && (
              <div className="adultMakeQuiz-selectedImagePreview">
                {/* Keep selected image preview */}
                <img
                  src={q.image.filePath}
                  alt={q.image.caption?.text?.generalLabel || 'Selected quiz image'}
                  className="adultMakeQuiz-previewImage"
                />
                <button
                  className="adultMakeQuiz-generateButton"
                  onClick={() => handleGenerateQuestion(qIndex, q.image.serial)}
                  disabled={generatingStates[qIndex] || !q.image.serial}
                  title={!q.image.serial ? "Select an image first" : "Generate question and options using AI"}
                >
                  {generatingStates[qIndex] ? 'Generating...' : '✨ Generate with AI ✨'}
                </button>
                <p className="adultMakeQuiz-selectedCaption">
                  {q.image.caption?.text?.imageCaption}
                </p>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Question Text (Required)"
            value={q.question}
            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
            required
            className="adultMakeQuiz-questionInput"
          />

          <div className="adultMakeQuiz-options">
            <h4>Options (Required):</h4>
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} className="adultMakeQuiz-option">
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...q.options];
                    newOptions[optIndex] = e.target.value;
                    handleQuestionChange(qIndex, 'options', newOptions);
                  }}
                  required
                />
                <label className="adultMakeQuiz-correctLabel">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`} // Ensures only one radio can be selected per question
                    checked={q.correct === optIndex}
                    onChange={() => handleQuestionChange(qIndex, 'correct', optIndex)}
                    required // Technically, one must be selected
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        className={`adultMakeQuiz-submitButton ${!validateQuestions() ? 'disabled' : ''}`}
        onClick={handleSubmit}
        disabled={!validateQuestions()}
        title={validateQuestions() ? "Create the quiz" : "Complete all required fields for at least 5 questions"}
      >
        Create Quiz
      </button>
    </div>
  );
};

export default AdultMakeQuizPage;
