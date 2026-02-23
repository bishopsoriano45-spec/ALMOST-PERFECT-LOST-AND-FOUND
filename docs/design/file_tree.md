# Enhanced Lost & Found AI System - File Structure

## Frontend Structure
```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── ItemCard.tsx                 # Item display component
│   ├── Footer.tsx                   # Footer with download link
│   ├── AIFeedback/                  # AI feedback components
│   │   ├── ClassificationFeedback.tsx
│   │   ├── SimilarityFeedback.tsx
│   │   └── MatchConfirmation.tsx
│   ├── Notifications/               # Notification components
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationItem.tsx
│   │   ├── NotificationPreferences.tsx
│   │   └── RealTimeNotifications.tsx
│   └── Upload/                      # Enhanced upload components
│       ├── ImageUpload.tsx
│       ├── AIClassificationDisplay.tsx
│       └── SimilarItemsPreview.tsx
├── pages/
│   ├── Index.tsx                    # Dashboard with enhanced features
│   ├── ReportLost.tsx               # Enhanced lost item reporting
│   ├── ReportFound.tsx              # Enhanced found item reporting
│   ├── ItemDetail.tsx               # Enhanced item detail view
│   ├── MyItems.tsx                  # User's items management
│   ├── Notifications.tsx            # Notification center page
│   └── AIFeedback.tsx               # AI feedback interface
├── lib/
│   ├── aiService.ts                 # Enhanced AI service integration
│   ├── notificationService.ts       # Notification management
│   ├── feedbackService.ts           # User feedback handling
│   ├── websocket.ts                 # Real-time communication
│   └── storage.ts                   # Enhanced data storage
├── hooks/
│   ├── useNotifications.ts          # Notification state management
│   ├── useAIFeedback.ts            # AI feedback hooks
│   └── useRealTime.ts              # Real-time updates
└── types/
    ├── index.ts                     # Enhanced type definitions
    ├── ai.ts                        # AI-related types
    └── notifications.ts             # Notification types
```

## Backend Structure
```
backend/
├── app/
│   ├── main.py                      # FastAPI application entry
│   ├── config.py                    # Configuration management
│   ├── database.py                  # Database connection setup
│   └── dependencies.py              # Dependency injection
├── api/
│   ├── __init__.py
│   ├── items.py                     # Item management endpoints
│   ├── ai.py                        # AI service endpoints
│   ├── notifications.py             # Notification endpoints
│   ├── feedback.py                  # User feedback endpoints
│   └── admin.py                     # Admin/monitoring endpoints
├── models/
│   ├── __init__.py
│   ├── user.py                      # User data models
│   ├── item.py                      # Item data models
│   ├── ai.py                        # AI-related models
│   ├── notification.py              # Notification models
│   └── feedback.py                  # Feedback models
├── services/
│   ├── __init__.py
│   ├── item_service.py              # Item business logic
│   ├── ai_service.py                # AI integration service
│   ├── notification_service.py      # Notification management
│   ├── feedback_service.py          # Feedback processing
│   └── auto_learning_service.py     # Auto-learning pipeline
├── ml/
│   ├── __init__.py
│   ├── yolo_classifier.py           # YOLOv8m integration
│   ├── embedding_extractor.py       # Feature extraction
│   ├── similarity_matcher.py        # Similarity search
│   ├── model_trainer.py             # Model retraining
│   └── model_manager.py             # Model version management
├── tasks/
│   ├── __init__.py
│   ├── celery_app.py                # Celery configuration
│   ├── ai_tasks.py                  # AI processing tasks
│   ├── notification_tasks.py        # Notification delivery tasks
│   ├── training_tasks.py            # Model training tasks
│   └── cleanup_tasks.py             # Maintenance tasks
├── utils/
│   ├── __init__.py
│   ├── image_processing.py          # Image utilities
│   ├── vector_operations.py         # Vector database operations
│   ├── notification_channels.py     # Multi-channel notifications
│   └── monitoring.py                # Performance monitoring
└── tests/
    ├── test_api/                    # API endpoint tests
    ├── test_services/               # Service layer tests
    ├── test_ml/                     # ML pipeline tests
    └── test_tasks/                  # Background task tests
```

