import { Vehicle } from '../../../../common/types/Vehicle';
import { VehicleTurnStats, NameValueData, NameValueDataInclPercentile, DetailedAssignmentStats, StatPortions, StageAssignmentStats, StageAssignmentStatsInclPercentile } from '../../../../common/types/Statistics';
import { GetSuccess } from '../../../../common/types/Results';
import { StageEndpointsInterface } from '../StageEndpointsInterface';
import { VehicleEndpointsInterface } from '../VehicleEndpointsInterface';
import { StageSummary } from '../../../types/Stage';
import { IdName } from '../../../types/misc';
import { StageAssignment } from '../../../types/StageAssignment';

// INTERFACE EXPORTS
export const getVehicleTurnStats = (vehicles: VehicleEndpointsInterface) =>
  async () => {
    if (vehicles) {
      const vehicleListResult = await vehicles.getVehicles(['active', 'sold']);
      const vehicleList = vehicleListResult.data;

      const returnValue: VehicleTurnStats = {
        count: vehicleCount(vehicleList),
        average: calcAvgVehicleTime(vehicleList),
        median: calcMedianVehicleTime(vehicleList),
        mode: calcModeVehicleTime(vehicleList),
      };
      return new GetSuccess(returnValue);
    } else {
      throw new Error('vehicle endpoints not provided to getVehicleTurnStats');
    };
  };

export const getStageStatistics = (stages: StageEndpointsInterface) =>
  async () => {
    const stageAssignments = await stages.getAllStageAssignments();
    const stagestmp = await stages.getStages();
    const peoplePlaces = await stages.getAllPeoplePlaces();
    const result = calcStagesStats(stageAssignments.data, stagestmp.data, peoplePlaces.data);
    return new GetSuccess(result);
  };

export const getPeoplePlacesStatistics = (stages: StageEndpointsInterface) =>
  async () => {
    const stageAssignments = await stages.getAllStageAssignments();
    const stagestmp = await stages.getStages();
    const peoplePlaces = await stages.getAllPeoplePlaces();
    const result = calcPeoplePlacesStats(stageAssignments.data, stagestmp.data, peoplePlaces.data);
    return new GetSuccess(result);
  };

// HELPER FUNCTIONS
interface CountVehicleReturn {
  getForSale: number;
  getSold: number;
  total: number;
};
function vehicleCount(vehicleList: Vehicle[]): CountVehicleReturn {
  const getForSale = vehicleList.filter(vehicle => vehicle.dateForSale).length;
  const getSold = vehicleList.filter(vehicle => vehicle.status === 'sold').length;

  return {
    getForSale,
    getSold,
    total: getSold
  };
};

