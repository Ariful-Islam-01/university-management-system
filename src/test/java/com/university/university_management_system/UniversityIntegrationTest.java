package com.university.university_management_system;

import com.university.university_management_system.entity.User;
import com.university.university_management_system.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UniversityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_ADMIN_EMAIL = "admin_test@university.com";

    @AfterEach
    void tearDown() {
        // Arrange cleanup: remove test admin user created during tests
        userRepository.findByEmail(TEST_ADMIN_EMAIL).ifPresent(userRepository::delete);
    }

    // ==========================================
    // Admin Authentication
    // ==========================================

    // 1. Admin login works successfully
    @Test
    void adminLoginWorksSuccessfully() throws Exception {
        // Arrange: save admin user with encoded password in the database
        User adminUser = new User(TEST_ADMIN_EMAIL, passwordEncoder.encode("adminPass123"), "ROLE_ADMIN");
        userRepository.save(adminUser);

        String loginJson = """
            {
                "email": "%s",
                "password": "adminPass123"
            }
            """.formatted(TEST_ADMIN_EMAIL);

        // Act & Assert: perform login with CSRF token and verify 200 OK with expected role
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    // 2. Admin logout works successfully
    @Test
    void adminLogoutWorksSuccessfully() throws Exception {
        // Arrange: save admin user and log in to obtain active session
        User adminUser = new User(TEST_ADMIN_EMAIL, passwordEncoder.encode("adminPass123"), "ROLE_ADMIN");
        userRepository.save(adminUser);

        String loginJson = """
            {
                "email": "%s",
                "password": "adminPass123"
            }
            """.formatted(TEST_ADMIN_EMAIL);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();

        // Act & Assert: perform logout with authenticated session and CSRF token, verify 200 OK
        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout successful"));
    }

    // ==========================================
    // Admin Authorization
    // ==========================================

    // 3. Admin can access Student API
    @Test
    @WithMockUser(username = "admin@university.com", roles = {"ADMIN"})
    void adminCanAccessStudentApi() throws Exception {
        // Act & Assert: request student endpoint as ADMIN and verify 200 OK
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk());
    }

    // ==========================================
    // Teacher Authorization
    // ==========================================

    // 4. Teacher can access Teacher API
    @Test
    @WithMockUser(username = "teacher@university.com", roles = {"TEACHER"})
    void teacherCanAccessTeacherApi() throws Exception {
        // Act & Assert: request teacher endpoint as TEACHER and verify 200 OK
        mockMvc.perform(get("/api/teachers"))
                .andExpect(status().isOk());
    }

    // 5. Teacher cannot access Student API
    @Test
    @WithMockUser(username = "teacher@university.com", roles = {"TEACHER"})
    void teacherCannotAccessStudentApi() throws Exception {
        // Act & Assert: TEACHER role is forbidden from student endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // Student Authorization
    // ==========================================

    // 6. Student can access Student API
    @Test
    @WithMockUser(username = "student@university.com", roles = {"STUDENT"})
    void studentCanAccessStudentApi() throws Exception {
        // Act & Assert: request student endpoint as STUDENT and verify 200 OK
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk());
    }

    // 7. Student cannot access Teacher API
    @Test
    @WithMockUser(username = "student@university.com", roles = {"STUDENT"})
    void studentCannotAccessTeacherApi() throws Exception {
        // Act & Assert: STUDENT role is forbidden from teacher endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/teachers"))
                .andExpect(status().isForbidden());
    }
}
