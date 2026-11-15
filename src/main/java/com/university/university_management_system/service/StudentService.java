
package com.university.university_management_system.service;

import com.university.university_management_system.dto.StudentCreateRequest;
import com.university.university_management_system.entity.Student;
import com.university.university_management_system.entity.User;
import com.university.university_management_system.repository.StudentRepository;
import com.university.university_management_system.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Autowired
    public StudentService(
            StudentRepository studentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public StudentService(StudentRepository studentRepository) {
        this(studentRepository, null, null);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    @Transactional
    public Student createStudent(Student student) {
        return createStudent(new StudentCreateRequest(
                student.getName(),
                student.getEmail(),
                student.getDepartment()
        ));
    }

    @Transactional
    public Student createStudent(StudentCreateRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        boolean wantsAccount = Boolean.TRUE.equals(request.getCreateAccount())
                || (request.getPassword() != null && !request.getPassword().isBlank())
                || (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank());

        if (wantsAccount) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

            if (!isAdmin) {
                throw new AccessDeniedException("Only administrators can create login accounts");
            }

            String password = request.getPassword();
            String confirmPassword = request.getConfirmPassword();

            if (password == null || password.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
            }
            if (confirmPassword == null || confirmPassword.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirm password is required");
            }
            if (!password.equals(confirmPassword)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
            }

            if (userRepository != null && userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("User with this email already exists");
            }
        }

        Student student = studentRepository.save(new Student(request.getName(), request.getEmail(), request.getDepartment()));

        if (wantsAccount && userRepository != null && passwordEncoder != null) {
            User user = new User(request.getEmail(), passwordEncoder.encode(request.getPassword()), "ROLE_STUDENT");
            userRepository.save(user);
        }

        return student;
    }

    public Optional<Student> updateStudent(Long id, Student updatedStudent) {
        return studentRepository.findById(id).map(student -> {
            Optional<Student> existingStudent =
                    studentRepository.findByEmail(updatedStudent.getEmail());

            if (existingStudent.isPresent()
                    && !existingStudent.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email already exists");
            }

            student.setName(updatedStudent.getName());
            student.setEmail(updatedStudent.getEmail());
            student.setDepartment(updatedStudent.getDepartment());

            return studentRepository.save(student);
        });
    }

    public boolean deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            return false;
        }

        studentRepository.deleteById(id);
        return true;
    }
}
