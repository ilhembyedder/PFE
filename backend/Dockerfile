# syntax=docker/dockerfile:1

# Multi-stage build producing a runnable jar.
# The previous image rewrote every Maven URL from https to http and then
# disabled TLS verification; Maven Central refuses plain HTTP, so the wrapper
# could never download itself. It also ran `mvnw spring-boot:run` as the
# container command, recompiling the whole project on every start.

FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Extra CA certificates for networks that intercept HTTPS (see certs/README.md).
# `certs` is a named build context supplied by compose; a directory holding
# only the README is a no-op here.
COPY --from=certs . /tmp/certs/
RUN for f in /tmp/certs/*.crt; do \
      [ -e "$f" ] || continue; \
      keytool -importcert -noprompt -trustcacerts -cacerts -storepass changeit \
        -alias "extra-$(basename "$f" .crt)" -file "$f"; \
    done

# Resolve dependencies first so source edits don't invalidate this layer.
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline

COPY src ./src
# Tests are skipped here: InsertAdminUser.java opens a real JDBC connection
# during `mvn test` (README §10), which cannot succeed inside a build.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests \
    && cp target/*.jar app.jar

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app
ENV UPLOAD_DIR=/app/uploads

# Runs unprivileged; the uploads volume is mounted here by compose.
RUN addgroup -S app && adduser -S -G app app \
    && mkdir -p /app/uploads && chown -R app:app /app

COPY --from=builder --chown=app:app /app/app.jar ./app.jar

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
