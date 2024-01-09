import { nonenumerable } from "nonenumerable";

type CollectionNamespace = { collection: string };
type CollectionInfo = { namespace: CollectionNamespace };
type Collection = { s: CollectionInfo };
type MixedCollectionName = string | Collection;

type Binary<N extends number = number> = string & {
  readonly BinaryStringLength: unique symbol;
  length: N;
};

type ObjectExpression = { [k: string]: any };

/**
 * @typedef {ObjectExpression | string | number | boolean | null} Expression 
 * @description A valid expression, string, number, boolean or null.
 */
type Expression = ObjectExpression | string | number | boolean;

/**
 * @typedef {ObjectExpression | number} NumberExpression
 * @description A number or any valid expression that resolves to a number.
 */
type NumberExpression = ObjectExpression | number;

/**
 * @typedef {ObjectExpression | Array<any>} ArrayExpression
 * @description An array or any valid expression that resolves to an array.
 */
type ArrayExpression = ObjectExpression | Array<any>;

/**
 * @typedef {ObjectExpression | string} StringExpression
 * @description A string or any valid expression that resolves to a string.
 */
type StringExpression = ObjectExpression | Array<any>;

type Timestamp = number;

// always two
const at = (ns: string) => (...args: any[]) => {
  if (args.length !== 2) {
    throw new TypeError(`${ns} expects two arguments. Received ${args.length} arguments.`);
  }
  const [a1, a2] = args;
  return { [ns]: [a1, a2] };
};

// pass thru args (as array)
const pta = (ns: string) => (...args: any[]) => ({ [ns]: args });
// no expression
const ne = (ns: string) => () => ({ [ns]: {} });
// single expression
const se = (ns: string, validate?: (ns: string, expr: Expression) => void) => (expr: Expression) => {
  if (validate) validate(ns, expr);
  return { [ns]: expr };
};

// [dynamic] two or one arguments indicate varied application in drive
const taf = (ns: string) => (...args: any[]) => {
  if (args.length > 1) {
    return { [ns]: args };
  }
  return { [ns]: args[0] };
};

const onlyOnce = (subject: { [k: string]: any }, methodName: string) => {
  const subjectText = subject.constructor.name;
  if (subject[methodName] === undefined) {
    throw new Error(`Method name "${methodName}" does not exist on ${subjectText}`);
  }
  if (typeof subject[methodName] !== 'function') {
    throw new Error(`The ${methodName} method is not a function on ${subjectText}`);
  }
  Object.defineProperty(subject, methodName, {
    value: function() {
      throw new Error(`Redundant call to ${methodName}() on ${subjectText} not allowed.`);
    },
  });
};

const validateFieldExpression = (ns: string, v: any) => {
  const type = typeof v;
  if (type === 'object') {
    if (Object.getPrototypeOf(v) !== Object.getPrototypeOf({})) {
      const name = v.constructor.name || 'unknown';
      throw new Error(`Expression for ${ns} expected to be a plain object. Received ${name}`);
    }
    if (Object.keys(v).length <= 0) {
      throw new Error(`Expression for ${ns} cannot be an empty object`);
    }
  } else {
    throw new TypeError(`Expression for ${ns} expected to be an object. Received: ${type}`);
  }
};

const getCollectionName = (v: MixedCollectionName) => {
  if (typeof v === 'string') {
    return v;
  }
  if (v.s && v.s.namespace && typeof v.s.namespace.collection === 'string') {
    return v.s.namespace.collection;
  }
  throw new TypeError(`Invalid $lookup from parameter: ${v}`);
};


type OperatorFn = (...args: any[]) => ObjectExpression;

const safeNumberArgs = (fn: OperatorFn) => (...args: any[]) => fn(...args.map((arg) => {
  return typeof arg === 'number' ? arg : $ifNull(arg, 0);
}));

type PipelineStage = Expression;

// Allow easier syntax for conditional stages in pipeline.
const pipeline = (...args: PipelineStage[]) => args.filter((v) => v).map((v) => {
  return typeof v === 'function' ? v(v) : v;
});

/**
 * STAGES
 */

type AddFieldsStage = { $addFields: ObjectExpression };

/**
 * Adds new fields to documents.
 * @category Stages
 * @function
 * @param {ObjectExpression} expression Specify the name of each field to add
 * and set its value to an aggregation expression or an empty object.
 * @returns {AddFieldsStage} 
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/|MongoDB reference}
 * for $addFields
 * @example
 * $addFields({ fullName: $.concat('$firstName', ' ', '$lastName') });
 * // returns
 * { $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
 */
const $addFields = se('$addFields', validateFieldExpression);


type BaseBucketExpression = {
  groupBy: Expression,
  output: ObjectExpression,
};

type BucketExpression = BaseBucketExpression & {
  boundaries: Array<number>,
  default: Expression,
};

class Bucket {
  public $bucket: Partial<BucketExpression> = {};

  constructor(
    groupBy: Expression,
    boundaries?: Array<number>,
    defaultId?: Expression,
    output?: ObjectExpression,
  ) {
    this.groupBy(groupBy);
    if (boundaries) {
      this.boundaries(...boundaries);
    }
    if (defaultId) {
      this.default(defaultId);
    }
    if (output) {
      this.output(output);
    }
  }

  groupBy(value: Expression) {
    this.$bucket.groupBy = value;
    onlyOnce(this, 'groupBy');
    return this;
  }

  output(document: ObjectExpression) {
    this.$bucket.output = document;
    onlyOnce(this, 'output');
    return this;
  }

  default(value: Expression) {
    this.$bucket.default = value;
    onlyOnce(this, 'default');
    return this;
  }

  boundaries(...args: Array<number>) {
    this.$bucket.boundaries = args;
    onlyOnce(this, 'boundaries');
    return this;
  }
}

/**
 * Categorizes incoming documents into groups called buckets, based on a 
 * specified expression and bucket boundaries.
 * @category Stages
 * @function
 * @param {Expression} groupBy An expression to group documents by.
 * @param {Array<number>} [boundaries] An array of values based on the groupBy
 * expression that specify the boundaries for each bucket.
 * @param {Expression} [defaultId] Optional. A literal that specifies the _id of
 * an additional bucket that contains all documents that don't fall into a 
 * bucket specified by boundaries.
 * @param {ObjectExpression} output Optional. A document that specifies the
 * fields to include.
 * @returns {Bucket} A Bucket object populated according to argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucket/|MongoDB reference}
 * for $bucket
 * @example <caption>Static notation</caption>
 * $bucket('$price', [0, 200, 400], 'Other');
 * // outputs
 * { $bucket: { groupBy: '$price', boundaries: [0, 200, 400], default: 'Other' } }
 * @example <caption>Object notation</caption>
 * $bucket('$price').boundaries(0, 200, 400).default('Other');
 * // outputs
 * { $bucket: { groupBy: '$price', boundaries: [0, 200, 400], default: 'Other' } }
 */
const $bucket = (
  groupBy: Expression,
  boundaries?: Array<number>,
  defaultId?: Expression,
  output?: ObjectExpression,
) => new Bucket(groupBy, boundaries, defaultId, output);

type BucketAutoExpression = BaseBucketExpression & {
  buckets: number,
  granularity: string,
};

class BucketAuto {
  public $bucketAuto: Partial<BucketAutoExpression> = {};

  constructor(
    groupBy: Expression,
    buckets?: number,
    granularity?: string,
    output?: ObjectExpression,
  ) {
    this.groupBy(groupBy);
    if (buckets) {
      this.buckets(buckets);
    }
    if (granularity) {
      this.granularity(granularity);
    }
    if (output) {
      this.output(output);
    }
  }

  groupBy(value: Expression) {
    this.$bucketAuto.groupBy = value;
    onlyOnce(this, 'groupBy');
    return this;
  }

  output(document: ObjectExpression) {
    this.$bucketAuto.output = document;
    onlyOnce(this, 'output');
    return this;
  }

  buckets(value: number) {
    this.$bucketAuto.buckets = value;
    onlyOnce(this, 'buckets');
    return this;
  }

  granularity(value: string) {
    this.$bucketAuto.granularity = value;
    onlyOnce(this, 'granularity');
    return this;
  }
}

