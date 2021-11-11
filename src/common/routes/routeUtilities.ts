import { Request, Response } from 'express';
import { Result, FailedResult } from '../types/Results';

export const serverError = (error: unknown, req: Request, res: Response) => {
  res.status(500).json(new FailedResult((error as Error).message, req.body, 'Internal Server Error. See Server Console for Details'));
  console.error(error);
};

export const badRequest = (error: unknown, req: Request, res: Response) => {
  res.status(400).json(new FailedResult((error as Error).message, req.body, 'Bad Request'));
  console.error(error);
};

export const postSuccess = (result: Result, res: Response) => {
  // set the status code for 400/201 depending on whether
  // the new doc was added (success) or it already existed (bad request)
  let code: number;
  result.status === 'exists' ? code = 400 : code = 201;
  res.status(code).json(result);
};