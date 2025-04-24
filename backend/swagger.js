const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ElComitePDCA API',
    version: '1.0.0',
    description: 'API documentation for continuous improvement management system',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your bearer token in the format: Bearer <token>'
      },
      OAuth2: {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: '/api/auth/login',
            scopes: {}
          }
        }
      }
    },
    schemas: {
      // Keep all your existing schemas here
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@elcomite.org'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'admin123'
          }
        },
        required: ['email', 'password']
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Inicio de sesión exitoso'
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                example: 1
              },
              name: {
                type: 'string',
                example: 'Admin User'
              },
              email: {
                type: 'string',
                example: 'admin@elcomite.org'
              },
              role: {
                type: 'string',
                example: 'admin'
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          name: {
            type: 'string',
            example: 'Admin User'
          },
          email: {
            type: 'string',
            example: 'admin@elcomite.org'
          },
          role: {
            type: 'string',
            example: 'admin'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00.000Z'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    // Your existing tags
    {
      name: 'Authentication',
      description: 'User authentication endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Processes',
      description: 'Process management endpoints',
    },
    {
      name: 'Actions',
      description: 'Improvement actions endpoints',
    },
    {
      name: 'Findings',
      description: 'Findings management endpoints',
    },
    {
      name: 'Opportunities',
      description: 'Improvement opportunities endpoints', 
    },
    {
      name: 'Notifications',
      description: 'User notification endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './models/*.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// Configure SwaggerUI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true
  }
};

module.exports = { swaggerSpec, swaggerUi, swaggerUiOptions };