/**
 * Categorizes incoming documents into a specific number of groups, called
 * buckets, based on a specified expression.
 * @category Stages
 * @function
 * @param {Expression} groupBy An expression to group documents by.
 * @param {number} [buckets] A positive number for the number of buckets into
 * which input documents will be grouped.
 * expression that specify the boundaries for each bucket.
 * @param {string} [granularity] Optional. Specifies the preferred number series
 * to use.
 * @param {ObjectExpression} [output] Optional. A document that specifies the
 * fields to include.
 * @returns {Bucket} A Bucket object populated according to argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucketAuto/|MongoDB reference}
 * for $bucketAuto
 * @example <caption>Static notation</caption>
 * $bucketAuto('$_id', 5);
 * // returns
 * { $bucketAuto: { groupBy: '$_id', buckets: 5 } }
 * @example <caption>Object notation</caption>
 * $bucketAuto('$_id').buckets(5).granularity('R5');
 * // returns
 * { $bucketAuto: { groupBy: '$_id', buckets: 5, granularity: 'R5' } }
 */
const $bucketAuto = (
  groupBy: Expression, 
  buckets?: number,
  granularity?: string,
  output?: ObjectExpression,
) => new BucketAuto(groupBy, buckets, granularity, output);

enum ChangeStreamFullDocument {
  default,
  required,
  updateLookup,
  whenAvailable,
}

enum ChangeStreamFullDocumentBeforeChange {
  off,
  whenAvailable,
  required,
}

type ChangeStreamExpression = {
  allChangesForCluster?: boolean,
  fullDocument?: ChangeStreamFullDocument,
  fullDocumentBeforeChange?: ChangeStreamFullDocumentBeforeChange,
  resumeAfter?: number,
  showExpandedEvents?: boolean,
  startAfter?: ObjectExpression,
  startAtOperationTime?: Timestamp,
};

class ChangeStream {
  public $changeStream: ChangeStreamExpression = {};

  constructor(opts: ChangeStreamExpression = {}) {
    if (opts.allChangesForCluster) this.allChangesForCluster(opts.allChangesForCluster);
    if (opts.fullDocument) this.fullDocument(opts.fullDocument);
    if (opts.fullDocumentBeforeChange) this.fullDocumentBeforeChange(opts.fullDocumentBeforeChange);
    if (opts.resumeAfter) this.resumeAfter(opts.resumeAfter);
    if (opts.showExpandedEvents) this.showExpandedEvents(opts.showExpandedEvents);
    if (opts.startAfter) this.startAfter(opts.startAfter);
    if (opts.startAtOperationTime) this.startAtOperationTime(opts.startAtOperationTime);
    // Object.entries(opts).forEach(([opt, val]) => this[opt as keyof ChangeStreamExpression](val));
    // Object.entries(opts).forEach(([opt, val]) => this[opt as keyof ChangeStreamExpression](val));
  }

  allChangesForCluster(value: boolean) {
    this.$changeStream.allChangesForCluster = value;
    onlyOnce(this, 'allChangesForCluster');
    return this;
  }

  fullDocument(value: ChangeStreamFullDocument) {
    this.$changeStream.fullDocument = value;
    onlyOnce(this, 'fullDocument');
    return this;
  }

  fullDocumentBeforeChange(value: ChangeStreamFullDocumentBeforeChange) {
    this.$changeStream.fullDocumentBeforeChange = value;
    onlyOnce(this, 'fullDocument');
    return this;
  }

  resumeAfter(value: number) {
    this.$changeStream.resumeAfter = value;
    onlyOnce(this, 'resumeAfter');
    return this;
  }

  showExpandedEvents(value: boolean) {
    this.$changeStream.showExpandedEvents = value;
    onlyOnce(this, 'showExpandedEvents');
    return this;
  }

  startAfter(value: ObjectExpression) {
    this.$changeStream.startAfter = value;
    onlyOnce(this, 'startAfter');
    return this;
  }

  startAtOperationTime(value: Timestamp) {
    this.$changeStream.startAtOperationTime = value;
    onlyOnce(this, 'startAtOperationTime');
    return this;
  }
}

/**
 * Returns a Change Stream cursor on a collection, a database, or an entire
 * cluster. Must be the first stage in the pipeline.
 * @category Stages
 * @function
 * @param {ChangeStreamExpression} [opts] Change stream options.
 * @returns {ChangeStream} A ChangeStream instance populated according to
 * argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/changeStream/|MongoDB reference}
 * for $changeStream
 * @example <caption>Basic example</caption>
 * $changeStream();
 * // returns
 * { $changeStream: {} }
 */
const $changeStream = (opts?: ChangeStreamExpression) => new ChangeStream(opts)

type CountOperator = {
  $count: string,
};

/**
 * Passes a document to the next stage that contains a count of the number of
 * documents input to the stage.
 * @category Stages
 * @function
 * @param {string} [name=count] The name of the output field for the count value.
 * Must be a non-empty string, must not start with `$` nor contain `.`.
 * @returns {CountOperator} A $count operator expression.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/|MongoDB reference}
 * for $addFields
 * @example
 * $count('myCount');
 * // returns
 * { $count: 'myCount' }
 * @example <caption>Use default name "count"</caption>
 * $count();
 * // returns
 * { $count: "count" }
 */
const $count = (name = 'count') => ({ $count: name });

/**
 * Returns literal documents from input values.
 * @category Stages
 * @function
 * @param {ObjectExpression | Array<ObjectExpression>} mixed The first document
 * or an array of documents.
 * @param {...ObjectExpression[]} [args] Additional documents to input into the
 * pipeline.
 * @returns {DocumentsOperator} Returns a $document operator based on input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/documents/|MongoDB reference}
 * for $documents
 * @example
 * $documents({ x: 10 }, { x: 2 }, { x: 5 });
 * // returns
 * { $documents: [{ x: 10 }, { x: 2 }, { x: 5 }
 */
const $documents = (mixed: ObjectExpression | Array<ObjectExpression>, ...args: ObjectExpression[]) => {
  let documents;
  if (Array.isArray(mixed)) {
    documents = mixed as Array<ObjectExpression>;
  } else {
    documents = args.length ? [mixed, ...args] : [mixed];
  }
  return { $documents: documents };
};

type GroupStage = {
  $group: ObjectExpression,
};

/**
 * Separates documents into groups according to a "group key".
 * @category Stages
 * @function
 * @param {ObjectExpression} expression Refer to documentation.
 * @returns {GroupStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/|MongoDB reference}
 * for $group
 * @example
 * $group({ _id: '$userId', total: $sum(1)) });
 * // returns
 * { $group: { _id: '$userId', total: { $sum: 1 } } };
 */
const $group = se('$group');

type LimitStage = {
  $limit: number,
};

/**
 * Limits the number of documents passed to the next stage in the pipeline.
 * @category Stages
 * @function
 * @param {number} value A positive 64bit integer.
 * @returns {LimitStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/|MongoDB reference}
 * for $limit
 * @example
 * $limit(10);
 * // returns
 * { $limit: 10 }
 */
const $limit = se('$limit');

type LookupExpression = {
  from: string;
  as: string;
  localField?: string;
  foreignField?: string;
  let?: Expression;
  pipeline?: PipelineStage[];
};

class Lookup {
  public $lookup: Partial<LookupExpression> = {};

  public constructor(
    from: MixedCollectionName | Array<ObjectExpression>,
    as: string,
    localField?: string,
    foreignField?: string
  ) {
    if (Array.isArray(from)) {
      this.$lookup.pipeline = [$documents(...from as [ObjectExpression, ...ObjectExpression[]])];
    } else {
      this.from(from);
    }

    this.as(as);
    if (localField) this.localField(localField);
    if (foreignField) this.foreignField(foreignField);
  }

  from(v: MixedCollectionName) {
    this.$lookup.from = getCollectionName(v);
    onlyOnce(this, 'from');
    return this;
  }

  as(v: string) {
    this.$lookup.as = v;
    onlyOnce(this, 'as');
    return this;
  }

  localField(v: string) {
    this.$lookup.localField = v;
    onlyOnce(this, 'localField');
    return this;
  }

  foreignField(v: string) {
    this.$lookup.foreignField = v;
    onlyOnce(this, 'foreignField');
    return this;
  }

  let(v: Expression) {
    this.$lookup.let = v;
    onlyOnce(this, 'let');
    return this;
  }

  pipeline(...args: PipelineStage[]) {
    let stages;
    if (args.length === 1 && Array.isArray(args[0])) {
      [stages] = args;
    } else {
      stages = args;
    }
    if (this.$lookup.pipeline === undefined) {
      this.$lookup.pipeline = stages as PipelineStage[];
    } else {
      this.$lookup.pipeline.push(...stages as PipelineStage[]);
    }
    console.log(this.$lookup.pipeline);
    onlyOnce(this, 'pipeline');
    return this;
  }
}

