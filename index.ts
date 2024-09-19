import { nonenumerable } from "nonenumerable";

type CollectionNamespace = { collection: string };
type CollectionInfo = { namespace: CollectionNamespace };
type Collection = { s: CollectionInfo };
type MixedCollectionName = string | Collection;

type Binary<N extends number = number> = string & {
  readonly BinaryStringLength: unique symbol;
  length: N;
};

type ObjectExpression = { [k: string]: any } | string;

/**
 * A valid expression, string, number, boolean or null.
 */
type Expression = ObjectExpression | number | boolean;

/**
 * A number or any valid expression that resolves to a number.
 */
type NumberExpression = ObjectExpression | number | string;

/**
 * An array or any valid expression that resolves to an array.
 */
type ArrayExpression = ObjectExpression | Array<any> | string;

/**
 * A string or any valid expression that resolves to a string.
 */
type StringExpression = ObjectExpression | Array<any> | string;

/**
 * A date or any valid expression that resolves to a date.
 */
type DateExpression = ObjectExpression | Date | string;

type ArrayOfExpressions = Array<ObjectExpression>;

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
// pass thru args (or first arg as array)
const ptafaa = (ns: string) => (...args: any[]) => ({ [ns]: args.length === 1 && Array.isArray(args) ? args[0] : args });
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

const safeNumberArgs = (fn: OperatorFn) => (...args: any[]) => {
  const nums = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  return fn(...nums.map((arg) => {
    switch (typeof arg) {
      case 'boolean':
        return arg ? 1 : 0;
      case 'number':
        return arg;
      case 'string':
        if (arg.match(/^[^$]/)) return 0;
        break;
      case 'object':
        if (arg === null) return 0;
        break;
      case 'undefined':
        return 0;
      default:
    }
    return $ifNull(arg, 0);
  }));
};

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
 * @param {string} [name] The name of the output field for the count value.
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

type DocumentsStage = {
  $documents: ObjectExpression;
};

/**
 * Returns literal documents from input values.
 * @category Stages
 * @function
 * @param {ObjectExpression | Array<ObjectExpression>} mixed The first document
 * or an array of documents.
 * @param {...ObjectExpression[]} [args] Additional documents to input into the
 * pipeline.
 * @returns {DocumentsStage} Returns a $document operator based on input.
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

type FacetExpression = { [k: string]: Array<PipelineStage> };
type FacetStage = { $facet: FacetExpression };

/**
 * Processes multiple aggregation pipelines within a single stage on the same
 * set of input documents.
 * @category Stages
 * @function
 * @param {FacetExpression} expression Refer to documentation.
 * @returns {FacetStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/|MongoDB reference}
 * for $project
 * @example
 * $project({ x: '$y' });
 * // returns
 * { $project: { x: '$y' } }
 */
const $facet = se('$facet');

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

type ReplaceWithStage = { $replaceWith: ObjectExpression };

/**
 * Replaces the input document with the specified document.
 * @category Stages
 * @function
 * @param {string | ObjectExpression} replacementDocument The replacement
 * document can be any valid express
 * @returns {ReplaceWithStage} Returns a $replaceWith operator stage.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceWith/|MongoDB reference}
 * for $replaceWith
 * @example
 * $replaceWith('$subpath');
 * // returns
 * { $replaceWith: '$subpath' }
 */
const $replaceWith = (replacementDocument: string | ObjectExpression) => ({ $replaceWith: replacementDocument });

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

type SortByCountStage = {
  $sortByCount: ObjectExpression,
};

/**
 * Groups incoming documents based on the value of a specified expression, then
 * computes the count of documents in each distinct group.
 * @category Stages
 * @function
 * @param {Expression} expression Refer to documentation.
 * @returns {SortByCountStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortByCount/|MongoDB reference}
 * for $sortByCount
 * @example
 * $sortByCount('$employee');
 * // returns
 * { $sortByCount: '$employee' }
 */
const $sortByCount = se('$sortByCount');

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
 * @example
 * $abs(-1);
 * // returns
 * { $abs: -1 }
 */
const $abs = se('$abs');

// TODO $accumulator (object notation required)

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
 * @example
 * $radiansToDegrees($acos($divide('$side_b', '$hypotenuse')));
 * // returns
 * { $radiansToDegrees: { $acos: { $divide: ['$side_b', '$hypotenuse'] } } }
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
 * @example
 * $radiansToDegrees($acosh('$x'));
 * // returns
 * { $radiansToDegrees: { $acosh: '$x' } }
 */
const $acosh = se('$acosh');

type AddOperator = {
  $add: Array<DateExpression|NumberExpression>,
};

/**
 * Adds numbers together or adds numbers and a date.
 * @category Operators
 * @function
 * @param {...NumberExpression|DateExpression} expression Number and/or date
 * expressions to add.
 * @returns {AddOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/|MongoDB reference}
 * for $add
 * @example <caption>Addends as arguments</caption>
 * $add(1, 2, 3);
 * // returns
 * { $add: [1, 2, 3] }
 * @example <caption>Addends as array</caption>
 * $add([1, 2, 3]);
 * // returns same as above
 */
const $add = ptafaa('$add');

/**
 * Add safetely, ensuring all expressions resolve a number. Null values resolve
 * to zero.
 * @category Safe Operators
 * @function
 * @param {...NumberExpression} expression Numbers or expressions to adds.
 * @returns {AddOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/|MongoDB reference}
 * for $add
 * @see $add
 * @example <caption>Non literal numbers input</caption>
 * $addSafe(1, 2, '$myVar');
 * // returns
 * { $add: [1, 2, { $ifNull: ['$myVar', 0] }] }
 * @example <caption>All literal numbers input</caption>
 * $addSafe(1, 2, 3);
 * // returns
 * { $add: [1, 2, 3] }
 * @todo Protect from non-null & non-numeric values.
 */
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
 * @example
 * $addToSet('$item');
 * // returns
 * { $addToSet: '$item' }
 */
const $addToSet = se('$addToSet');

type AllOperator = {
  $all: ArrayExpression,
}

/**
 * Selects documents where the value of a field is an array that contains all
 * the specified elements.
 * @function
 * @category Other Operators
 * @param {...Expression[]} expressions Match expression.
 * @returns {AllOperator} The compiled $all operator.
 */
