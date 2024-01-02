/* eslint-disable max-classes-per-file */

import { nonenumerable } from "nonenumerable";

type CollectionNamespace = { collection: string };
type CollectionInfo = { namespace: CollectionNamespace };
type Collection = { s: CollectionInfo };
type MixedCollectionName = string | Collection;

const getCollectionName = (v: MixedCollectionName) => {
  if (typeof v === 'string') {
    return v;
  }
  if (v.s && v.s.namespace && typeof v.s.namespace.collection === 'string') {
    return v.s.namespace.collection;
  }
  throw new TypeError(`Invalid $lookup from parameter: ${v}`);
};

const X = {};

type ObjectExpression = { [k: string]: any };

type Expression = ObjectExpression | string | number | boolean;

enum MergeActionWhenMatched {
  Replace = 'replace',
  KeepExisting = 'keepExisting',
  Merge = 'merge',
  Fail = 'fail',
  Pipeline = 'pipeline',
};

enum MergeActionWhenNotMatched {
  Insert = 'insert',
  Discard = 'discard',
  Fail = 'fail',
};

type MergeExpression = {
  into: string,
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
    return this;
  }

  let(varsExpression: Expression) {
    this.$merge.let = varsExpression;
    return this;
  }

  whenMatched(action: MergeActionWhenMatched) {
    this.$merge.whenMatched = action;
    return this;
  }

  whenNotMatched(action: MergeActionWhenNotMatched) {
    this.$merge.whenNotMatched = action;
    return this;
  }
}

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
    // onlyOnce(this, 'then');
    return this;
  }

  else(elseExpr: Expression) {
    this.$cond.else = elseExpr;
    // onlyOnce(this, 'else');
    return this;
  }
}

class Redaction {
  $redact: Condition;

  constructor(ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) {
    this.$redact = new Condition(ifExpr, thenExpr, elseExpr);
  }

  then(thenExpr: Expression) {
    this.$redact.then(thenExpr);
    // onlyOnce(this, 'then');
    return this;
  }

  else(elseExpr: Expression) {
    this.$redact.else(elseExpr);
    // onlyOnce(this, 'else');
    return this;
  }
}

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
    return this;
  }
}

type PipelineStage = Expression;

// Allow easier syntax for conditional stages in pipeline.
const pipeline = (...args: PipelineStage[]) => args.filter((v) => v).map((v) => {
  return typeof v === 'function' ? v(v) : v;
});

type LetExpression = {
  vars: Expression,
  in: Expression,
};

class LetVarsIn {
  $let: Partial<LetExpression>;

  constructor(varsExpr: Expression, inExpr?: Expression) {
    this.$let = { vars: varsExpr };
    if (inExpr) this.in(inExpr);
  }

  in(inExpr: Expression) {
    this.$let.in = inExpr;
    // TODO
    // onlyOnce(this, 'in');
    return this;
  }
}

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
const se = (ns: string, validate?: Function) => (expr: Expression) => {
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

const safeNumberArgs = (fn: Function) => (...args: any[]) => fn(...args.map((arg) => {
  return typeof arg === 'number' ? arg : $ifNull(arg, 0);
}));

type UnwindExpression = {
  path: string;
  preserveNullAndEmptyArrays?: boolean;
  includeArrayIndex?: string;
};

/* $unwind */

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
    return this;
  }

  includeArrayIndex(value: string) {
    this.params.includeArrayIndex = value;
    return this;
  }

  toJson() {
    return
  }
}

const $unwind = (path: string, preserveNullAndEmptyArrays: boolean | undefined = undefined) => new Unwind(path, preserveNullAndEmptyArrays);

const $ifNull = at('$ifNull');
const $arrayElemAt = at('$arrayElemAt');
const $cmp = at('$cmp');
const $covariancePop = at('$covariancePop');
const $covarianceSamp = at('$covarianceSamp');
const $divide = at('$divide');
const $log = at('$log');
const $mod = at('$mod');
const $ne = at('$ne');
const $subtract = at('$subtract');
const $subtractSafe = safeNumberArgs($subtract);
const $pow = at('$pow');
const $round = at('$round');
// TODO
// const $roundStandard = round;
const $setDifference = at('$setDifference');
const $setIsSubset = at('$setIsSubset');
const $split = at('$split');
const $strcasecmp = at('$strcasecmp');
const $trunc = at('$trunc');

