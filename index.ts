/* eslint-disable max-classes-per-file */

import { nonenumerable } from "nonenumerable";

type CollectionNamespace = { collection: string };
type CollectionInfo = { namespace: CollectionNamespace };
type Collection = { s: CollectionInfo };
type MixedCollectionName = string | Collection;

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

const getCollectionName = (v: MixedCollectionName) => {
  if (typeof v === 'string') {
    return v;
  }
  if (v.s && v.s.namespace && typeof v.s.namespace.collection === 'string') {
    return v.s.namespace.collection;
  }
  throw new TypeError(`Invalid $lookup from parameter: ${v}`);
};

type Binary<N extends number = number> = string & {
  readonly BinaryStringLength: unique symbol;
  length: N;
};

/**
 * @typedef {object} ObjectExpression
 * @property
 */
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
 * @static
 * @function
 * @param {Expression} ifExpr Any valid expression as long as it resolves to
 * a boolean.
 * @param {Expression} thenExpr Any valid expression as long as it resolves to
 * the $$DESCEND, $$PRUNE, or $$KEEP system variables.
 * @param {Expression} elseExpr Any valid expression as long as it resolves to
 * the $$DESCEND, $$PRUNE, or $$KEEP system variables.
 * @returns {Redaction}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/redact/|MongoDB reference}
 * for $redact
 */
const $redact = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Redaction(ifExpr, thenExpr, elseExpr);

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
 * @static
 * @function
 * @param {DefaultOrBranches} [arg1] Default path or array of branches.
 * @param {DefaultOrBranches} [arg2] Default path or array of branches.
 * @returns {Switch}
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
 * @static
 * @function
 * @param {string} path Field path to an array field.
 * @param {boolean} [preserveNullAndEmptyArrays] Keep or prune documents that
 * don't have at least one value in the array field.
 * @returns {Unwind}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/|MongoDB reference}
 * for $unwind
 */
const $unwind = (path: string, preserveNullAndEmptyArrays: boolean | undefined = undefined) => new Unwind(path, preserveNullAndEmptyArrays);

type IfNullOperator = {
  $ifNull: Array<Expression>,
};

/**
 * Evaluates input expressions for null values and returns the first non-null 
 * value.
 * TODO - Should support more than two args.
 * @static
 * @function
 * @param {Expression} input Input value.
 * @param {Expression} replacement Replacement value.
 * @returns {IfNullOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/|MongoDB reference}
 * for $ifNull
 */
const $ifNull = at('$ifNull');

type ArrayElemAtExpression = [Array<any>, number];

type ArrayElemAtOperator = {
  $arrayElemAt: Array<ArrayElemAtExpression>,
};

/**
 * Returns the element at the specified array index.
 * @static
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

type CmpOperator = {
  $cmp: [Expression, Expression],
};

/**
 * Compares two values.
 * @static
 * @function
 * @param {Expression} expression1 Any valid expression.
 * @param {Expression} expression2 Any valid expression.
 * @returns {CmpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/|MongoDB reference}
 * for $cmp
 */
const $cmp = at('$cmp');

type CovariancePopOperator = {
  $covariancePop: [NumberExpression, NumberExpression],
};

/**
 * Returns the population covariance of two numeric expressions that are
 * evaluated using documents in the $setWindowFields stage window.
 * @static
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
 * @static
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

type DivideOperator = {
  $divide: [NumberExpression, NumberExpression],
};

/**
 * Divides one number by another and returns the result.
 * @static
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

type LogOperator = {
  $log: [NumberExpression, NumberExpression],
};

/**
 * Calculates the log of a number in the specified base and returns the result
 * as a double.
 * @static
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

type ModOperator = {
  $mod: [NumberExpression, NumberExpression],
};

/**
 * Divides one number by another and returns the remainder.
 * @static
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

type NeOperator = {
  $ne: [Expression, Expression],
};

/**
 * Compares two values and returns true when the values are not equivalent and
 * false when the values are equivalent.
 * @static
 * @function
 * @param {Expression} expression1 Any valid expression.
 * @param {Expression} expression2 Any valid expression.
 * @returns {NeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/|MongoDB reference}
 * for $ne
 */
const $ne = at('$ne');

type SubtractOperator = {
  $subtract: [NumberExpression, NumberExpression],
};