/**
 * Performs a left outer join to a collection in the same database adding a new
 * array field to each input document.
 * @category Stages
 * @function
 * @param {MixedCollectionName | Array<ObjectExpression>} from Specifies the collection in the same
 * database to perform the join with. Can be either the collection name or the
 * Collection object.
 * @param {string} [asName] Specifies the name of the new array field to add to
 * the input documents where the results of the lookup will be.
 * @param {string} [localField] Specifies the field from the documents input to 
 * the lookup stage.
 * @param {string} [foreignField] Specifies the field in the from collection the documents input to 
 * the lookup stage.
 * @returns {Lookup} A Lookup instance populated based on argument input that
 * contains the relevant methods for otherwise configuring a $lookup stage.
 * @example <caption>Common lookup</caption>
 * $lookup('myCollection', 'myVar', 'localId', 'foreignId');
 * // returns a Lookup object populated like:
 * { $lookup: { from: 'myCollection', as: 'myVar', localField: 'localId', foreignField: 'foreignId' } }
 * @example <caption>Lookup with $documents in pipeline</caption>
 * // Pass the documents as an array using the "from" argument
 * $lookup([{ k: 1 }, { k: 2 }], 'subdocs')
 *   .let({ key: '$docKey' })
 *   .pipeline($.match({ k: '$$key' }));
 * // returns a Lookup object populated as follows:
 * {
 *   $lookup: {
 *     as: 'subdocs',
 *     let: { localField: '$docKey' },
 *     pipeline: [
 *       { $documents: [{ k: 1 }, { k: 2 }] },
 *       { $match: { k: '$$localField' } },
 *     ],
 *   },
 * }
 */
const $lookup = (
  from: MixedCollectionName | Array<ObjectExpression>,
  asName: string,
  localField?: string,
  foreignField?: string,
) => new Lookup(from, asName, localField, foreignField);

type MatchStage = {
  $match: ObjectExpression,
};

/**
 * Filters the documents to pass only the documents that match the specified
 * conditions(s) to the next pipeline stage.
 * @category Stages
 * @function
 * @param {ObjectExpression} fieldExpression
 * @returns {MatchStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/|MongoDB reference}
 * for $match
 * @example
 * $match({ x: 1 });
 * // returns 
 * { $match: { x: 1 } },
 */
const $match = se('$match');

type DatabaseAndCollectionName = {
  db: string,
  coll: MixedCollectionName,
};

/**
 * @typedef {string} MergeActionWhenMatched
 * @description Enumeration of: Replace (replace), KeepExisting (keepExisting), Merge
 * (merge), Fail (fail) and Pipeline (pipeline).
 */
enum MergeActionWhenMatched {
  Replace = 'replace',
  KeepExisting = 'keepExisting',
  Merge = 'merge',
  Fail = 'fail',
  Pipeline = 'pipeline',
}

/**
 * @typedef {string} MergeActionWhenNotMatched
 * @description Enumeration of: Insert (insert), Discard (discard) or Fail
 * (fail).
 */
enum MergeActionWhenNotMatched {
  Insert = 'insert',
  Discard = 'discard',
  Fail = 'fail',
}

type MergeExpression = {
  into: string | DatabaseAndCollectionName,
  let?: Expression,
  on?: Expression,
  whenMatched?: MergeActionWhenMatched,
  whenNotMatched?: MergeActionWhenNotMatched,
};

class Merge {
  $merge: MergeExpression;

  constructor(into: MixedCollectionName, onExpr?: Expression) {
    this.$merge = { into: getCollectionName(into) };
    if (onExpr) this.on(onExpr);
  }

  on(onExpression: Expression) {
    this.$merge.on = onExpression;
    onlyOnce(this, 'on');
    return this;
  }

  let(varsExpression: Expression) {
    this.$merge.let = varsExpression;
    onlyOnce(this, 'let');
    return this;
  }

  whenMatched(action: MergeActionWhenMatched) {
    this.$merge.whenMatched = action;
    onlyOnce(this, 'whenMatched');
    return this;
  }

  whenNotMatched(action: MergeActionWhenNotMatched) {
    this.$merge.whenNotMatched = action;
    onlyOnce(this, 'whenNotMatched');
    return this;
  }
}

/**
 * Writes the results of the pipeline to a specified location. Must be the last
 * stage in the pipeline.
 * @category Stages
 * @function
 * @param {MixedCollectionName | DatabaseAndCollectionName} into The collectionName or Collection object to
 * merge into.
 * @param {string|Array<string>} [onExpr] Field or fields that act as a unique
 * identifier for the document.
 * @returns {Merge} Returns a Merge object populated according to the provided
 * arguments.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/|MongoDB reference}
 * for $project
 * @example <caption>On single-field</caption>
 * $merge('myCollection', 'key');
 * // returns
 * { $merge: { into: 'myCollection', on: 'key' } }
 * @example <caption>On multiple fields</caption>
 * $merge('myCollection', ['key1', 'key2']);
 * { $merge: { into: 'myCollection', on: ['key1', 'key2'] } }
 * @example <caption>Full example</caption>
 * $merge('myCollection', ['key1', 'key2'])
 *   .whenMatched('replace')
 *   .whenNotMatched('discard');
 * @todo Add support for accepting a pipleine for whenMatched.
 */
const $merge = (into: MixedCollectionName, onExpr?: string | Array<string>) => new Merge(into, onExpr);

type OutExpression =  string | DatabaseAndCollectionName;

/**
 * @category Stages
 * @param {MixedCollectionName} collection The collection name or Collection object
 * to output to.
 * @param {string} [db] The output database name.
 * @returns {OutExpression} An $out expression accoring to argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/|MongoDB reference}
 * for $out
 * @example <caption>Basic</caption>
 * $out('myCollection');
 * // returns
 * { $out: 'myCollection' }
 * @example <caption>With db</caption>
 * $out('myCollection', 'myDb');
 * // returns
 * { $out: { coll: 'myCollection', db: 'myDb' } }
 */
const $out = (collection: MixedCollectionName, db?: string) => {
  if (db) return { $out: { db, coll: getCollectionName(collection) } };
  return { $out: collection };
};

type ProjectStage = {
  $project: ObjectExpression,
};

/**
 * Passes along the documents with the specified fields to the next stage in
 * the pipeline.
 * @category Stages
 * @function
 * @param {ObjectExpression} expression Refer to documentation.
 * @returns {ProjectStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/|MongoDB reference}
 * for $project
 * @example
 * $project({ x: '$y' });
 * // returns
 * { $project: { x: '$y' } }
 */
const $project = se('$project');

class Redaction {
  $redact: Condition;

  constructor(ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) {
    this.$redact = new Condition(ifExpr, thenExpr, elseExpr);
  }

  then(thenExpr: Expression) {
    this.$redact.then(thenExpr);
    return this;
  }

  else(elseExpr: Expression) {
    this.$redact.else(elseExpr);
    return this;
  }
}

/**
 * Restricts entire documents or content within documents from being outputted
 * based on information stored in the documents themselves.
 * @category Stages
 * @function
 * @param {Expression} ifExpr Any valid expression as long as it resolves to
 * a boolean.
 * @param {Expression} thenExpr Any valid expression as long as it resolves to
 * the $$DESCEND, $$PRUNE, or $$KEEP system variables.
 * @param {Expression} elseExpr Any valid expression as long as it resolves to
 * the $$DESCEND, $$PRUNE, or $$KEEP system variables.
 * @returns {Redaction} Returns a Redaction object that resembles the $redact
 * stage whose usage varies based on optional argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/redact/|MongoDB reference}
 * for $redact
 * @example <caption>Static Notation</caption>
 * $redact('$isAdmin', '$$KEEP', '$$PRUNE');
 * @example <caption>Object Notation</caption>
 * $redact('$isAdmin').then('$$KEEP').else('$$PRUNE');
 * @todo Expand for supporting sub-syntax like: `$redact().cond(...`
 * @todo Support non-$cond expression
 */
const $redact = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Redaction(ifExpr, thenExpr, elseExpr);

type ReplaceRootStage = {
  $replaceRoot: {
    newRoot: string | ObjectExpression,
  },
};

/**
 * Replaces the input document with the specified document.
 * @category Stages
 * @function
 * @param {string | ObjectExpression} newRoot The replacement document can be any valid express
 * @returns {ReplaceRootStage} Returns a $replaceRoot operator stage.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceRoot/|MongoDB reference}
 * for $replaceRoot
 * @example
 * $replaceRoot('$subpath');
 * // returns
 * { $replaceRoot: { newRoot: '$subpath' } }
 */