const $all = (...expressions: Expression[] ) => ({ $all: [...expressions ]});

type AllElementsTrueOperator = {
  $allElementsTrue: Array<Expression>,
};

/**
 * Evaluates an array as a set and returns `true` if no element in the array is
 * `false`. Otherwise, returns false. An empty array returns `true`.
 * @category Operators
 * @function
 * @param {...Expression} expressions Any valid expressions.
 * @returns {AllElementsTrueOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/allElementsTrue/|MongoDB reference}
 * for $allElementsTrue
 * @example
 * $allElementsTrue('$a', '$b', ['$c', '$d']);
 * // returns
 * { $allElementsTrue: ['$a', '$b', ['$c', '$d']] }
 */
const $allElementsTrue = pta('$allElementsTrue');

type AndOperator = {
  $and: Array<Expression>,
};

/**
 * Evaluates one or more expressions and returns true if _all_ of the
 * expressions are `true` or if run with no argument expressions.
 * @category Operators
 * @function
 * @param {...Expression} expressions Any valid expressions.
 * @returns {AndOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/and/|MongoDB reference}
 * for $and
 * @example
 * $and($or('$a', '$b'), '$c');
 * // returns
 * { $and: [{ $or: ['$a', '$b'], '$c'] }
 * @example <caption>First argument array</caption>
 * $and([$or('$a', '$b'), '$c']);
 * // returns same as above
 */
const $and = ptafaa('$and');

type AnyElementTrueOperator = {
  $anyElementTrue: Array<Expression>,
};

/**
 * Evaluates an array as a set and returns `true` if any of the elements are 
 * `true`. Returns `false` otherwise.
 * @category Operators
 * @function
 * @param {...Expression} expressions Any valid expressions.
 * @returns {AnyElementTrueOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/anyElementTrue/|MongoDB reference}
 * for $anyElementTrue
 * @example
 * $anyElementsTrue('$a', '$b', ['$c', '$d']);
 * // returns
 * { $anyElementsTrue: ['$a', '$b', ['$c', '$d']] }
 */
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
 * @example
 * $arrayElemAt('$favorites', 0);
 * // returns
 * { $arrayElemAt: ['$favorites', 0] }
 */
const $arrayElemAt = at('$arrayElemAt');


/**
 * Returns the first element in an array.
 * @category Operators
 * @function
 * @param {ArrayExpression} inputArray An arra or a valid expression that
 * resolves to an array.
 * @returns {ArrayElemAtOperator} Returns an $arrayElemAt operator with 0 as the
 * idx parameter.
 * @example
 * $arrayElemFirst('$myArray')
 * // returns
 * { $let: { vars: { inputArray: '$myArray' }, in: { $arrayElemAt: ['$myArray', 0] } } }
 */
const $arrayElemFirst = (inputArray: ArrayExpression) => $arrayElemAt(inputArray, 0);

/**
 * Returns the last element in an array.
 * @category Operators
 * @function
 * @param {ArrayExpression} inputArray An arra or a valid expression that
 * resolves to an array.
 * @returns {ArrayElemAtOperator} Returns an $arrayElemAt operator with the idx
 * parameter calculated from the size of the array for the last element.
 * @example
 * $arrayElemLast('$myArray')
 * // returns
 * { $let: {
 *   vars: { inputArray: '$myArray' },
 *   in: { $let: {
 *     vars: { length: { $size: '$$inputArray' } },
 *     in: { $arrayElemAt: ['$$inputArray', { $subtract: ['$$length', -1] } },
 *   } },
 * } }
 */
const $arrayElemLast = (inputArray: ArrayExpression) => $let({ inputArray }).in(
  $let({ length: $size('$$inputArray') }).in(
    $arrayElemAt('$$inputArray', $cond('$$length', $decrement('$$length'), 0)),
  ),
);

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
 * @param {ArrayToObjectExpression} arrayInput An array of two-element arrays
 * where the first element is the field name, and the second element is the
 * field value OR An array of documents that contains two fields, k and v where
 * k contains the field name and v contains the value of the field.
 * @returns {ArrayToObjectOperator} Returns an $arrayToObject operator populated
 * based on input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayToObject/|MongoDB reference}
 * for $arrayToObject
 * @example <caption>Key-value object</caption>
 * $arrayToObject([
 *   { k: 'item', v: 'abc123' },
 *   { k: 'qty', v: '$qty' },
 * ]);
 * @example <caption>Key-value pair</caption>
 * $arrayToObject([
 *   ['item', 'abc123'],
 *   ['qty', '$qty'],
 * ]);
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
 * @example
 * $asin($divide('$side_a', '$hyoptenuse'));
 * // returns
 * { $asin: { $divide: ['$side_a', '$hypotenuse'] } }
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
 * @example
 * $asinh('$x-coordinate');
 * // returns
 * { $asinh: '$x-coordinate' }
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
 * @example
 * $atan($divide('$side_b', '$side_a'));
 * // returns
 * { $atan: { $divide: ['$side_b', '$side_a'] } }
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
 * @example
 * $atanh('$x-coordinate');
 * // returns
 * { $atanh: '$x-coordinate' }
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
 * @example
 * $avg('$quantity');
 * // returns
 * { $avg: '$quantity' }
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
 * @example
 * $binarySize('$binary');
 * // returns
 * { $binarySize: '$binary' }
 */
const $binarySize = se('$binarySize');

/**
 * Returns the result of a bitwise and operation on an array of int or long
 * values.
 * @category Operators
 * @function
 * @param {...ObjectExpression} expressions int or long values.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitAnd/|MongoDB reference}
 * for $bitAnd
 * @example
 * $bitAnd('$myInt', '$myLong');
 * // returns
 * { $bitAnd: ['$myInt', '$myLong'] }
 */
const $bitAnd = ptafaa('$bitAnd');

/**
 * Returns the result of a bitwise not operation on a single int or long value.
 * @category Operators
 * @function
 * @param {...ObjectExpression} expressions int or long values.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitNot/|MongoDB reference}
 * for $bitAny
 * @example
 * $bitNot('$x');
 * // returns
 * { $bitNot: '$x' } 
 */
