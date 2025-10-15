import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, validateConfig } from './config/config';

// Validate configuration
validateConfig();

/**
 * Express App Setup
 */
const app: Application = express();

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression() as any);

// Request logging (Development)
if (config.server.isDevelopment) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
  });
});

// Import routes
import timetableRoutes from './routes/timetable.routes';
import substitutionRoutes from './routes/substitution.routes';
import cancelledRoutes from './routes/cancelled.routes';

// API Base Route
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Schulmanager API',
    version: '1.0.0',
    endpoints: {
      timetable: '/api/timetable',
      substitutions: '/api/substitutions',
      cancelled: '/api/cancelled',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/timetable', timetableRoutes);
app.use('/api/substitutions', substitutionRoutes);
app.use('/api/cancelled', cancelledRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.server.isDevelopment ? err.message : 'Internal server error',
      details: config.server.isDevelopment ? err.stack : undefined,
      statusCode: 500,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Server Start
// ============================================

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🚀 Schulmanager Backend API');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  console.log('');
});

export default app;