const $replaceRoot = (newRoot: string | ObjectExpression) => ({ $replaceRoot: { newRoot } });

type SetStage = { $set: ObjectExpression };

/**
 * Adds new fields to documents. (alias of $addFields)
 * @category Stages
 * @function
 * @param {ObjectExpression} expression Specify the name of each field to add
 * and set its value to an aggregation expression or an empty object.
 * @returns {SetStage} 
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/|MongoDB reference}
 * for $set
 * @example
 * $set({ fullName: $.concat('$firstName', ' ', '$lastName') });
 * // returns { $set: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
 */
const $set = se('$set', validateFieldExpression);

type SkipStage = {
  $skip: number,
};

/**
 * Skips over the specified number of documents that pass into the stage and
 * passes the remaining documents to the next stage in the pipeline.
 * @category Stages
 * @function
 * @param {number} value The number of documents to skip.
 * @returns {SkipStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/skip/|MongoDB reference}
 * for $skip
 * @example
 * $skip(10);
 * // returns
 * { $skip: 10 }
 */
const $skip = se('$skip');

type SortStage = {
  $sort: ObjectExpression,
};

/**
 * Sorts all input documents and returns them to the pipeline in sorted order.
 * @category Stages
 * @function
 * @param {Expression} expression Refer to documentation.
 * @returns {SortStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/|MongoDB reference}
 * for $sort
 * @example
 * $sort({ x: 1 });
 * // returns
 * { $sort: { x: 1 } }
 */
const $sort = se('$sort');

/**
 * Deconstructs an array field from the input documents to output a document
 * for each element.
 * @category Stages
 * @function
 * @param {string} path Field path to an array field.
 * @param {boolean | undefined} [preserveNullAndEmptyArrays] Keep or prune documents that
 * don't have at least one value in the array field.
 * @returns {Unwind} Returns an Unwind object that resembles the $unwind stage
 * which can be further manipulated using the relevant methods.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/|MongoDB reference}
 * for $unwind
 * @example <caption>Static Notation</caption>
 * $unwind('$myArray');
 * // returns { $unwind: '$myArray' }
 * @example <caption>Static Notation and preserveNullAndEmptyArrays</caption>
 * $unwind('$myArray', true);
 * // returns { $unwind: { path: '$myArray', preserverNullAndEmptyArray: true } }
 * @example <caption>Include Array Index</caption>
 * $unwind('$myArray', true).includeArrayIndex('idxName');
 * // returns { $unwind: { path: '$myArray', preserverNullAndEmptyArray: true, includeArrayIndex: 'idxName' } }
 */
const $unwind = (path: string, preserveNullAndEmptyArrays: boolean | undefined = undefined) => new Unwind(path, preserveNullAndEmptyArrays);

/**
 * OPERATORS
 */

type AbsOperator = {
  $abs: NumberExpression,
}

/**
 * Returns the absolute value of a number.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {AbsOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/|MongoDB reference}
 * for $abs
 */
const $abs = se('$abs');

type AcosOperator = {
  $acos: NumberExpression,
};

/**
 * Returns the inverse cosine (arc cosine) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expression that
 * resolves to a number.
 * @returns {AcosOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/acos/|MongoDB reference}
 * for $acos
 */
const $acos = se('$acos');

type AcoshOperator = {
  $acosh: NumberExpression,
};

/**
 * Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expression that
 * @returns {AcoshOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/acosh/|MongoDB reference}
 * for $acosh
 */
const $acosh = se('$acosh');

// TODO
const $add = pta('$add');

// TODO
const $addSafe = safeNumberArgs($add);

type AddToSetOperator = {
  $addToSet: Expression,
};

/**
 * Returns an array of all unique values that results from applying an
 * expression to each document in a group.
 * @category Operators
 * @function
 * @param {Expression} expression A valid expression.
 * @returns {AddToSetOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/addToSet/|MongoDB reference}
 * for $addToSet
 */
const $addToSet = se('$addToSet');

// TODO
const $all = pta('$all');
// TODO
const $allElementsTrue = pta('$allElementsTrue');

// TODO
const $and = pta('$and');

// TODO
const $anyElementTrue = pta('$anyElementTrue');

type ArrayElemAtExpression = [Array<any>, number];

type ArrayElemAtOperator = {
  $arrayElemAt: Array<ArrayElemAtExpression>,
};

/**
 * Returns the element at the specified array index.
 * @category Operators
 * @function
 * @param {ArrayExpression} arrayExpression An array or a valid expression that
 * resolves to an array.
 * @param {NumberExpression} index A number of any valid expression that
 * resolves to a number.
 * @returns {ArrayElemAtOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayElemAt/|MongoDB reference}
 * for $arrayElemAt
 */
const $arrayElemAt = at('$arrayElemAt');

type KeyValuePair = [string, any];
type KeyValueObject = {
  k: string,
  v: any,
};

type ArrayToObjectExpression = Array<KeyValuePair|KeyValueObject>;
type ArrayToObjectOperator = {
  $arrayToObject: ArrayToObjectExpression,
};

/**
 * Converts an array into a single document.
 * @category Operators
 * @function
 * @param {ArrayToObjectExpression} expression An array of two-element arrays
 * where the first element is the field name, and the second element is the
 * field value OR An array of documents that contains two fields, k and v where
 * k contains the field name and v contains the value of the field.
 * @returns {ArrayToObjectOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayToObject/|MongoDB reference}
 * for $arrayToObject
 */
const $arrayToObject = se('$arrayToObject');

type AsinOperator = {
  $asin: NumberExpression,
};

/**
 * Returns the inverse sine (arc sine) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number between -1 and 1.
 * @returns {AsinOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/asin/|MongoDB reference}
 * for $asin
 */
const $asin = se('$asin');

type AsinhOperator = {
  $asinh: NumberExpression,
};

/**
 * Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {AsinhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/asinh/|MongoDB reference}
 * for $asinh
 */
const $asinh = se('$asinh');

type AtanOperator = {
  $atan: NumberExpression,
};

/**
 * Returns the inverse tangent (arc tangent) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {AtanOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/atan/|MongoDB reference}
 * for $atan
 */
const $atan = se('$atan');

type AtanhOperator = {
  $atanh: NumberExpression,
};

/**
 * Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number between -1 and 1.
 * @returns {AtanhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/atanh/|MongoDB reference}
 * for $atanh
 */
const $atanh = se('$atanh');

type AverageExpression = NumberExpression | Array<NumberExpression>;
type AverageOperator = {
  $avg: AverageExpression,
};

/**
 * Returns the average value of the numeric values ignoring non-numeric values.
 * @category Operators
 * @function
 * @param {AverageExpression} expression Varies based on the stage it is being
 * used in. See documentation.
 * @returns {AverageOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/|MongoDB reference}
 * for $avg
 */
const $avg = se('$avg');

type BinarySizeOperator = {
  $binarySize: string | Binary | null,
};

/**
 * Returns the size of a given string or binary data value's content in bytes.
 * @category Operators
 * @function
 * @param {string | Binary | null} mixedInput Refer to documentation for
 * details.
 * @returns {BinarySizeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/binarySize/|MongoDB reference}
 * for $binarySize
 */
const $binarySize = se('$binarySize');

type BsonSizeOperator = {
  $bsonSize: ObjectExpression | null,
};

/**
 * Returns the size in bytes of a given document when encoded as BSON.
 * @category Operators
 * @function
 * @param {ObjectExpression | null} expression Any valid expression that
 * resolves an object or null.
 * @returns {BsonSizeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bsonSize/|MongoDB reference}
 * for $bsonSize
 */
const $bsonSize = se('$bsonSize');

type CeilOperator = {
  $ceil: NumberExpression,
};

/**
 * Returns the smallest integer greater than or equal to the specified number.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {CeilOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/|MongoDB reference}
 * for $ceil
 */
const $ceil = se('$ceil');

type CmpOperator = {
  $cmp: [Expression, Expression],
};

/**
 * Compares two values.
 * @category Operators
 * @function
 * @param {Expression} expression1 Any valid expression.
 * @param {Expression} expression2 Any valid expression.
 * @returns {CmpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/|MongoDB reference}
 * for $cmp
 */
const $cmp = at('$cmp');

// TODO
const $concat = pta('$concat');

// TODO
const $concatArrays = pta('$concatArrays');

type ConditionExpression = {
  if: Expression,
  then: Expression,
  else: Expression,
};

class Condition {
  $cond: Partial<ConditionExpression>;

  constructor(ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) {
    this.$cond = { if: ifExpr };
    if (thenExpr !== undefined) this.then(thenExpr);
    if (elseExpr !== undefined) this.else(elseExpr);
  }

