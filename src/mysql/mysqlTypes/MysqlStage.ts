export interface MysqlStageSummary {
  id: number,
  name: string,
  orderPosition: number,
}

export interface MysqlExportStage {
  id: number,
  name: string,
  peoplePlaces: string, // [id_1]-[name_1],[id_2]-[name_2]....
  orderPosition: number;
}