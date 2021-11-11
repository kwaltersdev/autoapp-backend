import { StageEndpointsInterface } from "../StageEndpointsInterface";
import { StageSummary } from '../../../types/Stage';
import { IdName } from "../../../types/misc";
import { GetSuccess, SuccessResult, PostSuccess } from "../../../types/Results";
import { Defaults, Stages, PeoplePlaces, VehicleDescriptors, VehicleDescriptorsQueryResult, ModelQueryResult } from '../../../types/Demo';
import { VehicleEndpointsInterface } from "../VehicleEndpointsInterface";
import { demoNotes } from './demoData/demoNotes';
import { defaults } from './defaults';
import { AssignmentProbability, assignmentProbabilities as assignmentProbabilitiesImport } from "./demoData/demoStagesPeoplePlaces";
import { AddVehicleParam } from "../../../types/Vehicle";
import AutoFlowClient from "../../../../mongoDb/AutoFlowClient";
import { DbSelection } from '../../../types/Demo';
import AutoFlowConnect from "../../../../mysql/AutoFlowConnect";
import { Pool } from 'mysql2/promise';

export function setDefaults(stages: StageEndpointsInterface, db: DbSelection) {
  return async () => {
    const mongoClient = new AutoFlowClient();
    const mysqlConnect = new AutoFlowConnect();
    const connection = db === 'mongodb' ? await mongoClient.connect() : await mysqlConnect.createPool();
    try {
      // check if our defaults alrady exist in the db;
      const stagestmp = await stages.getStages(connection);
      const assign = stagestmp.data.find((stage: StageSummary) => stage.name === defaults.assignStage.stage);
      const forSale = stagestmp.data.find((stages: StageSummary) => stages.name === defaults.forSaleStage.stage);
      const peoplePlacestmp = await stages.getAllPeoplePlaces(connection);
      const inventoryManager = peoplePlacestmp.data.find((personPlace: IdName) => personPlace.name === defaults.assignStage.personPlace);
      const smallTownAutoSales = peoplePlacestmp.data.find((personPlace: IdName) => personPlace.name === defaults.assignStage.stage);
      // add our defaults if they don't
      if (!assign && !forSale && !inventoryManager && !smallTownAutoSales) {
        const addStage = stages.addStage(defaults.assignStage.stage, connection);
        const addforSale = stages.addStage(defaults.forSaleStage.stage, connection);
        const stageResults = await Promise.all([addStage, addforSale]);
        const addInventoryManager = stageResults[0].doc && stages.addPersonPlace(stageResults[0].doc.id, defaults.assignStage.personPlace, connection);
        const addSmallTownAutoSales = stageResults[1].doc && stages.addPersonPlace(stageResults[1].doc.id, defaults.forSaleStage.personPlace, connection);
        const personPlaceResults = await Promise.all([addInventoryManager, addSmallTownAutoSales]);
        if (
          stageResults[0].status === 'success' &&
          stageResults[1].status === 'success' &&
          personPlaceResults[0]?.status === 'success' &&
          personPlaceResults[1]?.status === 'success'
        ) {
          return new SuccessResult;
        } else {
          throw new Error('failed to add default "Assign" and "Inventory Manager');
        }
      }
      return new SuccessResult;
    } finally {
      db === 'mongodb' && await mongoClient.close();
      db === 'mysql' && await (connection as Pool).end();
    }
  };
};

export function getDefaults(stages: StageEndpointsInterface, db: DbSelection) {
  return async () => {
    const mongoClient = new AutoFlowClient();
    const mysqlConnect = new AutoFlowConnect();
    const connection = db === 'mongodb' ? await mongoClient.connect() : await mysqlConnect.createPool();
    try {
      const stagestmp = await stages.getStages(connection);
      const assign = stagestmp.data.find((stage: StageSummary) => stage.name === 'Assign');
      const peoplePlacestmp = await stages.getAllPeoplePlaces(connection);
      const inventoryManager = peoplePlacestmp.data.find((personPlace: IdName) => personPlace.name === 'Inventory Manager');

      if (assign && inventoryManager) {
        const defaults: Defaults = {
          defaultStageAssignment: {
            stage: {
              id: assign.id,
              name: assign.name,
            },
            personPlace: {
              id: inventoryManager.id,
              name: inventoryManager.name,
            },
          },
        };

        return new GetSuccess(defaults);
      }

      throw new Error('failed to get defaults');

    } finally {
      db === 'mongodb' && await mongoClient.close();
      db === 'mysql' && await (connection as Pool).end();
    }
  };
}