const $eq = taf('$eq');
const $gt = taf('$gt');
const $gte = taf('$gte');
const $lt = taf('$lt');
const $lte = taf('$lte');
const $in = taf('$in');
const $inSafe = (...args: any[]) => {
  if (args.length === 2) {
    const [val, arr] = args;
    return $in(val, $ifNull(arr, []));
  }
  return $in(...args);
};
const $max = taf('$max');
const $min = taf('$min');

const $add = pta('$add');
const $addSafe = safeNumberArgs($add);
const $all = pta('$all');
const $allElementsTrue = pta('$allElementsTrue');
const $and = pta('$and');
const $anyElementTrue = pta('$anyElementTrue');
const $concat = pta('$concat');
const $concatArrays = pta('$concatArrays');
const $or = pta('$or');
// TODO - $mergeObjects accepts only one arg when used an accumulator
const $mergeObjects = pta('$mergeObjects');
const $multiply = pta('$multiply');
const $multiplySafe = safeNumberArgs($multiply);
const $setEquals = pta('$setEquals');
const $setIntersection = pta('$setIntersection');
const $setUnion = pta('$setUnion');

const $abs = se('$abs');
const $acos = se('$acos');
const $acosh = se('$acosh');
const $arrayToObject = se('$arrayToObject');
const $avg = se('$avg');
const $asin = se('$asin');
const $asinh = se('$asinh');
const $atan = se('$atan');
const $atanh = se('$atanh');
const $binarySize = se('$binarySize');
const $bsonSize = se('$bsonSize');
const $ceil = se('$ceil');
const $cos = se('$cos');
const $cosh = se('$cosh');
const $degreesToRadians = se('$degreesToRadians');
const $exp = se('$exp');
const $expr = se('$expr');
const $each = se('$each');
const $elemMatch = se('$elemMatch');
const $floor = se('$floor');
const $isNumber = se('$isNumber');
const $last = se('$last');
const $linearFill = se('$linearFill');
const $literal = se('$literal');
const $locf = se('$locf');
const $log10 = se('$log10');
const $meta = se('$meta');
const $not = se('$not');
const $sum = se('$sum');
const $match = se('$match');
const $mul = se('$mul');
const $project = se('$project');
const $group = se('$group');
const $limit = se('$limit');
const $type = se('$type');
const $objectToArray = se('$objectToArray');
const $radiansToDegrees = se('$radiansToDegrees');
const $sampleRate = se('$sampleRate');
const $size = se('$size');
const $sin = se('$sin');
const $sinh = se('$sinh');
const $skip = se('$skip');
const $sqrt = se('$sqrt');
const $strLenBytes = se('$strLenBytes');
const $strLenCP = se('$strLenCP');
const $tan = se('$tan');
const $tanh = se('$tanh');
const $toBool = se('$toBool');
const $toDate = se('$toDate');
const $toDecimal = se('$toDecimal');
const $toDouble = se('$toDouble');
const $toInt = se('$toInt');
const $toLong = se('$toLong');
const $toObjectId = se('$toObjectId');
const $toString = se('$toString');
const $toUpper = se('$toUpper');
const $toLower = se('$toLower');
const $tsIncrement = se('$tsIncrement');
const $tsSecond = se('$tsSecond');

const $denseRank = ne('$denseRank');
const $documentNumber = ne('$documentNumber');
const $rand = ne('$rand');
const $rank = ne('$rank');

