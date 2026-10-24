
package com.example.demo;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CourseDataLoader implements CommandLineRunner {

    private final CourseRepository courseRepository;

    public CourseDataLoader(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) {
        if (courseRepository.count() == 0) {
            courseRepository.saveAll(List.of(
                new Course(
                    "Java Programming",
                    "Course Team",
                    "Learn Java programming from the basics.",
                    "Beginner",
                    0.0
                ),
                new Course(
                    "Web Development",
                    "Course Team",
                    "Learn HTML, CSS and JavaScript.",
                    "Beginner",
                    0.0
                ),
                new Course(
                    "Database Management",
                    "Course Team",
                    "Learn SQL and database fundamentals.",
                    "Intermediate",
                    0.0
                )
            ));

            System.out.println("Sample courses added successfully!");
        }
    }
}