const $bitNot = se('$bitNot');

/**
 * Returns the result of a bitwise or operation on an array of int and long
 * values.
 * @category Operators
 * @function
 * @param {...ObjectExpression} expressions int or long values.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitOr/|MongoDB reference}
 * for $bitOr
 * @example
 * $bitOr('$myInt', '$myLong');
 * // returns
 * { $bitOr: ['$myInt', '$myLong'] }
 */
const $bitOr = ptafaa('$bitOr');

/**
 * Returns the result of a bitwise xor operation on an array of int and long
 * values.
 * @category Operators
 * @function
 * @param {...ObjectExpression} expressions int or long values.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitXor/|MongoDB reference}
 * for $bitXor
 * @example
 * $bitXor('$myInt', '$myLong');
 * // returns
 * { $bitXor: ['$myInt', '$myLong'] }
 */
const $bitXor = ptafaa('$bitXor');

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
 * @example
 * $bsonSize('$$ROOT');
 * // returns
 * { $bsonSize: '$$ROOT' }
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
 * @example
 * $ceil('$value');
 * // returns
 * { $ceil: '$value' }
 */
const $ceil = se('$ceil');

type CommentOperator = {
  $comment: string,
};

/**
 * Associates a comment to any expression taking a query predicate.
 * Adding a comment can make your profile data easier to interpret and trace.
 * @param {string} text Comment text
 * @returns {CommentOperator}
 */
const $comment = se('$comment');

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
 * @example
 * $cmp('$qty', 250);
 * // returns
 * { $cmp: ['$qty', 250] }
 */
const $cmp = at('$cmp');

type ConcatOperator = {
  $concat: Array<StringExpression>,
};

/**
 * Concatenates strings returning the result.
 * @category Operators
 * @function
 * @param {...StringExpression} stringParts The string parts to concatenate.
 * @returns {ConcatOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/concat/|MongoDB reference}
 * for $concat
 * @example <caption>String parts as arguments</caption>
 * $concat('$item', ' - ', '$description');
 * // returns
 * { $concat: ['$item', ' - ', '$description'] }
 * @example <caption>First argument array</caption>
 * $concat(['$item', ' - ', '$description']);
 * // returns same as above
 */
const $concat = ptafaa('$concat');

/**
 * Safely concatenates values as strings returning the result.
 * @category Safe Operators
 * @function
 * @param {...Expression | Expression[]} args The parts to concatenate.
 * @returns {ConcatOperator} A $concat operator with each operand ensured to
 * return a string.
 * @see $concat
 * @see $ensureString
 * @example <caption>String parts as arguments</caption>
 * $concatSafe('$item', ' - ', '$description');
 * // wraps each non-literal string with $ensureString
 * { $concat: [$ensureString('$item'), ' - ', $ensureString('$description')] }
 * @example <caption>First argument array</caption>
 * $concatSafe(['$item', ' - ', '$description']);
 * // returns same as above
 */
const $concatSafe = (...args: Expression[]) => {
  let parts = args;
  if (args.length && Array.isArray(args[0])) parts = args[0];
  return { $concat: parts.map((expr) => $ensureString(expr)) };
};

type ConcatArraysOperator = {
  $concatArrays: Array<ArrayExpression>,
};

/**
 * Concatenates arrays.
 * @category Operators
 * @function
 * @param {...ArrayExpression} arrays The arrays to concatenate.
 * @returns {ConcatArraysOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/concatArrays/|MongoDB reference}
 * for $concatArrays
 * @example
 * $concatArrays('$myArray', [1, 2]);
 * // returns
 * { $concatArrays: ['$myArray', [1, 2]] }
 */
const $concatArrays = pta('$concatArrays');

/**
 * Safely concatenate arrays.
 * @category Safe Operators
 * @function
 * @param {...ArrayExpression} args The arrays to concatenate.
 * @returns {ConcatArraysOperator} Returns a $concatArrays operator with each
 * operand ensured to be an array.
 * @see $concatArrays
 * @example
 * $concatArraySafe([1, 2, 3], [4, 5], '$c')
 * // returns
 * { $concatArrays: [[1, 2, 3], [4, 5], { $cond: { if: { $isArray: '$c' }, then: '$c', else: [] } }] }
 */
const $concatArraysSafe = (...args: Array<any>) => ({ $concatArrays: args.map((v) => $ensureArray(v)) });

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

enum ConversionType {
  double = 1,
  string = 2,
  objectId = 7,
  bool = 8,
  date = 9,
  int = 16,
  long = 18,
  decimal = 19,
}

type ConversionTypeExpression = ConversionType | StringExpression | NumberExpression;

type ConvertExpression = {
  input: Expression,
  to: ConversionTypeExpression,
  onError?: Expression,
  onNull?: Expression,
};

class ConvertOperator {
  public $convert: Partial<ConvertExpression> = {};
  constructor(
    input: Expression,
    to?: ConversionTypeExpression,
    onErrorOrNull?: Expression,
  ) {
    this.input(input);
    if (to) this.to(to);
    if (onErrorOrNull !== undefined) this.default(onErrorOrNull);
  }

  input(input: Expression) {
    this.$convert.input = input;
    return this;
  }

  to(type: ConversionTypeExpression) {
    this.$convert.to = type;
    return this;
  }

  onError(expression: Expression) {
    this.$convert.onError = expression;
    return this;
  }

  onNull(expression: Expression) {
    this.$convert.onNull = expression;
    return this;
  }

  default(onErrorAndNull: Expression) {
    this.onError(onErrorAndNull);
    this.onNull(onErrorAndNull);
    return this;
  }
}

/**
 * Converts a value to a specified type.
 * @category Operators
 * @function
 * @param {Expression} value The value to convert. Can be any valid expression.
 * @param {ConversionTypeExpression} toType The 
 * @param {Expression} defaultValue The result if the value to convert is null
 * or induces an error.
 * @returns {ConvertOperator} A $convert operator object populated based on
 * input with additional methods for advanced usage.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/convert/|MongoDB reference}
 * for $convert
 * @example <caption>Static notation</caption>
 * $convert('$myValue', 'int');
 * // returns
 * { $convert: { input: '$myValue', to: 'int' } }
 * @example <caption>Object notation</caption>
 * $convert('$myValue', 'int').onError(-1).onNull(0);
 * // returns
 * { $convert: { input: '$myValue', to: 'int', onError: -1, onNull: 0 } }
 */