/**
 * Subtracts two numbers to return the difference, or two dates to return the
 * difference in milliseconds, or a date and a number in milliseconds to return
 * the resulting date.
 * @static
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

type PowOperator = {
  $pow: [NumberExpression, NumberExpression],
};

/**
 * Raises a number to the specified exponent and retuns the result.
 * @static
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

type RoundOperator = {
  $round: NumberExpression,
};

/**
 * Rounds a number to a whole integer or to a specified decimal place.
 * @static
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

type SetDifferenceOperator = {
  $setDifference: [ArrayExpression, ArrayExpression],
};

/**
 * Takes two sets and returns an array containing the elements that only exist
 * in the first set.
 * @static
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

type SetIsSubsetOperator = {
  $setIsSubset: [ArrayExpression, ArrayExpression],
};

/**
 * Takes two arrays and returns true when the first array is a subset of the
 * second, including when the first array equals the second array, and false
 * otherwise.
 * @static
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

type SplitOperator = {
  $split: [StringExpression, StringExpression],
};

/**
 * Divides a string into an array of substrings based on a delimeter.
 * @static
 * @function
 * @param {StringExpression} value The string to be split.
 * @param {StringExpression} delimeter The delimeter to use.
 * @returns {SplitOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/split/|MongoDB reference}
 * for $split
 */
const $split = at('$split');

type StrcasecmpOperator = {
  $strcasecmp: [StringExpression, StringExpression],
};

/**
 * Performs case-insensitive comparison of two strings.
 * @static
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

type TruncOperator = {
  $trunc: [NumberExpression, NumberExpression],
};

/**
 * Truncates a number to a whole integer or to a specified decimal place.
 * @static
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

type AbsOperator = {
  $abs: NumberExpression,
}

/**
 * Returns the absolute value of a number.
 * @static
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
 * @static
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
 * @static
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expression that
 * @returns {AcoshOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/acosh/|MongoDB reference}
 * for $acosh
 */
const $acosh = se('$acosh');

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
 * @static
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

type AverageExpression = NumberExpression | Array<NumberExpression>;
type AverageOperator = {
  $avg: AverageExpression,
};

/**
 * Returns the average value of the numeric values ignoring non-numeric values.
 * @static
 * @function
 * @param {AverageExpression} expression Varies based on the stage it is being
 * used in. See documentation.
 * @returns {AverageOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/|MongoDB reference}
 * for $avg
 */
const $avg = se('$avg');

type AsinOperator = {
  $asin: NumberExpression,
};

/**
 * Returns the inverse sine (arc sine) of a value.
 * @static
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
 * @static
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
 * @static
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
 * @static
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number between -1 and 1.
 * @returns {AtanhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/atanh/|MongoDB reference}
 * for $atanh
 */
const $atanh = se('$atanh');

type BinarySizeOperator = {
  $binarySize: string | Binary | null,
};

/**
 * Returns the size of a given string or binary data value's content in bytes.
 * @static
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
 * @static
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
 * @static
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {CeilOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/|MongoDB reference}
 * for $ceil
 */
const $ceil = se('$ceil');

type CosOperator = {
  $cos: NumberExpression,
};

/**
 * Returns the cosine of a value that is measured in radians.
 * @static
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
 * @static
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {CoshOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cosh/|MongoDB reference}
 * for $cosh
 */
const $cosh = se('$cosh');

type DegreesToRadiansOperator = {
  $cosh: NumberExpression,
};

/**
 * Converts the input value measured in degrees to radians.
 * @static
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {DegreesToRadiansOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/degreesToRadians/|MongoDB reference}
 * for $degreesToRadians
 */
const $degreesToRadians = se('$degreesToRadians');

type ExpOperator = {
  $exp: NumberExpression,
};

/**
 * Raises Euler's number to the specified exponent and returns the result.
 * @static
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

// TODO - Determine if query components should be included
const $mul = se('$mul');

type FloorOperator = {
  $floor: NumberExpression,
};

/**
 * Returns the largest integer less than or equal to the specified number.
 * @static
 * @function
 * @param {NumberExpression} numberExpression Any valid expression that resolves
 * to a number.
 * @returns {FloorOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/|MongoDB reference}
 * for $floor
 */
const $floor = se('$floor');

// TODO
// const $function
// const $getField

type IsNumberOperator = {
  $isNumber: Expression,
};

/**
 * Checks if the specified expression resolves to a numeric BSON type.
 * @static
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
 * @static
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {LastOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/last/|MongoDB reference}
 * for $last
 */
const $last = se('$last');

type LinearFillOperator = {
  $linearFill: Expression,
};

/**
 * Fills null and missing fields in a window using linear interpolation based on
 * surrounding field values.
 * Only available in the $setWindowFields stage.
 * @static
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
 * @static
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
 * @static
 * @function
 * @param {Expression} expression A valid expression.
 * @returns {LocfOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/locf/|MongoDB reference}
 * for $locf
 */
const $locf = se('$locf');

type Log10Operator = {
  $log10: NumberExpression,
};

/**
 * Calculates the log base 10 of a number and returns the result as a double.
 * @static
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {Log10Operator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/|MongoDB reference}
 * for $log10
 */
const $log10 = se('$log10');

enum MetaDataKeyword {
  textScore,
  indexKey,
}

