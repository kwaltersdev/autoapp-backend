import express, { Request, Response } from 'express';
import { DemoEndpointsInterface } from '../service/endpoints/demo/DemoEndpointsInterface';
import { serverError } from './routeUtilities';

export function demoRoutes(demoEndpoints: DemoEndpointsInterface) {
  const demo = demoEndpoints;
  const router = express.Router();

  // GET ITEMS
  // get defaults
  router.get('/get-defaults', async (req: Request, res: Response) => {
    try {
      const result = await demo.getDefaults();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // add vehicle descriptors
  router.post('/add-vehicle-descriptors', async (req: Request, res: Response) => {
    try {
      const result = await demo.addVehicleDescriptors();
      res.status(201).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  router.post('/add-stages', async (req: Request, res: Response) => {
    try {
      const result = await demo.addStages();
      res.status(201).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  router.post('/generate-vehicles/:numberOfVehicles/:monthsBack', async (req: Request, res: Response) => {
    let numberOfVehicles, monthsBack;
    try {
      numberOfVehicles = parseInt(req.params.numberOfVehicles);
      monthsBack = parseInt(req.params.monthsBack);
    } catch (e) {
      serverError(e, req, res);
    }
    if (numberOfVehicles && monthsBack) {
      try {
        const result = await demo.generateVehicles(numberOfVehicles, monthsBack);
        res.status(201).json(result);
      } catch (e) {
        serverError(e, req, res);
      }
    }

  });

  // DELETE ITEMS
  // clear database
  router.delete('/clear-database', async (req: Request, res: Response) => {
    try {
      const result = await demo.clearDatabase();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  return router;
}