interface ModeVehicleReturn {
  getForSale: string;
  getForSalePercent: number;
  getSold: string;
  getSoldPercent: number;
  total: string;
  totalPercent: number;
};
function calcModeVehicleTime(vehicleList: Vehicle[]): ModeVehicleReturn {
  const calcMode = (type: 'forSale' | 'sold' | 'total'): [string, number] => {
    let filteredList = vehicleList.filter(vehicle => {
      if (type === 'forSale') {
        return Boolean(vehicle.dateForSale);
      } else {
        return Boolean(vehicle.status === 'sold');
      };
    });

    // function for converting milliseconds into days
    const formatDuration = (milliseconds: number) => {
      return milliseconds / (1000 * 60 * 60 * 24);
    };

    // function for rounding duration to the nearest .5
    const roundDuration = (duration: number) => {
      return Math.round(duration * 2) / 2;
    };

    if (filteredList.length > 0) {
      interface Count {
        number: number,
        count: number;
      }
      let durationArray: number[] = [], maxCount: number = 0, counts: Count[] = [], modes: number[] = [], assignmentPercentage: number;

      filteredList.forEach(vehicle => {
        let dateCreated = vehicle.dateAdded;
        let dateForSale = vehicle.dateForSale;
        let dateSold;
        let difference: number;
        let formattedDuration;
        let roundedDuration;
        switch (type) {
          case 'forSale':
            if (dateForSale) {
              difference = dateForSale - dateCreated;
              formattedDuration = formatDuration(difference);
              roundedDuration = roundDuration(formattedDuration);
              durationArray.push(roundedDuration);
            };
            break;
          case 'sold':
            dateSold = vehicle.dateSold;
            if (dateSold && dateForSale) {
              difference = dateSold - dateForSale;
              formattedDuration = formatDuration(difference);
              roundedDuration = roundDuration(formattedDuration);
              durationArray.push(roundedDuration);
            };
            break;
          case 'total':
            dateSold = vehicle.dateSold;
            if (dateSold) {
              difference = dateSold - dateCreated;
              formattedDuration = formatDuration(difference);
              roundedDuration = roundDuration(formattedDuration);
              durationArray.push(roundedDuration);
            };
            break;

        };
      });

      durationArray.forEach(number => {
        if (!counts.find(item => item.number === number)) {
          let counter: number = 0;
          for (const num of durationArray) {
            if (num === number) counter++;
          };
          if (counter > maxCount) maxCount = counter;
          counts.push({
            number: number,
            count: counter
          });
        };
      });

      counts.forEach(count => {
        if (count.count === maxCount) modes.push(count.number);
      });

      modes.sort((a, b) => a - b);

      assignmentPercentage = Math.round((modes.length * maxCount * 100) / filteredList.length);

      if (modes.length > 3) {
        return ['N/A', 0];
      } else {
        return [modes.join(', '), assignmentPercentage];
      };
    } else {
      return ['', 0];
    };
  };
  const forSale = calcMode('forSale');
  const sold = calcMode('sold');
  const total = calcMode('total');

  return {
    getForSale: forSale[0],
    getForSalePercent: forSale[1],
    getSold: sold[0],
    getSoldPercent: sold[1],
    total: total[0],
    totalPercent: total[1]
  };
};

interface AverageVehicleReturn {
  getForSale: number;
  getSold: number;
  total: number;
};
function calcAvgVehicleTime(array: Vehicle[]): AverageVehicleReturn {
  const calcAvg = (type: 'forSale' | 'sold' | 'total') => {
    if (array.length > 0) {
      const durationArray: number[] = [];
      array.forEach(vehicle => {
        let dateCreated = vehicle.dateAdded;
        let dateForSale = vehicle.dateForSale;
        let dateSold;
        let difference: number;
        switch (type) {
          case 'forSale':
            if (dateForSale) {
              difference = dateForSale - dateCreated;
              durationArray.push(difference);
            }
            break;
          case 'sold':
            dateSold = vehicle.dateSold;
            if (dateSold && dateForSale) {
              difference = dateSold - dateForSale;
              durationArray.push(difference);
            }
            break;
          case 'total':
            dateSold = vehicle.dateSold;
            if (dateSold) {
              difference = dateSold - dateCreated;
              durationArray.push(difference);
            }
            break;
        };
      });
      const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue;
      if (durationArray.length > 0) {
        const total = durationArray.reduce(reducer);
        const length = durationArray.length;
        const average = total / length;
        return average;
      } else {
        return 0;
      };
    } else {
      return 0;
    };
  };
  const getForSale = calcAvg('forSale');
  const getSold = calcAvg('sold');
  const total = calcAvg('total');

  return { getForSale, getSold, total };
};

interface MedianVehicleReturn {
  getForSale: number;
  getSold: number;
  total: number;
};
function calcMedianVehicleTime(vehicleList: Vehicle[]): MedianVehicleReturn {
  const calcMedian = (type: 'forSale' | 'sold' | 'total') => {
    if (vehicleList.length > 0) {
      let durationArray: number[] = [];
      vehicleList.forEach(vehicle => {
        let dateCreated = vehicle.dateAdded;
        let dateForSale = vehicle.dateForSale;
        let dateSold;
        let difference: number;
        switch (type) {
          case 'forSale':
            if (dateForSale) {
              difference = dateForSale - dateCreated;
              durationArray.push(difference);
            };
            break;
          case 'sold':
            dateSold = vehicle.dateSold;
            if (dateSold) {
              if (dateSold && dateForSale) {
                difference = dateSold - dateForSale;
                durationArray.push(difference);
              };
            };
            break;
          case 'total':
            dateSold = vehicle.dateSold;
            if (dateSold) {
              difference = dateSold - dateCreated;
              durationArray.push(difference);
            };
            break;
        };
      });

      durationArray.sort((a, b) => a - b);

      if (durationArray.length === 1) {
        return durationArray[0];
      } else if (durationArray.length % 2 !== 0) {
        let middleIndex: number = Math.ceil(durationArray.length / 2) - 1,
          median: number = durationArray[middleIndex];
        return median;
      } else {
        let middleIndices: [number, number] = [(durationArray.length / 2) - 1, durationArray.length / 2],
          median: number = (durationArray[middleIndices[0]] + durationArray[middleIndices[1]]) / 2;
        return median;
      };
    } else {
      return 0;
    };
  };
  const getForSale = calcMedian('forSale');
  const getSold = calcMedian('sold');
  const total = calcMedian('total');

  return { getForSale, getSold, total };
};

