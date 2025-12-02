import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

const dbSsl = (process.env.DB_SSL ?? 'true').toLowerCase() === 'true';
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: dbSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});

export async function connectAndSync() {
  try {
    await sequelize.authenticate();
    const syncAlter =
      (process.env.DB_SYNC_ALTER ?? 'false').toLowerCase() === 'true';
    if (syncAlter) {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

export default sequelize;