const $convert = (value: Expression, toType?: ConversionTypeExpression, defaultValue?: Expression) => new ConvertOperator(value, toType, defaultValue);

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
 * @example
 * $cos($degreesToRadians('$angle_a'));
 * // returns
 * { $cos: { $degreesToRadians: '$angle_a' } }
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
 * @example
 * $cosh($degreesToRadians('$angle'));
 * // returns
 * { $cosh: { $degreesToRadians: '$angle' } }
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
 * @example
 * $covariancePop($year('$orderDate'), '$quantity');
 * // returns
 * { $covariancePop: [{ $year: '$orderDate' }, '$quantity'] }
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
 * @example
 * $covarianceSamp($year('$orderDate'), '$quantity');
 * // returns
 * { $covarianceSamp: [{ $year: '$orderDate' }, '$quantity'] }
 */
const $covarianceSamp = at('$covarianceSamp');

type DegreesToRadiansOperator = {
  $cosh: NumberExpression,
};

/**
 * Decrement a number by 1.
 * @category Utility Operators
 * @param {NumberExpression} value A number of any valid expression that
 * resolves to a number.
 * @returns {SubtractOperator} A $subtract operator with `1` fixed as the
 * subtrahend.
 * @example
 * $decrement('$x')
 * // returns
 * { $subtract: ['$x', 1] }
 */
const $decrement = (value: Expression) => $subtract(value, 1);

/**
 * Converts the input value measured in degrees to radians.
 * @category Operators
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {DegreesToRadiansOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/degreesToRadians/|MongoDB reference}
 * for $degreesToRadians
 * @example
 * $degreesToRadians('$angle_a');
 * // returns
 * { $degreesToRadians: '$angle_a' }
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
 * @param {NumberExpression} dividend A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} divisor A number of any valid expression that
 * resolves to a number.
 * @returns {DivideOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/|MongoDB reference}
 * for $divide
 * @example
 * $divide(9, 3);
 * // returns
 * { $divide: [9, 3 }
 */
const $divide = at('$divide');

/**
 * Safely divide one number by another. Division by zero will return the
 * `defaultValue`.
 * @category Safe Operators
 * @param {NumberExpression | null | undefined} dividend A number or any expression that resolves
 * to a number.
 * @param {NumberExpression | null | undefined} divisor A number or any expression that resolves
 * to a number.
 * @param {NumberExpression} [defaultValue] The default value if the division
 * operation cannot be performed.
 * @returns {DivideOperator} A $divide operator populated according to argument
 * input.
 * @example
 * $divideSafe('$a', '$b');
 * // returns
 * { $let: {
 *   vars: {
 *     dividend: { $ifNull: ['$a', 0] },
 *     divisor: { $ifNull: ['$b', 0] },
 *   },
 *   in: { $cond: {
 *     if: { $eq: ['$$divisor', 0] },
 *     then: 0,
 *     else: { $divide: ['$dividend', '$divisor'] },
 *   } },
 * } }
 * @example <caption>Literal input</caption>
 * $divideSafe(9, 3); // returns { $divide: [9, 3] }
 * $divideSafe(true, 3); // returns 0
 * $divideSafe(9, false); // returns 0
 * $divideSafe(9, null); // returns 0
 * $divideSafe(null, 3); // returns 0
 */
const $divideSafe = (
  dividend: NumberExpression | null | undefined | boolean,
  divisor: NumberExpression | null | undefined | boolean,
  defaultValue = '$$REMOVE',
) => {
  switch (typeof divisor) {
    case 'number':
      if (typeof dividend === 'number') return $divide(dividend, divisor);
      break;
    case 'string':
      if (divisor.match(/^[^$]/)) return 0;
      break;
    case 'boolean':
    case 'undefined':
      return 0;
    case 'object':
      if (divisor === null) return 0;
      break;
    default:
  }
  switch (typeof dividend) {
    case 'undefined':
    case 'boolean':
      return 0;
    case 'string':
      if (dividend.match(/^[^$]/)) return 0;
      break;
    case 'object':
      if (dividend === null) return 0;
      break;
    default:
  }
  return $let({
    dividend: typeof dividend === 'number' ? dividend : $ifNull(dividend, 0),
    divisor: typeof divisor === 'number' ? divisor : $ifNull(divisor, 0),
  }).in($cond($eq('$$divisor', 0), defaultValue, $divide('$$dividend', '$$divisor')));
};

type DocumentNumberOperator = {
  $documentNumber: ObjectExpression,
};

/**
 * Returns the position of a document in the $setWindowFields stage.
 * @category Operators
 * @function
 * @returns {DocumentNumberOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/documentNumber/|MongoDB reference}
 * for $documentNumber
 * @example
 * $documentNumber();
 * // returns
 * { $documentNumber: {} }
 */
const $documentNumber = ne('$documentNumber');

type EachOperator = { $each: Expression }

/**
 * Query operator. Not known to work in aggregations.
 * @function
 * @category Other Operators
 * @param {ArrayExpression} expression A valid expression that resolves to an array.
 * @returns {EachOperator} Operator with the expression embedded.
 * @deprecated Unless new information is discovered.
 */
const $each = (expression: ArrayExpression): EachOperator => ({ $each: expression });

type ElemMatchOperator = { $elemMatch: Expression };

/**
 * Matches documents that contain an array field with at least one elements
 * matching the query criteria.
 * @function
 * @category Other Operators
 * @param {ObjectExpression} query A valid expression that resolves to an array.
 * @returns {ElemMatchOperator} Operator with the expression embedded.
 * @deprecated Unless new information is discovered.
 */
const $elemMatch = (query: ObjectExpression): ElemMatchOperator => ({ $elemMatch: query });

