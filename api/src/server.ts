import env from './config/env';
import { start } from './app';
import logger from './utils/logger';

logger.info({ env: env.NODE_ENV }, 'Starting ContrataMais API');

start();
