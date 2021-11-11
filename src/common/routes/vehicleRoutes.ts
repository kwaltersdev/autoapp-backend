import express, { Request, Response } from 'express';
import { VehicleEndpointsInterface } from '../service/endpoints/VehicleEndpointsInterface';
import { checkAddVehicleParam, checkInitialStageParam } from './typeChecks';
import { serverError, badRequest, postSuccess } from './routeUtilities';
import { VehicleStatus } from 'common/types/Vehicle';
import { ListOrder, Page } from 'common/types/misc';

export function vehicleRoutes(vehicleEndpoints: VehicleEndpointsInterface) {
  const vehicles = vehicleEndpoints;
  const router = express.Router();

  // GET items
  // Get Vehicles by Status Paged
  router.get('/get-vehicles-paged/:status/:sort/:perPage/:page/:compare', async (req: Request, res: Response) => {
    const { status, sort, perPage, page, compare } = req.params;

    if (!status || !sort || !perPage || !page) {
      badRequest(`Missing required parameters`, req, res);
    } else if ((page === 'next' || page === 'prev') && !compare) {
      badRequest(`Missing compare value`, req, res);
    } else {
      try {
        const result = await vehicles.getVehiclesPaged(
          status as VehicleStatus,
          sort as ListOrder,
          parseInt(perPage),
          page as Page,
          parseInt(compare),
          req.query
        );
        res.status(200).json(result);
      } catch (e) {
        serverError(e, req, res);
      }
    }
  });

  // Get Vehicles by Status:
  router.get('/', async (req: Request, res: Response) => {
    const status = req.query.status;
    let statusParams: string[] = [];
    if (!status) {
      badRequest(`missing 'status' query operator (active / sold / forSale / trash)`, req, res);
    } else {
      if (typeof status === 'string') {
        statusParams.push(status);
      } else {
        statusParams = [...status as string[]];
      };
      try {
        const result = await vehicles.getVehicles(statusParams);
        res.status(200).json(result);
      } catch (e) {
        serverError(e, req, res);
      };
    };
  });

  // Get next stock number suggestion:
  router.get('/next-stock', async (req: Request, res: Response) => {
    try {
      const result = await vehicles.getNextStock();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Check if a stock number already exists:
  router.get('/check-stock', async (req: Request, res: Response) => {
    const stock = req.query.stock;
    if (!stock) {
      badRequest(`missing 'stock' parameter`, req, res);
      return;
    };
    try {
      const result = await vehicles.checkStock(stock as string);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Find Vehicle by 'id' or 'stock' Field:
  router.get('/find', async (req: Request, res: Response) => {
    const { field, value } = req.query;
    if (!field || !value) {
      badRequest(`missing required query parameter(s)`, req, res);
      return;
    };
    if (field !== 'id' && field !== 'stock') {
      badRequest(`'field' query parameter may only be values 'id' or 'stock'`, req, res);
      return;
    };
    try {
      let result = await vehicles.findVehicle(field, value as string);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Get makes
  router.get('/makes', async (req: Request, res: Response) => {
    try {
      const result = await vehicles.getMakes();
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Get models
  router.get('/models', async (req: Request, res: Response) => {
    const makeId = req.query.makeId;
    try {
      const result = await vehicles.getModels(makeId as string);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Get trims
  router.get('/trims', async (req: Request, res: Response) => {
    const modelId = req.query.modelId;
    if (!modelId) {
      badRequest(`Missing 'modelId' parameter`, req, res);
      return;
    };
    try {
      const result = await vehicles.getTrims(modelId as string);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // POST items

  // Add New Vehicle
  router.post('/add', async (req: Request, res: Response) => {
    let addVehicleParam;
    let initialStageParam;
    try {
      addVehicleParam = JSON.parse(req.body.addVehicleParam);
      checkAddVehicleParam(addVehicleParam);
      initialStageParam = JSON.parse(req.body.initialStageParam);
      checkInitialStageParam(initialStageParam);
    } catch (e) {
      badRequest(e, req, res);
      return;
    };

    try {
      let result = await vehicles.addVehicle(addVehicleParam, initialStageParam);
      postSuccess(result, res);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Add new make
  router.post('/add-make', async (req: Request, res: Response) => {
    const { make } = req.body;
    if (!make) {
      badRequest(`Missing required 'make' parameter`, req, res);
      return;
    };
    try {
      const result = await vehicles.addMake(make);
      res.status(201).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Add new model
  router.post('/add-model', async (req: Request, res: Response) => {
    const { makeId, model } = req.body;
    if (!makeId || !model) {
      badRequest(`Missing one or more required 'model' parameter(s)`, req, res);
      return;
    };
    try {
      const result = await vehicles.addModel(makeId, model);
      res.status(201).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // PATCH items

  // Update Vehicle Doc
  router.patch('/update', async (req: Request, res: Response) => {
    const { vehicleId, updateDoc: update } = req.body;
    if (!vehicleId || !update) {
      badRequest('Missing required paramater', req, res);
      return;
    };
    let updateDoc;
    try {
      updateDoc = JSON.parse(update);
    } catch (e) {
      badRequest(e, req, res);
      return;
    };
    try {
      let result = await vehicles.updateVehicle(vehicleId, updateDoc);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Sell Vehicle
  router.patch('/sell', async (req: Request, res: Response) => {
    const { vehicleId, stageAssignmentId, dateSold } = req.body;
    if (!vehicleId || !stageAssignmentId || !dateSold) {
      badRequest('Missing required parameter(s)', req, res);
      return;
    };
    const dateSoldNum = parseInt(dateSold);
    try {
      const result = await vehicles.sellVehicle(vehicleId, stageAssignmentId, dateSoldNum);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // Add Trim
  router.patch('/add-trim', async (req: Request, res: Response) => {
    const { modelId, trim } = req.body;
    if (!modelId || !trim) {
      badRequest(`Missing required 'add trim' parameter(s)`, req, res);
      return;
    };
    try {
      const result = await vehicles.addTrim(modelId, trim);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  // DELETE items

  // Delete Vehicle
  router.delete('/delete', async (req: Request, res: Response) => {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      badRequest(`Missing required 'vehicleId' parameter`, req, res);
      return;
    };
    try {
      let result = await vehicles.deleteVehicle(vehicleId);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    };
  });

  return router;
}