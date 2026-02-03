FROM eclipse-temurin:11-jdk
COPY target/sentiment*.jar /usr/src/sentiment.jar
COPY src/main/resources/application.properties /opt/conf/application.properties
CMD ["java", "-jar", "/udosr/src/sentiment.jar", "--spring.config.location=file:/opt/conf/application.properties"]