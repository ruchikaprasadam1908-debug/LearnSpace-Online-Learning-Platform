
package com.example.demo;

import java.time.LocalDateTime;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(
    origins = "${APP_FRONTEND_URL:http://localhost:5173}",
    allowCredentials = "true"
)
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentController(
            EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping
    public ResponseEntity<?> getEnrollments(HttpSession session) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in.");
        }

        return ResponseEntity.ok(
                enrollmentRepository.findByStudentNameIgnoreCase(username));
    }

    @PostMapping
    public ResponseEntity<?> enroll(
            @RequestBody Enrollment request,
            HttpSession session) {

        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in before enrolling.");
        }

        if (request.getCourseId() == null) {
            return ResponseEntity.badRequest()
                    .body("Course ID is required.");
        }

        if (!courseRepository.existsById(request.getCourseId())) {
            return ResponseEntity.badRequest()
                    .body("Course not found.");
        }

        if (enrollmentRepository
                .existsByCourseIdAndStudentNameIgnoreCase(
                    request.getCourseId(), username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You are already enrolled in this course.");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setCourseId(request.getCourseId());
        enrollment.setStudentName(username);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setCompleted(false);

        return ResponseEntity.ok(
                enrollmentRepository.save(enrollment));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeEnrollment(
            @PathVariable Long id,
            HttpSession session) {

        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in.");
        }

        var result = enrollmentRepository.findById(id);

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Enrollment enrollment = result.get();

        if (!username.equalsIgnoreCase(enrollment.getStudentName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You cannot change another student's progress.");
        }

        enrollment.setCompleted(true);
        return ResponseEntity.ok(enrollmentRepository.save(enrollment));
    }
}