function calcAvgAssignmentTime(array: StageAssignment[]) {
  const durationArray: number[] = [];
  if (array.length > 0) {
    array.forEach(assignment => durationArray.push(assignment.completeTime));
    const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue;
    const total = durationArray.reduce(reducer);
    const average = total / durationArray.length;
    return average;
  } else {
    return 0;
  };
};

function calcMedianAssignmentTime(array: StageAssignment[]) {
  let timeArray: number[] = [];

  array.forEach(assignment => timeArray.push(assignment.completeTime));
  timeArray.sort((a, b) => a - b);

  if (array.length === 0) {
    return 0;
  } else if (array.length === 1) {
    return timeArray[0];
  } else if (array.length % 2 !== 0) {
    let middleIndex: number = Math.ceil(array.length / 2) - 1,
      median: number = timeArray[middleIndex];
    return median;
  } else {
    let middleIndices: [number, number] = [(array.length / 2) - 1, array.length / 2],
      median: number = (timeArray[middleIndices[0]] + timeArray[middleIndices[1]]) / 2;
    return median;
  };
};

type CalcModeReturn = [string, number];
function calcModeAssignmentTime(array: StageAssignment[]): CalcModeReturn {

  interface Count {
    number: number;
    count: number;
  };
  let timeArray: number[] = [], maxCount: number = 0, counts: Count[] = [], modes: number[] = [], assignmentPercentage: number;

  array.forEach(assignment => {
    let formattedAssignment: number = assignment.completeTime / (1000 * 60 * 60 * 24); // converts milliseconds to days
    let roundedAssignment: number = Math.round(formattedAssignment * 2) / 2; // rounds to the nearest .5
    timeArray.push(roundedAssignment);
  });

  timeArray.forEach(number => {
    if (!counts.find(item => item.number === number)) {
      let counter: number = 0;
      for (const num of timeArray) {
        if (num === number) counter++;
      };
      if (counter > maxCount) maxCount = counter;
      counts.push({
        number: number,
        count: counter
      });
    };
  });

  counts.forEach(count => {
    if (count.count === maxCount) modes.push(count.number);
  });

  modes.sort((a, b) => a - b);

  assignmentPercentage = Math.round((modes.length * maxCount * 100) / array.length);

  if (modes.length > 3) {
    return ['N/A', 0];
  } else {
    return [modes.join(', '), assignmentPercentage];
  };
};