  then(thenExpr: Expression) {
    this.$cond.then = thenExpr;
    onlyOnce(this, 'then');
    return this;
  }

  else(elseExpr: Expression) {
    this.$cond.else = elseExpr;
    onlyOnce(this, 'else');
    return this;
  }
}

/**
 * Evaluates a boolean expression to return one of the two specified return
 * expressions.
 * @category Operators
 * @function
 * @param {Expression} ifExpr A boolean expression.
 * @param {Expression} [thenExpr] The true case.
 * @param {Expression} [elseExpr] The false case.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/|MongoDB reference}
 * for $cond
 * @example <caption>Static Notation</caption>
 * $cond($.lte($.size('$myArray'), 5), '$myArray', $.slice('$myArray', -5));
 * @example <caption>Object Notation</caption>
 * $cond($.lte($.size('$myArray'), 5)).then('$myArray').else($.slice('$myArray', -5));
 * @returns {Condition} Returns a "Condition" object that represents the $cond
 * operator whose usage varies based on the optional arguments (`thenExpr`
 * and `elseExpr`).
 * _The optional arguments are required but can be alternatively be provided
 * using a corresponding method (see the Object Notation example).
 */
const $cond = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Condition(ifExpr, thenExpr, elseExpr);

type CosOperator = {
  $cos: NumberExpression,
};

/**
 * Returns the cosine of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {CosOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cos/|MongoDB reference}
 * for $cos
 */
const $cos = se('$cos');

type CoshOperator = {
  $cosh: NumberExpression,
};

/**
 * Returns the hyperbolic cosine of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {CoshOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cosh/|MongoDB reference}
 * for $cosh
 */
const $cosh = se('$cosh');

type CovariancePopOperator = {
  $covariancePop: [NumberExpression, NumberExpression],
};

/**
 * Returns the population covariance of two numeric expressions that are
 * evaluated using documents in the $setWindowFields stage window.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {CovariancePopOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/covariancePop/|MongoDB reference}
 * for $covariancePop
 */
const $covariancePop = at('$covariancePop');

type CovarianceSampOperator = {
  $covarianceSamp: [NumberExpression, NumberExpression],
};

/**
 * Returns the sample covariance of two numeric expressions that are evaluated
 * using documents in the $setWindowFields stage window.
 * Non-numeric, null and missing fields are ignored.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {CovarianceSampOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/covarianceSamp/|MongoDB reference}
 * for $covarianceSamp
 */
const $covarianceSamp = at('$covarianceSamp');

type DegreesToRadiansOperator = {
  $cosh: NumberExpression,
};

/**
 * Converts the input value measured in degrees to radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {DegreesToRadiansOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/degreesToRadians/|MongoDB reference}
 * for $degreesToRadians
 */
const $degreesToRadians = se('$degreesToRadians');

const $denseRank = ne('$denseRank');

type DivideOperator = {
  $divide: [NumberExpression, NumberExpression],
};

/**
 * Divides one number by another and returns the result.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {DivideOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/|MongoDB reference}
 * for $divide
 */
const $divide = at('$divide');

// TODO
const $divideSafe = (dividend: number | string, divisor: number | string, defaultValue = '$$REMOVE') => $let({
  dividend: typeof dividend === 'number' ? dividend : $ifNull(dividend, 0),
  divisor: typeof divisor === 'number' ? divisor : $ifNull(divisor, 0),
}).in($cond($eq('$$divisor', 0), defaultValue, $divide('$$dividend', '$$divisor')));
// }).in($if($not($eq('$$divisor', 0))).then($divide('$$dividend', '$$divisor')).else(defaultValue));

// TODO
const $documentNumber = ne('$documentNumber');

type DocumentsOperator = {
  $documents: ObjectExpression;
};

// TODO
const $eq = taf('$eq');

type ExpOperator = {
  $exp: NumberExpression,
};

/**
 * Raises Euler's number to the specified exponent and returns the result.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {ExpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/|MongoDB reference}
 * for $exp
 */
const $exp = se('$exp');

// TODO - Determine if query components should be included
const $each = se('$each');

// TODO - Determine if query components should be included
const $elemMatch = se('$elemMatch');

// TODO - Determine if query components should be included
const $expr = se('$expr');

// TODO
const $filter = (inputExpr: Expression, asExpr: Expression, condExpr: Expression) => ({ $filter: { input: inputExpr, as: asExpr, cond: condExpr } });

type FloorOperator = {
  $floor: NumberExpression,
};

/**
 * Returns the largest integer less than or equal to the specified number.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {FloorOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/|MongoDB reference}
 * for $floor
 */
const $floor = se('$floor');

// TODO
// const $getField

// TODO
const $gt = taf('$gt');

// TODO
const $gte = taf('$gte');

/**
 * Shortcut object-notation for the $cond operation (if/then/else).
 * @category Operators
 * @function
 * @param {Expression} ifExpr A boolean expression.
 * @returns {Condition} A Condition object that resembles the $cond operation
 * whose then and else case should be set using the corresponding methods.
 * @see $cond
 * @example
 * $if($.lte($.size('$myArray'), 5), '$myArray', $.slice('$myArray', -5));
 */
const $if = (ifExpr: Expression) => new Condition(ifExpr);

type IfNullOperator = {
  $ifNull: Array<Expression>,
};

/**
 * Evaluates input expressions for null values and returns the first non-null 
 * value.
 * TODO - Should support more than two args.
 * @category Operators
 * @function
 * @param {Expression} input Input value.
 * @param {Expression} replacement Replacement value.
 * @returns {IfNullOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/|MongoDB reference}
 * for $ifNull
 */
const $ifNull = at('$ifNull');

// TODO
const $in = taf('$in');

// TODO
const $inSafe = (...args: any[]) => {
  if (args.length === 2) {
    const [val, arr] = args;
    return $in(val, $ifNull(arr, []));
  }
  return $in(...args);
};

// TODO
// const $function

type IsNumberOperator = {
  $isNumber: Expression,
};

/**
 * Checks if the specified expression resolves to a numeric BSON type.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {IsNumberOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/|MongoDB reference}
 * for $isNumber
 */
const $isNumber = se('$isNumber');

type LastOperator = {
  $last: Expression,
};

/**
 * Returns the result of an expression of the last document in a group of 
 * documents. Only meaningful when documents are in a defined order.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {LastOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/last/|MongoDB reference}
 * for $last
 */
const $last = se('$last');

type LetExpression = {
  vars: Expression,
  in: Expression,
};

class LetVarsIn {
  $let: Partial<LetExpression>;

  constructor(varsExpr?: Expression, inExpr?: Expression) {
    this.$let = {}
    if (varsExpr) this.vars(varsExpr);
    if (inExpr) this.in(inExpr);
  }

  vars(varsExpr: Expression) {
    this.$let.vars = varsExpr;
    onlyOnce(this, 'vars');
    return this;
  }

  in(inExpr: Expression) {
    this.$let.in = inExpr;
    onlyOnce(this, 'in');
    return this;
  }
}

/**
 * Binds variables for use in the specified expression and returns the result of
 * the expression.
 * @category Operators
 * @function
 * @param {Expression} varsExpr Assign for the variables accessible in the in
 * expression.
 * @param {Expression} [inExpr] The expression to evaluate.
 * @returns {LetVarsIn} Returns a "LetVarsIn" object that resembles the $let
 * operator whose usage varies based on the optional arguments.
 * _The optional arguments can be alternatively be provided using a
 * corresponding method (see the Object Notation example).
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/let/|MongoDB reference}
 * for $let
 * @example <caption>Static Notation</caption>
 * $let({ myVar: 'val' }, $.concat('myVar equals: ', '$$myVar'));
 * @example <caption>Object Notation #1</caption>
 * $let({ myVar: 'val' }}).in($.concat('myVar equals: ', '$$myVar'));
 * @example <caption>Object Notation #2</caption>
 * $let().vars({ myVar: 'val' }}).in($.concat('myVar equals: ', '$$myVar'));
 * @example <caption>Return value of all above examples</caption>
 * { $let: { vars: { myVar: 'val', in: { $concat: ['myVar equals: ', '$$myVar'] } } } }
 */
const $let = (varsExpr?: Expression, inExpr?: Expression) => new LetVarsIn(varsExpr, inExpr);

type LinearFillOperator = {
  $linearFill: Expression,
};

