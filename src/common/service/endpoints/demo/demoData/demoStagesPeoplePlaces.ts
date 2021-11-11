import { Stages, PeoplePlaces } from '../../../../types/Demo';

export const demoStages: Stages = ['Transmission Repair', 'Mechanical Repair', 'Exhaust Repair', 'Detail', 'Body Repair'];

export const demoPeoplePlaces: PeoplePlaces = [
  {
    name: 'Ray Reynolds',
    stages: ['Mechanical Repair']
  },
  {
    name: 'Joe Johnson',
    stages: ['Mechanical Repair', 'Exhaust Repair']
  },
  {
    name: 'Elite Transmission Repair',
    stages: ['Transmission Repair']
  },
  {
    name: `Earl's Custom Exhaust`,
    stages: ['Exhaust Repair']
  },
  {
    name: 'Carl Wilkins',
    stages: ['Detail']
  },
  {
    name: 'Bill Barton',
    stages: ['Detail']
  },
  {
    name: `Danny's Detailing`,
    stages: ['Detail']
  },
  {
    name: `Bo's Body Shop`,
    stages: ['Body Repair'],
  },
  {
    name: `Al's Auto Body`,
    stages: ['Body Repair']
  },
];

export interface AssignmentProbability {
  stage: string;
  initialProbability?: number; // only applicable to 'Assign', and is the probability that it will be assigned before any other stage (0-1);
  probability: number; // probability of stage being assigned to a given vehicle. In the case of 'Assign', probability of being assigned after every other stage is completed (except 'For Sale').
  peoplePlaces: { // array of peoplePlaces for the stage ;
    personPlace: string;
    probability: number; // probability of being assigned the given stage (0-1). All personPlace probabilities in the array must add up to 1;
    durationRange: [number, number]; // [MIN, MAX] values in DAYS;
  }[];
};

export const assignmentProbabilities: AssignmentProbability[] = [
  {
    stage: 'Assign',
    initialProbability: 0.8,
    probability: 0.5,
    peoplePlaces: [
      {
        personPlace: 'Inventory Manager',
        probability: 1,
        durationRange: [1, 7],
      }
    ]
  },
  {
    stage: 'Transmission Repair',
    probability: 0.05,
    peoplePlaces: [
      {
        personPlace: 'Elite Transmission Repair',
        probability: 1,
        durationRange: [3, 7]
      }
    ]
  },
  {
    stage: 'Mechanical Repair',
    probability: 0.95,
    peoplePlaces: [
      {
        personPlace: 'Ray Reynolds',
        probability: 0.6,
        durationRange: [1, 4]
      },
      {
        personPlace: 'Joe Johnson',
        probability: 0.4,
        durationRange: [2, 14]
      }
    ]
  },
  {
    stage: 'Exhaust Repair',
    probability: 0.25,
    peoplePlaces: [
      {
        personPlace: 'Joe Johnson',
        probability: 0.4,
        durationRange: [6, 21]
      },
      {
        personPlace: `Earl's Custom Exhaust`,
        probability: 0.6,
        durationRange: [4, 10]
      }
    ]
  },
  {
    stage: 'Detail',
    probability: 0.95,
    peoplePlaces: [
      {
        personPlace: 'Carl Wilkins',
        probability: 0.4,
        durationRange: [2, 4]
      },
      {
        personPlace: `Bill Barton`,
        probability: 0.4,
        durationRange: [3, 5]
      },
      {
        personPlace: `Danny's Detailing`,
        probability: 0.2,
        durationRange: [1, 2]
      },
    ]
  },
  {
    stage: 'Body Repair',
    probability: 0.4,
    peoplePlaces: [
      {
        personPlace: `Bo's Body Shop`,
        probability: 0.75,
        durationRange: [3, 9]
      },
      {
        personPlace: `Al's Auto Body`,
        probability: 0.25,
        durationRange: [7, 21]
      }
    ]
  },
  {
    stage: 'For Sale',
    probability: 1,
    peoplePlaces: [
      {
        personPlace: 'Small Town Auto Sales',
        probability: 1,
        durationRange: [1, 90],
      }
    ]
  }
];