/**
 * Ensure an expression resolves an array. Non-array values return an empty
 * array.
 * @category Utility Operators
 * @function
 * @param {Expression | null | undefined} value The value to ensure is an array.
 * @returns {Array<any>|Condition} Returns a literal array for invalid literal
 * input and a Condition for variable input.
 * @example
 * $ensureArray('$myVar');
 * // returns
 * { $let: {
 *   vars: { input: '$myVar' },
 *   in: { $cond: { if: { $isArray: '$$input' }, then: '$$input', else: [] } },
 * } }
 * @example <caption>Literal input</caption>
 * $ensureArray([1, 2, 3]); // returns [1, 2 3]
 * $ensureArray('myString'); // returns [];
 * $ensureArray(1); // returns [];
 * $ensureArray(true); // returns [];
 * $ensureArray(false); // returns [];
 * $ensureArray(undefined); // returns [];
 * $ensureArray(null); // returns [];
 */
const $ensureArray = (value: Expression | null | undefined) => {
  if (Array.isArray(value)) return value;
  switch (typeof value) {
    case 'string':
      if (value.match(/^[^$]/)) return [];
      break;
    case 'object':
      if (value === null) return [];
      break;
    case 'number':
    case 'undefined':
    case 'boolean':
      return [];
    default:
  }
    return $let({ input: value }).in($if($isArray('$$input')).then('$$input').else([]));
};

/**
 * Ensure an expression resolves a number.
 * @category Utility Operators
 * @function
 * @param {Expression | null | undefined} value The value to ensure is a number.
 * is null or induces an error.
 * @param {NumberExpression} [defaultValue] The value to return for null
 * values or when converting the input value to a double produces an error.
 * @returns {number | Condition} Returns a number of a $cond expression that
 * will convert non-numeric types to a double.
 * @example
 * $ensureNumber('$myVar');
 * // returns
 * { $cond: {
 *   if: { $in: [{ $type: '$myVar' }, ['decimal', 'int', 'double', 'long'] },
 *   then: '$myVar',
 *   else: { $convert: { input: '$myVar', to: 1, onError: 0, onNull: 0 },
 * } }
 * @example <caption>Literal input</caption>
 * $ensureNumber(123); // returns 123
 * $ensureNumber(true); // returns 1
 * $ensureNumber(false); // returns 0
 */
const $ensureNumber = (value: Expression | null | undefined, defaultValue: NumberExpression = 0) => {
  switch (typeof value) {
    case 'number': return value;
    case 'boolean': return value ? 1 : 0;
    case 'string':
      if (value.match(/^[^$]/)) return $toDouble(value);
      break;
    case 'object':
      if (value === null) return defaultValue;
      break;
    case 'undefined':
      return defaultValue;
    default:
  }
  return $let({ input: value }).in($if($isNumber('$$input')).then('$$input').else($convert('$$input', 1, defaultValue)));
};

/**
 * Ensure an expression resolves a string.
 * @category Utility Operators
 * @function
 * @param {Expression | null | undefined} value The value to ensure is of the specified type.
 * @param {StringExpression} [defaultValue] Override the default value of ""
 * if the conversion results in null or induces an error.
 * @returns {string | ConvertOperator} A literal string if the input value is a
 * literal string. Otherwise a ConvertOperator populated accordinly is returned.
 * @see $convert
 * @example
 * $ensureString('$myVariable');
 * // returns
 * { $convert: { input: '$myVariable', to: 2, onError: '', onNull: '' } },
 * @example <caption>Literal string input</caption>
 * $ensureString('literalString');
 * @example <caption>Literal number input</caption>
 * $ensureString(1); // returns "1"
 * $ensureString(1.1); // returns "1.1"
 * @example <caption>Literal boolean input</caption>
 * $ensureString(true); // returns ""
 * $ensureString(false); // return ""
 */
const $ensureString = (value: Expression | null | undefined, defaultValue: StringExpression = '') => {
  switch (typeof value) {
    case 'string':
      if (value[0] !== '$') return value;
      break;
    case 'number':
      return `${value}`;
    case 'boolean':
      return value ? 'true' :'false';
    case 'object':
      if (value === null) return defaultValue;
      break;
    case 'undefined':
      return defaultValue;
    default:
  }
  return $convert(value as Expression, ConversionType.string, defaultValue);
};

type EqOperator = {
  $eq: [Expression, Expression],
};

/**
 * Compares two values and returns `true` when the values are equivalent and
 * `false` otherwise.
 * @category Operators
 * @function
 * @param {Expression} expression1 First expression.
 * @param {Expression} expression2 Second expression.
 * @returns {EqOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/|MongoDB reference}
 * for $eq
 * @example
 * $eq('$qty', 250);
 * // returns
 * { $eq: ['$qty', 250] }
 */
const $eq = at('$eq');

type ExistsOperator = {
  $exists: boolean | Expression,
};

/**
 * Matches documents that contain or do not contain a specified field, including
 * documents where the field value is null.
 * @param {Expression} match Boolean expression.
 * @returns {ExistsOperator}
 */
const $exists = se('$exists');

type ExpOperator = {
  $exp: NumberExpression,
};

/**
 * Raises Euler's number to the specified exponent and returns the result.
 * @function
 * @category Operators
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {ExpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/|MongoDB reference}
 * for $exp
 * @example
 * $exp('$interestRate');
 * // returns
 * { $exp: '$interestRate' }
 */
const $exp = se('$exp');

type ExprOperator = {
  $expr: Expression,
};

/**
 * Allows the use of some aggregation operators otherwise unavailable to the
 * aggregation stage.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid aggregation expression.
 * @returns {ExprOperator} The compiled $expr expression.
 */
const $expr = (expression: Expression): ExprOperator => ({ $expr: expression });

type FilterExpression = {
  input: ArrayExpression,
  cond: Expression,
  as?: string,
  limit?: number,
};

class FilterOperator {
  $filter: Partial<FilterExpression> = {};
  constructor(
    inputExpr: ArrayExpression,
    asExpr?: string,
    cond?: Expression,
    limit?: number,
  ) {
    this.input(inputExpr);
    if (asExpr) this.as(asExpr);
    if (cond) this.cond(cond);
    if (limit !== undefined) this.limit(limit);
  }

  input(value: ArrayExpression) {
    this.$filter.input = value;
    return this;
  }

  as(name: string) {
    this.$filter.as = name;
    return this;
  }

  cond(expression: Expression) {
    this.$filter.cond = expression;
    return this;
  }

  limit(value: number) {
    this.$filter.limit = value;
    return this;
  }
}

