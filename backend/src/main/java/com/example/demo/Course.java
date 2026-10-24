
package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String instructor;
    private String description;
    private String level;
    private double price;

    public Course() {
    }

    public Course(String title, String instructor,
                  String description, String level, double price) {
        this.title = title;
        this.instructor = instructor;
        this.description = description;
        this.level = level;
        this.price = price;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getInstructor() {
        return instructor;
    }

    public String getDescription() {
        return description;
    }

    public String getLevel() {
        return level;
    }

    public double getPrice() {
        return price;
    }
}
