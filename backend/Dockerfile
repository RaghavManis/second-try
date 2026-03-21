# Build stage
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app
# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src
# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
# Copy the built jar file from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the default port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
