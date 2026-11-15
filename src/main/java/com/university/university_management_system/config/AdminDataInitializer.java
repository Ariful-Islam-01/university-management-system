package com.university.university_management_system.config;

import com.university.university_management_system.entity.Admin;
import com.university.university_management_system.entity.User;
import com.university.university_management_system.repository.AdminRepository;
import com.university.university_management_system.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminDataInitializer.class);

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin.email:${INITIAL_ADMIN_EMAIL:}}")
    private String adminEmail;

    @Value("${app.initial-admin.name:${INITIAL_ADMIN_NAME:}}")
    private String adminName;

    @Value("${app.initial-admin.password:${INITIAL_ADMIN_PASSWORD:}}")
    private String adminPassword;

    @Autowired
    public AdminDataInitializer(
            UserRepository userRepository,
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminDataInitializer(
            UserRepository userRepository,
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            String adminEmail,
            String adminName,
            String adminPassword) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminName = adminName;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail == null || adminEmail.isBlank()
                || adminPassword == null || adminPassword.isBlank()
                || adminName == null || adminName.isBlank()) {
            logger.warn("Initial admin environment variables (INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, INITIAL_ADMIN_PASSWORD) are not fully set. Skipping initial admin provisioning.");
            return;
        }

        String email = adminEmail.trim();
        String name = adminName.trim();

        boolean userExists = userRepository.existsByEmail(email);
        boolean adminExists = adminRepository.existsByEmail(email);

        if (userExists || adminExists) {
            logger.info("Admin account or user with email '{}' already exists. Skipping provisioning.", email);
            return;
        }

        User user = new User(email, passwordEncoder.encode(adminPassword), "ROLE_ADMIN");
        userRepository.save(user);

        Admin admin = new Admin(name, email);
        adminRepository.save(admin);

        logger.info("Initial admin account successfully provisioned for email '{}'.", email);
    }
}
