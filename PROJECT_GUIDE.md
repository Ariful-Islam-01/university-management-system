# University Management System — Complete Educational Guide & Architectural Documentation

Welcome to the comprehensive architecture and learning guide for the **University Management System (UMS)**.

This document is crafted specifically for university Computer Science & Engineering (CSE) students, instructors, and examiners. It explains how modern, enterprise-grade Java web applications are structured, secured, tested, containerized, and deployed using Spring Boot, Spring Security, MariaDB, Docker, and Vanilla JavaScript.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Complete Project Structure](#2-complete-project-structure)
3. [Spring Boot Fundamentals Used in This Project](#3-spring-boot-fundamentals-used-in-this-project)
4. [Backend Architecture & Layered Design](#4-backend-architecture--layered-design)
5. [REST API and HTTP Specification](#5-rest-api-and-http-specification)
6. [Frontend Architecture & Client Logic](#6-frontend-architecture--client-logic)
7. [Database and JPA/Hibernate Data Layer](#7-database-and-jpahibernate-data-layer)
8. [Spring Security, Authentication, and RBAC](#8-spring-security-authentication-and-rbac)
9. [Docker & Containerized Deployment](#9-docker--containerized-deployment)
10. [Automated Testing Strategy](#10-automated-testing-strategy)
11. [Complete End-to-End Request Flow](#11-complete-end-to-end-request-flow)
12. [Teacher Viva Preparation (30 Questions & Answers)](#12-teacher-viva-preparation-30-questions--answers)
13. [Important Commands Reference](#13-important-commands-reference)
14. [One-Page Quick Revision Summary](#14-one-page-quick-revision-summary)

---

## 1. Project Overview

### What the University Management System Does
The **University Management System (UMS)** is a full-stack web application designed to manage university personnel records (Administrators, Teachers, and Students) while enforcing strict **Role-Based Access Control (RBAC)**, session-based authentication, password encryption, and database integrity.

The system serves two essential purposes:
1. **Academic Personnel Record Management (CRUD):** Creating, reading, updating, and deleting profiles for Administrators, Teachers, and Students.
2. **User Credential Provisioning:** Allowing authorized administrators to seamlessly create user login accounts simultaneously when adding teacher or student records.

### Main Features & Roles

```
+---------------------------------------------------------------------------------------+
|                                    USER ROLES                                         |
+---------------------------+---------------------------+-------------------------------+
|        ROLE_ADMIN         |       ROLE_TEACHER        |         ROLE_STUDENT          |
+---------------------------+---------------------------+-------------------------------+
| - Full access to all data | - Can view & edit Teacher | - Can view & edit Student     |
| - Manage Admins           |   directory records       |   directory records           |
| - Manage Teachers         | - Forbidden from Admins   | - Forbidden from Admins       |
| - Manage Students         | - Forbidden from Students | - Forbidden from Teachers     |
| - Provision User logins   | - Cannot create logins    | - Cannot create logins        |
+---------------------------+---------------------------+-------------------------------+
```

- **Single Sign-On / Session Authentication:** Secure authentication using Spring Security sessions (`JSESSIONID`) and CSRF tokens (`XSRF-TOKEN`).
- **Atomic Profile & Account Creation:** When an Admin creates a Teacher or Student, they can optionally check "Create login account" with a password. Spring's `@Transactional` guarantees both records are saved together, or both rolled back if anything fails.
- **Single Page Application (SPA) Experience:** Built using pure HTML5, CSS3, and modern Vanilla JavaScript without any bulky external frameworks or NPM dependencies.
- **Automated Initial Provisioning:** On startup, the system automatically checks for `INITIAL_ADMIN_*` environment variables and provisions an initial Admin account if the database is empty.
- **Dockerized Architecture:** Fully containerized with a multi-stage Dockerfile and a multi-container Docker Compose setup with MariaDB health checks.

### Technology Stack & Justification

| Technology | Role | Why It Was Chosen |
|---|---|---|
| **Java 21 (LTS)** | Core Language | Long-Term Support release with modern language features (text blocks, pattern matching, records), high performance, and strong typing. |
| **Spring Boot 4.1.2** | Application Framework | Industry standard for Java web services. Eliminates boilerplate configuration, provides embedded Tomcat, and offers production-ready defaults. |
| **Spring Web (MVC)** | REST API Engine | Maps incoming HTTP requests to controller methods, serializes/deserializes JSON automatically, and standardizes error responses. |
| **Spring Data JPA & Hibernate** | Object-Relational Mapping (ORM) | Simplifies SQL operations by mapping Java classes (entities) to relational tables. Reduces repetitive SQL queries to simple repository interfaces. |
| **Spring Security** | Security & RBAC | Provides comprehensive filter-chain security, CSRF protection, session fixation mitigation, role-based URL authorization, and BCrypt hashing. |
| **MariaDB 10.11 / MySQL** | Relational Database | Reliable, open-source relational database that guarantees ACID compliance (Atomicity, Consistency, Isolation, Durability) for student and academic records. |
| **HTML5 / CSS3 / Vanilla JS** | Frontend | Zero build tools, zero node_modules, zero framework bloat. Fast load times, beginner-friendly, and demonstrates fundamental web principles. |
| **Docker & Docker Compose** | Containerization | Ensures the exact same database and application environment runs on any developer's machine or production server without manual software installs. |
| **Maven Wrapper (`mvnw`)** | Build Automation | Manages dependencies, compiles source code, runs automated tests, and packages the runnable JAR without requiring Maven pre-installed on the host. |

---

## 2. Complete Project Structure

Here is the actual directory and file layout of the repository:

```
university-management-system/
|-- .dockerignore                               # Excludes build artifacts/logs from Docker builds
|-- .env                                        # Local environment variables (DB passwords, admin seed)
|-- .gitignore                                  # Git exclusion rules
|-- compose.yaml                                # Docker Compose configuration (App + MariaDB)
|-- Dockerfile                                  # Multi-stage container build definition
|-- mvnw                                        # Maven Wrapper Unix script
|-- mvnw.cmd                                    # Maven Wrapper Windows batch script
|-- pom.xml                                     # Maven Project Object Model (Dependencies & plugins)
|-- PROJECT_GUIDE.md                            # Comprehensive project documentation (This file)
|
+-- src/
    +-- main/
    |   +-- java/com/university/university_management_system/
    |   |   |-- UniversityManagementSystemApplication.java   # Spring Boot entry point
    |   |   |
    |   |   +-- config/
    |   |   |   |-- AdminDataInitializer.java                # Auto-provisions seed Admin account
    |   |   |   +-- SecurityConfig.java                      # Spring Security filter chain & RBAC
    |   |   |
    |   |   +-- controller/
    |   |   |   |-- AdminController.java                     # REST endpoints for /api/admins
    |   |   |   |-- AuthController.java                      # Login, logout, /me, and CSRF endpoints
    |   |   |   |-- StudentController.java                   # REST endpoints for /api/students
    |   |   |   +-- TeacherController.java                   # REST endpoints for /api/teachers
    |   |   |
    |   |   +-- dto/
    |   |   |   |-- LoginRequest.java                        # Login payload (email, password)
    |   |   |   |-- StudentCreateRequest.java                # Student creation payload + credentials
    |   |   |   +-- TeacherCreateRequest.java                # Teacher creation payload + credentials
    |   |   |
    |   |   +-- entity/
    |   |   |   |-- Admin.java                               # JPA Entity mapping to "admins" table
    |   |   |   |-- Student.java                             # JPA Entity mapping to "students" table
    |   |   |   |-- Teacher.java                             # JPA Entity mapping to "teachers" table
    |   |   |   +-- User.java                                # JPA Entity mapping to "users" table
    |   |   |
    |   |   +-- exception/
    |   |   |   +-- GlobalExceptionHandler.java              # Centralized HTTP status code handler
    |   |   |
    |   |   +-- repository/
    |   |   |   |-- AdminRepository.java                     # Spring Data JPA interface for admins
    |   |   |   |-- StudentRepository.java                   # Spring Data JPA interface for students
    |   |   |   |-- TeacherRepository.java                   # Spring Data JPA interface for teachers
    |   |   |   +-- UserRepository.java                      # Spring Data JPA interface for users
    |   |   |
    |   |   +-- service/
    |   |       |-- AdminService.java                        # Business logic for Admin profiles
    |   |       |-- CustomUserDetailsService.java            # Spring Security user loading bridge
    |   |       |-- StudentService.java                      # Business logic & transaction for Students
    |   |       +-- TeacherService.java                      # Business logic & transaction for Teachers
    |   |
    |   +-- resources/
    |       |-- application.properties                       # Spring Boot configuration file
    |       +-- static/                                      # Embedded Single Page Application
    |           |-- app.js                                   # Frontend API calls & DOM controller
    |           |-- index.html                               # Responsive HTML structure & forms
    |           +-- style.css                                # Modern CSS design system & styles
    |
    +-- test/
        +-- java/com/university/university_management_system/
            |-- TeacherStudentAccountIntegrationTest.java    # Integration tests for combined creation
            |-- UniversityManagementSystemApplicationTests.java # Context loading & route smoke tests
            |
            +-- config/
            |   |-- AdminDataInitializerTest.java            # Unit tests for startup admin seeding
            |   +-- SecurityRbacIntegrationTest.java         # 30+ tests for RBAC, CSRF & sessions
            |
            +-- service/
                |-- AdminServiceTest.java                    # Unit tests with Mockito for AdminService
                +-- CustomUserDetailsServiceTest.java        # Unit tests for UserDetailsService
```

### Purpose of Each Important Java Class

| Class Name | Package | Purpose in the System |
|---|---|---|
| `UniversityManagementSystemApplication` | Root | The main entry point containing the standard `main()` method that boots up Spring Boot. |
| `SecurityConfig` | `.config` | Configures the security filter chain, CSRF rules, session management, URL authorization rules, and password encoder. |
| `AdminDataInitializer` | `.config` | Runs on application startup (`CommandLineRunner`) to provision the default system administrator if configured. |
| `AdminController` | `.controller` | Exposes REST endpoints (`GET`, `POST`, `PUT`, `DELETE`) for administrator profiles under `/api/admins`. |
| `TeacherController` | `.controller` | Exposes REST endpoints for teacher profiles under `/api/teachers`. |
| `StudentController` | `.controller` | Exposes REST endpoints for student profiles under `/api/students`. |
| `AuthController` | `.controller` | Handles authentication tasks: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, and `/api/auth/csrf`. |
| `AdminService` | `.service` | Implements business logic and validation for Administrator records. |
| `TeacherService` | `.service` | Coordinates teacher record persistence and optional login account creation within atomic transactions. |
| `StudentService` | `.service` | Coordinates student record persistence and optional login account creation within atomic transactions. |
| `CustomUserDetailsService` | `.service` | Implements Spring Security's `UserDetailsService` to look up users by email and grant authorities. |
| `Admin`, `Teacher`, `Student` | `.entity` | JPA entities representing personnel directories in MariaDB (`admins`, `teachers`, `students` tables). |
| `User` | `.entity` | JPA entity storing authentication credentials (email, BCrypt password, role) in the `users` table. |
| `GlobalExceptionHandler` | `.exception` | Intercepts validation errors, missing records, unauthorized attempts, and email conflicts to output clean JSON. |

---

## 3. Spring Boot Fundamentals Used in This Project

### What Spring Boot Is
Spring Boot is an extension of the Spring framework that simplifies Java application development. Traditionally, Spring required hundreds of lines of complex XML or Java configuration to configure a web server, dispatcher servlets, and database connections. Spring Boot provides **"opinionated auto-configuration"**: it detects libraries on your classpath (like `spring-boot-starter-web` and `spring-boot-starter-data-jpa`) and automatically configures Tomcat, database pools, and JSON processors.

### Main Application Class
Located at `com.university.university_management_system.UniversityManagementSystemApplication`:

```java
@SpringBootApplication
public class UniversityManagementSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(UniversityManagementSystemApplication.class, args);
    }
}
```

The `@SpringBootApplication` annotation combines three critical annotations:
1. `@SpringBootConfiguration`: Declares this class as a configuration source for Spring beans.
2. `@EnableAutoConfiguration`: Tells Spring Boot to automatically configure components based on JAR dependencies.
3. `@ComponentScan`: Tells Spring to scan the current package (`com.university.university_management_system`) and all child sub-packages for `@Component`, `@Service`, `@Repository`, and `@RestController` classes.

### Dependency Injection (DI) and Inversion of Control (IoC)
In traditional Java programming, if a class needs a dependency, it creates it using `new`:
```java
// Traditional tight coupling (NOT used here):
public class TeacherController {
    private TeacherService service = new TeacherService();
}
```
In this project, we use **Inversion of Control (IoC)** via **Constructor-based Dependency Injection**:
```java
// Loose coupling with Dependency Injection:
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {
    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService; // Spring automatically provides this bean!
    }
}
```
**Benefits:**
- **Loose Coupling:** The controller doesn't need to know how to construct `TeacherService`.
- **Testability:** During unit testing, we can easily pass mock services into the constructor.
- **Single Source of Truth:** Spring manages services as singletons in the Application Context.

### Maven and `pom.xml`
Maven is the dependency and build manager. The `pom.xml` (Project Object Model) defines:
- **Parent Starter:** `spring-boot-starter-parent` (version `4.1.2`), defining plugin versions and Java 21 compatibility.
- **Dependencies:**
  - `spring-boot-starter-webmvc`: Provides Spring MVC and the embedded Apache Tomcat container.
  - `spring-boot-starter-data-jpa`: Provides Hibernate ORM and Spring Data JPA.
  - `spring-boot-starter-security`: Provides Spring Security and BCrypt encryption.
  - `spring-boot-starter-validation`: Provides Jakarta Bean Validation annotations (`@NotBlank`, `@Email`).
  - `mysql-connector-j`: The JDBC driver allowing Java to communicate over the network with MySQL/MariaDB.
  - Test starters (`spring-boot-starter-*-test`): JUnit 5, Mockito, and Spring MockMvc.

### How the Application Starts Up
When you run `java -jar app.jar` or execute `mvnw spring-boot:run`:
1. The JVM invokes `UniversityManagementSystemApplication.main()`.
2. `SpringApplication.run()` initializes the Spring Application Context.
3. Spring Boot scans packages and registers all Beans.
4. Embedded Tomcat initializes on port `8081`.
5. Spring Data JPA connects to MariaDB and verifies/updates database schemas.
6. The security filter chain is mounted.
7. Any `CommandLineRunner` beans (such as `AdminDataInitializer`) execute to seed initial data.
8. The server begins listening for HTTP requests on `http://localhost:8081`.

### How `application.properties` Works
Located in `src/main/resources/application.properties`, this file configures Spring Boot defaults:

```properties
spring.application.name=university-management-system

spring.datasource.url=jdbc:mysql://localhost:3306/university_management_db
spring.datasource.username=root
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

server.port=8081
```
- `spring.datasource.*`: Specifies the JDBC connection string, database credentials, and driver destination.
- `spring.jpa.hibernate.ddl-auto=update`: Instructs Hibernate to automatically create or alter database tables to match your Java entity classes without dropping existing data.
- `server.port=8081`: Configures the embedded Tomcat server to bind to port 8081 instead of the default 8080.

---

## 4. Backend Architecture

The backend strictly follows the industry-standard **Separation of Concerns (SoC)** layered architecture:

```
[ HTTP Request from Browser / Client ]
                 |
                 v
       +-------------------+
       |   Security Filter | (Checks CSRF, Session Cookie, and RBAC permissions)
       +-------------------+
                 |
                 v
       +-------------------+
       |    Controller     | (Exposes endpoints, validates DTO inputs, returns ResponseEntity)
       +-------------------+
                 |
                 v
       +-------------------+
       |     Service       | (Business logic, password encoding, @Transactional boundaries)
       +-------------------+
                 |
                 v
       +-------------------+
       |    Repository     | (Spring Data JPA queries communicating with the database)
       +-------------------+
                 |
                 v
       +-------------------+
       |  MariaDB Database | (Persists data in tables: teachers, students, admins, users)
       +-------------------+
```

### Component Responsibilities

1. **Entity (`entity/`):**
   - Pure Java class annotated with `@Entity` and `@Table`.
   - Represents a table row in MariaDB.
   - Example: `Teacher.java` has columns `id`, `name`, `email`, and `department`.
2. **DTO — Data Transfer Object (`dto/`):**
   - Decouples client request payloads from internal database entities.
   - Contains Jakarta Bean Validation annotations (`@NotBlank`, `@Email`).
   - Example: `TeacherCreateRequest.java` includes `createAccount`, `password`, and `confirmPassword`, which do not belong in the `teachers` database table.
3. **Repository (`repository/`):**
   - Interface extending `JpaRepository<T, ID>`.
   - Spring automatically provides SQL queries for `findAll()`, `findById()`, `save()`, and `deleteById()`.
   - Can declare custom query methods like `findByEmail(String email)` or `existsByEmail(String email)`.
4. **Service (`service/`):**
   - Annotated with `@Service`.
   - Houses the core business logic, validation rules, password hashing, and role verification.
   - Manages database transaction boundaries using `@Transactional`.
5. **Controller (`controller/`):**
   - Annotated with `@RestController` and `@RequestMapping`.
   - The presentation layer that handles HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
   - Validates incoming DTOs using `@Valid` and returns standard HTTP responses (`ResponseEntity`).
6. **Exception Handler (`exception/GlobalExceptionHandler.java`):**
   - Annotated with `@RestControllerAdvice`.
   - Catches exceptions thrown anywhere in controllers or services and converts them into clean JSON error responses instead of ugly HTML error pages.

### Step-by-Step Request Flow: Creating a Teacher with an Account

Let us trace what happens when an Admin creates a new teacher with a login account:

```
1. Admin fills form in Browser -> clicks "Save Teacher"
2. app.js sends:
   POST /api/teachers
   Headers: Content-Type: application/json, X-CSRF-TOKEN: <token>, Cookie: JSESSIONID=<id>
   Body: {"name":"Alan Turing","email":"aturing@uni.com","department":"CSE","createAccount":true,"password":"Secret123!","confirmPassword":"Secret123!"}
3. Spring Security Filter:
   - Validates CSRF token header against session.
   - Verifies JSESSIONID belongs to an active user with ROLE_ADMIN.
4. TeacherController:
   - Method createTeacher(@Valid @RequestBody TeacherCreateRequest request) is invoked.
   - Validates that name, email, and department are not blank.
5. TeacherService:
   - createTeacher(TeacherCreateRequest) runs inside a database transaction (@Transactional).
   - Checks if email already exists in teachers table.
   - Because createAccount is true, it verifies:
     a) Current user is ROLE_ADMIN.
     b) Password and confirmPassword are not blank and match.
     c) Email does not already exist in users table.
     d) Hashes password using BCrypt: passwordEncoder.encode("Secret123!").
     e) Saves new User("aturing@uni.com", hashedPassword, "ROLE_TEACHER") via UserRepository.
   - Creates new Teacher("Alan Turing", "aturing@uni.com", "CSE") and saves via TeacherRepository.
   - If ANY error occurs (e.g. database failure), @Transactional rolls back both inserts!
6. TeacherController:
   - Receives saved Teacher object (without any password fields).
   - Wraps it in ResponseEntity.status(HttpStatus.CREATED).body(createdTeacher).
7. Browser:
   - Receives HTTP 201 Created and JSON representation of the new Teacher.
   - Displays a green success banner and refreshes the teacher table.
```

---

## 5. REST API and HTTP

### What REST and RESTful Mean
- **API (Application Programming Interface):** A standardized way for computer programs to talk to one another over a network.
- **REST (Representational State Transfer):** An architectural style for network applications. It uses standard HTTP requests to post data (create), read data, put data (update), and delete data.
- **RESTful API:** An API that adheres to REST principles: stateless communication, resource-based URLs (using nouns like `/api/teachers`), standard HTTP status codes, and JSON representation.

### HTTP Methods Used in This System
- **`GET`:** Safe, idempotent method used to retrieve resources from the server without modifying anything.
- **`POST`:** Used to submit data and create a new resource on the server.
- **`PUT`:** Idempotent method used to completely update an existing resource identified by ID.
- **`DELETE`:** Used to remove an existing resource identified by ID.

### Complete Endpoint Reference

#### 1. Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/auth/csrf` | `GET` | **Public** | Returns the current CSRF token and sets the `XSRF-TOKEN` cookie. |
| `/api/auth/login` | `POST` | **Public** | Authenticates user via email and password; establishes `JSESSIONID`. |
| `/api/auth/logout` | `POST` | Authenticated | Clears the Spring Security context and invalidates the session. |
| `/api/auth/me` | `GET` | Authenticated | Returns the email and role of the currently signed-in user. |

**Login Request Example:**
```http
POST /api/auth/login
Content-Type: application/json
X-CSRF-TOKEN: 8f4e2b10-6c9a-4e88-922c-a2f07849c7aa

{
  "email": "admin@university.com",
  "password": "unipassadmin3220"
}
```
**Login Response (200 OK):**
```json
{
  "message": "Login successful",
  "email": "admin@university.com",
  "role": "ROLE_ADMIN"
}
```

#### 2. Administrator Resource Endpoints (`/api/admins`)

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/admins` | `GET` | `ROLE_ADMIN` | List all administrator records. |
| `/api/admins/{id}` | `GET` | `ROLE_ADMIN` | Retrieve single administrator by primary key ID. |
| `/api/admins` | `POST` | `ROLE_ADMIN` | Create a new administrator record. |
| `/api/admins/{id}` | `PUT` | `ROLE_ADMIN` | Update an existing administrator by ID. |
| `/api/admins/{id}` | `DELETE` | `ROLE_ADMIN` | Delete an administrator by ID. |

**Admin Creation Request:**
```http
POST /api/admins
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "name": "Sarah Connor",
  "email": "sconnor@university.com"
}
```
**Admin Creation Response (201 Created):**
```json
{
  "id": 2,
  "name": "Sarah Connor",
  "email": "sconnor@university.com"
}
```

#### 3. Teacher Resource Endpoints (`/api/teachers`)

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/teachers` | `GET` | `ROLE_ADMIN`, `ROLE_TEACHER` | List all teacher records. |
| `/api/teachers/{id}` | `GET` | `ROLE_ADMIN`, `ROLE_TEACHER` | Retrieve single teacher by ID. |
| `/api/teachers` | `POST` | `ROLE_ADMIN`, `ROLE_TEACHER`* | Create teacher profile (Account creation is `ROLE_ADMIN` only). |
| `/api/teachers/{id}` | `PUT` | `ROLE_ADMIN`, `ROLE_TEACHER` | Update teacher profile by ID. |
| `/api/teachers/{id}` | `DELETE` | `ROLE_ADMIN`, `ROLE_TEACHER` | Delete teacher by ID. |

*Note: If `createAccount: true` or password fields are submitted by non-admin roles, the backend rejects the request with `403 Forbidden`.*

**Teacher Creation (With Optional Login Account):**
```http
POST /api/teachers
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "name": "Dr. Alan Turing",
  "email": "aturing@university.com",
  "department": "Computer Science",
  "createAccount": true,
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```
**Teacher Creation Response (201 Created):**
```json
{
  "id": 5,
  "name": "Dr. Alan Turing",
  "email": "aturing@university.com",
  "department": "Computer Science"
}
```
*(Notice that passwords or password hashes are NEVER exposed in response bodies).*

#### 4. Student Resource Endpoints (`/api/students`)

| Endpoint | Method | Allowed Roles | Description |
|---|---|---|---|
| `/api/students` | `GET` | `ROLE_ADMIN`, `ROLE_STUDENT` | List all student records. |
| `/api/students/{id}` | `GET` | `ROLE_ADMIN`, `ROLE_STUDENT` | Retrieve single student by ID. |
| `/api/students` | `POST` | `ROLE_ADMIN`, `ROLE_STUDENT`* | Create student profile (Account creation is `ROLE_ADMIN` only). |
| `/api/students/{id}` | `PUT` | `ROLE_ADMIN`, `ROLE_STUDENT` | Update student profile by ID. |
| `/api/students/{id}` | `DELETE` | `ROLE_ADMIN`, `ROLE_STUDENT` | Delete student by ID. |

### HTTP Status Codes Explained

- **`200 OK`:** Request succeeded (used for `GET`, `PUT`, and `/login`).
- **`201 Created`:** A new resource was successfully created on the server (used for `POST /api/teachers`, `/api/students`, `/api/admins`).
- **`204 No Content`:** The request succeeded, and there is no response body to return (used for `DELETE` operations).
- **`400 Bad Request`:** Invalid payload, validation error, malformed JSON, or mismatched passwords.
- **`401 Unauthorized`:** Authentication is required, credentials were invalid, or the session expired.
- **`403 Forbidden`:** The user is authenticated, but their assigned role is not permitted to access this resource.
- **`404 Not Found`:** The requested ID does not exist in the database table.
- **`409 Conflict`:** Duplicate data detected (e.g. attempting to register an email address that already exists).

### Request Anatomy: URL Parameters vs Headers vs Body

```
POST http://localhost:8081/api/teachers/5?notify=true
     \_________________/ \____________/ \_________/
          Base URL            Path      Query Parameter (URL Param)

HEADERS:
  Content-Type: application/json          <-- Tells server body format is JSON
  X-CSRF-TOKEN: 8f4e2b10-...             <-- Custom security token header
  Cookie: JSESSIONID=B26F8...             <-- Browser session cookie

REQUEST BODY:
  {
    "name": "Dr. Alan Turing",            <-- The actual data payload to save
    "email": "aturing@university.com"
  }
```

---

## 6. Frontend Architecture & Client Logic

The frontend is located entirely in `src/main/resources/static/` and is served as public static assets by Spring Boot. It uses pure standards: HTML5, CSS3, and Vanilla JavaScript.

### How the Single Page Application (SPA) Works
Unlike multi-page applications that reload the entire webpage on every click, this system loads `index.html` once. JavaScript dynamically toggles which section is visible:
- **`#login-view`:** Displayed when unauthenticated. Shows email and password fields.
- **`#dashboard-view`:** Displayed when authenticated. Contains the sidebar, summary cards, and content tab panels.

### Key JavaScript Functions in `app.js`

| Function Name | Purpose | Associated Backend Endpoint |
|---|---|---|
| `init()` | Binds DOM event listeners when page loads; calls `checkCurrentSession()`. | None |
| `fetchCsrfToken()` | Fetches active CSRF token and sets `csrfToken` variable. | `GET /api/auth/csrf` |
| `apiRequest(url, options)` | Central fetch wrapper: attaches CSRF header, credentials, and handles global status codes (401, 403, 500). | All endpoints |
| `checkCurrentSession()` | Checks if the browser has an active session cookie on page load. | `GET /api/auth/me` |
| `handleLoginSubmit(e)` | Validates login form and performs session sign-in. | `POST /api/auth/login` |
| `handleLogout()` | Logs out the user and switches view back to login screen. | `POST /api/auth/logout` |
| `applyRbac(role)` | Adjusts UI visibility (tabs, forms, buttons) depending on role (`ROLE_ADMIN`, `ROLE_TEACHER`, `ROLE_STUDENT`). | None |
| `switchTab(tabName)` | Switches active tab panel between Overview, Admins, Teachers, and Students. | None |
| `loadAdmins()` | Fetches administrators list and renders the table. | `GET /api/admins` |
| `loadTeachers()` | Fetches teachers list and renders the table. | `GET /api/teachers` |
| `loadStudents()` | Fetches students list and renders the table. | `GET /api/students` |
| `handleTeacherSubmit(e)` | Submits new or updated teacher record with optional credentials. | `POST` or `PUT /api/teachers` |
| `handleStudentSubmit(e)` | Submits new or updated student record with optional credentials. | `POST` or `PUT /api/students` |
| `editTeacher(id)` / `editStudent(id)` | Populates form fields with existing record data for editing. | In-memory cache |
| `confirmDelete(type, id, name)` | Shows modal confirmation dialog before executing a delete operation. | `DELETE /api/{resource}/{id}` |
| `testEndpointAuthorization(url)` | Educational tool on the dashboard allowing users to test API access live. | `GET /api/admins`, `/api/teachers`, `/api/students` |
| `showAlert(message, type)` | Renders toast notifications (success, warning, error, info). | None |

### How Fetch and JSON Handling Work in JavaScript
1. **Preparing JSON with `JSON.stringify()`:**
   JavaScript objects cannot be sent over HTTP directly. `JSON.stringify()` converts a JavaScript object into a JSON string:
   ```javascript
   const payload = { name: "Alan Turing", email: "aturing@uni.com" };
   options.body = JSON.stringify(payload); // '{"name":"Alan Turing","email":"aturing@uni.com"}'
   ```
2. **Sending the Request with `fetch()`:**
   ```javascript
   const response = await fetch('/api/teachers', {
       method: 'POST',
       credentials: 'same-origin', // Sends session cookies automatically
       headers: {
           'Content-Type': 'application/json',
           'X-CSRF-TOKEN': csrfToken
       },
       body: JSON.stringify(payload)
   });
   ```
3. **Parsing Response with `response.json()`:**
   ```javascript
   if (response.ok) {
       const createdTeacher = await response.json(); // Parses JSON string into a JavaScript object
       console.log("Teacher ID:", createdTeacher.id);
   }
   ```

---

## 7. Database and JPA/Hibernate Data Layer

### How MariaDB Works in This System
MariaDB is an open-source, relational database engine that stores data in structured tables with defined column data types. The application connects to MariaDB on TCP port `3306` using the MySQL Connector/J driver over JDBC (`jdbc:mysql://localhost:3306/university_management_db`).

### Actual Database Tables & Schemas

The database consists of **4 distinct tables**:

```
+--------------------------------------------------------------------------+
|                                 admins                                   |
+---------------------+---------------------+------------------------------+
| Column Name         | Data Type           | Constraints                  |
+---------------------+---------------------+------------------------------+
| id                  | BIGINT (Long)       | PRIMARY KEY, AUTO_INCREMENT  |
| name                | VARCHAR(255)        | NOT NULL                     |
| email               | VARCHAR(255)        | NOT NULL, UNIQUE             |
+---------------------+---------------------+------------------------------+

+--------------------------------------------------------------------------+
|                                teachers                                  |
+---------------------+---------------------+------------------------------+
| Column Name         | Data Type           | Constraints                  |
+---------------------+---------------------+------------------------------+
| id                  | BIGINT (Long)       | PRIMARY KEY, AUTO_INCREMENT  |
| name                | VARCHAR(255)        | NOT NULL                     |
| email               | VARCHAR(255)        | NOT NULL, UNIQUE             |
| department          | VARCHAR(255)        | NOT NULL                     |
+---------------------+---------------------+------------------------------+

+--------------------------------------------------------------------------+
|                                students                                  |
+---------------------+---------------------+------------------------------+
| Column Name         | Data Type           | Constraints                  |
+---------------------+---------------------+------------------------------+
| id                  | BIGINT (Long)       | PRIMARY KEY, AUTO_INCREMENT  |
| name                | VARCHAR(255)        | NOT NULL                     |
| email               | VARCHAR(255)        | NOT NULL, UNIQUE             |
| department          | VARCHAR(255)        | NOT NULL                     |
+---------------------+---------------------+------------------------------+

+--------------------------------------------------------------------------+
|                                  users                                   |
+---------------------+---------------------+------------------------------+
| Column Name         | Data Type           | Constraints                  |
+---------------------+---------------------+------------------------------+
| id                  | BIGINT (Long)       | PRIMARY KEY, AUTO_INCREMENT  |
| email               | VARCHAR(255)        | NOT NULL, UNIQUE             |
| password            | VARCHAR(255)        | NOT NULL (BCrypt hash)       |
| role                | VARCHAR(255)        | NOT NULL (ROLE_ADMIN/...)    |
+---------------------+---------------------+------------------------------+
```

### Constraints & Relationships Explained
- **Primary Keys:** Every table uses `id BIGINT AUTO_INCREMENT PRIMARY KEY` for fast indexing and row identification.
- **Email Uniqueness:** Every table enforces a `UNIQUE` constraint on `email`. No two teachers, students, admins, or users can share the same email address.
- **Logical Association (No Foreign Keys):**
  Notice there are **no foreign key constraints** linking `users` to `teachers` or `students`. Instead, records are linked **logically by email**. 
  - An Admin record in `admins` with email `admin@university.com` matches the `users` record with email `admin@university.com` and `role = "ROLE_ADMIN"`.
  - This design decouples directory profiles from authentication accounts.

### Profile-Only vs Combined Creation
- **Profile-Only Creation:** If an Admin creates a Teacher without checking "Create login account", only a row in `teachers` is inserted. No login account is created; that teacher cannot log into the web system.
- **Combined Creation:** If "Create login account" is checked, a row is inserted in `teachers` AND a row is inserted in `users` with `role = "ROLE_TEACHER"` and a BCrypt password hash. Both operations execute inside an atomic Spring `@Transactional` block.

---

## 8. Spring Security, Authentication, and RBAC

### Authentication vs Authorization
- **Authentication ("Who are you?"):** Verifying identity using credentials (email and password). Handled by `AuthController` and `CustomUserDetailsService`.
- **Authorization ("What are you allowed to do?"):** Granting or denying access to specific URLs or resources based on the user's role. Handled by `SecurityConfig`.

### Passwords & BCrypt Hashing
Passwords are never stored in plain text. Spring Security's `BCryptPasswordEncoder` bean is used:
- BCrypt incorporates a **salt** (random string) and uses an adaptive key derivation function.
- A generated hash looks like: `$2a$10$e7qA...`
- Even if two users choose the same password, their BCrypt hashes will be completely different.
- BCrypt is one-way: hashes cannot be reversed back to plain text. Verification works by hashing incoming candidate passwords and comparing them.

### Session Lifecycle (`JSESSIONID`) and CSRF Protection
1. **Session Login:** When `POST /api/auth/login` succeeds, Spring establishes an `HttpSession` and sets a secure cookie named `JSESSIONID` in the user's browser.
2. **Session Fixation Protection:** Upon login, `request.changeSessionId()` is invoked to issue a new session ID, defending against Session Fixation attacks.
3. **Cross-Site Request Forgery (CSRF) Protection:**
   - Spring Security maintains a CSRF token stored in a cookie named `XSRF-TOKEN`.
   - Any state-changing request (`POST`, `PUT`, `DELETE`) **must** include this token in the `X-CSRF-TOKEN` header.
   - Attackers on malicious external sites cannot read or forge this token due to the browser's Same-Origin Policy.

### Complete RBAC Access Matrix

| Role | Static Assets (`/`, `*.js`, `*.css`) | `/api/auth/**` | `/api/admins/**` | `/api/teachers/**` | `/api/students/**` |
|---|---|---|---|---|---|
| **Unauthenticated** | **Allow** | Login & CSRF only | **401 Unauthorized** | **401 Unauthorized** | **401 Unauthorized** |
| **ROLE_ADMIN** | **Allow** | Full access | **Allow (200 OK)** | **Allow (200 OK)** | **Allow (200 OK)** |
| **ROLE_TEACHER** | **Allow** | Me & Logout only | **Deny (403 Forbidden)**| **Allow (200 OK)** | **Deny (403 Forbidden)**|
| **ROLE_STUDENT** | **Allow** | Me & Logout only | **Deny (403 Forbidden)**| **Deny (403 Forbidden)**| **Allow (200 OK)** |

### 401 Unauthorized vs 403 Forbidden
- **`401 Unauthorized`:** The request lacked valid authentication credentials (you are not logged in).
- **`403 Forbidden`:** The server knows who you are, but your role lacks permission (a Student trying to access Teacher records).

### Defense Against Browser-Cached HTTP Basic Hijacking
In [SecurityConfig.java](file:///e:/3.2/CSE%203220/university-management-system/src/main/java/com/university/university_management_system/config/SecurityConfig.java), a custom filter is placed immediately before `BasicAuthenticationFilter`:
- If an active, authenticated `HttpSession` already exists (e.g. `ROLE_TEACHER`), the filter masks any stale `Authorization: Basic` headers sent by the browser.
- This prevents browser-cached Admin credentials from overriding the user's active session and exposing unauthorized student data.

### Automated Initial Admin Provisioning
`AdminDataInitializer.java` implements `CommandLineRunner`. On application boot:
1. Reads `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, and `INITIAL_ADMIN_PASSWORD` from environment variables.
2. If already configured in the database, it skips provisioning.
3. If missing, it creates the initial Admin profile in `admins` and the user credentials in `users` with `ROLE_ADMIN` and BCrypt hashing.

---

## 9. Docker & Containerized Deployment

### Containerization Overview
- **Docker Image:** A lightweight, standalone, executable package including the code, runtime (JRE 21), system tools, and libraries.
- **Docker Container:** A running instance of an image executed in an isolated user space.

### Line-by-Line Explanation of `Dockerfile`

```dockerfile
# Stage 1: Build Stage (Uses full JDK to compile source code)
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copy Maven Wrapper and POM first to leverage Docker layer caching
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn/ .mvn/

# Ensure Unix script is executable
RUN chmod +x mvnw

# Copy source code and build runnable JAR
COPY src/ src/
RUN ./mvnw package -DskipTests

# Stage 2: Runtime Stage (Uses minimal JRE for smaller, secure image)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy only the compiled JAR from Stage 1
COPY --from=builder /app/target/university-management-system-0.0.1-SNAPSHOT.jar /app/app.jar

# Inform Docker that the application listens on 8081
EXPOSE 8081

# Command to execute when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Why a Multi-Stage Build?**
- Stage 1 uses the large JDK (~500MB) with compilers.
- Stage 2 copies only the final `.jar` into a clean, lightweight JRE runtime (~200MB).
- Source code, Maven cache, and build tools are discarded, drastically reducing image size and attack surface.

### Line-by-Line Explanation of `compose.yaml`

```yaml
services:
  db:
    image: mariadb:10.11                     # Official MariaDB LTS image
    restart: unless-stopped                 # Restarts automatically if it crashes
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD} # Reads from .env
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql              # Named volume persists database files
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "8082:8081"                         # Host port 8082 maps to Container port 8081
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/${DB_NAME} # "db" resolves to container IP!
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL}
      INITIAL_ADMIN_NAME: ${INITIAL_ADMIN_NAME}
      INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD}
    depends_on:
      db:
        condition: service_healthy          # Waits until MariaDB is completely ready!

volumes:
  db_data:                                  # Declares persistent storage volume
```

### Key Docker Concepts in This Project
1. **Container Networking (`db:3306`):** Inside the Docker network, Docker Compose assigns container hostnames matching service names. Spring Boot connects to `jdbc:mysql://db:3306/...` rather than `localhost`.
2. **Port Mapping (`8082:8081`):** Host machine port `8082` forwards traffic to container port `8081`. You open `http://localhost:8082` in your host browser.
3. **Database Healthcheck:** Prevents Spring Boot from crashing on startup by making `app` wait until MariaDB has initialized its InnoDB storage engine.
4. **Volume Persistence (`db_data`):** Even if containers are stopped or removed, database records remain safe on the host disk inside the `db_data` volume.

---

## 10. Automated Testing Strategy

The project contains **60 comprehensive automated tests** across unit and integration levels.

```
Total Automated Tests: 60 Passed | 0 Failed | 0 Errors
```

### Unit Testing vs Integration Testing
- **Unit Testing:** Tests a single class in complete isolation. Dependencies are simulated using **Mockito** mocks. Very fast (milliseconds).
  - Example: `AdminServiceTest.java` tests `adminService.createAdmin()` by mocking `AdminRepository`.
  - Example: `CustomUserDetailsServiceTest.java` tests loading user details by mocking `UserRepository`.
- **Integration Testing:** Boots the complete Spring Application Context, mounts the security filter chain, connects to the database, and performs realistic HTTP requests using `MockMvc`.
  - Example: `SecurityRbacIntegrationTest.java` tests real CSRF, logins, and RBAC restrictions.
  - Example: `TeacherStudentAccountIntegrationTest.java` tests transactional combined account creation.

### How the Access Matrix is Tested
In `SecurityRbacIntegrationTest.java`:
- `@WithMockUser(roles = "TEACHER")` sends `GET /api/students` -> asserts `403 Forbidden`.
- `@WithMockUser(roles = "STUDENT")` sends `GET /api/teachers` -> asserts `403 Forbidden`.
- Unauthenticated requests send `GET /api/admins` -> asserts `401 Unauthorized`.
- Active session requests verify that a Teacher session cannot be corrupted into Admin even if browser sends cached Basic Auth headers.

---

## 11. Complete End-to-End Request Flow

The following diagram illustrates the complete architectural journey of an HTTP request:

```
+---------------------------------------------------------------------------------------+
| 1. BROWSER (Client Side)                                                              |
| User interacts with UI in index.html (e.g. clicks "Save Teacher")                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 2. JAVASCRIPT (app.js)                                                                |
| - Gathers form input fields into a JavaScript object.                                 |
| - Converts object to JSON using JSON.stringify().                                     |
| - Attaches X-CSRF-TOKEN header and credentials: 'same-origin'.                         |
| - Calls fetch('/api/teachers', options).                                              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 3. SPRING SECURITY FILTER CHAIN (SecurityConfig.java)                                 |
| - Inspects incoming HTTP request before it reaches any controller.                    |
| - Verifies CSRF Token against session.                                                |
| - Validates JSESSIONID session cookie and checks user role.                           |
| - If role is unauthorized -> Returns HTTP 403 Forbidden immediately.                  |
| - If valid -> Passes request along the chain to Controller.                           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 4. REST CONTROLLER (TeacherController.java)                                           |
| - Annotated with @RestController and @RequestMapping("/api/teachers").               |
| - Deserializes incoming JSON body into TeacherCreateRequest DTO.                      |
| - Validates inputs using @Valid.                                                      |
| - Calls teacherService.createTeacher(request).                                        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 5. SERVICE LAYER (TeacherService.java)                                                |
| - Enforces business rules inside @Transactional boundary.                             |
| - Checks for duplicate emails in repository.                                          |
| - Hashes account password using BCrypt: passwordEncoder.encode(rawPassword).          |
| - Prepares Teacher entity and User entity.                                            |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 6. DATA ACCESS LAYER (TeacherRepository.java & UserRepository.java)                   |
| - Spring Data JPA interfaces extending JpaRepository.                                 |
| - Hibernate generates SQL: "INSERT INTO teachers ..." & "INSERT INTO users ...".      |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 7. DATABASE ENGINE (MariaDB 10.11)                                                    |
| - Executes SQL statements, allocates auto-increment IDs, enforces UNIQUE constraints. |
| - Commits the atomic transaction.                                                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 8. RESPONSE DISPATCH                                                                  |
| - Controller returns ResponseEntity.status(HttpStatus.CREATED).body(teacher).         |
| - Spring converts Teacher entity into JSON (passwords are omitted).                   |
| - Browser receives HTTP 201 Created.                                                  |
| - app.js receives response.json(), triggers green toast alert, and refreshes table.   |
+---------------------------------------------------------------------------------------+
```

---

## 12. Teacher Viva Preparation (30 Questions & Answers)

Here are 30 high-frequency questions teachers and examiners ask during project presentations and vivas:

### Spring Boot & Architecture
1. **Q: What is Spring Boot and why did you use it over standard Spring?**  
   *A:* Spring Boot simplifies Spring application development by providing opinionated auto-configuration, dependency starter packages, and an embedded Tomcat server, removing the need for complex XML configurations.
2. **Q: What is Dependency Injection (DI)?**  
   *A:* DI is a design pattern where an object receives its dependencies from an external container (Spring IoC container) rather than instantiating them itself with `new`, enabling loose coupling and easy testing.
3. **Q: Why use Constructor Injection instead of `@Autowired` on fields?**  
   *A:* Constructor injection makes dependencies explicit, enforces immutability via `final` fields, prevents `NullPointerException`, and allows easy passing of mocks in unit tests without reflection.
4. **Q: What does `@SpringBootApplication` do?**  
   *A:* It is a convenience annotation combining `@SpringBootConfiguration` (defines bean configurations), `@EnableAutoConfiguration` (enables Spring Boot auto-setup), and `@ComponentScan` (scans current package and sub-packages for Spring components).
5. **Q: What is the purpose of the 3-tier architecture (Controller-Service-Repository)?**  
   *A:* It enforces Separation of Concerns: Controllers handle HTTP requests and JSON translation, Services execute business rules and transactions, and Repositories handle database persistence.

### REST API & HTTP
6. **Q: What is the difference between a REST API and a RESTful API?**  
   *A:* A REST API is any web service that uses HTTP; a RESTful API strictly follows REST architectural constraints such as statelessness, noun-based resource URIs, standard HTTP methods, and appropriate HTTP status codes.
7. **Q: What is the difference between `PUT` and `POST`?**  
   *A:* `POST` is used to create a new resource and is not idempotent (calling it multiple times creates multiple records). `PUT` is used to update an existing resource and is idempotent (calling it multiple times produces the same result).
8. **Q: What is JSON and why is it used?**  
   *A:* JSON (JavaScript Object Notation) is a lightweight, human-readable text format for data exchange that is natively parsed by browsers and easily mapped to Java objects by Spring's Jackson library.
9. **Q: What is the difference between HTTP 401 and HTTP 403?**  
   *A:* `401 Unauthorized` means the user is not authenticated (unrecognized identity or expired session). `403 Forbidden` means the user is authenticated, but lacks permissions (role) to access that resource.
10. **Q: What does HTTP 409 Conflict represent in your project?**  
    *A:* It is returned when an operation conflicts with existing server state, specifically when attempting to register an email address that is already registered in the database.

### JPA & Hibernate
11. **Q: What is JPA and what is Hibernate?**  
    *A:* JPA (Jakarta Persistence API) is a standard specification defining object-relational mapping in Java; Hibernate is the actual ORM library implementation that generates and executes SQL queries.
12. **Q: What does `spring.jpa.hibernate.ddl-auto=update` do?**  
    *A:* It directs Hibernate to inspect Java `@Entity` classes on startup and automatically create or alter database tables to match them without dropping existing data.
13. **Q: Why extend `JpaRepository`?**  
    *A:* Extending `JpaRepository<T, ID>` automatically provides standard CRUD methods (`save`, `findById`, `findAll`, `deleteById`) and pagination without writing boilerplate SQL or implementation code.
14. **Q: What is the purpose of `@Transactional`?**  
    *A:* It defines an atomic database transaction boundary. If an unhandled runtime exception occurs within the method (e.g., during teacher or user creation), all database writes within that method are rolled back to preserve data consistency.

### Spring Security & Authentication
15. **Q: What is the difference between Authentication and Authorization?**  
    *A:* Authentication verifies identity ("Who are you?"), whereas Authorization verifies access privileges ("Are you allowed to access this resource?").
16. **Q: How does your application authenticate users?**  
    *A:* It uses session-based authentication. On successful `POST /api/auth/login`, Spring Security establishes an `HttpSession` on the server and issues a `JSESSIONID` cookie to the browser.
17. **Q: What is BCrypt and why is it safe?**  
    *A:* BCrypt is a cryptographic one-way hashing function that incorporates a random salt and a configurable work factor. It protects against rainbow table and brute-force attacks.
18. **Q: What is CSRF and how does this project prevent it?**  
    *A:* Cross-Site Request Forgery tricks an authenticated browser into submitting unauthorized requests. We prevent it using Spring Security's `CookieCsrfTokenRepository`: the frontend must read the `XSRF-TOKEN` cookie and send it in the `X-CSRF-TOKEN` header on every state-changing request.
19. **Q: What roles exist in this project and what can they access?**  
    *A:* Three roles: `ROLE_ADMIN` (can access Admins, Teachers, and Students), `ROLE_TEACHER` (can only access Teachers), and `ROLE_STUDENT` (can only access Students).
20. **Q: Why are passwords not returned in the Teacher or Student API responses?**  
    *A:* The `Teacher` and `Student` entities have no password fields. Passwords belong exclusively to the `User` entity, and controllers never return `User` entities to the client, preventing credential leaks.

### Frontend & Integration
21. **Q: Why did you use Vanilla JavaScript instead of React or Angular?**  
    *A:* Vanilla JS has zero external dependencies, no build steps, extremely fast load times, and clearly demonstrates core web fundamentals (DOM manipulation, Fetch API, event handling).
22. **Q: How does `app.js` authenticate API requests?**  
    *A:* Every request made through `apiRequest()` includes `credentials: 'same-origin'`, which instructs the browser to automatically include the `JSESSIONID` cookie with the request.
23. **Q: What does `JSON.stringify()` do?**  
    *A:* It serializes a client-side JavaScript object into a JSON string so it can be transmitted in an HTTP request body with `Content-Type: application/json`.
24. **Q: How does the UI handle Role-Based Access Control?**  
    *A:* The `applyRbac()` function inspects `currentUser.role` upon login and adjusts the DOM: it hides unauthorized navigation tabs, summary cards, and admin-only form fields.

### Docker & Containers
25. **Q: What is a multi-stage Docker build?**  
    *A:* A build process that uses separate stages in a single `Dockerfile`. Stage 1 uses a full JDK to compile code and build the JAR; Stage 2 copies only the JAR into a lean JRE runtime, keeping the final production image small and secure.
26. **Q: What is the difference between an image and a container?**  
    *A:* An image is an immutable template containing application binaries, libraries, and instructions. A container is a running, isolated instance of an image.
27. **Q: Why does `compose.yaml` map ports `"8082:8081"`?**  
    *A:* The Spring Boot container listens internally on port `8081`. The host machine maps port `8082` to container port `8081` so users access the app at `http://localhost:8082`, avoiding conflicts if host port 8081 is busy.
28. **Q: What is a Docker volume and why is it used for MariaDB?**  
    *A:* Containers have ephemeral filesystems; if destroyed, their data is lost. A Docker named volume (`db_data`) persists the MariaDB database files directly on the host machine disk across container restarts.
29. **Q: Why is `.env` added to `.gitignore`?**  
    *A:* The `.env` file contains sensitive production secrets, root passwords, and database credentials that must never be exposed in public version control repositories.
30. **Q: What does the MariaDB healthcheck in `compose.yaml` do?**  
    *A:* It runs `healthcheck.sh --connect --innodb_initialized` inside the database container. The application container waits for this check to pass before starting, preventing Spring Boot from crashing due to an unready database.

---

## 13. Important Commands Reference

All commands below are formatted for Windows PowerShell:

### 1. Local Development (Maven & Local Database)
```powershell
# Run the application locally using Maven Wrapper
.\mvnw.cmd spring-boot:run

# Run all 60 automated unit and integration tests
.\mvnw.cmd test

# Clean build directory and compile without running tests
.\mvnw.cmd clean package -DskipTests

# Run tests with detailed test logging
.\mvnw.cmd test -Dtest=SecurityRbacIntegrationTest
```

### 2. Docker & Containerized Operations
```powershell
# Build Docker images and run containers in the background (detached mode)
docker compose up -d --build

# View real-time logs from both the Spring Boot app and MariaDB containers
docker compose logs -f

# View logs from only the Spring Boot application container
docker compose logs -f app

# View logs from only the MariaDB database container
docker compose logs -f db

# Check the health status of running containers
docker compose ps

# Stop all running containers without deleting database data
docker compose stop

# Stop and remove containers and internal networks (preserves db_data volume)
docker compose down

# Stop, remove containers, and completely delete the database volume (Fresh Start)
docker compose down -v
```

---

## 14. One-Page Quick Revision Summary

Print or review this page right before your project demonstration:

```
========================================================================================
             UNIVERSITY MANAGEMENT SYSTEM (UMS) — QUICK REVISION CHEAT SHEET
========================================================================================

1. ARCHITECTURE PATTERN:
   Browser (HTML/CSS/JS) -> Spring Security Filter -> Controller -> Service -> Repository -> MariaDB
   - Controller: Defines endpoints, validates DTO inputs, returns ResponseEntity.
   - Service: Business logic, BCrypt password hashing, atomic @Transactional boundaries.
   - Repository: Spring Data JPA interfaces; auto-generates SQL queries.
   - Database: 4 tables (admins, teachers, students, users) linked logically by email.

2. SECURITY & ROLES:
   - Authentication: Session-based (JSESSIONID cookie).
   - Password Hashing: BCryptPasswordEncoder (one-way salt + hash).
   - CSRF Protection: CookieCsrfTokenRepository (Cookie: XSRF-TOKEN -> Header: X-CSRF-TOKEN).
   - Access Matrix:
     * ROLE_ADMIN:   Full access to /api/admins/**, /api/teachers/**, /api/students/**.
     * ROLE_TEACHER: Access to /api/teachers/** ONLY (403 on Admins & Students).
     * ROLE_STUDENT: Access to /api/students/** ONLY (403 on Admins & Teachers).
     * Unauthenticated: Static frontend & /api/auth/login, /api/auth/csrf ONLY (401 on APIs).

3. CRUD & ATOMIC CREATION:
   - Profile Only: Saves teacher/student directory record without login credentials.
   - Profile + Account: Saves teacher/student record AND creates User login account (ROLE_TEACHER / ROLE_STUDENT).
   - Atomic Rollback: If account creation fails, @Transactional rolls back profile insert too!

4. DOCKER & DEPLOYMENT:
   - Multi-stage Dockerfile: eclipse-temurin:21-jdk (build) -> eclipse-temurin:21-jre (runtime).
   - Port Mapping: 8082 (Host) -> 8081 (Container). URL: http://localhost:8082.
   - Container DB URL: jdbc:mysql://db:3306/university_management_db (Host is 'db', not 'localhost').
   - Database Healthcheck: App waits for MariaDB InnoDB initialization before booting.
   - Volume db_data: Persists MariaDB data on host disk across container restarts.

5. VERIFIED TEST METRICS:
   - Total Tests: 60 Passed | 0 Failed | 0 Errors
   - Test Types: Mockito Unit Tests (Services) & Spring MockMvc Integration Tests (Security/RBAC/Transactions).
========================================================================================
```
