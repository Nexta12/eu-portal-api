import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { DeepPartial } from 'typeorm';
import envConfig from './config/envConfig';
import dataSource from './data-source';
import handlingLogging from './middleware/logging';
import routes from './routes';
import { logger, swaggerDocs } from './services';
import { initializeSocketServer } from './socket.io/socketServer';
import { Gender, StaffEntity, UserRole } from './entities';

const { PORT } = envConfig;

const main = async () => {

  const staffRepository = dataSource.AppDataSource.getRepository(StaffEntity);
  try {

    const adminDetails: DeepPartial<StaffEntity> = {
      firstName: process.env.FIRSTNAME,
      lastName: process.env.LASTNAME,
      email: process.env.EMAIL,
      password: await bcrypt.hash(process.env.PASSWORD, 10),
      gender: Gender.MALE,
      phoneNumber: process.env.PHONENUMBER,
      address: 'Lagos Nigeria',
      role: UserRole.ADMIN,
      dateOfEmployment: new Date('1990-06-15'),
      cityOfResidence: 'Lagos',
      designation: 'Software Developer',
    };
    await dataSource.AppDataSource.initialize();

    const existingAdmin = await staffRepository.findOne({ where: { email: adminDetails.email } });

    if (existingAdmin) {

      logger.info('Super Admin exists');

    } else {
      const newAdmin = staffRepository.create(adminDetails);
      await staffRepository.save(newAdmin);
      logger.info('Super Admin user created successfully.');
    }

    const app = express();
    const server = http.createServer(app);

    initializeSocketServer(server);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(helmet());
    app.use(handlingLogging);
    app.use('/', routes);

    swaggerDocs(app, PORT);

    app.use((req, res) =>
      res.status(404).send({
        message: `This route does not exist: [${req.method}] ${req.url}`
      })
    );

    server.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        dataSource.AppDataSource.destroy();
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Error during server initialization:', error);
  }
}

main();
