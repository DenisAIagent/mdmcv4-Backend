const winston = require('winston');

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mdmc-music-ads' },
  transports: [
    // Écriture dans la console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // Écriture dans un fichier pour la production
    ...(process.env.NODE_ENV === 'production' 
      ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log' 
          })
        ] 
      : [])
  ]
});

module.exports = logger;