export function addVehicleDescriptors(vehicles: VehicleEndpointsInterface, vehicleDescriptors: VehicleDescriptors, db: DbSelection) {
  return async () => {
    const mongoClient = new AutoFlowClient();
    const mysqlConnect = new AutoFlowConnect();
    const connection = db === 'mongodb' ? await mongoClient.connect() : await mysqlConnect.createPool();
    try {
      for (let make of vehicleDescriptors) {
        const addedMake = await vehicles.addMake(make.make, connection) as PostSuccess<IdName, IdName[]>;
        for (let model of make.models) {
          const addedModel = await vehicles.addModel(addedMake.id, model.model, connection) as PostSuccess<IdName, IdName[]>;
          for (let trim of model.trims) {
            await vehicles.addTrim(addedModel.id, trim, connection);
          }
        }
      }
      return new SuccessResult;
    } finally {
      db === 'mongodb' && await mongoClient.close();
      db === 'mysql' && await (connection as Pool).end();

    }
  };
}

export function addStages(stageEndpoints: StageEndpointsInterface, stages: Stages, peoplePlaces: PeoplePlaces, db: DbSelection) {
  return async () => {
    const mongoClient = new AutoFlowClient();
    const mysqlConnect = new AutoFlowConnect();
    const connection = db === 'mongodb' ? await mongoClient.connect() : await mysqlConnect.createPool();
    try {
      type Stagestmp = { stage: string, id: string; }[];
      const stagestmp: Stagestmp = [];
      for (let stage of stages) {
        const addedStage = await stageEndpoints.addStage(stage, connection) as PostSuccess<IdName, IdName[]>;
        stagestmp.push({ stage, id: addedStage.id });
      }

      for (let personPlace of peoplePlaces) {
        const firstStageId = stagestmp.find(stage => stage.stage === personPlace.stages[0])?.id;
        const addedPersonPlace = firstStageId && await stageEndpoints.addPersonPlace(firstStageId, personPlace.name, connection) as PostSuccess<IdName, { peoplePlaces: IdName[] | undefined; allPeoplePlaces: IdName[]; }>;

        // this is necessary to add all of the additional stages that a person/place might be associated with
        for (let stage of personPlace.stages) {
          const stageId = stagestmp.find(stageTmp => stageTmp.stage === stage)?.id;
          stageId && addedPersonPlace && await stageEndpoints.addStagePersonPlace(stageId, addedPersonPlace.id, connection);
        }
      }

      return new SuccessResult;

    } finally {
      db === 'mongodb' && await mongoClient.close();
      db === 'mysql' && await (connection as Pool).end();
    }
  };
}