/**
 * Filters an array based on the specified condition returning the items that
 * match the condition.
 * @category Operators
 * @param {ArrayExpression} inputExpr An expression that resolves to an array.
 * @param {string} [asName] Optional. A name for the value that represents each
 * element of the input array. If no name is specified, the variable name
 * defaults to `this`.
 * @param {Expression} [condExpr] An expression that resolves to boolean and can
 * references each elements of the input array with the variable name specified
 * in as().
 * @param {number} [limit] Optional. A number expression that restricts the
 * number of matching array elements to return.
 * @returns {FilterOperator} A FilterOperator
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/filter/|MongoDB reference}
 * for $filter
 * @example <caption>Static notation</caption>
 * $filter('$myArray', 'item', '$$item.sold', 10);
 * // returns
 * { $filter: { input: '$myArray', as: 'item', cond: '$$item.sold', limit: 10 } }
 * @example <caption>Object notation</caption>
 * $filter('$myArray').as('item').cond('$$item.sold').limit(10);
 * // returns same as above
 */
const $filter = (
  inputExpr: ArrayExpression,
  asName?: string,
  condExpr?: Expression,
  limit?: number,
) => new FilterOperator(inputExpr, asName, condExpr, limit);

type FindParams = [
  ArrayExpression,
  string,
  Expression,
  number?,
];

const $find = (...args: FindParams) => $arrayElemAt($filter(...args), 0);

type FirstOperator = {
  $first: Expression,
};

/**
 * Returns the result of an expression for the first document in a group of
 * documents.
 * @category Operators
 * @function
 * @param {Expression} expression Expression that resolves a value from the 
 * document.
 * @returns {FirstOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/first/|MongoDB reference}
 * for $first
 * @example
 * $first('$date');
 * // returns
 * { $first: '$date' }
 */
const $first = se('$first');

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
 * @example
 * $floor('$value');
 * // returns
 * { $floor: '$value' }
 */
const $floor = se('$floor');

// TODO
const $getField = (field: string, input: ObjectExpression|undefined = undefined) => {
  return  { $getField: input ? { field, input } : { field } };
};

// TODO
const $gt = taf('$gt');

// TODO
const $gte = taf('$gte');

/**
 * Shortcut object-notation for the $cond operation (if/then/else).
 * @category Utility Operators
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
 * @example
 * $ifNull('$myArray', []);
 * // returns
 * { $ifNull: ['$myArray', []] }
 */
const $ifNull = at('$ifNull');

/**
 * Increment a number by 1.
 * @category Utility Operators
 * @param {NumberExpression} value A number or any valid expression that
 * resolves to a number.
 * @returns {AddOperator} An $add operator with a fixed added of 1.
 * @example
 * $increment('$x')
 * // returns
 * { $add: ['$x', 1] }
 */
const $increment = (value: NumberExpression) => $add(value, 1);

// TODO
const $in = taf('$in');

// TODO
// * @category Safe Operators
const $inSafe = (...args: any[]) => {
  if (args.length === 2) {
    const [val, arr] = args;
    return $in(val, $ifNull(arr, []));
  }
  return $in(...args);
};

// TODO
// const $function

type IsArrayOperator = {
  $isArray: Expression,
};

/**
 * Determines if the operand is an array.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {IsArrayOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/isArray/|MongoDB reference}
 * for $isArray
 * @example
 * $isArray('$value');
 * // returns
 * { $isArray: '$value' }
 */
const $isArray = se('$isArray');

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
 * @example
 * $isNumber('$value');
 * // returns
 * { $isNumber: '$value' }
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
 * @example
 * $last('$myArr');
 * // return
 * { $last: '$myArray' }
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
 * @example
 * $linearFill('$price');
 * // returns
 * { $linearFill: '$price' }
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
 * @example
 * $literal(1);
 * // returns
 * { $literal: 1 }
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
 * @example
 * $locf('$price');
 * // returns
 * { $locf: '$price' }
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
 * @example
 * $log('$int', 2);
 * // returns
 * { $log: ['$int', 2] }
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
 * @example
 * $log10('$H30');
 * // returns
 * { $log10: '$H30' }
 */
const $log10 = se('$log10');

// TODO
const $lt = taf('$lt');

// TODO
const $lte = taf('$lte');

type MapExpression = {
  input: ArrayExpression,
  as: string,
  in: Expression,
};

class MapOperator {
  $map: Partial<MapExpression> = {};
  constructor(inputExpr: ArrayExpression, asName?: string, inExpr?: Expression) {
    this.input(inputExpr);
    if (asName) this.as(asName);
    if (inExpr) this.in(inExpr);
  }

  input(inputExpr: ArrayExpression) {
    this.$map.input = inputExpr;
    onlyOnce(this, 'input');
    return this;
  }

  as(name: string) {
    this.$map.as = name;
    onlyOnce(this, 'as');
    return this;
  }

  in(expression: Expression) {
    this.$map.in = expression;
    onlyOnce(this, 'in');
    return this;
  }
}

/**
 * Applies an expression to each item in an array and returns an array with the
 * results.
 * @category Operators
 * @param {ArrayExpression} inputExpr An expression that resolves to an array.
 * @param {string} [asName] A name for the variable that represents each
 * individual element of the input array.
 * @param {Expression} [inExpr] An expression that is applied to each element of
 * the input array.
 * @returns {MapOperator} A MapOperator object populated based on input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/map/|MongoDB reference}
 * for $map
 * @example <caption>Static notation</caption>
 * $map('$myArray', 'item', '$$item.name');
 * // returns
 * { $map: { input: '$myArray', as: 'item', in: '$$item.name' } }
 */
const $map = (inputExpr: ArrayExpression, asName?: string, inExpr?: Expression) => new MapOperator(inputExpr, asName, inExpr);

// TODO
const $max = taf('$max');

// TODO - $mergeObjects accepts only one arg when used an accumulator
const $mergeObjects = ptafaa('$mergeObjects');

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
 * @example
 * $meta('textScore');
 * // returns
 * { $meta: 'textScore' }
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
 * @example
 * $mod('$hours', '$tasks');
 * // returns
 * { $mod: ['$hours', '$tasks'] }
 */
const $mod = at('$mod');

