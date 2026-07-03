// Express app factory. Kept separate from the HTTP server (src/index.js) so it
// can be imported by tests without binding a port.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.env !== 'test') app.use(morgan('dev'));

  app.use('/', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
