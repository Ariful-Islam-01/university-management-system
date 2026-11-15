package com.university.university_management_system.service;

import com.university.university_management_system.entity.Teacher;
import com.university.university_management_system.repository.TeacherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class TeacherServiceTest {

    private TeacherRepository teacherRepository;
    private TeacherService teacherService;

    @BeforeEach
    void setUp() {
        // Simple Mockito mock for repository - no real database needed
        teacherRepository = Mockito.mock(TeacherRepository.class);
        teacherService = new TeacherService(teacherRepository);
    }

    // 4. Teacher can be added successfully
    @Test
    void teacherCanBeAddedSuccessfully() {
        // Arrange: prepare teacher and mock repository behavior
        Teacher teacher = new Teacher("Dr. Alan Turing", "turing@example.com", "Computer Science");
        when(teacherRepository.existsByEmail("turing@example.com")).thenReturn(false);
        when(teacherRepository.save(any(Teacher.class))).thenReturn(teacher);

        // Act: call the service create method
        Teacher result = teacherService.createTeacher(teacher);

        // Assert: verify that the teacher is returned with correct details
        assertNotNull(result);
        assertEquals("Dr. Alan Turing", result.getName());
        assertEquals("turing@example.com", result.getEmail());
    }

    // 5. Teacher can be updated successfully
    @Test
    void teacherCanBeUpdatedSuccessfully() {
        // Arrange: prepare existing teacher and updated information
        Teacher existingTeacher = new Teacher("Dr. Alan Turing", "turing@example.com", "Computer Science");
        Teacher updatedInfo = new Teacher("Prof. Alan Turing", "turing.new@example.com", "Artificial Intelligence");

        when(teacherRepository.findById(1L)).thenReturn(Optional.of(existingTeacher));
        when(teacherRepository.findByEmail("turing.new@example.com")).thenReturn(Optional.empty());
        when(teacherRepository.save(any(Teacher.class))).thenReturn(existingTeacher);

        // Act: call the service update method
        Optional<Teacher> result = teacherService.updateTeacher(1L, updatedInfo);

        // Assert: verify that the updated teacher has the new name and department
        assertTrue(result.isPresent());
        assertEquals("Prof. Alan Turing", result.get().getName());
        assertEquals("Artificial Intelligence", result.get().getDepartment());
    }
}