type MultiplyOperator = {
  $multiply: NumberExpression[],
};

/**
 * Multiplies numbers together and returns the result.
 * @category Operators
 * @function
 * @param {...NumberExpression} expressions Any valid expression that resolves
 * to a number.
 * @returns {MultiplyOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/|MongoDB reference}
 * for $multiply
 * @example
 * $multiply(1, 2, 3, 4);
 * // returns
 * { $multiply: [1, 2, 3, 4] }
 */
const $multiply = ptafaa('$multiply');

/**
 * Safely multiply numbers together.
 * @category Safe Operators
 * @function
 * @param {...NumberExpression} expressions Any valid expression that resolves
 * to a number.
 * @returns {MultiplyOperator}
 * @see $multiply
 * @example
 * $multiplySafe('$a', 2, '$c');
 * // returns
 * { $multiply: [{ $ifNull: ['$a', 0] }, 2, { $ifNull: ['$c', 0] } }
 * @example <caption>Literal input</caption>
 * $multiplySafe(1, 2, 3, 4); // returns { $multiply: [1, 2, 3, 4] }
 * $multiplySafe(1, true); // returns 0;
 * $multiplySafe(false, 2); // returns 0;
 * $multiplySafe(null, 2); // returns 0;
 * $multiplySafe(1, undefined); // returns 0;
 */
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
 * @example
 * $ne('$qty', 250);
 * // returns
 * { $ne: ['$qty', 250] }
 */
const $ne = at('$ne');

// TODO
const $nin = taf('$nin');

// TODO
// * @category Safe Operators
const $ninSafe = (...args: any[]) => {
  if (args.length === 2) {
    const [val, arr] = args;
    return $in(val, $ifNull(arr, []));
  }
  return $in(...args);
};

type NorOperator = {
  $not: Expression,
};

/**
 * Evalutes a boolean and returns the opposite boolean value.
 * @category Operators
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {NorOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/nor/|MongoDB reference}
 * for $nor
 * @example
 * $nor('$a', '$b');
 * // returns
 * { $nor: ['$a', '$b'] }
 */
const $nor = se('$nor');

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
 * @example
 * $not('$myVar');
 * // returns
 * { $not: '$myVar' }
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
const $or = ptafaa('$or');

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

// TODO
const $reduce = (input: ObjectExpression, initialValue: Expression, inExpr: Expression) => ({
  $reduce: { input, initialValue, in: inExpr },
});

type RoundOperator = {
  $round: NumberExpression,
};

/**
 * Rounds a number to a whole integer or to a specified decimal place.
 * @category Operators
 * @function
 * @param {NumberExpression} value A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} [places] A number of any valid expression that
 * resolves to an integer between -20 and 100. Defaults to 0 if unspecified.
 * @returns {RoundOperator} A $round operator populated with argument input.
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/|MongoDB reference}
 * for $round
 * @example
 * $round(10.5) // 10
 * $round(11.5) // 12
 * $round(12.5) // 12
 * $round(13.5) // 14
 */
const $round = (value: Expression, places = 0) => ({ $round: [value, places] });

/**
 * Rounds a number to a specified decimal place.
 * @category Utility Operators
 * @function
 * @param {NumberExpression} value A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} [places] A number of any valid expression that
 * resolves to an integer between -20 and 100. Defaults to 0 if unspecified.
 * @returns {LetVarsIn} Returns an expression that rounds the value accordingly.
 * @see $round
 * @see {@link https://www.npmjs.com/package/mongo-round}
 * @see {@link https://stackoverflow.com/questions/17482623/rounding-to-2-decimal-places-using-mongodb-aggregation-framework}
 * @example <caption>Zero decimal places</caption>
 * $roundStandard('$myVal');
 * // returns
 * { $let: {
 *   input: '$myVal',
 *   in: { $let: {
 *     vars: {
 *       val: { $add: [
 *         '$$input',
 *         { $cond: { if: { $gte: ['$$input', 0] }, then: 0.5, else: -0.5 } },
 *       ] },
 *     },
 *     in: { $subtact: ['$$val', { $mod: ['$$val', 1] }] },
 *   } },
 * } }
 * @example <caption>With decimal places</caption>
 * $roundStandard('$myVal', 2);
 * // returns
 * { $let: {
 *   input: '$myVal',
 *   in: { $let: {
 *     vars: {
 *       val: { $add: [
 *         { $multiply: ['$$input', 2] },
 *         { $cond: { if: { $gte: ['$$input', 0] }, then: 0.5, else: -0.5 } },
 *       ] },
 *     },
 *     in: { $divide: [{ $subtract: ['$$val', { $mod: ['$$val', 1] }] }, 2] },
 *   } },
 * } },
 */
