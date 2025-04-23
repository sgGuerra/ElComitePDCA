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
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
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

module.exports = { swaggerSpec, swaggerUi };