function calcStagesStats(stageAssignments: StageAssignment[], stages: StageSummary[], peoplePlaces: IdName[]): StageAssignmentStats {
  const avgOverview: NameValueData[] = [];
  const details: DetailedAssignmentStats[] = [];

  stages.filter(stage => stageAssignments.find(assignment => assignment.stage.id === stage.id && assignment.status === 'complete'))
    .forEach(stage => {
      const stageFilteredAssignments = stageAssignments.filter(assignment => assignment.stage.id === stage.id && assignment.status === 'complete');

      let length = stageFilteredAssignments.length;
      let averageTmp = calcAvgAssignmentTime(stageFilteredAssignments);
      let medianTmp = calcMedianAssignmentTime(stageFilteredAssignments);
      let modeTmp = calcModeAssignmentTime(stageFilteredAssignments);
      let portionsTmp: StatPortions[] = [];

      peoplePlaces.filter(personPlace => stageFilteredAssignments.find(assignment => assignment.personPlace.id === personPlace.id))
        .forEach(personPlace => {
          const personPlaceFilteredAssignments = stageFilteredAssignments.filter(assignment => assignment.personPlace.id === personPlace.id && assignment.status === 'complete');

          let lengthSub = personPlaceFilteredAssignments.length;
          let averageSubTmp = calcAvgAssignmentTime(personPlaceFilteredAssignments);
          let medianSubTmp = calcMedianAssignmentTime(personPlaceFilteredAssignments);
          let modeSubTmp = calcModeAssignmentTime(personPlaceFilteredAssignments);

          portionsTmp.push({
            name: personPlace.name,
            count: lengthSub,
            average: averageSubTmp,
            median: medianSubTmp,
            mode: modeSubTmp[0],
            modePercent: modeSubTmp[1]
          });
        });

      avgOverview.push({ name: stage.name, value: averageTmp });
      details.push({
        name: stage.name,
        count: length,
        average: averageTmp,
        median: medianTmp,
        mode: modeTmp[0],
        modePercent: modeTmp[1],
        portions: portionsTmp
      });
    });

  return { avgOverview, details };
};

function calcPeoplePlacesStats(stageAssignments: StageAssignment[], stages: StageSummary[], peoplePlaces: IdName[]): StageAssignmentStatsInclPercentile {
  const avgOverviewTmp: NameValueData[] = [];
  const details: DetailedAssignmentStats[] = [];

  const filteredStages = stages.filter(stage => stage.name !== 'For Sale');

  // for a personPlace to appear in peoplePlaceStatistics, it must have a 1) assignment that has been assined to it and 2) an assignment that has been completed and is not of the stage 'For Sale'
  peoplePlaces.filter(personPlace => stageAssignments.find(assignment => assignment.personPlace.id === personPlace.id && assignment.status === 'complete' && assignment.stage.name !== 'For Sale'))
    .forEach(personPlace => {
      // filter out only complete stageAssignments, and stageAssignments that are not 'For Sale'. 'For Sale' data is not relevant to this chart, and better analyzed in other contexts
      const personPlaceFilteredAssignments = stageAssignments.filter(assignment => assignment.stage.name !== 'For Sale' && assignment.personPlace.id === personPlace.id && assignment.status === 'complete');

      let length = personPlaceFilteredAssignments.length;
      let averageTmp = calcAvgAssignmentTime(personPlaceFilteredAssignments);
      let medianTmp = calcMedianAssignmentTime(personPlaceFilteredAssignments);
      let modeTmp = calcModeAssignmentTime(personPlaceFilteredAssignments);
      let portionsTmp: StatPortions[] = [];

      filteredStages.filter(stage => personPlaceFilteredAssignments.find(assignment => assignment.stage.id === stage.id))
        .forEach(stage => {
          const stageFilteredAssignments = personPlaceFilteredAssignments.filter(assignment => assignment.stage.id === stage.id && assignment.status === 'complete');

          let lengthSub = stageFilteredAssignments.length;
          let averageSubTmp = calcAvgAssignmentTime(stageFilteredAssignments);
          let medianSubTmp = calcMedianAssignmentTime(stageFilteredAssignments);
          let modeSubTmp = calcModeAssignmentTime(stageFilteredAssignments);

          portionsTmp.push({
            name: stage.name,
            count: lengthSub,
            average: averageSubTmp,
            median: medianSubTmp,
            mode: modeSubTmp[0],
            modePercent: modeSubTmp[1]
          });
        });

      avgOverviewTmp.push({ name: personPlace.name, value: averageTmp });
      details.push({
        name: personPlace.name,
        count: length,
        average: averageTmp,
        median: medianTmp,
        mode: modeTmp[0],
        modePercent: modeTmp[1],
        portions: portionsTmp
      });
    });

  const avgOverview: NameValueDataInclPercentile[] = [];

  // calculatePercentile
  avgOverviewTmp.forEach(overview => {
    const totalCount = avgOverviewTmp.length;
    const scoresBelow = avgOverviewTmp.filter(overviewTmp => overviewTmp.value < overview.value).length;
    const avgPercentile = scoresBelow / totalCount * 100;
    avgOverview.push({ ...overview, avgPercentile });
  });

  return { avgOverview, details };
}