/**
 * Swagger/OpenAPI Configuration
 * API documentation setup using swagger-jsdoc and swagger-ui-express
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alracare Clinic API',
      version: '1.0.0',
      description: 'API documentation for Alracare Clinic Management System',
      contact: {
        name: 'Alracare Clinic',
        email: 'support@alracare.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://alracare.com/license'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://alracare.vercel.app' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;