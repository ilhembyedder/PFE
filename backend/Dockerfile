FROM eclipse-temurin:21-jdk-alpine

# Install certs and bypass SSL for maven wrapper download
RUN apk add --no-cache ca-certificates wget \
    && sed -i 's/https/http/g' /etc/apk/repositories || true

WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN sed -i 's/https/http/g' .mvn/wrapper/maven-wrapper.properties || true
RUN ./mvnw dependency:go-offline -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true

COPY src ./src

CMD ["./mvnw", "spring-boot:run"]
