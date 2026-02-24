import { config } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogPayload {
  event: string;
  [key: string]: any;
}

export class Logger {
  private isDev = config.env === 'development';

  private formatMessage(level: LogLevel, payload: LogPayload, error?: any) {
    const timestamp = new Date().toISOString();
    
    if (this.isDev) {
      // Pretty print with colors for local development
      const colors: Record<LogLevel | 'reset', string> = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[90m', // Gray
        success: '\x1b[32m', // Green
        reset: '\x1b[0m',
      };
      
      const color = colors[level] || colors.reset;
      const prefix = `[${timestamp}] ${color}[${level.toUpperCase()}]${colors.reset}`;
      const { event, ...meta } = payload;
      
      let msg = `${prefix} ${event}`;
      if (Object.keys(meta).length > 0) {
        msg += ` \n  ${colors.debug}${JSON.stringify(meta, null, 2)}${colors.reset}`;
      }
      if (error) {
        msg += ` \n  ${colors.error}${error.stack || error.message || error}${colors.reset}`;
      }
      return msg;
    }

    return JSON.stringify({
      level: level.toUpperCase(),
      timestamp,
      ...payload,
      ...(error && {
        error: error.message || error,
      })
    });
  }

  private normalizePayload(eventOrPayload: string | LogPayload, meta?: Record<string, any>): LogPayload {
    if (typeof eventOrPayload === 'string') {
      return { event: eventOrPayload, ...meta };
    }
    return eventOrPayload;
  }

  info(eventOrPayload: string | LogPayload, meta?: Record<string, any>) {
    console.log(this.formatMessage('info', this.normalizePayload(eventOrPayload, meta)));
  }
  
  success(eventOrPayload: string | LogPayload, meta?: Record<string, any>) {
    console.log(this.formatMessage('success', this.normalizePayload(eventOrPayload, meta)));
  }

  warn(eventOrPayload: string | LogPayload, meta?: Record<string, any>) {
    console.warn(this.formatMessage('warn', this.normalizePayload(eventOrPayload, meta)));
  }

  error(eventOrPayload: string | LogPayload, error?: any, meta?: Record<string, any>) {
    console.error(this.formatMessage('error', this.normalizePayload(eventOrPayload, meta), error));
  }

  debug(eventOrPayload: string | LogPayload, meta?: Record<string, any>) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', this.normalizePayload(eventOrPayload, meta)));
    }
  }
}

export const logger = new Logger();