type MetaOperator = {
  $meta: MetaDataKeyword,
};

/**
 * Returns the metadata associated with a document when performing a search.
 * @static
 * @function
 * @param {MetaDataKeyword} metaDataKeyword
 * @returns {MetaOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/meta/|MongoDB reference}
 * for $meta
 */
const $meta = se('$meta');

type NotOperator = {
  $not: Expression,
};

/**
 * Evalutes a boolean and returns the opposite boolean value.
 * @static
 * @function
 * @param {Expression} expression Any valid expression.
 * @returns {NotOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/|MongoDB reference}
 * for $not
 */
const $not = se('$not');

type SumOperator = {
  $sum: Expression,
};

/**
 * Calculates and returns the collective sum of numeric values. Non-numeric
 * values are ignored.
 * @static
 * @function
 * @param {Expression} expression Refer to documentation.
 * @returns {SumOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/|MongoDB reference}
 * for $sum
 */
const $sum = se('$sum');

type MatchStage = {
  $match: ObjectExpression,
};

/**
 * Filters the documents to pass only the documents that match the specified
 * conditions(s) to the next pipeline stage.
 * @static
 * @function
 * @param {ObjectExpression} fieldExpression
 * @returns {MatchStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/|MongoDB reference}
 * for $match
 */
const $match = se('$match');

type ProjectStage = {
  $project: ObjectExpression,
};

/**
 * Passes along the documents with the specified fields to the next stage in
 * the pipeline.
 * @static
 * @function
 * @param {ObjectExpression} expression Refer to documentation.
 * @returns {ProjectStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/|MongoDB reference}
 * for $project
 */
const $project = se('$project');

type GroupStage = {
  $group: ObjectExpression,
};

/**
 * Separates documents into groups according to a "group key".
 * @static
 * @function
 * @param {ObjectExpression} expression Refer to documentation.
 * @returns {GroupStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/|MongoDB reference}
 * for $group
 */
const $group = se('$group');

type LimitStage = {
  $limit: number,
};

/**
 * Limits the number of documents passed to the next stage in the pipeline.
 * @static
 * @function
 * @param {number} value A positive 64bit integer.
 * @returns {LimitStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/|MongoDB reference}
 * for $limit
 */
const $limit = se('$limit');

type TypeOperator = {
  $type: Expression,
};

/**
 * Returns a string that specifies the BSON type of the argument.
 * @static
 * @function
 * @param {Expression} Any valid expression.
 * @returns {TypeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/|MongoDB reference}
 * for $type
 */
const $type = se('$type');

type ObjectToArrayOperator = {
  $objectToArray: ObjectExpression,
};

/**
 * Converts a document to an array.
 * @static
 * @function
 * @param {ObjectExpression} object Any valid expression that evaluates to an
 * expression.
 * @returns {ObjectToArrayOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/objectToArray/|MongoDB reference}
 * for $objectToArray
 */
const $objectToArray = se('$objectToArray');

type RadiansToDegreesOperator = {
  $radiansToDegrees: NumberExpression,
};

/**
 * Converts an input value measured in radians to degrees.
 * @static
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {RadiansToDegreesOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/radiansToDegrees/|MongoDB reference}
 * for $radiansToDegrees
 */
const $radiansToDegrees = se('$radiansToDegrees');

type SampleRateOperator = {
  $sampleRate: number,
};

/**
 * Matches a random selection of input documents.
 * @static
 * @function
 * @param {number} value A floating point number between 0 and 1.
 * @returns {SampleRateOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sampleRate/|MongoDB reference}
 * for $sampleRate
 */
const $sampleRate = se('$sampleRate');

type SizeOperator = {
  $size: ArrayExpression,
};

/**
 * Counts and returns the total number of items in an array.
 * @static
 * @function
 * @param {ArrayExpression} arrayExpression An array or a valid expression that
 * resolves to an array.
 * @returns {SizeOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/|MongoDB reference}
 * for $size
 */
const $size = se('$size');

type SinOperator = {
  $sin: NumberExpression,
};

/**
 * Returns the sine of a value that is measured in radians.
 * @static
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
 * @static
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {SinhOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sinh/|MongoDB reference}
 * for $sinh
 */
const $sinh = se('$sinh');

type SkipOperator = {
  $skip: number,
};

/**
 * Skips over the specified number of documents that pass into the stage and
 * passes the remaining documents to the next stage in the pipeline.
 * @static
 * @function
 * @param {number} value The number of documents to skip.
 * @returns {SkipOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/skip/|MongoDB reference}
 * for $skip
 */
const $skip = se('$skip');

type SqrtOperator = {
  $sqrt: number,
};

