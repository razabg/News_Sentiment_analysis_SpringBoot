# Real-time News Sentiment Analysis

A reactive streaming application that analyzes sentiment of news articles in real-time using Apache Kafka and Stanford CoreNLP.

## Overview

This project demonstrates a modern data pipeline that:
- Fetches live news articles from NewsAPI
- Streams content through Apache Kafka
- Performs NLP-based sentiment analysis using Stanford CoreNLP
- Aggregates results in configurable time windows

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Java 11, Spring Boot 2.6, Spring WebFlux |
| Frontend | React 19 |
| NLP | Stanford CoreNLP 3.8 |
| Messaging | Apache Kafka (Reactor Kafka) |
| News Source | NewsAPI |

## Architecture

```
NewsAPI → Spring WebFlux → Kafka → Sentiment Analyzer → REST API
                                                            ↓
                                                     React Frontend
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (only if running frontend)

## Quick Start

### Option 1: Docker Only (Recommended)

Run everything with a single command:

```bash
docker-compose up -d
```

This starts:
- **Zookeeper** on port 2181
- **Kafka** on port 9092
- **Sentiment API** on port 8080

The API will be available at `http://localhost:8080`

To stop:
```bash
docker-compose down
```

### Option 2: Docker + React Frontend

1. **Start the backend services**
   ```bash
   docker-compose up -d
   ```

2. **Start the React frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Option 3: Local Development

1. **Start Kafka & Zookeeper only**
   ```bash
   docker-compose up -d zookeeper kafka
   ```

2. **Build and run the application**
   ```bash
   mvn clean package
   mvn spring-boot:run
   ```

   The application will be available at `http://localhost:8080`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /hello?text=...` | Analyze sentiment of a single text |
| `GET /sendKafka?text=...` | Send message to Kafka |
| `GET /getKafka` | Consume messages from Kafka |
| `GET /startNews?text=...` | Start streaming news by keyword |
| `GET /stopNews` | Stop news streaming |
| `GET /grouped?text=...&timeWindowSec=3` | Group news in time windows |
| `GET /sentiment?text=...&timeWindowSec=3` | Analyze news sentiment in time windows |

## Example Usage

```bash
# Analyze sentiment of a single text
curl "http://localhost:8080/hello?text=I%20love%20this%20product"

# Send a message to Kafka
curl "http://localhost:8080/sendKafka?text=test1"

# Consume messages from Kafka
curl "http://localhost:8080/getKafka"

# Stream and analyze news sentiment about a topic
curl "http://localhost:8080/sentiment?text=technology&timeWindowSec=5"
```

## Sentiment Scale

| Score | Meaning |
|-------|---------|
| 1 | Very Negative |
| 2 | Negative |
| 3 | Neutral |
| 4 | Positive |
| 5 | Very Positive |

## Configuration

### Kafka Settings

Configure in `src/main/resources/application.properties`:

```properties
spring.kafka.bootstrap-servers=kafka:9092
```

### NewsAPI

Get your API key from [newsapi.org](https://newsapi.org) and update it in the application.

## Project Structure

```
.
├── docker-compose.yml              # Docker services configuration
├── pom.xml                         # Maven dependencies
├── src/main/java/com/handson/sentiment/
│   ├── SentimentApplication.java   # Spring Boot entry point
│   ├── controller/
│   │   └── AppController.java      # REST endpoints
│   ├── nlp/
│   │   └── SentimentAnalyzer.java  # Stanford NLP sentiment service
│   ├── kafka/
│   │   ├── AppKafkaSender.java     # Kafka producer
│   │   ├── KafkaConfig.java        # Kafka configuration
│   │   └── KafkaTopicConfig.java   # Topic setup
│   └── News/
│       └── AppNewsStream.java      # NewsAPI integration
└── frontend/                       # React frontend (optional)
    ├── src/
    │   ├── App.js                  # Main React component
    │   └── App.css                 # Styles
    └── package.json
```

## Frontend

The optional React frontend provides a visual interface for:
- **Text Sentiment Analysis** - Enter any text and get instant sentiment score
- **Live News Sentiment Stream** - Real-time visualization of news sentiment by keyword

### Frontend Features
- Color-coded sentiment indicators (green = positive, yellow = neutral, red = negative)
- Live streaming timeline
- Average sentiment calculation
- Responsive design

## Docker Services

| Service | Image | Port |
|---------|-------|------|
| sentiment | razabg/sentiment:1.0 | 8080 |
| kafka | confluentinc/cp-kafka:7.4.0 | 9092 |
| zookeeper | confluentinc/cp-zookeeper:7.4.0 | 2181 |

## License

MIT
