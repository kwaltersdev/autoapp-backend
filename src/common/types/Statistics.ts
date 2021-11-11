export interface VehicleTurnStats {
  count: {
    getForSale: number;
    getSold: number;
    total: number;
  };
  average: {
    getForSale: number;
    getSold: number;
    total: number;
  };
  median: {
    getForSale: number;
    getSold: number;
    total: number;
  };
  mode: {
    getForSale: string;
    getForSalePercent: number;
    getSold: string;
    getSoldPercent: number;
    total: string;
    totalPercent: number;
  };
};

export interface NameValueData {
  name: string;
  value: number;
};

export interface NameValueDataInclPercentile extends NameValueData {
  avgPercentile: number;
}

export interface StatPortions {
  name: string;
  count: number;
  average: number;
  median: number;
  mode: string;
  modePercent: number;
};

export interface DetailedAssignmentStats {
  name: string;
  count: number;
  average: number;
  median: number;
  mode: string;
  modePercent: number;
  portions: StatPortions[];
};

export interface StageAssignmentStats {
  avgOverview: NameValueData[];
  details: DetailedAssignmentStats[];
};

export interface StageAssignmentStatsInclPercentile {
  avgOverview: NameValueDataInclPercentile[];
  details: DetailedAssignmentStats[];
}