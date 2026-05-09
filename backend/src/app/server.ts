import { createApp } from './app';
import logger from '../utils/logger';

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
