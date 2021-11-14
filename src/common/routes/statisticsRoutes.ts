import express, { Request, Response } from 'express';
import { StatisticsEndpointsInterface } from '../service/endpoints/statistics/StatisticsEndpointsInterface';
import { serverError } from './routeUtilities';

export function statisticsRoutes(statisticsEndpoints: StatisticsEndpointsInterface) {
  const statistics = statisticsEndpoints;
  const router = express.Router();

  // GET items
  // Get vehicle turn statistics
  router.get('/vehicle-turn-statistics', async (req: Request, res: Response) => {
    try {
      const result = await statistics.getVehicleTurnStats();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Get stage statistics
  router.get('/stages-statistics', async (req: Request, res: Response) => {
    try {
      const result = await statistics.getStageStatistics();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Get person place statistics
  router.get('/people-places-statistics', async (req: Request, res: Response) => {
    try {
      const result = await statistics.getPeoplePlacesStatistics();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  return router;
}