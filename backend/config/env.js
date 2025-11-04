import dotenv from 'dotenv';

dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT'
];

// Optional but recommended
const optionalEnvVars = [
  'GEMINI_API_KEY',
  'HUGGINGFACE_API_KEY',
  'NODE_ENV'
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If required variables are missing
 */
export function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please create a .env file with these variables.`
    );
  }

  // Warn about missing optional variables
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Missing optional environment variables: ${missingOptional.join(', ')}\n` +
      `Some features may not work without these.`
    );
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters for security');
  }

  // Validate MongoDB URI format
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    throw new Error('MONGO_URI must be a valid MongoDB connection string');
  }

  console.log('✅ Environment variables validated successfully');
  
  return {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: parseInt(process.env.PORT) || 5000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production'
  };
}

export default validateEnv;