/**
 * Calculates the square root of a positive number and returns the result as a
 * double.
 * @static
 * @function
 * @param {NumberExpression} numberOrExpression A number or an expresison that
 * resolves to a number.
 * @returns {SqrtOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/|MongoDB reference}
 * for $sqrt
 */
const $sqrt = se('$sqrt');

type StrLenBytesOperator = {
  $strLenBytes: StringExpression,
};

/**
 * Returns the number of UTF-9 encoded bytes in the specified string.
 * @static
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
 * @static
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {StrLenCpOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenCP/|MongoDB reference}
 * for $strLenCP
 */
const $strLenCP = se('$strLenCP');

type TanOperator = {
  $tan: NumberExpression,
};

/**
 * Returns the tangent of a value that is measured in radians.
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
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
 * @static
 * @function
 * @param {StringExpression} expression A string or a valid expression that
 * resolves to a string.
 * @returns {ToLowerOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/|MongoDB reference}
 * for $toLower
 */
const $toLower = se('$toLower');

type TsIncrementOperator = {
  $tsIncrement: Expression,
};

/**
 * Returns the incrementing ordinal from a timestamp as a long.
 * @static
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
 * @static
 * @function
 * @param {Expression} expression Any valid expression that resolves to a
 * timestamp.
 * @returns {TsSecondOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsSecond/|MongoDB reference}
 * for $tsSecond
 */
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
    if (args.length === 1 && Array.isArray(args[0])) {
      [this.$lookup.pipeline] = args;
    } else {
      this.$lookup.pipeline = args;
    }
    onlyOnce(this, 'pipeline');
    return this;
  }
}
const $lookup = (from: MixedCollectionName, as: string, localField?: string, foreignField?: string) => new Lookup(from, as, localField, foreignField);

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
 * Adds new fields to documents.
 * @static
 * @function
 * @param {ObjectExpression} expression Specify the name of each field to add
 * and set its value to an aggregation expression or an empty object.
 * @returns {AddFieldsStage} 
 * @example
 * $addFields({ fullName: $.concat('$firstName', ' ', '$lastName') });
 * // returns { $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/|MongoDB reference}
 * for $addFields
 */
const $addFields = se('$addFields', validateFieldExpression);

type SetStage = { $set: ObjectExpression };

/**
 * Adds new fields to documents. (alias of $addFields)
 * @static
 * @function
 * @param {ObjectExpression} expression Specify the name of each field to add
 * and set its value to an aggregation expression or an empty object.
 * @returns {SetStage} 
 * @example
 * $set({ fullName: $.concat('$firstName', ' ', '$lastName') });
 * // returns { $set: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/|MongoDB reference}
 */
const $set = se('$set', validateFieldExpression);

type PushOperator = {
  $push: Expression,
};

/**
 * Returns an array of all values that result from applying an expression to
 * documents.
 * @static
 * @function
 * @param expression Expression
 * @param {Expression} expression A valid expression.
 * @returns {PushOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/push/|MongoDB reference}
 * for $push
 */
const $push = se('$push');

type AddToSetOperator = {
  $addToSet: Expression,
};

/**
 * Returns an array of all unique values that results from applying an
 * expression to each document in a group.
 * @static
 * @function
 * @param {Expression} expression A valid expression.
 * @returns {AddToSetOperator}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/addToSet/|MongoDB reference}
 * for $addToSet
 */
const $addToSet = se('$addToSet');

type SortStage = {
  $sort: ObjectExpression,
};

/**
 * Sorts all input documents and returns them to the pipeline in sorted order.
 * @static
 * @function
 * @param {Expression} expression Refer to documentation.
 * @returns {SortStage}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/|MongoDB reference}
 * for $sort
 */
const $sort = se('$sort');

/**
 * Evaluates a boolean expression to return one of the two specified return
 * expressions.
 * @static
 * @function
 * @param {Expression} ifExpr A boolean expression.
 * @param {Expression} [thenExpr] The true case.
 * @param {Expression} [elseExpr] The false case.
 * @returns {Condition}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/|MongoDB reference}
 * for $cond
 */
const $cond = (ifExpr: Expression, thenExpr?: Expression, elseExpr?: Expression) => new Condition(ifExpr, thenExpr, elseExpr);

/**
 * Binds variables for use in the specified expression and returns the result of
 * the expression.
 * @static
 * @function
 * @param {Expression} varsExpr Assign for the variables accessible in the in
 * expression.
 * @param {Expression} [inExpr] The expression to evaluate.
 * @returns {LetVarsIn}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/let/|MongoDB reference}
 * for $let
 */
const $let = (varsExpr?: Expression, inExpr?: Expression) => new LetVarsIn(varsExpr, inExpr);

const $merge = (into: MixedCollectionName, onExpr?: Expression) => new Merge(into, onExpr);

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
  MergeActionWhenMatched,
  MergeActionWhenNotMatched,
};