/**
 * Fills null and missing fields in a window using linear interpolation based on
 * surrounding field values.
 * Only available in the $setWindowFields stage.
 * @category Operators
 * @function
 * @param {Expression} expression A valid expression.
 * @returns {LinearFillOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/linearFill/|MongoDB reference}
 * for $linearFill
 */
const $linearFill = se('$linearFill');

type LiteralOperator = {
  $literal: any,
};

/**
 * Returns a value without parsing. Use for values that the aggregation pipeline
 * may interpret as an expression.
 * @category Operators
 * @function
 * @param {any} value Any value
 * @returns {LiteralOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/literal/|MongoDB reference}
 * for $literal
 */
const $literal = se('$literal');

type LocfOperator = {
  $locfOperator: Expression,
};

/**
 * Last observation carried forward. Sets values for null and missing fields in
 * a window to the last non-null value for the field.
 * Only available in the $setWindowFields stage.
 * @category Operators
 * @function
 * @param {Expression} expression A valid expression.
 * @returns {LocfOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/locf/|MongoDB reference}
 * for $locf
 */
const $locf = se('$locf');

type LogOperator = {
  $log: [NumberExpression, NumberExpression],
};

/**
 * Calculates the log of a number in the specified base and returns the result
 * as a double.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a non-negative number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a positive number greater than 1.
 * @returns {LogOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/|MongoDB reference}
 * for $log
 */
const $log = at('$log');

type Log10Operator = {
  $log10: NumberExpression,
};

/**
 * Calculates the log base 10 of a number and returns the result as a double.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {Log10Operator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/|MongoDB reference}
 * for $log10
 */
const $log10 = se('$log10');

// TODO
const $lt = taf('$lt');

// TODO
const $lte = taf('$lte');

// TODO
const $map = (inputExpr: Expression, asExpr: string, inExpr: Expression) => ({ $map: { input: inputExpr, as: asExpr, in: inExpr } });

// TODO
const $max = taf('$max');

// TODO - $mergeObjects accepts only one arg when used an accumulator
const $mergeObjects = pta('$mergeObjects');

enum MetaDataKeyword {
  textScore,
  indexKey,
}

type MetaOperator = {
  $meta: MetaDataKeyword,
};

/**
 * Returns the metadata associated with a document when performing a search.
 * @category Operators
 * @function
 * @param {MetaDataKeyword} metaDataKeyword
 * @returns {MetaOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/meta/|MongoDB reference}
 * for $meta
 */
const $meta = se('$meta');

// TODO
const $min = taf('$min');

type ModOperator = {
  $mod: [NumberExpression, NumberExpression],
};

/**
 * Divides one number by another and returns the remainder.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {ModOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/|MongoDB reference}
 * for $mod
 */
const $mod = at('$mod');

// TODO - Determine if query components should be included
const $mul = se('$mul');

// TODO
const $multiply = pta('$multiply');

// TODO
const $multiplySafe = safeNumberArgs($multiply);

type NeOperator = {
  $ne: [Expression, Expression],
};

/**
 * Compares two values and returns true when the values are not equivalent and
 * false when the values are equivalent.
 * @category Operators
 * @function
 * @param {Expression} expression1 Any valid expression.
 * @param {Expression} expression2 Any valid expression.
 * @returns {NeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/|MongoDB reference}
 * for $ne
 */
const $ne = at('$ne');

type NotOperator = {
  $not: Expression,
};

/**
 * Evalutes a boolean and returns the opposite boolean value.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {NotOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/|MongoDB reference}
 * for $not
 */
const $not = se('$not');

type ObjectToArrayOperator = {
  $objectToArray: ObjectExpression,
};

/**
 * Converts a document to an array.
 * @category Operators
 * @function
 * @param {ObjectExpression} object Any valid expression that evaluates to an
 * expression.
 * @returns {ObjectToArrayOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/objectToArray/|MongoDB reference}
 * for $objectToArray
 */
const $objectToArray = se('$objectToArray');

// TODO
const $or = pta('$or');

type PowOperator = {
  $pow: [NumberExpression, NumberExpression],
};

/**
 * Raises a number to the specified exponent and retuns the result.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {PowOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/|MongoDB reference}
 * for $pow
 */
const $pow = at('$pow');

type PushOperator = {
  $push: Expression,
};

/**
 * Returns an array of all values that result from applying an expression to
 * documents.
 * @category Operators
 * @function
 * @param expression Expression
 * @param {Expression} expression A valid expression.
 * @returns {PushOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/push/|MongoDB reference}
 * for $push
 */
const $push = se('$push');

type RadiansToDegreesOperator = {
  $radiansToDegrees: NumberExpression,
};

/**
 * Converts an input value measured in radians to degrees.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {RadiansToDegreesOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/radiansToDegrees/|MongoDB reference}
 * for $radiansToDegrees
 */
const $radiansToDegrees = se('$radiansToDegrees');

// TODO
const $rand = ne('$rand');

// TODO
const $rank = ne('$rank');

type RoundOperator = {
  $round: NumberExpression,
};

/**
 * Rounds a number to a whole integer or to a specified decimal place.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to an integer between -20 and 100. Defaults to 0 if unspecified.
 * @returns {RoundOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/|MongoDB reference}
 * for $round
 * @example
 * $round(10.5) // 10
 * $round(11.5) // 12
 * $round(12.5) // 12
 * $round(13.5) // 14
 */
const $round = at('$round');

// TODO
// based on mongo-round
const $roundStandard = (valueExpression: Expression, decimals: number) => {
	const multiplier = Math.pow(10, decimals || 0);

	if (multiplier === 1) { // zero decimals
		return $let({
      val: $add(valueExpression, $if($gte(valueExpression, 0)).then(0.5).else(-0.5)),
    }).in($subtract('$$val', $mod('$$val', 1)));
	}

	return $let({
    val: $add(
      $multiply(valueExpression, multiplier),
      $if($gte(valueExpression, 0)).then(0.5).else(-0.5),
    ),
  }).in($divide($subtract('$$val', $mod('$$val', 1)), multiplier));
};

type SampleRateOperator = {
  $sampleRate: number,
};

/**
 * Matches a random selection of input documents.
 * @category Operators
 * @function
 * @param {number} value A floating point number between 0 and 1.
 * @returns {SampleRateOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sampleRate/|MongoDB reference}
 * for $sampleRate
 */
const $sampleRate = se('$sampleRate');

type SetDifferenceOperator = {
  $setDifference: [ArrayExpression, ArrayExpression],
};

/**
 * Takes two sets and returns an array containing the elements that only exist
 * in the first set.
 * @category Operators
 * @function
 * @param {ArrayExpression} expression1 An array or a valid expression that
 * resolves to an array.
 * @param {ArrayExpression} expression2 An array or a valid expression that
 * resolves to an array.
 * @returns {SetDifferenceOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/setDifference/|MongoDB reference}
 * for $setDifference
 */
const $setDifference = at('$setDifference');

// TODO
const $setEquals = pta('$setEquals');

// TODO
const $setIntersection = pta('$setIntersection');

type SetIsSubsetOperator = {
  $setIsSubset: [ArrayExpression, ArrayExpression],
};

/**
 * Takes two arrays and returns true when the first array is a subset of the
 * second, including when the first array equals the second array, and false
 * otherwise.
 * @category Operators
 * @function
 * @param {ArrayExpression} expression1 An array or a valid expression that
 * resolves to an array.
 * @param {ArrayExpression} expression2 An array or a valid expression that
 * resolves to an array.
 * @returns {SetIsSubsetOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/setIsSubset/|MongoDB reference}
 * for $setIsSubset
 */
const $setIsSubset = at('$setIsSubset');

// TODO
const $setUnion = pta('$setUnion');

type SinOperator = {
  $sin: NumberExpression,
};

/**
 * Returns the sine of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {SinOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sin/|MongoDB reference}
 * for $sin
 */
const $sin = se('$sin');

type SinhOperator = {
  $sinh: NumberExpression,
};

/**
 * Returns the hyperbolic sine of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {SinhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sinh/|MongoDB reference}
 * for $sinh
 */
const $sinh = se('$sinh');

type SizeOperator = {
  $size: ArrayExpression,
};

/**
 * Counts and returns the total number of items in an array.
 * @category Operators
 * @function
 * @param {ArrayExpression} arrayExpression An array or a valid expression that
 * resolves to an array.
 * @returns {SizeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/|MongoDB reference}
 * for $size
 */
const $size = se('$size');

type SplitOperator = {
  $split: [StringExpression, StringExpression],
};

/**
 * Divides a string into an array of substrings based on a delimeter.
 * @category Operators
 * @function
 * @param {StringExpression} value The string to be split.
 * @param {StringExpression} delimeter The delimeter to use.
 * @returns {SplitOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/split/|MongoDB reference}
 * for $split
 */
