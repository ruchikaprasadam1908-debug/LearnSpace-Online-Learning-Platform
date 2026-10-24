
package com.example.demo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudentNameIgnoreCase(String studentName);

    boolean existsByCourseIdAndStudentNameIgnoreCase(
        Long courseId, String studentName
    );
}

