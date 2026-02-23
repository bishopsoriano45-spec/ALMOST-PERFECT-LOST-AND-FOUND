# Enhanced Lost & Found AI System - Project Structure

## Root Directory Structure

```
/workspace/
├── src/                                    # Frontend source code
│   ├── components/                         # React components
│   │   ├── ui/                            # shadcn/ui base components
│   │   ├── feedback/                      # Feedback collection components
│   │   │   ├── ClassificationFeedback.tsx
│   │   │   ├── MatchConfirmation.tsx
│   │   │   ├── FeedbackForm.tsx
│   │   │   └── FeedbackHistory.tsx
│   │   ├── admin/                         # Admin dashboard components
│   │   │   ├── ModelMetrics.tsx
│   │   │   ├── TrainingDataManager.tsx
│   │   │   ├── RetrainingStatus.tsx
│   │   │   └── SystemConfiguration.tsx
│   │   ├── search/                        # Enhanced search components
│   │   │   ├── HierarchicalResults.tsx
│   │   │   ├── SimilarityScore.tsx
│   │   │   ├── VisualSearch.tsx
│   │   │   └── SearchFilters.tsx
│   │   └── items/                         # Item management components
│   │       ├── ItemUpload.tsx
│   │       ├── ItemDetails.tsx
│   │       ├── ItemCard.tsx
│   │       └── AIClassificationBadge.tsx
│   ├── services/                          # Frontend services
│   │   ├── api/                          # API client services
│   │   │   ├── itemService.ts
│   │   │   ├── feedbackService.ts
│   │   │   ├── searchService.ts
│   │   │   ├── adminService.ts
│   │   │   └── modelService.ts
│   │   ├── yoloService.ts                # Enhanced YOLO integration
│   │   ├── feedbackCollector.ts          # Client-side feedback handling
│   │   └── imageProcessor.ts             # Image preprocessing utilities
│   ├── stores/                           # State management
│   │   ├── itemStore.ts                  # Item state management
│   │   ├── feedbackStore.ts              # Feedback state management
│   │   ├── adminStore.ts                 # Admin dashboard state
│   │   └── userStore.ts                  # User authentication state
│   ├── types/                            # TypeScript type definitions
│   │   ├── api.ts                        # API response types
│   │   ├── feedback.ts                   # Feedback-related types
│   │   ├── models.ts                     # ML model types
│   │   └── items.ts                      # Item-related types
│   ├── hooks/                            # Custom React hooks
│   │   ├── useFeedback.ts               # Feedback management hook
│   │   ├── useAutoLearning.ts           # Auto-learning status hook
│   │   ├── useModelMetrics.ts           # Model performance hook
│   │   └── useSearch.ts                 # Enhanced search hook
│   ├── utils/                            # Utility functions
│   │   ├── imageUtils.ts                # Image processing utilities
│   │   ├── validationUtils.ts           # Data validation helpers
│   │   ├── formatUtils.ts               # Data formatting utilities
│   │   └── constants.ts                 # Application constants
│   ├── App.tsx                          # Main application component
│   ├── main.tsx                         # Application entry point
│   └── index.css                        # Global styles
├── backend/                             # Backend API services
│   ├── app/                            # FastAPI application
│   │   ├── api/                        # API route handlers
│   │   │   ├── v1/                     # API version 1
│   │   │   │   ├── items.py           # Item management endpoints
│   │   │   │   ├── feedback.py        # Feedback collection endpoints
│   │   │   │   ├── search.py          # Search and similarity endpoints
│   │   │   │   ├── admin.py           # Admin dashboard endpoints
│   │   │   │   ├── models.py          # Model management endpoints
│   │   │   │   └── training.py        # Training pipeline endpoints
│   │   │   └── __init__.py
│   │   ├── core/                       # Core application logic
│   │   │   ├── config.py              # Configuration management
│   │   │   ├── security.py            # Authentication & authorization
│   │   │   ├── database.py            # Database connection setup
│   │   │   └── exceptions.py          # Custom exception handlers
│   │   ├── models/                     # SQLModel database models
│   │   │   ├── item.py                # Item model
│   │   │   ├── user.py                # User model
│   │   │   ├── feedback.py            # Feedback model
│   │   │   ├── training.py            # Training sample model
│   │   │   ├── model_version.py       # Model version tracking
│   │   │   └── metrics.py             # System metrics model
│   │   ├── schemas/                    # Pydantic schemas
│   │   │   ├── item_schemas.py        # Item request/response schemas
│   │   │   ├── feedback_schemas.py    # Feedback schemas
│   │   │   ├── search_schemas.py      # Search schemas
│   │   │   └── admin_schemas.py       # Admin schemas
│   │   ├── services/                   # Business logic services
│   │   │   ├── item_service.py        # Item management service
│   │   │   ├── feedback_service.py    # Feedback processing service
│   │   │   ├── search_service.py      # Search and similarity service
│   │   │   ├── auto_learning_service.py # Auto-learning engine
│   │   │   ├── model_service.py       # Model management service
│   │   │   └── validation_service.py  # Data validation service
│   │   ├── ml/                        # Machine learning components
│   │   │   ├── yolo_service.py        # Enhanced YOLOv8m service
│   │   │   ├── embedding_service.py   # Embedding generation
│   │   │   ├── similarity_service.py  # Similarity computation
│   │   │   ├── training_pipeline.py   # Training orchestration
│   │   │   ├── model_optimizer.py     # Model optimization
│   │   │   └── data_validator.py      # Training data validation
│   │   ├── background/                 # Background task services
│   │   │   ├── scheduler.py           # APScheduler configuration
│   │   │   ├── retraining_tasks.py    # Retraining job handlers
│   │   │   ├── index_rebuilder.py     # Vector index rebuilding
│   │   │   └── monitoring_tasks.py    # System monitoring tasks
│   │   ├── database/                   # Database utilities
│   │   │   ├── vector_db.py           # FAISS/Milvus integration
│   │   │   ├── migrations/            # Database migrations
│   │   │   └── seeders/               # Database seed data
│   │   ├── utils/                      # Utility modules
│   │   │   ├── image_utils.py         # Image processing utilities
│   │   │   ├── file_utils.py          # File handling utilities
│   │   │   ├── metrics_utils.py       # Performance metrics utilities
│   │   │   └── logging_utils.py       # Logging configuration
│   │   └── main.py                    # FastAPI application factory
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend container configuration
│   └── alembic.ini                   # Database migration configuration
├── ml_models/                         # Machine learning model storage
│   ├── yolov8m/                      # YOLOv8m model files
│   │   ├── base/                     # Base model weights
│   │   ├── versions/                 # Model version history
│   │   │   ├── v1.0/
│   │   │   ├── v1.1/
│   │   │   └── latest/
│   │   └── config/                   # Model configuration files
│   ├── embeddings/                   # Pre-computed embeddings
│   └── training_data/                # Training datasets
│       ├── original/                 # Original training data
│       ├── user_feedback/            # User-contributed samples
│       ├── validated/                # Validated training samples
│       └── synthetic/                # Synthetic training data
├── data/                             # Data storage
│   ├── images/                       # Image file storage
│   │   ├── uploads/                  # User uploaded images
│   │   ├── processed/                # Processed/resized images
│   │   └── thumbnails/               # Generated thumbnails
│   ├── vectors/                      # Vector database files
│   │   ├── faiss_index/              # FAISS index files
│   │   └── metadata/                 # Vector metadata
│   └── logs/                         # Application logs
│       ├── api/                      # API request logs
│       ├── training/                 # Training process logs
│       └── system/                   # System performance logs
├── config/                           # Configuration files
│   ├── development.env               # Development environment config
│   ├── production.env               # Production environment config
│   ├── docker-compose.yml           # Docker composition
│   ├── nginx.conf                   # Nginx configuration
│   └── monitoring/                  # Monitoring configurations
│       ├── prometheus.yml
│       └── grafana/
├── scripts/                          # Utility scripts
│   ├── setup_environment.sh         # Environment setup script
│   ├── migrate_database.sh          # Database migration script
│   ├── backup_models.sh             # Model backup script
│   ├── deploy.sh                    # Deployment script
│   └── monitoring/                  # Monitoring scripts
│       ├── health_check.py
│       └── performance_test.py
├── tests/                           # Test suites
│   ├── frontend/                    # Frontend tests
│   │   ├── components/              # Component tests
│   │   ├── services/                # Service tests
│   │   └── e2e/                     # End-to-end tests
│   ├── backend/                     # Backend tests
│   │   ├── api/                     # API endpoint tests
│   │   ├── services/                # Service layer tests
│   │   ├── ml/                      # ML component tests
│   │   └── integration/             # Integration tests
│   └── load/                        # Load testing
│       ├── api_load_test.py
│       └── ml_inference_test.py
├── docs/                            # Documentation
│   ├── api/                         # API documentation
│   ├── deployment/                  # Deployment guides
│   ├── architecture/                # Architecture diagrams
│   └── user_guides/                 # User documentation
├── .github/                         # GitHub workflows
│   └── workflows/                   # CI/CD pipelines
│       ├── test.yml
│       ├── build.yml
│       └── deploy.yml
├── package.json                     # Frontend dependencies
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── vite.config.ts                  # Vite build configuration
├── docker-compose.yml              # Multi-service orchestration
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── README.md                       # Project documentation
```

## Key Directory Explanations

### `/src/components/feedback/`
Contains React components specifically designed for collecting and displaying user feedback on AI classifications and similarity matches. These components integrate with the auto-learning system to provide seamless user interaction.

### `/backend/app/ml/`
Houses the core machine learning services including the enhanced YOLOv8m service, embedding generation, similarity computation, and the automated training pipeline that enables continuous learning.

### `/backend/app/background/`
Contains background services powered by APScheduler for automated retraining, index rebuilding, and system monitoring. These services ensure the system continuously improves without manual intervention.

### `/ml_models/`
Stores all machine learning models, including base YOLOv8m weights, version history, and training data. The version control system enables rollback capabilities and A/B testing of model improvements.

### `/data/vectors/`
Contains FAISS index files and vector metadata for efficient similarity search. The hierarchical organization supports class-aware similarity matching for improved relevance.

### `/config/monitoring/`
Configuration files for Prometheus and Grafana monitoring stack to track system performance, model accuracy, and user engagement metrics in real-time.

This structure supports the enhanced auto-learning functionality while maintaining clear separation of concerns and scalability for future enhancements.