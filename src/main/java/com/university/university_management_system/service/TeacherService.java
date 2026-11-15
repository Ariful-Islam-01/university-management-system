package com.university.university_management_system.service;

import com.university.university_management_system.dto.TeacherCreateRequest;
import com.university.university_management_system.entity.Teacher;
import com.university.university_management_system.entity.User;
import com.university.university_management_system.repository.TeacherRepository;
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
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Autowired
    public TeacherService(
            TeacherRepository teacherRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public TeacherService(TeacherRepository teacherRepository) {
        this(teacherRepository, null, null);
    }

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }

    @Transactional
    public Teacher createTeacher(Teacher teacher) {
        return createTeacher(new TeacherCreateRequest(
                teacher.getName(),
                teacher.getEmail(),
                teacher.getDepartment()
        ));
    }

    @Transactional
    public Teacher createTeacher(TeacherCreateRequest request) {
        if (teacherRepository.existsByEmail(request.getEmail())) {
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

        Teacher teacher = teacherRepository.save(new Teacher(request.getName(), request.getEmail(), request.getDepartment()));

        if (wantsAccount && userRepository != null && passwordEncoder != null) {
            User user = new User(request.getEmail(), passwordEncoder.encode(request.getPassword()), "ROLE_TEACHER");
            userRepository.save(user);
        }

        return teacher;
    }

    public Optional<Teacher> updateTeacher(Long id, Teacher updatedTeacher) {
        return teacherRepository.findById(id).map(teacher -> {
            Optional<Teacher> existingTeacher =
                    teacherRepository.findByEmail(updatedTeacher.getEmail());

            if (existingTeacher.isPresent()
                    && !existingTeacher.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email already exists");
            }

            teacher.setName(updatedTeacher.getName());
            teacher.setEmail(updatedTeacher.getEmail());
            teacher.setDepartment(updatedTeacher.getDepartment());

            return teacherRepository.save(teacher);
        });
    }

    public boolean deleteTeacher(Long id) {
        if (!teacherRepository.existsById(id)) {
            return false;
        }

        teacherRepository.deleteById(id);
        return true;
    }
}
