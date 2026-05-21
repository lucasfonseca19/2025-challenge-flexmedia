# ── Estágio 1: build ─────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copia pom e resolve dependências antes do source (cache de camada)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copia source e empacota
COPY src ./src
RUN mvn package -DskipTests -q

# ── Estágio 2: runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
RUN mkdir -p uploads && chown appuser:appgroup uploads
USER appuser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
