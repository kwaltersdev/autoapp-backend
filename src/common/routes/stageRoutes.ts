import express, { Request, Response } from 'express';
import { StageEndpointsInterface } from '../service/endpoints/StageEndpointsInterface';
import { checkAssignStageParam, checkUpdateStageOrderParam } from './typeChecks';
import { serverError, badRequest } from './routeUtilities';

export function stageRoutes(stageEndpoints: StageEndpointsInterface) {
  const stages = stageEndpoints;
  const router = express.Router();

  // GET items
  // Get vehicles counts per stage
  router.get('/get-stage-vehicle-counts', async (req: Request, res: Response) => {
    try {
      const response = await stages.getStageVehicleCounts();
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  router.get('/get-person-place-vehicle-counts', async (req: Request, res: Response) => {
    try {
      const response = await stages.getPersonPlaceVehicleCounts();
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Find a Stage Assignment by stageId
  router.get('/find-stage', async (req: Request, res: Response) => {
    const { stageId } = req.body;
    if (!stageId) {
      badRequest(`Missing 'stageId' parameter`, req, res);
      return;
    }
    try {
      const response = await stages.findStageAssignment(stageId);
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Find Stage Assignment History by vehicleId
  router.get('/stage-history', async (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId;
    if (!vehicleId) {
      badRequest(`Missing 'vehicleId' parameter`, req, res);
      return;
    }
    try {
      const response = await stages.getStageHistory(vehicleId as string);
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Get Stages
  router.get('/get-stages', async (req: Request, res: Response) => {
    try {
      const response = await stages.getStages();
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Get People/Places
  router.get('/get-people-places', async (req: Request, res: Response) => {
    const stageId = req.query.stageId;
    if (!stageId) {
      badRequest(`missing 'stageId' parameter`, req, res);
      return;
    }
    try {
      const result = await stages.getPeoplePlaces(stageId as string);
      res.status(200).json(result);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Get All People/Places
  router.get('/get-all-people-places', async (req: Request, res: Response) => {
    try {
      const response = await stages.getAllPeoplePlaces();
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // POST items

  // Assign a Stage
  router.post('/assign-stage', async (req: Request, res: Response) => {
    let assignStageParam;
    let previousStage;
    try {
      assignStageParam = JSON.parse(req.body.assignStageParam);
      checkAssignStageParam(assignStageParam);
      if (req.body.previousStage) previousStage = JSON.parse(req.body.previousStage);
    } catch (e) {
      badRequest(e, req, res);
      return;
    }

    try {
      const response = await stages.assignStage(assignStageParam, previousStage);
      res.status(201).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Add a Stage
  router.post('/add-stage', async (req: Request, res: Response) => {
    const { stage } = req.body;
    if (!stage) {
      badRequest(`Missing 'stage' paramter`, req, res);
      return;
    }
    try {
      const response = await stages.addStage(stage);
      res.status(201).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // Add a Person/Place
  router.post('/add-person-place', async (req: Request, res: Response) => {
    const { stageId, personPlace } = req.body;
    if (!stageId || !personPlace) {
      badRequest(`Missing required parameter(s)`, req, res);
      return;
    }
    try {
      const response = await stages.addPersonPlace(stageId, personPlace);
      res.status(201).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  // PATCH items

  // Update a Stage
  // router.patch('/update-stage-assignment', async (req: Request, res: Response) => {
  // const stageAssignmentId = req.body.stageAssignmentId;
  // if (!stageAssignmentId) {
  // badRequest(`Missing 'stageAssignmentId' parameter`, req, res);
  // return;
  // }
  // let updateDoc;
  // try {
  // updateDoc = JSON.parse(req.body.updateDoc);
  // } catch (e) {
  // badRequest(e, req, res);
  // return;
  // }
  // try {
  // const response = await stages.updateStageAssignment(stageAssignmentId, updateDoc);
  // res.status(200).json(response);
  // } catch (e) {
  // serverError(e, req, res);
  // }
  // });

  // Complete a stageAssignment
  router.patch('/complete-stage-assignment', async (req: Request, res: Response) => {
    const { stageAssignmentId, dateCompleted } = req.body;
    if (!stageAssignmentId || !dateCompleted) {
      badRequest(`Missing one or more required parameters`, req, res);
      return;
    }
    const dateCompletedNum = parseInt(dateCompleted);
    try {
      const response = await stages.completeStageAssignment(stageAssignmentId, dateCompletedNum);
      res.status(200).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });


  // Update Stage Order
  router.patch('/update-stage-order', async (req: Request, res: Response) => {
    let updates;
    try {
      updates = req.body.updates;
      checkUpdateStageOrderParam(updates);
    } catch (e) {
      badRequest(e, req, res);
      return;
    }
    try {
      const response = await stages.updateStageOrder(updates);
      res.status(201).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });

  router.patch('/add-stage-person-place', async (req: Request, res: Response) => {
    const { stageId, personPlaceId } = req.body;
    if (!stageId || !personPlaceId) {
      badRequest(`Missing required 'addStagePersonPlace' paramter(s)`, req, res);
      return;
    }
    try {
      const response = await stages.addStagePersonPlace(stageId, personPlaceId);
      res.status(201).json(response);
    } catch (e) {
      serverError(e, req, res);
    }
  });


  return router;
}