import { ServiceAbstract } from '../service/ServiceAbstract';
import { stageRoutes } from './stageRoutes';
import { vehicleRoutes } from './vehicleRoutes';
import { statisticsRoutes } from './statisticsRoutes';
import { demoRoutes } from './demoRoutes';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';

export function initializeRoutes(app: Express, service: ServiceAbstract) {
  const { vehicleEndpoints, stageEndpoints, statisticsEndpoints, demoEndpoints } = service;

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  vehicleEndpoints && app.use('/api/vehicles', vehicleRoutes(vehicleEndpoints));
  stageEndpoints && app.use('/api/stages', stageRoutes(stageEndpoints));
  statisticsEndpoints && app.use('/api/statistics', statisticsRoutes(statisticsEndpoints));
  demoEndpoints && app.use('/api/demo', demoRoutes(demoEndpoints));
}