const $split = at('$split');

/**
 * Calculates the square root of a positive number and returns the result as a
 * double.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {SortStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/|MongoDB reference}
 * for sqrt
 */
const $sqrt = se('$sqrt');

type StrLenBytesOperator = {
  $strLenBytes: StringExpression,
};

/**
 * Returns the number of UTF-9 encoded bytes in the specified string.
 * @category Operators
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {StrLenBytesOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenBytes/|MongoDB reference}
 * for $strLenBytes
 */
const $strLenBytes = se('$strLenBytes');

type StrLenCpOperator = {
  $strLenCP: StringExpression,
};

/**
 * Returns the number of UTF-8 code pints in the specified string.
 * @category Operators
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {StrLenCpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenCP/|MongoDB reference}
 * for $strLenCP
 */
const $strLenCP = se('$strLenCP');

type StrcasecmpOperator = {
  $strcasecmp: [StringExpression, StringExpression],
};

/**
 * Performs case-insensitive comparison of two strings.
 * @category Operators
 * @function
 * @param {StringExpression} exression1 A string or any valid expression that
 * resolves to a string.
 * @param {StringExpression} exression2 A string or any valid expression that
 * resolves to a string.
 * @returns {StrcasecmpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/strcasecmp/|MongoDB reference}
 * for $strcasecmp
 */
const $strcasecmp = at('$strcasecmp');

type SubtractOperator = {
  $subtract: [NumberExpression, NumberExpression],
};

/**
 * Subtracts two numbers to return the difference, or two dates to return the
 * difference in milliseconds, or a date and a number in milliseconds to return
 * the resulting date.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to a number.
 * @returns {SubtractOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/|MongoDB reference}
 * for $subtract
 */
const $subtract = at('$subtract');

// TODO
const $subtractSafe = safeNumberArgs($subtract);

type SumOperator = {
  $sum: Expression,
};

/**
 * Calculates and returns the collective sum of numeric values. Non-numeric
 * values are ignored.
 * @category Operators
 * @function
 * @param {Expression} expression Refer to documentation.
 * @returns {SumOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/|MongoDB reference}
 * for $sum
 */
const $sum = se('$sum');

type Branch = {
  case: Expression,
  then: Expression,
};

const branch = (caseExpr: Expression, thenExpr: Expression): Branch =>
  ({ case: caseExpr, then: thenExpr });

type SwitchExpression = {
  branches: Branch[];
  default?: Expression;
};

/**
 * @typedef {Expression | Array<Branch>} DefaultOrBranches
 * @description The default path or an array of (switch) branches.
 */
type DefaultOrBranches = Expression | Branch[];

class Switch {
  public $switch: Partial<SwitchExpression> = {};

  constructor(arg1?: DefaultOrBranches, arg2?: DefaultOrBranches) {
    const args = [arg1, arg2].filter((v) => v !== undefined);
    if (args.length >= 2) {
      if (args.filter((v) => Array.isArray(v)).length > 1) {
        throw new TypeError(`Multiple switch branches input. Only one is supported.`);
      }
      if (args.filter((v) => !Array.isArray(v)).length > 1) {
        throw new TypeError(`Multiple switch defaults input. Only one is supported.`);
      }
    }
    while (args.length) {
      const arg = args.shift();
      if (Array.isArray(arg)) {
        this.branches(...arg as Branch[]);
      } else {
        this.default(arg as Expression);
      }
    }
  }

  branches(...args: Branch[]) {
    this.$switch.branches = args;
    return this;
  }

  branch(caseExpr: Expression, thenExpr: Expression) {
    if (this.$switch.branches === undefined) {
      this.$switch.branches = [];
    }
    this.$switch.branches.push({ case: caseExpr, then: thenExpr });
    return this;
  }

  default(defaultReturn: Expression) {
    this.$switch.default = defaultReturn;
    onlyOnce(this, 'default');
    return this;
  }
}

/**
 * Evaluates a series of case expressions. When it finds an expression which
 * evaluates to true, $switch executes a specified expression and breaks out of
 * the control flow.
 * @category Operators
 * @function
 * @param {DefaultOrBranches} [arg1] Default path or array of branches.
 * @param {DefaultOrBranches} [arg2] Default path or array of branches.
 * @returns {Switch} Returns a Switch object that resembles the $switch operator
 * whose usage varies based on the optional argument input.
 * _Optional arguments should be provided through their corresponding methods
 * to complete the expression._
 * @example <caption>Static Notation</caption>
 * $switch('$$PRUNE', [
 *   $case('$user.isAdministrator', '$$KEEP'),
 *   $case('$document.hasMore', '$$DESCEND'),
 * ]);
 * @example <caption>With arguments inverted</caption>
 * $switch([
 *   $case('$user.isAdministrator', '$$KEEP'),
 *   $case('$document.hasMore', '$$DESCEND'),
 * ], '$$PRUNE');
 * @example <caption>Object notation</caption>
 * $switch()
 *  .case('$user.isAdministor', '$$KEEP')
 *  .case('$document.hasMore', '$$DESCEND')
 *  .default('$$PRUNE');
 * @example <caption>Hybrid Notation</caption>
 * $switch('$$PRUNE')
 *  .case('$user.isAdministor', '$$KEEP')
 *  .case('$document.hasMore', '$$DESCEND');
 * @example <caption>Return value of all above examples</caption>
 * {
 *   $switch: {
 *     branches: [
 *       { cond: '$user.isAdministrator', then: '$$KEEP' },
 *       { cond: '$document.hasMore', then: '$$DESCEND' },
 *     ],
 *     default: '$$PRUNE',
 *   },
 * }
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/switch/|MongoDB reference}
 * for $switch
 */
const $switch = (arg1?: DefaultOrBranches, arg2?: DefaultOrBranches) => new Switch(arg1, arg2);

type TanOperator = {
  $tan: NumberExpression,
};

/**
 * Returns the tangent of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {TanOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/tan/|MongoDB reference}
 * for $tan
 */
const $tan = se('$tan');

type TanhOperator = {
  $tanh: NumberExpression,
};

/**
 * Returns the hyperbolic tangent of a value that is measured in radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {TanhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/tanh/|MongoDB reference}
 * for $tanh
 */
const $tanh = se('$tanh');

type ToBoolOperator = {
  $toBool: Expression,
};

/**
 * Converts a value to a boolean.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToBoolOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/|MongoDB reference}
 * for $toBool
 */
const $toBool = se('$toBool');

type ToDateOperator = {
  $toDate: Expression,
};
/**
 * Converts a value to a date. Will produce an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToDateOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/|MongoDB reference}
 * for $toDate
 */
const $toDate = se('$toDate');

type ToDecimalOperator = {
  $toDecimal: Expression,
};

/**
 * Converts a value to a decimal. Throws an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToDecimalOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDecimal/|MongoDB reference}
 * for $toDecimal
 */
const $toDecimal = se('$toDecimal');

type ToDoubleOperator = {
  $toDouble: Expression,
};

/**
 * Converts a value to a double. Throws an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToDoubleOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/|MongoDB reference}
 * for $toDouble
 */
const $toDouble = se('$toDouble');

type ToIntOperator = {
  $toInt: Expression,
};

/**
 * Converts a value to an integer. Throws an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToIntOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/|MongoDB reference}
 * for $toInt
 */
const $toInt = se('$toInt');
type ToLongOperator = {
  $toLong: Expression,
};

/**
 * Converts a value to a long. Throws an error if the value cannot be converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToLongOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLong/|MongoDB reference}
 * for $toLong
 */
const $toLong = se('$toLong');

type ToObjectIdOperator = {
  $toObjectId: Expression,
};

/**
 * Converts a value to an ObjectId. Throws an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToObjectIdOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/|MongoDB reference}
 * for $toObjectId
 */
const $toObjectId = se('$toObjectId');

type ToStringOperator = {
  $toString: Expression,
};

/**
 * Converts a value to a string. Throws an error if the value cannot be
 * converted.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {ToStringOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/|MongoDB reference}
 * for $toString
 */
const $toString = se('$toString');

type ToUpperOperator = {
  $toUpper: StringExpression,
};

/**
 * Returns a string converts to uppercase.
 * @category Operators
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {ToUpperOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toUpper/|MongoDB reference}
 * for $toUpper
 */
const $toUpper = se('$toUpper');

type ToLowerOperator = {
  $toUpper: StringExpression,
};

