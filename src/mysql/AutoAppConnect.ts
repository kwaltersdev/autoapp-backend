import mysql from 'mysql2/promise';

export default class AutoAppConnect {
  private readonly config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  async createPool() {
    return mysql.createPool(this.config);
  }
}