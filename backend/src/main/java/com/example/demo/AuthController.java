
package com.example.demo;

import java.util.Locale;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
    origins = "${APP_FRONTEND_URL:http://localhost:5173}",
    allowCredentials = "true"
)
public class AuthController {

    private final StudentAccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            StudentAccountRepository accountRepository,
            PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record AuthRequest(String username, String password) {
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody AuthRequest request,
            HttpSession session) {

        if (request.username() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body("Username and password are required.");
        }

        String username = normalizeUsername(request.username());
        String password = request.password();

        if (!username.matches("^[a-z0-9_.-]{3,30}$")) {
            return ResponseEntity.badRequest().body(
                "Username must be 3-30 characters using letters, numbers, dots, underscores, or hyphens."
            );
        }

        if (password.length() < 8 || password.length() > 72) {
            return ResponseEntity.badRequest().body(
                "Password must contain 8-72 characters."
            );
        }

        if (accountRepository.existsByUsernameIgnoreCase(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("That username is already registered.");
        }

        StudentAccount account = new StudentAccount();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(password));

        StudentAccount saved = accountRepository.save(account);

        session.setAttribute("username", saved.getUsername());

        return ResponseEntity.ok(
                Map.of("username", saved.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AuthRequest request,
            HttpServletRequest servletRequest) {

        if (request.username() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body("Username and password are required.");
        }

        String username = normalizeUsername(request.username());

        var account = accountRepository
                .findByUsernameIgnoreCase(username);

        if (account.isEmpty() || !passwordEncoder.matches(
                request.password(), account.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password.");
        }

        HttpSession session = servletRequest.getSession(true);
        servletRequest.changeSessionId();
        session.setAttribute("username", account.get().getUsername());

        return ResponseEntity.ok(
                Map.of("username", account.get().getUsername()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(HttpSession session) {
        String username = (String) session.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not signed in.");
        }

        return ResponseEntity.ok(Map.of("username", username));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
