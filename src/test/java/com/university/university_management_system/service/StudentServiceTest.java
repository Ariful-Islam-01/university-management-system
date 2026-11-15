package com.university.university_management_system.service;

import com.university.university_management_system.entity.Student;
import com.university.university_management_system.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentServiceTest {

    private StudentRepository studentRepository;
    private StudentService studentService;

    @BeforeEach
    void setUp() {
        // Simple Mockito mock for repository - no real database needed
        studentRepository = Mockito.mock(StudentRepository.class);
        studentService = new StudentService(studentRepository);
    }

    // 1. Student can be added successfully
    @Test
    void studentCanBeAddedSuccessfully() {
        // Arrange: prepare student and mock repository behavior
        Student student = new Student("John Doe", "john@example.com", "Computer Science");
        when(studentRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        // Act: call the service method
        Student result = studentService.createStudent(student);

        // Assert: verify that the student is returned with correct details
        assertNotNull(result);
        assertEquals("John Doe", result.getName());
        assertEquals("john@example.com", result.getEmail());
    }

    // 2. Student can be updated successfully
    @Test
    void studentCanBeUpdatedSuccessfully() {
        // Arrange: prepare existing student and updated information
        Student existingStudent = new Student("John Doe", "john@example.com", "Computer Science");
        Student updatedInfo = new Student("John Updated", "john.updated@example.com", "Software Engineering");

        when(studentRepository.findById(1L)).thenReturn(Optional.of(existingStudent));
        when(studentRepository.findByEmail("john.updated@example.com")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenReturn(existingStudent);

        // Act: call the service update method
        Optional<Student> result = studentService.updateStudent(1L, updatedInfo);

        // Assert: verify that the updated student has the new name and department
        assertTrue(result.isPresent());
        assertEquals("John Updated", result.get().getName());
        assertEquals("Software Engineering", result.get().getDepartment());
    }

    // 3. Student can be deleted successfully
    @Test
    void studentCanBeDeletedSuccessfully() {
        // Arrange: mock repository to confirm the student exists
        Long studentId = 1L;
        when(studentRepository.existsById(studentId)).thenReturn(true);

        // Act: call the service delete method
        boolean isDeleted = studentService.deleteStudent(studentId);

        // Assert: verify deletion returned true and repository delete was called
        assertTrue(isDeleted);
        verify(studentRepository).deleteById(studentId);
    }

    // 6. Duplicate email is rejected
    @Test
    void duplicateEmailIsRejected() {
        // Arrange: mock repository to indicate the email is already in use
        Student student = new Student("Alice Smith", "duplicate@example.com", "Mathematics");
        when(studentRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        // Act & Assert: verify that IllegalArgumentException is thrown with correct message
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> studentService.createStudent(student)
        );
        assertEquals("Email already exists", exception.getMessage());
    }
}

