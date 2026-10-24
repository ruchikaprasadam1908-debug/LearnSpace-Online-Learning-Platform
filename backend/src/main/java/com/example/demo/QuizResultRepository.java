
package com.example.demo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizResultRepository
        extends JpaRepository<QuizResult, Long> {

    List<QuizResult> findTop10ByUsernameIgnoreCaseOrderByTakenAtDesc(
            String username);
}
