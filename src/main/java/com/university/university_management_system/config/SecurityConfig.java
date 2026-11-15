package com.university.university_management_system.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        tokenRepository.setHeaderName("X-CSRF-TOKEN");
        return tokenRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CsrfTokenRepository csrfTokenRepository) throws Exception {
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        // Prevent browser-cached or stale HTTP Basic credentials from hijacking or overriding an active session
        http.addFilterBefore(new org.springframework.web.filter.OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    jakarta.servlet.http.HttpServletRequest request,
                    jakarta.servlet.http.HttpServletResponse response,
                    jakarta.servlet.FilterChain filterChain) throws jakarta.servlet.ServletException, java.io.IOException {

                org.springframework.security.core.Authentication auth =
                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

                boolean hasActiveSession = auth != null && auth.isAuthenticated()
                        && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken);

                if (hasActiveSession && request.getHeader("Authorization") != null) {
                    jakarta.servlet.http.HttpServletRequest wrappedRequest =
                            new jakarta.servlet.http.HttpServletRequestWrapper(request) {
                                @Override
                                public String getHeader(String name) {
                                    if ("Authorization".equalsIgnoreCase(name)) {
                                        return null;
                                    }
                                    return super.getHeader(name);
                                }

                                @Override
                                public java.util.Enumeration<String> getHeaders(String name) {
                                    if ("Authorization".equalsIgnoreCase(name)) {
                                        return java.util.Collections.emptyEnumeration();
                                    }
                                    return super.getHeaders(name);
                                }

                                @Override
                                public java.util.Enumeration<String> getHeaderNames() {
                                    java.util.List<String> names = java.util.Collections.list(super.getHeaderNames());
                                    names.removeIf(n -> "Authorization".equalsIgnoreCase(n));
                                    return java.util.Collections.enumeration(names);
                                }
                            };
                    filterChain.doFilter(wrappedRequest, response);
                } else {
                    filterChain.doFilter(request, response);
                }
            }
        }, org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(requestHandler)
                )
                .sessionManagement(session -> session
                        .sessionFixation(fixation -> fixation.changeSessionId())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/", "/index.html", "/style.css", "/app.js", "/favicon.ico").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/csrf").permitAll()
                        .requestMatchers("/api/auth/logout", "/api/auth/me").authenticated()
                        .requestMatchers("/api/admins", "/api/admins/**").hasRole("ADMIN")
                        .requestMatchers("/api/teachers", "/api/teachers/**").hasAnyRole("ADMIN", "TEACHER")
                        .requestMatchers("/api/students", "/api/students/**").hasAnyRole("ADMIN", "STUDENT")
                        .anyRequest().authenticated()
                )
                .httpBasic(basic -> basic
                        .securityContextRepository(new org.springframework.security.web.context.RequestAttributeSecurityContextRepository())
                );

        return http.build();
    }
}
