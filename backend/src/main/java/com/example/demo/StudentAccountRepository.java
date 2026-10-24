
package com.example.demo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentAccountRepository
        extends JpaRepository<StudentAccount, Long> {

    Optional<StudentAccount> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);
}
