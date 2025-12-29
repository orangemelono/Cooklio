import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { connectRedis } from './database/redis';
import authRoutes from './routes/auth';
import pool from './database/connection';

const fastify = Fastify({ 
  logger: true 
});

// Register plugins
fastify.register(cors, {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
});
fastify.register(helmet);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });

// Root route
fastify.get('/', async (request, reply) => {
  return { message: 'Cooklio API Server' };
});

const start = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
    
    const port = parseInt(process.env.PORT || '8000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();