const $roundStandard = (value: Expression, places = 0) => {
  const expr = $let({ input: value });
  if (places) {
    const multiplier = Math.pow(10, places || 0);
    return expr.in($let({
      val: $add(
        $multiply('$$input', multiplier),
        $if($gte('$$input', 0)).then(0.5).else(-0.5),
      ),
    }).in($divide($subtract('$$val', $mod('$$val', 1)), multiplier)));
  }
  return expr.in($let({
    val: $add('$$input', $if($gte('$$input', 0)).then(0.5).else(-0.5)),
  }).in($subtract('$$val', $mod('$$val', 1))));
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
const $setField = (field: string, value: Expression, input: ObjectExpression) => ({
  $setField: { field, input, value },
});

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
 * @example
 * $size('$myArray');
 * // returns
 * { $size: '$myArray' }
 */
const $size = se('$size');

const $slice = pta('$slice');

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
 * @example
 * $split('June-15-2013', '-');
 * // returns
 * { $split: ['June-15-2013', '-'] }
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
 * @example
 * $strcasecmp('$quarter', '13q4');
 * // returns
 * { $strcasecmp: ['$quarter', '13q4'] }
 */
const $strcasecmp = at('$strcasecmp');

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
 * @example
 * $strLenBytes('cafeteria');
 * // returns
 * { $strLenBytes: 'cafeteria' }
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
 * @example
 * $strLenCP('cafeteria');
 * // returns
 * { $strLenCP: 'cafeteria' }
 */
const $strLenCP = se('$strLenCP');

type SubtractOperator = {
  $subtract: [NumberExpression, NumberExpression],
};

/**
 * Subtracts two numbers to return the difference, or two dates to return the
 * difference in milliseconds, or a date and a number in milliseconds to return
 * the resulting date.
 * @category Operators
 * @function
 * @param {NumberExpression} minuend A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression} subtrahend number of any valid expression that
 * resolves to a number.
 * @returns {SubtractOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/|MongoDB reference}
 * for $subtract
 * @example
 * $subtract('$price', '$discount');
 * // returns
 * { $subtract: ['$price', '$discount'] }
 */
const $subtract = at('$subtract');

/**
 * Safely subtract two numbers returning the difference.
 * @category Safe Operators
 * @function
 * @param {NumberExpression | null | undefined | boolean} minuend A number of any valid expression that
 * resolves to a number.
 * @param {NumberExpression | null | undefined | boolean} subtrahend number of any valid expression that
 * resolves to a number.
 * @returns {SubtractOperator | number}
 * @see $subtract
 * @example
 * $subtractSafe('$a', '$b')
 * // returns
 * { $subtract: [{ $ifNull: ['$a', 0] }, { $ifNull: ['$b', 0] }] }
 * @example <caption>Literal input</caption>
 * $subtractSafe('$a', 1); // returns { $subtract: [{ $ifNull: ['$a', 0] }, 1] }
 * $subtractSafe(3, '$b'); // returns { $subtract: [3, { $ifNull: ['$b', 0] }] }
 * $subtractSafe(3, 1); // returns { $subtract: [3, 1] }
 * $subtractSafe(true, 1); // returns { $subtract: [1, 1]
 * $subtractSafe(3, false); // returns { $subtract: [3, 0] }
 * $subtractSafe(3, undefined); // returns { $subtract: [3, 0] }
 * $subtractSafe(3, null); // returns { $subtract: [3, 0] }
 * $subtractSafe(undefined, 1); // returns { $subtract: [0, 1] }
 * $subtractSafe(null, 1); // returns { $subtract: [0, 1] }
 */
const $subtractSafe = safeNumberArgs($subtract);

const $substr = pta('$substr');
const $substrBytes = pta('$substrBytes');
const $substrCP = pta('$substrCP');

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
 * @example <caption>Single operand</caption>
 * $sum('$value');
 * // returns
 * { $sum: '$value' }
 * @todo Support array operands
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

// TODO
const $unsetField = (field: string, input: ObjectExpression) => ({
  $unsetField: { field, input },
});

// TODO
const $year = se('$year');

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
  $arrayElemFirst,
  arrayElemFirst: $arrayElemFirst,
  $arrayElemLast,
  arrayElemLast: $arrayElemLast,
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
  $bitAnd,
  bitAnd: $bitAnd,
  $bitNot,
  bitNot: $bitNot,
  $bitOr,
  bitOr: $bitOr,
  $bitXor,
  bitXor: $bitXor,
  $bsonSize,
  bsonSize: $bsonSize,
  case: branch,
  $ceil,
  ceil: $ceil,
  $changeStream,
  changeStream: $changeStream,
  $cmp,
  cmp: $cmp,
  $comment,
  comment: $comment,
  $concat,
  concat: $concat,
  $concatSafe,
  concatSafe: $concatSafe,
  $concatArrays,
  concatArrays: $concatArrays,
  $concatArraysSafe,
  concatArraysSafe: $concatArraysSafe,
  $cond,
  cond: $cond,
  $convert,
  convert: $convert,
  $cos,
  cos: $cos,
  $cosh,
  cosh: $cosh,
  $count,
  count: $count,
  $covariancePop,
  covariancePop: $covariancePop,
  $covarianceSamp,
  covarianceSamp: $covarianceSamp,
  $decrement,
  decrement: $decrement,
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
  $ensureArray,
  $each,
  each: $each,
  $elemMatch,
  elemMatch: $elemMatch,
  ensureArray: $ensureArray,
  $ensureNumber,
  ensureNumber: $ensureNumber,
  $ensureString,
  ensureString: $ensureString,
  $eq,
  eq: $eq,
  $exists,
  exists: $exists,
  $exp,
  exp: $exp,
  $expr,
  expr: $expr,
  $facet,
  facet: $facet,
  $filter,
  filter: $filter,
  $find,
  find: $find,
  $first,
  first: $first,
  $floor,
  floor: $floor,
  $group,
  group: $group,
  $getField,
  getField: $getField,
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
  $increment,
  increment: $increment,
  $inSafe,
  inSafe: $inSafe,
  $isArray,
  isArray: $isArray,
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
  $ne,
  ne: $ne,
  $nin,
  nin: $nin,
  $nor,
  nor: $nor,
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
  $reduce,
  reduce: $reduce,
  $replaceRoot,
  replaceRoot: $replaceRoot,
  $replaceWith,
  replaceWith: $replaceWith,
  $round,
  round: $round,
  $roundStandard,
  roundStandard: $roundStandard,
  $sampleRate,
  sampleRate: $sampleRate,
  $set,
  set: $set,
  $setDifference,
  setDifference: $setDifference,
  $setEquals,
  setEquals: $setEquals,
  $setField,
  setField: $setField,
  $setIntersection,
  setIntersection: $setIntersection,
  $setIsSubset,
  setIsSubset: $setIsSubset,
  $setUnion,
  setUnion: $setUnion,
  $sort,
  sort: $sort,
  $sortByCount,
  sortByCount: $sortByCount,
  $split,
  split: $split,
  $strcasecmp,
  strcasecmp: $strcasecmp,
  $substr,
  substr: $substr,
  $substrBytes,
  substrBytes: $substrBytes,
  $substrCP,
  substrCP: $substrCP,
  $subtract,
  subtract: $subtract,
  $subtractSafe,
  subtractSafe: $subtractSafe,
  $size,
  size: $size,
  $slice,
  slice: $slice,
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
  toObjectId: $toObjectId,
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
  $unsetField,
  unsetField: $unsetField,
  $unwind,
  unwind: $unwind,
  $year,
  year: $year,

  // Enums
  ChangeStreamFullDocument,
  MergeActionWhenMatched,
  MergeActionWhenNotMatched,
};