const $filter = (inputExpr: Expression, asExpr: Expression, condExpr: Expression) => ({ $filter: { input: inputExpr, as: asExpr, cond: condExpr } });
const $map = (inputExpr: Expression, asExpr: string, inExpr: Expression) => ({ $map: { input: inputExpr, as: asExpr, in: inExpr } });

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

  public constructor(from: MixedCollectionName, as: string, localField?: string, foreignField?: string) {
    this.from(from);
    this.as(as);
    if (localField) this.localField(localField);
    if (foreignField) this.foreignField(foreignField);
  }

  from(v: MixedCollectionName) {
    this.$lookup.from = getCollectionName(v);
    return this;
  }

  as(v: string) {
    this.$lookup.as = v;
    return this;
  }

  localField(v: string) {
    this.$lookup.localField = v;
    return this;
  }

  foreignField(v: string) {
    this.$lookup.foreignField = v;
    return this;
  }

  let(v: Expression) {
    this.$lookup.let = v;
    return this;
  }

  pipeline(...args: PipelineStage[]) {
    if (args.length === 1 && Array.isArray(args[0])) {
      [this.$lookup.pipeline] = args;
    } else {
      this.$lookup.pipeline = args;
    }
    return this;
  }
}
const $lookup = (from: MixedCollectionName, as: string, localField?: string, foreignField?: string) => new Lookup(from, as, localField, foreignField);
const lookup = $lookup;

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

type AddFieldsStage = { $addFields: ObjectExpression };

/**
 * $addFields Stage
 *
 * @param fieldsExpression FieldExpression
 * @returns {AddFieldsStage} 
 *
 * @stage('addFields')
 * @sample({ a: 1, b: 2 })
 * @sample({
 *   fullName: $.concat('$firstName', ' ', '$lastName'),
 *   birthDate: $.toString('$birthDate'),
 *   firstName: '$REMOVE',
 *   lastName: '$REMOVE',
 * })
 */
const $addFields = se('$addFields', validateFieldExpression);

type SetStage = { $set: ObjectExpression };

/**
 * $set Stage (alias of $addFields)
 *
 * @param fieldsExpression FieldExpression
 * @returns {SetStage} 
 *
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/|MongoDB reference}
 * for $set
 *
 * @stage('set')
 * @sample({ a: 1, b: 2 })
 * @sample({
 *   fullName: $.concat('$firstName', ' ', '$lastName'),
 *   birthDate: $.toString('$birthDate'),
 *   firstName: '$REMOVE',
 *   lastName: '$REMOVE',
 * })
 */
const $set = se('$set', validateFieldExpression);

const $push = se('$push');
const $addToSet = se('$addToSet');
const $sort = se('$sort');

/* $cond */
const $cond = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Condition(ifExpr, thenExpr, elseExpr);

const $redact = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Redaction(ifExpr, thenExpr, elseExpr);
const $let = (varsExpr: Expression, inExpr?: Expression) => new LetVarsIn(varsExpr, inExpr);

/* $switch */
const $switch = (arg1?: DefaultOrBranches, arg2?: DefaultOrBranches) => new Switch(arg1, arg2);

const $merge = (into: MixedCollectionName, onExpr: Expression) => new Merge(into, onExpr);

// Unique
const $replaceRoot = (newRoot: string) => ({ $replaceRoot: { newRoot } });
const $count = (v = {}) => ({ $count: v });

// Custom
const $if = (ifExpr: Expression) => new Condition(ifExpr);
const $divideSafe = (dividend: number | string, divisor: number | string, defaultValue = '$$REMOVE') => $let({
  dividend: typeof dividend === 'number' ? dividend : $ifNull(dividend, 0),
  divisor: typeof divisor === 'number' ? divisor : $ifNull(divisor, 0),
}).in($cond($eq('$$divisor', 0), defaultValue, $divide('$$dividend', '$$divisor')));
// }).in($if($not($eq('$$divisor', 0))).then($divide('$$dividend', '$$divisor')).else(defaultValue));

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
  $binarySize,
  binarySize: $binarySize,
  branch,
  $bsonSize,
  bsonSize: $bsonSize,
  case: branch,
  $ceil,
  ceil: $ceil,
  $cmp,
  cmp: $cmp,
  $concat,
  concat: $concat,
  $concatArrays,
  concatArrays: $concatArrays,
  $cond,
  cond: $cond,
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
  // $roundStandard,
  // roundStandard: $roundStandard,
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
  MergeActionWhenMatched,
  MergeActionWhenNotMatched,
};
