import { MongoIdName } from './mongoTypes/mongoMisc';
import { MongoDetailedVehicle, MongoModelDoc, MongoVehicle } from './mongoTypes/MongoVehicle';
import { MongoStageAssignment } from './mongoTypes/MongoStageAssignment';
import { MongoExportStage } from './mongoTypes/MongoStage';
import { DetailedVehicle, ModelDoc, Vehicle } from '../common/types/Vehicle';
import { StageAssignment } from '../common/types/StageAssignment';
import { StageSummary, ExportStage } from '../common/types/Stage';
import { IdName } from '../common/types/misc';
import { ObjectId } from 'mongodb';

export const convertMongoVehicle = (mongoVehicle: MongoVehicle) => {
  const { _id } = mongoVehicle;
  const vehicleTmp: any = { id: _id.toHexString(), ...mongoVehicle };
  delete vehicleTmp._id;
  const vehicle: Vehicle = vehicleTmp;
  return vehicle;

};

export const convertMongoDetailedVehicle = (mongoDetailedVehicle: MongoDetailedVehicle) => {
  const { _id } = mongoDetailedVehicle;
  const vehicleTmp: any = { id: _id.toString(), ...mongoDetailedVehicle };
  delete vehicleTmp._id;
  const { _id: currentStage_id } = mongoDetailedVehicle.currentStage;
  vehicleTmp.currentStage = { id: currentStage_id.toString(), ...vehicleTmp.currentStage };
  delete vehicleTmp.currentStage._id;
  const DetailedVehicle: DetailedVehicle = vehicleTmp;
  return DetailedVehicle;
};

export const convertMongoStageAssignment = (mongoStageAssignment: MongoStageAssignment) => {
  const { _id } = mongoStageAssignment;
  const stagetmp: any = { id: _id.toHexString(), ...mongoStageAssignment };
  delete stagetmp._id;
  stagetmp.vehicleId = stagetmp.vehicleId.toHexString();
  const stageAssignment: StageAssignment = stagetmp;
  return stageAssignment;
};

export const convertMongoStageSummary = (mongoStageSummary: MongoIdName) => {
  const { _id } = mongoStageSummary;
  const stagetmp: any = { id: _id.toHexString(), ...mongoStageSummary };
  delete stagetmp._id;
  const stage: StageSummary = stagetmp;
  return stage;
};

export const convertMongoExportStage = (mongoStage: MongoExportStage) => {
  const { _id } = mongoStage;
  const stagetmp: any = { id: _id.toHexString(), ...mongoStage };
  delete stagetmp._id;
  const peoplePlacestmp = mongoStage.peoplePlaces.map(personPlacetmp => {
    const { _id, name: personPlaceName } = personPlacetmp;
    return { id: _id.toHexString(), name: personPlaceName };
  });
  stagetmp.peoplePlaces = peoplePlacestmp;
  const stage: ExportStage = stagetmp;
  return stage;
};

export const convertMongoPersonPlace = (mongoPersonPlace: MongoIdName) => {
  const { _id } = mongoPersonPlace;
  const personPlacetmp: any = { id: _id.toHexString(), ...mongoPersonPlace };
  delete personPlacetmp._id;
  const personPlace: IdName = personPlacetmp;
  return personPlace;
};

export const convertMongoMake = (mongoMake: MongoIdName) => {
  const { _id } = mongoMake;
  const maketmp: any = { id: _id.toHexString(), ...mongoMake };
  delete maketmp._id;
  const make: IdName = maketmp;
  return make;
};

export const convertMongoModel = (mongoModel: MongoIdName) => {
  const { _id } = mongoModel;
  const modeltmp: any = { id: _id.toHexString(), ...mongoModel };
  delete modeltmp._id;
  const model: IdName = modeltmp;
  return model;
};

export const convertMongoModelDoc = (mongoModelDoc: MongoModelDoc) => {
  const { _id, trims } = mongoModelDoc;
  const modelDoctmp: any = { id: _id.toHexString(), ...mongoModelDoc };
  delete modelDoctmp._id;
  const trimstmp = trims.map(trimtmp => {
    const { _id, name: trimName } = trimtmp;
    return { id: _id.toHexString(), name: trimName };
  });
  modelDoctmp.trims = trimstmp;
  const modelDoc: ModelDoc = modelDoctmp;
  return modelDoc;
};

export const handleIdParam = (id: string | ObjectId) => {
  let idtmp;
  typeof id === 'string' ? idtmp = new ObjectId(id) : idtmp = id;
  return idtmp;
};