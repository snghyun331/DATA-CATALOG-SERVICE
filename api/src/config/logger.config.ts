import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYYMMDD',
    dirname: `logs/${level}`,
    filename: `%DATE%_${level}.log`,
    maxFiles: 7,
    zippedArchive: true,
    maxSize: '5m',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf(({ level, message, timestamp, stack, context }) => {
        return `${timestamp} [${level}]: ${message} ${stack ? stack : ''} ${context ? JSON.stringify(context) : ''}`;
      }),
    ),
  };
};

export const WINSTON_CONFIG = {
  transports: [
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({
          format: 'MM-DD HH:mm:ss',
        }),
        winston.format.printf(({ level, message, timestamp, stack, context }) => {
          return `${timestamp} [${level}]: ${message} ${stack ? stack : ''} ${context ? JSON.stringify(context) : ''}`;
        }),
      ),
    }),
    new winstonDaily(dailyOptions('info')),
    new winstonDaily(dailyOptions('error')),
  ],
};