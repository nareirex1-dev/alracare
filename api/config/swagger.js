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
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.alracare.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Booking: {
          type: 'object',
          required: ['patient_name', 'patient_phone', 'appointment_date', 'appointment_time', 'selected_services'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique booking ID',
              example: 'BK1705123456ABC'
            },
            patient_name: {
              type: 'string',
              description: 'Full name of the patient',
              example: 'John Doe'
            },
            patient_phone: {
              type: 'string',
              description: 'Phone number (10-13 digits)',
              example: '081234567890'
            },
            patient_address: {
              type: 'string',
              description: 'Full address of the patient',
              example: 'Jl. Sudirman No. 123, Jakarta'
            },
            patient_notes: {
              type: 'string',
              description: 'Additional notes from patient',
              example: 'Alergi terhadap obat tertentu'
            },
            appointment_date: {
              type: 'string',
              format: 'date',
              description: 'Appointment date (YYYY-MM-DD)',
              example: '2024-01-20'
            },
            appointment_time: {
              type: 'string',
              format: 'time',
              description: 'Appointment time (HH:MM)',
              example: '14:30'
            },
            appointment_datetime: {
              type: 'string',
              format: 'date-time',
              description: 'Combined appointment datetime in UTC',
              example: '2024-01-20T07:30:00.000Z'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'cancelled'],
              description: 'Booking status',
              example: 'pending'
            },
            total_price: {
              type: 'number',
              description: 'Total price of all services',
              example: 500000
            },
            selected_services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'A_TAHILALAT(NEAVY)_1' },
                  name: { type: 'string', example: 'Tahi Lalat (Neavy)_1' },
                  price: { type: 'string', example: 'Rp 500.000' }
                }
              }
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-19T10:00:00.000Z'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Service ID',
              example: 'perawatan1'
            },
            title: {
              type: 'string',
              description: 'Service title',
              example: 'Perawatan Luka Modern'
            },
            description: {
              type: 'string',
              description: 'Service description',
              example: 'Pilih jenis perawatan luka yang Anda butuhkan'
            },
            type: {
              type: 'string',
              enum: ['checkbox', 'radio'],
              description: 'Selection type',
              example: 'checkbox'
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'string' },
                  image: { type: 'string' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 150
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 50
            },
            offset: {
              type: 'integer',
              description: 'Current offset',
              example: 0
            },
            hasMore: {
              type: 'boolean',
              description: 'Whether there are more items',
              example: true
            },
            currentPage: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 3
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Bookings',
        description: 'Booking management endpoints'
      },
      {
        name: 'Services',
        description: 'Service catalog endpoints'
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      }
    ]
  },
  apis: ['./api/routes/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;