export function generateVehicles(vehicles: VehicleEndpointsInterface, stages: StageEndpointsInterface, db: DbSelection) {
  return async (vehiclesAmountParam: number, monthsBackParam: number) => {
    const mongoClient = new AutoFlowClient();
    const mysqlConnect = new AutoFlowConnect();
    const connection = db === 'mongodb' ? await mongoClient.connect() : await mysqlConnect.createPool();
    try {
      const vehicleAmount = vehiclesAmountParam;
      const startPoint = monthsBackParam; // time in MONTHS to go back for first vehicle

      const vehicleDescriptors = await getVehicleDescriptors(vehicles);
      const stagesTmp = (await stages.getStages(connection)).data;
      const peoplePlaces = (await stages.getAllPeoplePlaces(connection)).data;
      const assignmentProbabilities = getCompleteAssignmentProbabilities(assignmentProbabilitiesImport, stagesTmp, peoplePlaces);

      // generate vehicle
      const genStock = stockGenerator(vehicleAmount);
      const genDateAdded = dateAddedGenerator(vehicleAmount, startPoint);

      async function* vehicleGenerator() {
        for (let i = 0; i < vehicleAmount; i++) {
          const stock = genStock.next().value;
          const year = randomYear();
          const make = randomMake(vehicleDescriptors);
          const model = make && randomModel(vehicleDescriptors, make.id);
          const trim = make && model && randomTrim(vehicleDescriptors, make.id, model.id);
          const notes = randomNotes(demoNotes);
          const dateAdded = genDateAdded.next().value;

          const vehicle: AddVehicleParam = {
            stock,
            year,
            make,
            model,
            trim,
            notes,
            dateAdded,
          };
          yield vehicle;
        }
      }

      const gen = vehicleGenerator();

      for (let i = 0; i < vehicleAmount; i++) {
        const iteration = await gen.next();

        try {
          const vehicleHistory = generateVehicleHistory(iteration.value as AddVehicleParam, assignmentProbabilities);
          const first = vehicleHistory[0];
          const initialStageAssignment = {
            stage: first.stage,
            personPlace: first.personPlace,
            tasks: []
          };
          const vehicle = (await vehicles.addVehicle(iteration.value as AddVehicleParam, initialStageAssignment, connection)).doc;
          const currentDate = Date.now();
          // start our loop at the second assignment value (index: 1), since the first was already assigned when vehicle was added
          for (let i = 1; i < vehicleHistory.length; i++) {
            const assignment = vehicleHistory[i];
            if (assignment.dateRange[0] <= currentDate) {
              if (vehicle) {
                // if i equals 1 (this is the first stage after the initial stage) then we need to complete the initial stage
                if (i === 1) {
                  await stages.completeStageAssignment(vehicle.currentStage.id, assignment.dateRange[0], connection);
                }
                const assignStageParam = {
                  vehicleId: vehicle.id,
                  dateAssigned: assignment.dateRange[0],
                  stage: assignment.stage,
                  personPlace: assignment.personPlace,
                  tasks: [],
                  dateForSale: assignment.stage.name === 'For Sale' ? assignment.dateRange[0] : undefined
                };
                const updatedVehicle = (await stages.assignStage(assignStageParam, undefined, false, undefined, connection)).doc;
                if (updatedVehicle) {
                  if (assignment.dateRange[1] < currentDate) {
                    if (assignment.stage.name === 'For Sale') {
                      await vehicles.sellVehicle(vehicle.id, updatedVehicle.currentStage.id, assignment.dateRange[1], connection);
                    } else {
                      await stages.completeStageAssignment(updatedVehicle.currentStage.id, assignment.dateRange[1], connection);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
        // const percentDoneIncrement = vehicleAmount >= 10000 ? 1 : vehicleAmount >= 1000 ? 5 : 10;
        const percentDone = (i + 1) / vehicleAmount * 100;
        (percentDone % 1 === 0) && console.log(`Generating Vehicles: ${percentDone}% done`);
      }

      return new SuccessResult;

    } finally {
      db === 'mongodb' && await mongoClient.close();
      db === 'mysql' && await (connection as Pool).end();
    }
  };
}

// HELPER FUNCTIONS
function* stockGenerator(vehicleAmount: number) {
  const year = new Date().getFullYear();
  let stock = (year - 2000) * 1000 + 1;
  const stockMax = 99999;
  for (let i = 0; i < vehicleAmount; i++) {
    if (stock < stockMax) {
      yield stock++;
    }
    else yield 0;
  }
  return 0;
}

function randomYear() {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 3;
  const minYear = currentYear - 10;
  return getRandomIntRange(minYear, maxYear);
}

function randomMake(vehicleDescriptors: VehicleDescriptorsQueryResult) {
  const makes: IdName[] = [];
  vehicleDescriptors.forEach(make => makes.push({ id: make.id, name: make.make }));
  const index = getRandomInt(makes.length);
  return makes[index];
}

function randomModel(vehicleDescriptors: VehicleDescriptorsQueryResult, makeId: string) {
  const models: IdName[] = [];
  vehicleDescriptors
    .find(make => make.id === makeId)?.models
    .forEach(model => models.push({ id: model.id, name: model.model }));
  const index = getRandomInt(models.length);
  return models[index];
}

function randomTrim(vehiclDescriptors: VehicleDescriptorsQueryResult, makeId: string, modelId: string) {
  const trims: IdName[] = [];
  vehiclDescriptors
    .find(make => make.id === makeId)?.models
    .find(model => model.id === modelId)?.trims
    .forEach(trim => trims.push({ id: trim.id, name: trim.trim }));
  const index = getRandomInt(trims.length);
  return trims[index];
}

function randomNotes(notes: string[]) {
  const rand = getRandomInt(2);
  return rand === 1 ? '' : notes[getRandomInt(notes.length)];
}

// startPoint parameter is in MONTHS and expresses how far back to go for adding the first car
function* dateAddedGenerator(vehicleAmount: number, startPoint: number) {
  const today = Date.now();
  const milliseconds = startPoint * 30.4167 * 24 * 60 * 60 * 1000;
  const gap = Math.floor(milliseconds / vehicleAmount);
  const startDate = today - milliseconds;
  let dateAdded = startDate;

  for (let i = 0; i < vehicleAmount; i++) {
    yield dateAdded;
    dateAdded = dateAdded + gap;
  }
  return 0;
}

async function getVehicleDescriptors(vehicles: VehicleEndpointsInterface) {
  const result: VehicleDescriptorsQueryResult = [];

  const makes: IdName[] = (await vehicles.getMakes()).data;
  for (let make of makes) {
    const models: ModelQueryResult = [];
    const modelsTmp = (await vehicles.getModels(make.id)).data;
    for (let model of modelsTmp) {
      const trims: any = [];
      const trimsTmp = (await vehicles.getTrims(model.id)).data;
      for (let trim of trimsTmp) {
        trims.push({ id: trim.id, trim: trim.name });
      }
      models.push({ id: model.id, model: model.name, trims });
    }

    result.push({ id: make.id, make: make.name, models });
  }

  return result;
}

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

function getRandomIntRange(min: number, max: number) {
  const range = max - min;
  const num = Math.floor(Math.random() * range);
  return min + num;
};

// inputs are in days, output is in milliseconds. Output provides bell range number
function randBellNumRange(min: number, max: number) {
  const v = 2; // number random numbers to average out (generate bell curve);
  var numTmp = 0;
  for (var i = v; i > 0; i--) {
    numTmp += Math.random();
  };
  const random = numTmp / v;
  const millisecondsInDay = (24 * 60 * 60 * 1000);
  const minMilliseconds = (min * millisecondsInDay);
  const maxMilliseconds = (max * millisecondsInDay);
  const range = (maxMilliseconds) - (minMilliseconds);
  const result = minMilliseconds + (random * range);
  return result;
}

interface PersonPlaceProbabilities {
  personPlace: IdName;
  probability: number; // probability of being assigned the given stage (0-1). All personPlace probabilities in the array must add up to 1;
  durationRange: number[]; // [MIN, MAX] values in DAYS;
}
interface CompleteAssignmentProbability {
  stage: IdName;
  initialProbability?: number; // only applicable to 'Assign', and is the probability that it will be assigned before any other stage (0-1);
  probability: number; // probability of stage ever being assigned. In the case of 'Assign', this is after every stage is completed, everyother case is once per vehicle
  peoplePlaces: PersonPlaceProbabilities[]; // array of peoplePlaces and thier probabilities and duration ranges for the stage ;
  selectPersonPlace: IdName[]; // array of 10 personPlace names. The number of times a personPlace appears in the array is equal to it's probability * 10;
};

function getCompleteAssignmentProbabilities(assignmentProbabilities: AssignmentProbability[], stagesParam: StageSummary[], peoplePlacesParam: IdName[]): CompleteAssignmentProbability[] {
  let completeAssignmentProbabilities: CompleteAssignmentProbability[] = [];
  for (let assignment of assignmentProbabilities) {
    // get the id for the stage
    const stageId = stagesParam.find(stage => stage.name === assignment.stage);
    // initialize 'peoplePlaces' array
    const peoplePlaces: PersonPlaceProbabilities[] = [];
    // initialize 'selectPersonPlace' array
    const selectPersonPlace: IdName[] = [];
    if (stageId) {
      for (let personPlace of assignment.peoplePlaces) {
        const personPlaceId = peoplePlacesParam.find(personPlaceTmp => personPlaceTmp.name === personPlace.personPlace);
        if (personPlaceId) {
          peoplePlaces.push({
            personPlace: personPlaceId,
            probability: personPlace.probability,
            durationRange: personPlace.durationRange
          });
          // add the personPlace name to selectPersonPlace arry for 10 times its probability
          for (let i = 0; i < personPlace.probability * 10; i++) {
            selectPersonPlace.push(personPlaceId);
          }
        }
      }
      completeAssignmentProbabilities.push({
        stage: {
          id: stageId.id,
          name: assignment.stage
        },
        initialProbability: assignment.initialProbability,
        probability: assignment.probability,
        peoplePlaces,
        selectPersonPlace
      });
    }
  }

  return completeAssignmentProbabilities;
};

function generateVehicleHistory(addVehicleParam: AddVehicleParam, completeAssignmentProbabilities: CompleteAssignmentProbability[]) {
  const assignStage = completeAssignmentProbabilities.find(assignment => assignment.stage.name === 'Assign');
  const dateAdded = addVehicleParam.dateAdded;
  let date: number = dateAdded;
  const vehicleHistory = [];
  for (let assignment of completeAssignmentProbabilities) {
    // this conditional is to determine if it is the first assignment in the array, the 'Assign' stage
    if (assignment.stage.name === 'Assign' && assignment.initialProbability) {
      // determine if 'Assign' should be assigned before any other stage
      if (Math.random() < assignment.initialProbability) {
        const stage = assignment.stage;
        //select personPlace
        let index = getRandomInt(10); // 10 is always the length of the selectPersonPlace array
        const personPlace = assignment.selectPersonPlace[index];
        const durationRangeTmp = assignment.peoplePlaces.find(personPlaceTmp => personPlaceTmp.personPlace.id === personPlace.id)?.durationRange;
        const min = durationRangeTmp ? durationRangeTmp[0] : 0;
        const max = durationRangeTmp ? durationRangeTmp[1] : 0;
        const duration = randBellNumRange(min, max);
        const startDate = date;
        const endDate = date += duration;
        const dateRange = [startDate, endDate];
        vehicleHistory.push({ stage, personPlace, dateRange });
      }
    } else {
      // determine if stage should be assigned
      if (Math.random() < assignment.probability) {
        const stage = assignment.stage;
        // select personPlace
        let index = getRandomInt(10); // 10 is always the length of the selectPersonPlace array
        const personPlace = assignment.selectPersonPlace[index];
        const durationRangeTmp = assignment.peoplePlaces.find(personPlaceTmp => personPlaceTmp.personPlace.id === personPlace.id)?.durationRange;
        const min = durationRangeTmp ? durationRangeTmp[0] : 0;
        const max = durationRangeTmp ? durationRangeTmp[1] : 0;
        const duration = randBellNumRange(min, max);
        const startDate = date;
        const endDate = date += duration;
        const dateRange = [startDate, endDate];
        vehicleHistory.push({ stage, personPlace, dateRange });
        // determine if 'Assign' should be assigned after stage is complete (all stages except 'For Sale')
        if (assignment.stage.name !== 'For Sale' && assignStage && assignStage.probability && Math.random() < assignStage.probability) {
          const stage = assignStage.stage;
          // select personPlace
          let index = getRandomInt(10); // 10 is always the length of the selectPersonPlace array
          const personPlace = assignStage.selectPersonPlace[index];
          const durationRangeTmp = assignStage.peoplePlaces.find(personPlaceTmp => personPlaceTmp.personPlace.id === personPlace.id)?.durationRange;
          const min = durationRangeTmp ? durationRangeTmp[0] : 0;
          const max = durationRangeTmp ? durationRangeTmp[1] : 0;
          const duration = randBellNumRange(min, max);
          const startDate = date;
          const endDate = date += duration;
          const dateRange = [startDate, endDate];
          vehicleHistory.push({ stage, personPlace, dateRange });
        }
      }
    }
  }

  return vehicleHistory;
}
