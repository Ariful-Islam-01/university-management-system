package com.university.university_management_system.service;

import com.university.university_management_system.entity.Admin;
import com.university.university_management_system.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Optional<Admin> getAdminById(Long id) {
        return adminRepository.findById(id);
    }

    public Admin createAdmin(Admin admin) {
        if (adminRepository.existsByEmail(admin.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        return adminRepository.save(admin);
    }

    public Optional<Admin> updateAdmin(Long id, Admin updatedAdmin) {
        return adminRepository.findById(id).map(admin -> {
            Optional<Admin> existingAdmin =
                    adminRepository.findByEmail(updatedAdmin.getEmail());

            if (existingAdmin.isPresent()
                    && !existingAdmin.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email already exists");
            }

            admin.setName(updatedAdmin.getName());
            admin.setEmail(updatedAdmin.getEmail());

            return adminRepository.save(admin);
        });
    }

    public boolean deleteAdmin(Long id) {
        if (!adminRepository.existsById(id)) {
            return false;
        }

        adminRepository.deleteById(id);
        return true;
    }
}
