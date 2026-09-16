export interface IAppConfig {
  app: {
    APP_NAME: string;
    ENVIRONMENT: string;
    APP_PORT: number;
  };
  utils: {
    EXTERNAL_URLS: {
      getByIdResource: string;
    };
    AVAILABLE_VERSIONS: string[];
    LOG_LEVEL: string;
    ENABLED_ENCRYPT: boolean;
    SCHEMAS_NAMES: string[];
    languages: string[];
    INGRESS_HOST: string;
    BALLS: {
      red?: string;
      orange?: string;
      yellow?: string;
      green?: string;
      blue?: string;
      violet?: string;
      black?: string;
      white?: string;
    };
  };
  database: {
    DB_NAME: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_SSL_CA?: string;
    DB_PASSWORD: string;
    DB_PROVIDER: 'mongo' | 'atlas';
    DB_USERNAME: string;
    DB_SSL?: boolean;
    DB_SSL_VALIDATE?: boolean;
    DB_SECURE_SOCKET?: boolean;
  };
  kafka: {
    KAFKA_ID?: string;
    KAFKA_BROKERS?: string[];
    KAFKA_LOG_LEVEL?: number | null;
  };
  aws: {
    ENABLED_AWS_S3: boolean;
    AWS_CONFIG: {
      id?: string;
      secret?: string;
      buckets: {
        assets: string;
      };
    };
    MIME_TYPES: string[];
    UPLOAD_CONFIG: {
      encoding: string;
      mimeTypes: string[];
      maxFileSize: number;
      maxFieldsSize: number;
    };
    FILE_STORAGE?: string;
  };
}

export default () => {
  const GATEWAY_URL = `http://${process.env.GATEWAY_HOST}:${process.env.GATEWAY_PORT}`;
  const MIME_TYPES = [
    'image/jpeg',
    'image/gif',
    'image/bmp',
    'image/png',
    'audio/mpeg',
    'audio/ogg',
    'video/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  return {
    app: {
      APP_NAME: 'defaults-service',
      APP_PORT: parseInt(process.env.APP_PORT ?? '3000', 10),
      ENVIRONMENT: process.env.ENVIRONMENT?.toLowerCase() as string,
    },
    utils: {
      EXTERNAL_URLS: {
        // *External-URLs
        getByIdResource: `${GATEWAY_URL}/resources/:id`,
      },
      AVAILABLE_VERSIONS: process.env?.AVAILABLE_VERSIONS?.split(',') || [
        '1.0.0',
      ],
      LOG_LEVEL: process.env.LOG_LEVEL as string,
      ENABLED_ENCRYPT: process.env.ENABLED_ENCRYPT === 'true',
      SCHEMAS_NAMES: ['codeableConcept'],
      languages: ['es', 'en'],
      INGRESS_HOST: `http://${process.env.INGRESS_HOST}`,
      BALLS: {
        red: '🔴',
        orange: '🟠',
        yellow: '🟡',
        green: '🟢',
        blue: '🔵',
        violet: '🟣',
        black: '⚫',
        white: '⚪',
      },
    },
    database: {
      DB_NAME: process.env.DB_NAME as string,
      DB_HOST: process.env.DB_HOST as string,
      DB_PORT: parseInt(process.env.DB_PORT ?? '27017', 10),
      DB_SSL_CA: process.env.DB_SSL_CA,
      DB_PASSWORD: process.env.DB_PASSWORD as string,
      DB_USERNAME: process.env.DB_USERNAME as string,
      DB_PROVIDER: process.env.DB_PROVIDER as 'mongo' | 'atlas',
      DB_SSL: process.env.DB_SSL?.toLowerCase() === 'true',
      DB_SSL_VALIDATE: process.env.DB_SSL_VALIDATE?.toLowerCase() === 'true',
      DB_SECURE_SOCKET:
        process.env.DB_SECURE_SOCKET?.toLowerCase() === 'true' || false,
    },
    kafka: {
      KAFKA_ID: process.env.KAFKA_ID,
      KAFKA_BROKERS: process.env.KAFKA_BROKERS?.split(','),
      KAFKA_LOG_LEVEL: process.env?.KAFKA_LOG_LEVEL
        ? Number(process.env?.KAFKA_LOG_LEVEL)
        : null,
    },
    aws: {
      ENABLED_AWS_S3:
        (process.env.ENABLED_AWS_S3?.toLowerCase() === 'true' ? true : false) ||
        false,
      AWS_CONFIG: {
        id: process.env.AWS_ID,
        secret: process.env.AWS_SECRET,
        buckets: {
          assets: process.env.S3_ASSETS_BUCKET || 'none',
        },
      },
      MIME_TYPES,
      UPLOAD_CONFIG: {
        encoding: 'utf-8',
        mimeTypes: MIME_TYPES,
        maxFileSize: 3 * 1024 * 1024,
        maxFieldsSize: 3 * 1024 * 1024,
      },
      FILE_STORAGE: process.env.FILE_STORAGE as string,
    },
  } as IAppConfig;
};
