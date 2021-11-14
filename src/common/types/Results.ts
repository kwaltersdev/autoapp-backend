type ResultStatus = 'success' | 'exists' | 'failed' | 'empty';

export abstract class Result {
  status: ResultStatus;
  constructor(status: ResultStatus) {
    this.status = status;
  }
};

export class SuccessResult extends Result {
  constructor() {
    super('success');
  }
};

export class GetSuccess<Return> extends SuccessResult {
  data: Return;

  constructor(data: Return) {
    super();
    this.data = data;
  };
};

export class PostSuccess<Doc, Data = void> extends SuccessResult {
  id: string;
  doc: Doc;
  data?: Data;

  constructor(id: string, addedDoc: Doc, data?: Data,) {
    super();
    this.id = id;
    this.doc = addedDoc;
    this.data = data;
  };
};

export class PostExists extends Result {
  field: string;
  value: string;
  patch?: null;
  doc?: null;
  data?: null;

  constructor(field: string, value: string) {
    super('exists');
    this.field = field;
    this.value = value;
  };
};

export class PatchSuccess<Patch, Doc, Data = void> extends PostSuccess<Doc, Data> {
  patch: Patch;

  constructor(id: string, patch: Patch, doc: Doc, data?: Data) {
    super(id, doc, data);
    this.patch = patch;
  };
};

export class PatchManyResult<Return> extends Result {
  constructor(
    public status: 'success' | 'failed',
    public patches: (PatchSuccess<unknown, unknown> | FailedResult)[],
    public data: Return
  ) { super(status); }
}

export class DeleteSuccess extends SuccessResult { };

export class FailedResult extends Result {
  patch = null;
  doc = null;
  data = null;
  error?: string;
  requestBody?: object;
  details?: string;

  constructor(error?: string, requestBody?: object, details?: string) {
    super('failed');
    this.error = error;
    this.requestBody = requestBody;
    this.details = details;
  };
}