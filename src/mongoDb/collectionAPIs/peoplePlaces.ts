import AutoFlowClient, { AutoFlowConnection } from '../AutoFlowClient';
import { convertMongoPersonPlace } from '../mongoUtilities';
import { GetSuccess, PostSuccess, PostExists } from '../../common/types/Results';
import { addStagePersonPlaceMongo } from './stages';
import { PersonPlaceVehicleCount } from 'common/types/Stage';

// INTERFACE EXPORTS
export async function getPersonPlaceVehicleCountsMongo(connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    const peoplePlacesTmp = (await getAllPeoplePlacesMongo(connection)).data;
    const peoplePlacesCounts: PersonPlaceVehicleCount[] = [];
    for (let personPlace of peoplePlacesTmp) {
      const count = (await vehicles.countDocuments({ status: { $in: ['active'] }, 'currentStage.personPlaceId': { $eq: personPlace.id } })).valueOf();
      peoplePlacesCounts.push({ ...personPlace, count });
    }
    return new GetSuccess(peoplePlacesCounts);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function getAllPeoplePlacesMongo(connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { peoplePlaces } = connection;
    const mongoPeoplePlaces = await peoplePlaces.find().sort({ name: 1 }).toArray();
    const peoplePlacestmp = mongoPeoplePlaces
      .map(personPlace => convertMongoPersonPlace(personPlace))
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
    return new GetSuccess(peoplePlacestmp);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function addPersonPlaceMongo(stageId: string, personPlace: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { peoplePlaces } = connection;
    // check if personPlace already exists
    const search = await peoplePlaces.findOne({ name: personPlace });
    if (search) return new PostExists('name', personPlace);
    const personPlaceDoc = { name: personPlace };
    const response = await peoplePlaces.insertOne(personPlaceDoc);
    const personPlaceId = response.insertedId;
    const allPeoplePlacesTmp = getAllPeoplePlacesMongo(connection);
    const newPersonPlaceTmp = addStagePersonPlaceMongo(stageId, personPlaceId, connection);
    const [allPeoplePlaces, newPersonPlace] = await Promise.all([allPeoplePlacesTmp, newPersonPlaceTmp]);
    return new PostSuccess(
      personPlaceId.toHexString(),
      { id: response.insertedId, name: personPlace },
      { peoplePlaces: newPersonPlace?.data, allPeoplePlaces: allPeoplePlaces.data }
    );
  } finally {
    !connectionParam && await client.close();
  }
};