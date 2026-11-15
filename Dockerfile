# Build stage
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copy Maven Wrapper, wrapper configuration, and POM
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn/ .mvn/

# Ensure Unix Maven Wrapper script has executable permission
RUN chmod +x mvnw

# Copy source files and build the Spring Boot JAR
COPY src/ src/
RUN ./mvnw package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy generated JAR into runtime stage as /app/app.jar
COPY --from=builder /app/target/university-management-system-0.0.1-SNAPSHOT.jar /app/app.jar

# Expose application port
EXPOSE 8081

# Container entrypoint
ENTRYPOINT ["java", "-jar", "app.jar"]
