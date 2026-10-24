
import { useEffect, useState } from 'react';
import './App.css';

const API = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080/api'
).replace(/\/$/, '');

const quizQuestions = [
  {
    question: 'Which language is primarily used to build React interfaces?',
    options: ['Java', 'JavaScript', 'SQL', 'C'],
    answer: 'JavaScript',
  },
  {
    question: 'Which annotation marks a REST controller in Spring Boot?',
    options: ['@Entity', '@Id', '@RestController', '@Override'],
    answer: '@RestController',
  },
  {
    question: 'Which SQL command retrieves records from a table?',
    options: ['SELECT', 'INSERT', 'DELETE', 'UPDATE'],
    answer: 'SELECT',
  },
  {
    question: 'Which HTTP method is commonly used to retrieve data?',
    options: ['POST', 'GET', 'DELETE', 'PATCH'],
    answer: 'GET',
  },
  {
    question: 'Which React hook manages component state?',
    options: ['useRoute', 'useFetch', 'useState', 'useStyle'],
    answer: 'useState',
  },
];

async function responseMessage(response) {
  const message = await response.text();
  return message || `Request failed (${response.status}).`;
}

function App() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All levels');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedScore, setSubmittedScore] = useState(null);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizSaveMessage, setQuizSaveMessage] = useState('');

  useEffect(() => {
    let active = true;

    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetch(`${API}/courses`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load courses.');
        return response.json();
      })
      .then(setCourses)
      .catch(() => setError('Could not load courses. Check your backend.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setEnrollments([]);
      setQuizHistory([]);
      return;
    }

    let active = true;

    async function loadStudentData() {
      try {
        const [enrollmentResponse, quizResponse] = await Promise.all([
          fetch(`${API}/enrollments`, { credentials: 'include' }),
          fetch(`${API}/quiz-results`, { credentials: 'include' }),
        ]);

        if (!enrollmentResponse.ok || !quizResponse.ok) {
          throw new Error('Could not load your saved learning data.');
        }

        const [savedEnrollments, savedResults] = await Promise.all([
          enrollmentResponse.json(),
          quizResponse.json(),
        ]);

        if (active) {
          setEnrollments(savedEnrollments);
          setQuizHistory(savedResults);
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    loadStudentData();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      course.title.toLowerCase().includes(term) ||
      course.instructor.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term);

    const matchesLevel =
      levelFilter === 'All levels' || course.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const isEnrolled = (courseId) =>
    enrollments.some((item) => item.courseId === courseId);

  const myCourses = courses
    .map((course) => ({
      course,
      enrollment: enrollments.find(
        (item) => item.courseId === course.id
      ),
    }))
    .filter((item) => item.enrollment);

  async function handleAuth(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setAuthBusy(true);

    const endpoint = authMode === 'register' ? 'register' : 'login';

    try {
      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error(await responseMessage(response));

      const user = await response.json();
      setCurrentUser(user);
      setUsername(user.username);
      setPassword('');
      setNotice(
        authMode === 'register'
          ? 'Account created successfully!'
          : 'Signed in successfully!'
      );
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setError('');
    setNotice('');

    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Clear the local view even if the server connection fails.
    }

    setCurrentUser(null);
    setEnrollments([]);
    setQuizHistory([]);
    setSelectedAnswers({});
    setSubmittedScore(null);
    setQuizSaveMessage('');
    setNotice('You have signed out.');
  }

  async function handleEnroll(course) {
    setError('');
    setNotice('');

    if (!currentUser) {
      setNotice('Please register or sign in before enrolling.');
      document.getElementById('account')?.scrollIntoView({
        behavior: 'smooth',
      });
      return;
    }

    if (isEnrolled(course.id)) {
      setNotice('You are already enrolled in this course.');
      return;
    }

    setEnrollingId(course.id);

    try {
      const response = await fetch(`${API}/enrollments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });

      if (!response.ok) throw new Error(await responseMessage(response));

      const saved = await response.json();
      setEnrollments((previous) => [...previous, saved]);
      setNotice(`Successfully enrolled in ${course.title}!`);
    } catch (err) {
      setError(err.message || 'Could not enroll. Please try again.');
    } finally {
      setEnrollingId(null);
    }
  }

  async function handleComplete(enrollment, courseTitle) {
    setError('');
    setNotice('');
    setCompletingId(enrollment.id);

    try {
      const response = await fetch(
        `${API}/enrollments/${enrollment.id}/complete`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error(await responseMessage(response));

      const updated = await response.json();

      setEnrollments((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setNotice(`${courseTitle} marked as complete!`);
    } catch (err) {
      setError(err.message || 'Could not update your progress.');
    } finally {
      setCompletingId(null);
    }
  }

  async function handleQuizSubmit(event) {
    event.preventDefault();

    const answers = quizQuestions.map(
      (_, index) => selectedAnswers[index]
    );

    const score = quizQuestions.filter(
      (question, index) => selectedAnswers[index] === question.answer
    ).length;

    setSubmittedScore(score);
    setQuizSaveMessage('');

    if (!currentUser) {
      setQuizSaveMessage('Sign in to save this quiz result to your account.');
      return;
    }

    setQuizSaving(true);

    try {
      const response = await fetch(`${API}/quiz-results`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error(await responseMessage(response));

      const saved = await response.json();
      setSubmittedScore(saved.score);
      setQuizHistory((previous) => [saved, ...previous].slice(0, 10));
      setQuizSaveMessage('Quiz result saved to your account.');
    } catch (err) {
      setQuizSaveMessage(
        `${err.message} Your quiz result was not saved.`
      );
    } finally {
      setQuizSaving(false);
    }
  }

  function retakeQuiz() {
    setSelectedAnswers({});
    setSubmittedScore(null);
    setQuizSaveMessage('');
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#top">
          Learn<span>Space.</span>
        </a>
        <span className="nav-label">ONLINE LEARNING</span>
      </nav>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">LEARN SOMETHING NEW</p>
          <h1>Build skills for your future.</h1>
          <p className="hero-text">
            Explore courses, learn at your own pace,
            and take the next step in your learning journey.
          </p>
          <a href="#courses" className="explore-button">
            Explore courses ↓
          </a>
        </section>

        <section className="auth-section" id="account">
          <p className="eyebrow">YOUR STUDENT ACCOUNT</p>

          {authLoading ? (
            <p className="message">Checking your account...</p>
          ) : currentUser ? (
            <div className="signed-in-panel">
              <div>
                <h2>Welcome, {currentUser.username}!</h2>
                <p>Your enrollments and quiz results are linked to your account.</p>
              </div>
              <button
                type="button"
                className="auth-button"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <h2>
                {authMode === 'register'
                  ? 'Create your account'
                  : 'Sign in to LearnSpace'}
              </h2>
              <p className="auth-description">
                Create an account to save your enrollments, completion
                progress, and quiz results separately.
              </p>

              <form className="auth-form" onSubmit={handleAuth}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9_.-]{3,30}"
                  title="Use 3-30 letters, numbers, dots, underscores, or hyphens."
                  required
                />

                <input
                  type="password"
                  placeholder="Password (at least 8 characters)"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    authMode === 'register'
                      ? 'new-password'
                      : 'current-password'
                  }
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="submit"
                  className="auth-button"
                  disabled={authBusy}
                >
                  {authBusy
                    ? 'Please wait...'
                    : authMode === 'register'
                      ? 'Create Account'
                      : 'Sign In'}
                </button>
              </form>

              <button
                type="button"
                className="auth-switch"
                onClick={() => {
                  setAuthMode(
                    authMode === 'register' ? 'login' : 'register'
                  );
                  setError('');
                }}
              >
                {authMode === 'register'
                  ? 'Already registered? Sign in'
                  : "New here? Create an account"}
              </button>
            </>
          )}

          {error && <p className="error">{error}</p>}
        </section>

        <section className="courses-section" id="courses">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING JOURNEY</p>
              <h2>Explore our courses</h2>
            </div>
            <span className="course-count">
              {filteredCourses.length}{' '}
              {filteredCourses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>

          <div className="course-filters">
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search courses"
            />

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              aria-label="Filter by course level"
            >
              <option value="All levels">All levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {notice && <p className="success-message">{notice}</p>}
          {loading && <p className="message">Loading courses...</p>}

          {!loading && courses.length === 0 && !error && (
            <p className="message">No courses are available yet.</p>
          )}

          {!loading && courses.length > 0 && filteredCourses.length === 0 && (
            <p className="message">No matching courses found.</p>
          )}

          <div className="course-grid">
            {filteredCourses.map((course, index) => (
              <article className="course-card" key={course.id}>
                <div className={`course-art art-${index % 3}`}>
                  <span className="course-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="art-symbol">
                    {['⌘', '</>', '▤'][index % 3]}
                  </span>
                  <span className="level">{course.level}</span>
                </div>

                <div className="course-content">
                  <p className="instructor">BY {course.instructor}</p>
                  <h3>{course.title}</h3>
                  <p className="description">{course.description}</p>

                  <div className="course-footer">
                    <span className="price">
                      {Number(course.price) === 0
                        ? 'Free'
                        : `₹${course.price}`}
                    </span>
                    <span className="course-id">COURSE #{course.id}</span>
                  </div>

                  <button
                    type="button"
                    className={`enroll-button ${
                      isEnrolled(course.id) ? 'enrolled' : ''
                    }`}
                    onClick={() => handleEnroll(course)}
                    disabled={
                      isEnrolled(course.id) || enrollingId === course.id
                    }
                  >
                    {isEnrolled(course.id)
                      ? 'Enrolled ✓'
                      : enrollingId === course.id
                        ? 'Enrolling...'
                        : 'Enroll Now →'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="my-learning" id="my-learning">
          <p className="eyebrow">YOUR PERSONAL LEARNING SPACE</p>
          <h2>My Learning</h2>
          <p className="learning-subtitle">
            Track your enrolled and completed courses.
          </p>

          {!currentUser ? (
            <p className="message">
              Sign in to view your personal learning dashboard.
            </p>
          ) : myCourses.length === 0 ? (
            <p className="message">
              You haven't enrolled in any courses yet.
            </p>
          ) : (
            <div className="learning-list">
              {myCourses.map(({ course, enrollment }) => (
                <div className="learning-item" key={enrollment.id}>
                  <div className="learning-details">
                    <h3>{course.title}</h3>
                    <p>{course.level} · {course.instructor}</p>

                    <div className="progress-labels">
                      <span>Course progress</span>
                      <strong>
                        {enrollment.completed ? '100%' : '0%'}
                      </strong>
                    </div>

                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-valuenow={enrollment.completed ? 100 : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${course.title} progress`}
                    >
                      <div
                        className={`progress-fill ${
                          enrollment.completed ? 'progress-done' : ''
                        }`}
                        style={{
                          width: enrollment.completed ? '100%' : '0%',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="complete-button"
                    onClick={() => handleComplete(enrollment, course.title)}
                    disabled={
                      enrollment.completed || completingId === enrollment.id
                    }
                  >
                    {enrollment.completed
                      ? 'Completed ✓'
                      : completingId === enrollment.id
                        ? 'Saving...'
                        : 'Mark as Complete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="quiz-section" id="quiz">
          <p className="eyebrow">TEST YOUR KNOWLEDGE</p>
          <h2>Quick Knowledge Quiz</h2>
          <p className="quiz-intro">
            Answer five questions about React, Spring Boot, web development,
            and databases.
          </p>

          <form onSubmit={handleQuizSubmit}>
            {quizQuestions.map((question, index) => (
              <fieldset className="quiz-question" key={question.question}>
                <legend>{index + 1}. {question.question}</legend>

                <div className="quiz-options">
                  {question.options.map((option) => (
                    <label className="quiz-option" key={option}>
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={selectedAnswers[index] === option}
                        onChange={() => {
                          setSelectedAnswers((previous) => ({
                            ...previous,
                            [index]: option,
                          }));
                          setSubmittedScore(null);
                          setQuizSaveMessage('');
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {submittedScore !== null && (
                  <p
                    className={
                      selectedAnswers[index] === question.answer
                        ? 'answer-feedback correct-answer'
                        : 'answer-feedback wrong-answer'
                    }
                  >
                    {selectedAnswers[index] === question.answer
                      ? 'Correct!'
                      : `Correct answer: ${question.answer}`}
                  </p>
                )}
              </fieldset>
            ))}

            {submittedScore === null ? (
              <button
                type="submit"
                className="quiz-submit"
                disabled={
                  Object.keys(selectedAnswers).length !== quizQuestions.length
                }
              >
                Submit Answers
              </button>
            ) : (
              <div className="quiz-result">
                <h3>Your score: {submittedScore}/5</h3>
                <p>
                  {submittedScore === 5
                    ? 'Excellent work! You got every answer right.'
                    : submittedScore >= 3
                      ? 'Good job! Review your incorrect answers and try again.'
                      : 'Keep practicing! Review the answers and try again.'}
                </p>

                {quizSaving && <p>Saving your result...</p>}
                {quizSaveMessage && <p>{quizSaveMessage}</p>}

                <button
                  type="button"
                  className="quiz-submit"
                  onClick={retakeQuiz}
                  disabled={quizSaving}
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </form>

          {currentUser && (
            <div className="quiz-history">
              <h3>Your Recent Quiz Results</h3>
              {quizHistory.length === 0 ? (
                <p className="message">
                  Your submitted quiz results will appear here.
                </p>
              ) : (
                <div className="learning-list">
                  {quizHistory.map((result) => (
                    <div className="learning-item" key={result.id}>
                      <div>
                        <h3>
                          Score: {result.score}/{result.totalQuestions}
                        </h3>
                        <p>
                          {result.takenAt
                            ? new Date(result.takenAt).toLocaleString()
                            : 'Saved quiz result'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
        
<section className="team-section" id="team">
  <p className="eyebrow">MEET OUR TEAM</p>
  <h2>Project Team</h2>
  <p className="team-intro">
    LearnSpace was developed as a team project.
  </p>

  <div className="team-grid">
    <article className="team-card">
      <div className="team-avatar">01</div>
      <h3>Ruchika Prasadam</h3>
      <p>Roll Number: 24251A05C3</p>
      <span>Frontend & Integration</span>
    </article>

    <article className="team-card">
      <div className="team-avatar">02</div>
      <h3>Aashritha Mandhapati</h3>
      <p>Roll Number: 24251A05B7</p>
      <span>Backend Development</span>
    </article>

    <article className="team-card">
      <div className="team-avatar">03</div>
      <h3>P.Sahasra Reddy</h3>
      <p>Roll Number: 24251A0592</p>
      <span>Database & Testing</span>
    </article>
  </div>
</section>

      </main>

      <footer>
        <a className="logo" href="#top">
          Learn<span>Space.</span>
        </a>
        <p>Learn at your own pace. Grow at your own speed.</p>
      </footer>
    </div>
  );
}

export default App;
