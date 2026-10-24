
package com.example.demo;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quiz-results")
@CrossOrigin(
    origins = "${APP_FRONTEND_URL:http://localhost:5173}",
    allowCredentials = "true"
)
public class QuizResultController {

    private final QuizResultRepository resultRepository;

    private final List<String> correctAnswers = List.of(
        "JavaScript",
        "@RestController",
        "SELECT",
        "GET",
        "useState"
    );

    public QuizResultController(QuizResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    public record QuizSubmission(List<String> answers) {
    }

    @GetMapping
    public ResponseEntity<?> getResults(HttpSession session) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in.");
        }

        return ResponseEntity.ok(
                resultRepository
                    .findTop10ByUsernameIgnoreCaseOrderByTakenAtDesc(username));
    }

    @PostMapping
    public ResponseEntity<?> saveResult(
            @RequestBody QuizSubmission submission,
            HttpSession session) {

        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in to save quiz results.");
        }

        if (submission.answers() == null
                || submission.answers().size() != correctAnswers.size()
                || submission.answers().stream().anyMatch(a -> a == null)) {
            return ResponseEntity.badRequest()
                    .body("Please submit answers to all five questions.");
        }

        int score = 0;

        for (int i = 0; i < correctAnswers.size(); i++) {
            if (correctAnswers.get(i).equals(submission.answers().get(i))) {
                score++;
            }
        }

        QuizResult result = new QuizResult();
        result.setUsername(username);
        result.setScore(score);
        result.setTotalQuestions(correctAnswers.size());
        result.setTakenAt(LocalDateTime.now());

        QuizResult saved = resultRepository.save(result);

        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "username", saved.getUsername(),
            "score", saved.getScore(),
            "totalQuestions", saved.getTotalQuestions(),
            "takenAt", saved.getTakenAt()
        ));
    }
}
