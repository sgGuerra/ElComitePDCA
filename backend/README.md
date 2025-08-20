# El Comité PDCA Backend - FastAPI

This is the backend API for the El Comité PDCA application, built with FastAPI.

## Features

- RESTful API with FastAPI
- SQLite database with async access via aiosqlite
- JWT authentication
- Role-based access control
- File upload management
- Swagger documentation

## Requirements

- Python 3.8 or higher
- Dependencies listed in requirements.txt

## Installation

1. Clone the repository
2. Navigate to the backend_fastapi directory
3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

The application uses environment variables for configuration. You can set these in a `.env` file in the root directory.

Example `.env` file:

```
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Running the Application

To run the application in development mode:

```bash
python run.py --reload
```

To run the application in production mode:

```bash
python run.py
```

## API Documentation

Once the application is running, you can access the API documentation at:

- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Creating an Admin User

Use the utility script to create an admin user:

```bash
python -m app.utils.create_admin --name "Admin User" --email "admin@example.com" --password "securepassword"
```

## API Endpoints

The API is organized around the following resource groups:

- **Authentication**: User login and token management
- **Users**: User CRUD operations
- **Processes**: Process CRUD operations
- **Actions**: Action CRUD operations 
- **Notifications**: User notification management
- **Statistics**: Data analytics and reporting

## Directory Structure

```
backend_fastapi/
├── app/
│   ├── api/
│   │   ├── endpoints/   # API endpoint handlers
│   │   └── routes.py    # API router configuration
│   ├── core/            # Core application components
│   ├── db/              # Database setup and utilities
│   ├── middleware/      # Middleware functions
│   ├── models/          # Data models and database access
│   ├── schemas/         # Pydantic models for request/response validation
│   ├── services/        # Business logic services
│   ├── uploads/         # File uploads directory
│   ├── utils/           # Utility functions
│   └── main.py          # Application entry point
├── asgi.py              # ASGI application for production servers
├── requirements.txt     # Python dependencies
└── run.py               # Development server runner
```

## Development

To contribute to the project:

1. Create a fork
2. Create a branch for your feature
3. Submit a pull request

## License

MIT