## Infrastructure & Configuration
```
infrastructure/
├── docker/
│   ├── Dockerfile.frontend          # Frontend container
│   ├── Dockerfile.backend           # Backend API container
│   ├── Dockerfile.ai                # AI service container
│   ├── Dockerfile.worker            # Celery worker container
│   └── docker-compose.yml           # Complete stack orchestration
├── kubernetes/                      # K8s deployment manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── deployments/
│   ├── services/
│   └── ingress/
├── monitoring/
│   ├── prometheus.yml               # Metrics collection
│   ├── grafana/                     # Dashboards
│   └── alerts/                      # Alert rules
└── scripts/
    ├── setup.sh                     # Environment setup
    ├── deploy.sh                    # Deployment script
    ├── backup.sh                    # Data backup
    └── migrate.sh                   # Database migration
```

## ML Models & Data
```
ml_assets/
├── models/
│   ├── yolov8m-cls/                 # YOLOv8m classification model
│   │   ├── v1.0/
│   │   ├── v1.1/
│   │   └── latest/
│   ├── embeddings/                  # Pre-trained embedding models
│   └── checkpoints/                 # Training checkpoints
├── datasets/
│   ├── training/                    # Training datasets
│   │   ├── verified/                # User-verified samples
│   │   ├── feedback/                # Feedback-based corrections
│   │   └── augmented/               # Data augmentation results
│   ├── validation/                  # Validation datasets
│   └── test/                        # Test datasets
├── configs/
│   ├── training_config.yaml         # Training parameters
│   ├── model_config.yaml            # Model architecture
│   └── inference_config.yaml        # Inference settings
└── scripts/
    ├── train_model.py               # Model training script
    ├── evaluate_model.py            # Model evaluation
    ├── export_onnx.py               # ONNX export
    └── data_preprocessing.py        # Data preparation
```

## Database Migrations
```
migrations/
├── alembic/
│   ├── versions/                    # Migration versions
│   ├── env.py                       # Alembic environment
│   └── alembic.ini                  # Alembic configuration
├── seeds/
│   ├── initial_categories.sql       # Category seed data
│   ├── sample_items.sql             # Sample items for testing
│   └── admin_users.sql              # Admin user setup
└── scripts/
    ├── init_db.py                   # Database initialization
    ├── seed_data.py                 # Data seeding
    └── backup_restore.py            # Backup/restore utilities
```

## Documentation
```
docs/
├── design/
│   ├── enhanced_prd.md              # Product Requirements Document
│   ├── system_architecture.md       # System architecture (this file)
│   ├── api_documentation.md         # API endpoint documentation
│   └── deployment_guide.md          # Deployment instructions
├── user_guides/
│   ├── user_manual.md               # End-user documentation
│   ├── admin_guide.md               # Administrator guide
│   └── feedback_guide.md            # AI feedback instructions
├── technical/
│   ├── ml_pipeline.md               # ML pipeline documentation
│   ├── notification_system.md       # Notification system details
│   ├── performance_tuning.md        # Performance optimization
│   └── troubleshooting.md           # Common issues and solutions
└── diagrams/
    ├── architect.plantuml           # System architecture diagram
    ├── class_diagram.plantuml       # Class relationships
    ├── sequence_diagram.plantuml    # Process flows
    ├── er_diagram.plantuml          # Database schema
    └── ui_navigation.plantuml       # UI navigation flow
```

## Configuration Files
```
config/
├── environments/
│   ├── development.env              # Development environment
│   ├── staging.env                  # Staging environment
│   └── production.env               # Production environment
├── nginx/
│   ├── nginx.conf                   # Web server configuration
│   └── ssl/                         # SSL certificates
├── redis/
│   └── redis.conf                   # Redis configuration
├── postgresql/
│   └── postgresql.conf              # Database configuration
└── monitoring/
    ├── prometheus.yml               # Metrics configuration
    └── grafana.json                 # Dashboard definitions
```

This file structure provides a comprehensive organization for the enhanced Lost & Found AI system, supporting scalable development, deployment, and maintenance of all components including the auto-learning ML pipeline and real-time notification system.