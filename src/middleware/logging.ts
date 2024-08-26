import { NextFunction, Request, Response } from 'express';

import logger from '../services/logger';

const getDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9; //  convert to nanoseconds
  const NS_TO_MS = 1e6; // convert to milliseconds
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

const handlingLogging = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  const start = process.hrtime();
  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    logger.info(
      `${req.method} ${req.url} ${res.statusCode} ${durationInMilliseconds.toLocaleString()} ms`
    );
  });

  next();
};

export default handlingLogging;
