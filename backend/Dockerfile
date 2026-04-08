# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache Maven dependencies by copying only the POM first
COPY pom.xml .
RUN mvn dependency:go-offline

# Now copy the source code and build (this layer only rebuilds if code changes)
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Strictly limit JVM Memory to prevent the 512MB Render Container from OOM crashing (521 Error)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-XX:+UseSerialGC", "-jar", "app.jar"]
