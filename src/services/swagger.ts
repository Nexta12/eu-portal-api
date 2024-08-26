import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import swaggerJsdoc, { SwaggerDefinition } from 'swagger-jsdoc';

import logger from './logger';

const openApiDocs = yaml.load(readFileSync('src/docs/docs.yaml', 'utf8'));

const options: swaggerJsdoc.Options = {
  swaggerDefinition: openApiDocs as SwaggerDefinition,
  apis: ['src/routes/**/*.ts']
};

const specs = swaggerJsdoc(options);

const swaggerDocs = (app: Express, port: number) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  logger.info(`Docs available at http://localhost:${port}/docs`);
};

export default swaggerDocs;