/**
 * Returns a string converted to lowercase.
 * @category Operators
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {ToLowerOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/|MongoDB reference}
 * for $toLower
 */
const $toLower = se('$toLower');

type TruncOperator = {
  $trunc: [NumberExpression, NumberExpression],
};

/**
 * Truncates a number to a whole integer or to a specified decimal place.
 * @category Operators
 * @function
 * @param {NumberExpression} expression1 A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} expression2 A number of any valid expression that
 * resolves to an integer between -20 and 100. Defaults to 0 if unspecified.
 * @returns {TruncOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/|MongoDB reference}
 * for $trunc
 */
const $trunc = at('$trunc');

type TsIncrementOperator = {
  $tsIncrement: Expression,
};

/**
 * Returns the incrementing ordinal from a timestamp as a long.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression that resolves to a
 * timestamp.
 * @returns {TsIncrementOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsIncrement/|MongoDB reference}
 * for $tsIncrement
 */
const $tsIncrement = se('$tsIncrement');

type TsSecondOperator = {
  $tsSecond: Expression,
};

/**
 * Returns the seconds from a timestamp as a long.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression that resolves to a
 * timestamp.
 * @returns {TsSecondOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsSecond/|MongoDB reference}
 * for $tsSecond
 */
const $tsSecond = se('$tsSecond');

type TypeOperator = {
  $type: Expression,
};

/**
 * Returns a string that specifies the BSON type of the argument.
 * @category Operators
 * @function
 * @param {Expression} Any valid expression.
 * @returns {TypeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/|MongoDB reference}
 * for $type
 */
const $type = se('$type');

type UnwindExpression = {
  path: string;
  preserveNullAndEmptyArrays?: boolean;
  includeArrayIndex?: string;
};

class Unwind {
  @nonenumerable
  params: UnwindExpression;

  get path() {
    return this.params.path;
  }

  constructor(path: string, arg2: boolean | undefined) {
    this.params = { path };
    if (arg2 !== undefined) {
      this.preserveNullAndEmptyArrays(arg2);
    }
    Object.defineProperty(this, '$unwind', {
      get: () => {
        if (this.params.preserveNullAndEmptyArrays !== undefined || this.params.includeArrayIndex !== undefined) {
          return this.params;
        }
        return this.path;
      },
      enumerable: true,
    });
  }

  preserveNullAndEmptyArrays(value: boolean) {
    this.params.preserveNullAndEmptyArrays = value;
    onlyOnce(this, 'preserveNullAndEmptyArrays');
    return this;
  }

  includeArrayIndex(value: string) {
    this.params.includeArrayIndex = value;
    onlyOnce(this, 'includeArrayIndex');
    return this;
  }
}

export = {
  $abs,
  abs: $abs,
  $acos,
  acos: $acos,
  $acosh,
  acosh: $acosh,
  $add,
  add: $add,
  $addSafe,
  addSafe: $addSafe,
  $addFields,
  addFields: $addFields,
  $addToSet,
  addToSet: $addToSet,
  $all,
  all: $all,
  $allElementsTrue,
  allElementsTrue: $allElementsTrue,
  $and,
  and: $and,
  $anyElementTrue,
  anyElementTrue: $anyElementTrue,
  $arrayElemAt,
  arrayElemAt: $arrayElemAt,
  $arrayToObject,
  arrayToObject: $arrayToObject,
  $asin,
  asin: $asin,
  $asinh,
  asinh: $asinh,
  $atan,
  atan: $atan,
  $atanh,
  atanh: $atanh,
  $avg,
  avg: $avg,
  $bucket,
  bucket: $bucket,
  $bucketAuto,
  bucketAuto: $bucketAuto,
  $binarySize,
  binarySize: $binarySize,
  branch,
  $bsonSize,
  bsonSize: $bsonSize,
  case: branch,
  $ceil,
  ceil: $ceil,
  $changeStream,
  changeStream: $changeStream,
  $cmp,
  cmp: $cmp,
  $concat,
  concat: $concat,
  $concatArrays,
  concatArrays: $concatArrays,
  $cond,
  cond: $cond,
  // TODO
  // $convert
  $cos,
  cos: $cos,
  $cosh,
  cosh: $cosh,
  $count,
  count: $count,
  $covariancePop,
  $covarianceSamp,
  $degreesToRadians,
  degreesToRadians: $degreesToRadians,
  $denseRank,
  denseRank: $denseRank,
  $divide,
  divide: $divide,
  $divideSafe,
  divideSafe: $divideSafe,
  $documentNumber,
  documentNumber: $documentNumber,
  $documents,
  documents: $documents,
  $each,
  each: $each,
  $elemMatch,
  elemMatch: $elemMatch,
  $eq,
  eq: $eq,
  $exp,
  exp: $exp,
  $expr,
  expr: $expr,
  $filter,
  filter: $filter,
  $floor,
  floor: $floor,
  $group,
  group: $group,
  $gt,
  gt: $gt,
  $gte,
  gte: $gte,
  $if,
  if: $if,
  $ifNull,
  ifNull: $ifNull,
  $in,
  in: $in,
  $inSafe,
  inSafe: $inSafe,
  $isNumber,
  isNumber: $isNumber,
  $last,
  last: $last,
  $let,
  let: $let,
  $limit,
  limit: $limit,
  $linearFill,
  linearFill: $linearFill,
  $literal,
  literal: $literal,
  $locf,
  locf: $locf,
  $log,
  log: $log,
  $log10,
  log10: $log10,
  $lookup,
  lookup: $lookup,
  $lt,
  lt: $lt,
  $lte,
  lte: $lte,
  $map,
  map: $map,
  $match,
  match: $match,
  $max,
  max: $max,
  $meta,
  meta: $meta,
  $min,
  min: $min,
  $merge,
  merge: $merge,
  $mergeObjects,
  mergeObjects: $mergeObjects,
  $mod,
  mod: $mod,
  $multiply,
  multiply: $multiply,
  $multiplySafe,
  multiplySafe: $multiplySafe,
  $mul,
  mul: $mul,
  $ne,
  ne: $ne,
  $not,
  not: $not,
  $or,
  or: $or,
  $out,
  out: $out,
  pipeline,
  $pow,
  pow: $pow,
  $objectToArray,
  objectToArray: $objectToArray,
  $radiansToDegrees,
  radiansToDegrees: $radiansToDegrees,
  $project,
  project: $project,
  $push,
  push: $push,
  $rand,
  rand: $rand,
  $rank,
  rank: $rank,
  $redact,
  redact: $redact,
  $replaceRoot,
  replaceRoot: $replaceRoot,
  $round,
  round: $round,
  $roundStandard,
  roundStandard: $roundStandard,
  $sampleRate,
  sampleRate: $sampleRate,
  $set,
  set: $set,
  $setEquals,
  $setDifference,
  setDifference: $setDifference,
  setEquals: $setEquals,
  $setIntersection,
  setIntersection: $setIntersection,
  $setIsSubset,
  setIsSubset: $setIsSubset,
  $setUnion,
  setUnion: $setUnion,
  $sort,
  sort: $sort,
  $split,
  split: $split,
  $strcasecmp,
  strcasecmp: $strcasecmp,
  $subtract,
  subtract: $subtract,
  $subtractSafe,
  subtractSafe: $subtractSafe,
  $size,
  size: $size,
  $sin,
  sin: $sin,
  $sinh,
  sinh: $sinh,
  $skip,
  skip: $skip,
  $sqrt,
  sqrt: $sqrt,
  $strLenBytes,
  strLenBytes: $strLenBytes,
  $strLenCP,
  strLenCP: $strLenCP,
  $sum,
  sum: $sum,
  $switch,
  switch: $switch,
  $tan,
  tan: $tan,
  $tanh,
  tanh: $tanh,
  $toBool,
  toBool: $toBool,
  $toDate,
  toDate: $toDate,
  $toDecimal,
  toDecimal: $toDecimal,
  $toDouble,
  toDouble: $toDouble,
  $toInt,
  toInt: $toInt,
  $toLong,
  toLong: $toLong,
  $toObjectId,
  toObject: $toObjectId,
  $toString,
  toString: $toString,
  $toUpper,
  toUpper: $toUpper,
  $toLower,
  toLower: $toLower,
  $tsIncrement,
  tsIncrement: $tsIncrement,
  $tsSecond,
  tsSecond: $tsSecond,
  $trunc,
  trunc: $trunc,
  $type,
  type: $type,
  $unwind,
  unwind: $unwind,

  // Enums
  ChangeStreamFullDocument,
  MergeActionWhenMatched,
  MergeActionWhenNotMatched,
};
