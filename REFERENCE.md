# MongoDB PipelineJS - API Reference

_[&laquo; View README](./README.md)_

## Functions

<dl>
<dt><a href="#$redact">$redact(expression)</a> ⇒ <code>Redaction</code></dt>
<dd><p>Restricts entire documents or content within documents from being outputted
based on information stored in the documents themselves.</p></dd>
<dt><a href="#$switch">$switch([arg1], [arg2])</a> ⇒ <code>Switch</code></dt>
<dd><p>Evaluates a series of case expressions. When it finds an expression which
evaluates to true, $switch executes a specified expression and breaks out of
the control flow.</p></dd>
<dt><a href="#_class6">_class6(path, [preserveNullAndEmptyArrays])</a> ⇒ <code>Unwind</code></dt>
<dd><p>Deconstructs an array field from the input documents to output a document
for each element.</p></dd>
<dt><a href="#$ifNull">$ifNull(input, replacement)</a> ⇒ <code>IfNullOperator</code></dt>
<dd><p>Evaluates input expressions for null values and returns the first non-null
value.</p>
<p>TODO - Should support more than two args.</p></dd>
<dt><a href="#$arrayElemAt">$arrayElemAt(arrayExpression, index)</a> ⇒ <code>ArrayElemAtOperator</code></dt>
<dd><p>Returns the element at the specified array index.</p></dd>
<dt><a href="#$cmp">$cmp(expression1, expression2)</a> ⇒ <code>CmpOperator</code></dt>
<dd><p>Compares two values.</p></dd>
<dt><a href="#$covariancePop">$covariancePop(expression1, expression2)</a> ⇒ <code>CovariancePopOperator</code></dt>
<dd><p>Returns the population covariance of two numeric expressions that are
evaluated using documents in the $setWindowFields stage window.</p></dd>
<dt><a href="#$covarianceSamp">$covarianceSamp(expression1, expression2)</a> ⇒ <code>CovarianceSampOperator</code></dt>
<dd><p>Returns the sample covariance of two numeric expressions that are evaluated
using documents in the $setWindowFields stage window.</p>
<p>Non-numeric, null and missing fields are ignored.</p></dd>
<dt><a href="#$divide">$divide(expression1, expression2)</a> ⇒ <code>DivideOperator</code></dt>
<dd><p>Divides one number by another and returns the result.</p></dd>
<dt><a href="#$log">$log(expression1, expression2)</a> ⇒ <code>LogOperator</code></dt>
<dd><p>Calculates the log of a number in the specified base and returns the result
as a double.</p></dd>
<dt><a href="#$mod">$mod(expression1, expression2)</a> ⇒ <code>ModOperator</code></dt>
<dd><p>Divides one number by another and returns the remainder.</p></dd>
<dt><a href="#$ne">$ne(expression1, expression2)</a> ⇒ <code>NeOperator</code></dt>
<dd><p>Compares two values and returns true when the values are not equivalent and
false when the values are equivalent.</p></dd>
<dt><a href="#$subtract">$subtract(expression1, expression2)</a> ⇒ <code>SubtractOperator</code></dt>
<dd><p>Subtracts two numbers to return the difference, or two dates to return the
difference in milliseconds, or a date and a number in milliseconds to return
the resulting date.</p></dd>
<dt><a href="#$pow">$pow(expression1, expression2)</a> ⇒ <code>PowOperator</code></dt>
<dd><p>Raises a number to the specified exponent and retuns the result.</p></dd>
<dt><a href="#$round">$round(expression1, expression2)</a> ⇒ <code>RoundOperator</code></dt>
<dd><p>Rounds a number to a whole integer or to a specified decimal place.</p></dd>
<dt><a href="#$setDifference">$setDifference(expression1, expression2)</a> ⇒ <code>SetDifferenceOperator</code></dt>
<dd><p>Takes two sets and returns an array containing the elements that only exist
in the first set.</p></dd>
<dt><a href="#$setIsSubset">$setIsSubset(expression1, expression2)</a> ⇒ <code>SetIsSubsetOperator</code></dt>
<dd><p>Takes two arrays and returns true when the first array is a subset of the
second, including when the first array equals the second array, and false
otherwise.</p></dd>
<dt><a href="#$split">$split(value, delimeter)</a> ⇒ <code>SplitOperator</code></dt>
<dd><p>Divides a string into an array of substrings based on a delimeter.</p></dd>
<dt><a href="#$strcasecmp">$strcasecmp(exression1, exression2)</a> ⇒ <code>StrcasecmpOperator</code></dt>
<dd><p>Performs case-insensitive comparison of two strings.</p></dd>
<dt><a href="#$trunc">$trunc(expression1, expression2)</a> ⇒ <code>TruncOperator</code></dt>
<dd><p>Truncates a number to a whole integer or to a specified decimal place.</p></dd>
<dt><a href="#$abs">$abs(numberOrExpression)</a> ⇒ <code>AbsOperator</code></dt>
<dd><p>Returns the absolute value of a number.</p></dd>
<dt><a href="#$acos">$acos(numberOrExpression)</a> ⇒ <code>AcosOperator</code></dt>
<dd><p>Returns the inverse cosine (arc cosine) of a value.</p></dd>
<dt><a href="#$acosh">$acosh(numberOrExpression)</a> ⇒ <code>AcoshOperator</code></dt>
<dd><p>Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value.</p></dd>
<dt><a href="#$arrayToObject">$arrayToObject(expression)</a> ⇒ <code>ArrayToObjectOperator</code></dt>
<dd><p>Converts an array into a single document.</p></dd>
<dt><a href="#$avg">$avg(expression)</a> ⇒ <code>AverageOperator</code></dt>
<dd><p>Returns the average value of the numeric values ignoring non-numeric values.</p></dd>
<dt><a href="#$asin">$asin(numberExpression)</a> ⇒ <code>AsinOperator</code></dt>
<dd><p>Returns the inverse sine (arc sine) of a value.</p></dd>
<dt><a href="#$asinh">$asinh(numberExpression)</a> ⇒ <code>AsinhOperator</code></dt>
<dd><p>Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value.</p></dd>
<dt><a href="#$atan">$atan(numberExpression)</a> ⇒ <code>AtanOperator</code></dt>
<dd><p>Returns the inverse tangent (arc tangent) of a value.</p></dd>
<dt><a href="#$atanh">$atanh(numberExpression)</a> ⇒ <code>AtanhOperator</code></dt>
<dd><p>Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value.</p></dd>
<dt><a href="#$binarySize">$binarySize(mixedInput)</a> ⇒ <code>BinarySizeOperator</code></dt>
<dd><p>Returns the size of a given string or binary data value's content in bytes.</p></dd>
<dt><a href="#$bsonSize">$bsonSize(expression)</a> ⇒ <code>BsonSizeOperator</code></dt>
<dd><p>Returns the size in bytes of a given document when encoded as BSON.</p></dd>
<dt><a href="#$ceil">$ceil(numberExpression)</a> ⇒ <code>CeilOperator</code></dt>
<dd><p>Returns the smallest integer greater than or equal to the specified number.</p></dd>
<dt><a href="#$cos">$cos(numberExpression)</a> ⇒ <code>CosOperator</code></dt>
<dd><p>Returns the cosine of a value that is measured in radians.</p></dd>
<dt><a href="#$cosh">$cosh(numberExpression)</a> ⇒ <code>CoshOperator</code></dt>
<dd><p>Returns the hyperbolic cosine of a value that is measured in radians.</p></dd>
<dt><a href="#$degreesToRadians">$degreesToRadians(numberExpression)</a> ⇒ <code>DegreesToRadiansOperator</code></dt>
<dd><p>Converts the input value measured in degrees to radians.</p></dd>
<dt><a href="#$exp">$exp(numberExpression)</a> ⇒ <code>ExpOperator</code></dt>
<dd><p>Raises Euler's number to the specified exponent and returns the result.</p></dd>
<dt><a href="#$floor">$floor(numberExpression)</a> ⇒ <code>FloorOperator</code></dt>
<dd><p>Returns the largest integer less than or equal to the specified number.</p></dd>
<dt><a href="#$isNumber">$isNumber(expression)</a> ⇒ <code>IsNumberOperator</code></dt>
<dd><p>Checks if the specified expression resolves to a numeric BSON type.</p></dd>
<dt><a href="#$last">$last(expression)</a> ⇒ <code>LastOperator</code></dt>
<dd><p>Returns the result of an expression of the last document in a group of
documents. Only meaningful when documents are in a defined order.</p></dd>
<dt><a href="#$linearFill">$linearFill(expression)</a> ⇒ <code>LinearFillOperator</code></dt>
<dd><p>Fills null and missing fields in a window using linear interpolation based on
surrounding field values.</p>
<p>Only available in the $setWindowFields stage.</p></dd>
<dt><a href="#$literal">$literal(value)</a> ⇒ <code>LiteralOperator</code></dt>
<dd><p>Returns a value without parsing. Use for values that the aggregation pipeline
may interpret as an expression.</p></dd>
<dt><a href="#$locf">$locf(expression)</a> ⇒ <code>LocfOperator</code></dt>
<dd><p>Last observation carried forward. Sets values for null and missing fields in
a window to the last non-null value for the field.</p>
<p>Only available in the $setWindowFields stage.</p></dd>
<dt><a href="#$log10">$log10(numberOrExpression)</a> ⇒ <code>Log10Operator</code></dt>
<dd><p>Calculates the log base 10 of a number and returns the result as a double.</p></dd>
<dt><a href="#$meta">$meta(metaDataKeyword)</a> ⇒ <code>MetaOperator</code></dt>
<dd><p>Returns the metadata associated with a document when performing a search.</p></dd>
<dt><a href="#$not">$not(expression)</a> ⇒ <code>NotOperator</code></dt>
<dd><p>Evalutes a boolean and returns the opposite boolean value.</p></dd>
<dt><a href="#$sum">$sum(expression)</a> ⇒ <code>SumOperator</code></dt>
<dd><p>Calculates and returns the collective sum of numeric values. Non-numeric
values are ignored.</p></dd>
<dt><a href="#$match">$match(fieldExpression)</a> ⇒ <code>MatchStage</code></dt>
<dd><p>Filters the documents to pass only the documents that match the specified
conditions(s) to the next pipeline stage.</p></dd>
<dt><a href="#$project">$project(expression)</a> ⇒ <code>ProjectStage</code></dt>
<dd><p>Passes along the documents with the specified fields to the next stage in
the pipeline.</p></dd>
<dt><a href="#$group">$group(expression)</a> ⇒ <code>GroupStage</code></dt>
<dd><p>Separates documents into groups according to a &quot;group key&quot;.</p></dd>
<dt><a href="#$limit">$limit(value)</a> ⇒ <code>LimitOperator</code></dt>
<dd><p>Limits the number of documents passed to the next stage in the pipeline.</p></dd>
<dt><a href="#$type">$type(Any)</a> ⇒ <code>TypeOperator</code></dt>
<dd><p>Returns a string that specifies the BSON type of the argument.</p></dd>
<dt><a href="#$objectToArray">$objectToArray(object)</a> ⇒ <code>ObjectToArrayOperator</code></dt>
<dd><p>Converts a document to an array.</p></dd>
<dt><a href="#$radiansToDegrees">$radiansToDegrees(numberOrExpression)</a> ⇒ <code>RadiansToDegreesOperator</code></dt>
<dd><p>Converts an input value measured in radians to degrees.</p></dd>
<dt><a href="#$sampleRate">$sampleRate(value)</a> ⇒ <code>SampleRateOperator</code></dt>
<dd><p>Matches a random selection of input documents.</p></dd>
<dt><a href="#$size">$size(arrayExpression)</a> ⇒ <code>SizeOperator</code></dt>
<dd><p>Counts and returns the total number of items in an array.</p></dd>
<dt><a href="#$sin">$sin(numberOrExpression)</a> ⇒ <code>SinOperator</code></dt>
<dd><p>Returns the sine of a value that is measured in radians.</p></dd>
<dt><a href="#$sinh">$sinh(numberOrExpression)</a> ⇒ <code>SinhOperator</code></dt>
<dd><p>Returns the hyperbolic sine of a value that is measured in radians.</p></dd>
<dt><a href="#$skip">$skip(value)</a> ⇒ <code>SkipOperator</code></dt>
<dd><p>Skips over the specified number of documents that pass into the stage and
passes the remaining documents to the next stage in the pipeline.</p></dd>
<dt><a href="#$sqrt">$sqrt(numberOrExpression)</a> ⇒ <code>SqrtOperator</code></dt>
<dd><p>Calculates the square root of a positive number and returns the result as a
double.</p></dd>
<dt><a href="#$strLenBytes">$strLenBytes(expression)</a> ⇒ <code>StrLenBytesOperator</code></dt>
<dd><p>Returns the number of UTF-9 encoded bytes in the specified string.</p></dd>
<dt><a href="#$strLenCP">$strLenCP(expression)</a> ⇒ <code>StrLenCpOperator</code></dt>
<dd><p>Returns the number of UTF-8 code pints in the specified string.</p></dd>
<dt><a href="#$tan">$tan(numberOrExpression)</a> ⇒ <code>TanOperator</code></dt>
<dd><p>Returns the tangent of a value that is measured in radians.</p></dd>
<dt><a href="#$tanh">$tanh(numberOrExpression)</a> ⇒ <code>TanhOperator</code></dt>
<dd><p>Returns the hyperbolic tangent of a value that is measured in radians.</p></dd>
<dt><a href="#$toBool">$toBool(expression)</a> ⇒ <code>ToBoolOperator</code></dt>
<dd><p>Converts a value to a boolean.</p></dd>
<dt><a href="#$toDate">$toDate(expression)</a> ⇒ <code>ToDateOperator</code></dt>
<dd><p>Converts a value to a date. Will produce an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toDecimal">$toDecimal(expression)</a> ⇒ <code>ToDecimalOperator</code></dt>
<dd><p>Converts a value to a decimal. Throws an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toDouble">$toDouble(expression)</a> ⇒ <code>ToDoubleOperator</code></dt>
<dd><p>Converts a value to a double. Throws an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toInt">$toInt(expression)</a> ⇒ <code>ToIntOperator</code></dt>
<dd><p>Converts a value to an integer. Throws an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toLong">$toLong(expression)</a> ⇒ <code>ToLongOperator</code></dt>
<dd><p>Converts a value to a long. Throws an error if the value cannot be converted.</p></dd>
<dt><a href="#$toObjectId">$toObjectId(expression)</a> ⇒ <code>ToObjectIdOperator</code></dt>
<dd><p>Converts a value to an ObjectId. Throws an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toString">$toString(expression)</a> ⇒ <code>ToStringOperator</code></dt>
<dd><p>Converts a value to a string. Throws an error if the value cannot be
converted.</p></dd>
<dt><a href="#$toUpper">$toUpper(expression)</a> ⇒ <code>ToUpperOperator</code></dt>
<dd><p>Returns a string converts to uppercase.</p></dd>
<dt><a href="#$toLower">$toLower(expression)</a> ⇒ <code>ToLowerOperator</code></dt>
<dd><p>Returns a string converted to lowercase.</p></dd>
<dt><a href="#$tsIncrement">$tsIncrement(expression)</a> ⇒ <code>TsIncrementOperator</code></dt>
<dd><p>Returns the incrementing ordinal from a timestamp as a long.</p></dd>
<dt><a href="#$tsSecond">$tsSecond(expression)</a> ⇒ <code>TsSecondOperator</code></dt>
<dd><p>Returns the seconds from a timestamp as a long.</p></dd>
<dt><a href="#$addFields">$addFields(expression)</a> ⇒ <code>AddFieldsStage</code></dt>
<dd><p>Adds new fields to documents.</p></dd>
<dt><a href="#$set">$set(expression)</a> ⇒ <code>SetStage</code></dt>
<dd><p>Adds new fields to documents. (alias of $addFields)</p></dd>
<dt><a href="#$push">$push(expression, expression)</a> ⇒ <code>PushOperator</code></dt>
<dd><p>Returns an array of all values that result from applying an expression to
documents.</p></dd>
<dt><a href="#$addToSet">$addToSet(expression)</a> ⇒ <code>AddToSetOperator</code></dt>
<dd><p>Returns an array of all unique values that results from applying an
expression to each document in a group.</p></dd>
<dt><a href="#$sort">$sort(expression)</a> ⇒ <code>SortStage</code></dt>
<dd><p>Sorts all input documents and returns them to the pipeline in sorted order.</p></dd>
<dt><a href="#$cond">$cond(ifExpr, [thenExpr], [elseExpr])</a> ⇒ <code>Condition</code></dt>
<dd><p>Evaluates a boolean expression to return one of the two specified return
expressions.</p></dd>
<dt><a href="#$let">$let(varsExpr, [inExpr])</a> ⇒ <code>LetVarsIn</code></dt>
<dd><p>Binds variables for use in the specified expression and returns the result of
the expression.</p></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ObjectExpression">ObjectExpression</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Expression">Expression</a> : <code><a href="#ObjectExpression">ObjectExpression</a></code> | <code>string</code> | <code>number</code> | <code>boolean</code> | <code>null</code></dt>
<dd><p>A valid expression, string, number, boolean or null.</p></dd>
<dt><a href="#NumberExpression">NumberExpression</a> : <code><a href="#ObjectExpression">ObjectExpression</a></code> | <code>number</code></dt>
<dd><p>A number or any valid expression that resolves to a number.</p></dd>
<dt><a href="#ArrayExpression">ArrayExpression</a> : <code><a href="#ObjectExpression">ObjectExpression</a></code> | <code>Array.&lt;any&gt;</code></dt>
<dd><p>An array or any valid expression that resolves to an array.</p></dd>
<dt><a href="#StringExpression">StringExpression</a> : <code><a href="#ObjectExpression">ObjectExpression</a></code> | <code>string</code></dt>
<dd><p>A string or any valid expression that resolves to a string.</p></dd>
<dt><a href="#MergeActionWhenMatched">MergeActionWhenMatched</a> : <code>string</code></dt>
<dd><p>Enumeration of: Replace (replace), KeepExisting (keepExisting), Merge
(merge), Fail (fail) and Pipeline (pipeline).</p></dd>
<dt><a href="#MergeActionWhenNotMatched">MergeActionWhenNotMatched</a> : <code>string</code></dt>
<dd><p>Enumeration of: Insert (insert), Discard (discard) or Fail
(fail).</p></dd>
<dt><a href="#DefaultOrBranches">DefaultOrBranches</a> : <code><a href="#Expression">Expression</a></code> | <code>Array.&lt;Branch&gt;</code></dt>
<dd></dd>
</dl>

<a name="$redact"></a>

## $redact(expression) ⇒ <code>Redaction</code>
<p>Restricts entire documents or content within documents from being outputted
based on information stored in the documents themselves.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/redact/)
for $redact  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression as long as it resolves to the $$DESCEND, $$PRUNE, or $$KEEP system variables.</p> |

<a name="$switch"></a>

## $switch([arg1], [arg2]) ⇒ <code>Switch</code>
<p>Evaluates a series of case expressions. When it finds an expression which
evaluates to true, $switch executes a specified expression and breaks out of
the control flow.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/switch/)
for $switch  

| Param | Type | Description |
| --- | --- | --- |
| [arg1] | [<code>DefaultOrBranches</code>](#DefaultOrBranches) | <p>Default path or array of branches.</p> |
| [arg2] | [<code>DefaultOrBranches</code>](#DefaultOrBranches) | <p>Default path or array of branches.</p> |

**Example** *(Static Notation)*  
```js
$switch('$$PRUNE', [
  $case('$user.isAdministrator', '$$KEEP'),
  $case('$document.hasMore', '$$DESCEND'),
]);
```
**Example** *(With arguments inverted)*  
```js
$switch([
  $case('$user.isAdministrator', '$$KEEP'),
  $case('$document.hasMore', '$$DESCEND'),
], '$$PRUNE');
```
**Example** *(Object notation)*  
```js
$switch()
 .case('$user.isAdministor', '$$KEEP')
 .case('$document.hasMore', '$$DESCEND')
 .default('$$PRUNE');
```
**Example** *(Hybrid Notation)*  
```js
$switch('$$PRUNE')
 .case('$user.isAdministor', '$$KEEP')
 .case('$document.hasMore', '$$DESCEND');
```
**Example** *(Return value of all above examples)*  
```js
{
  $switch: {
    branches: [
      { cond: '$user.isAdministrator', then: '$$KEEP' },
      { cond: '$document.hasMore', then: '$$DESCEND' },
    ],
    default: '$$PRUNE',
  },
}
```
<a name="_class6"></a>

## \_class6(path, [preserveNullAndEmptyArrays]) ⇒ <code>Unwind</code>
<p>Deconstructs an array field from the input documents to output a document
for each element.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)
for $unwind  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | <p>Field path to an array field.</p> |
| [preserveNullAndEmptyArrays] | <code>boolean</code> | <p>Keep or prune documents that don't have at least one value in the array field.</p> |

<a name="$ifNull"></a>

## $ifNull(input, replacement) ⇒ <code>IfNullOperator</code>
<p>Evaluates input expressions for null values and returns the first non-null
value.</p>
<p>TODO - Should support more than two args.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/)
for $ifNull  

| Param | Type | Description |
| --- | --- | --- |
| input | [<code>Expression</code>](#Expression) | <p>Input value.</p> |
| replacement | [<code>Expression</code>](#Expression) | <p>Replacement value.</p> |

<a name="$arrayElemAt"></a>

## $arrayElemAt(arrayExpression, index) ⇒ <code>ArrayElemAtOperator</code>
<p>Returns the element at the specified array index.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayElemAt/)
for $arrayElemAt  

| Param | Type | Description |
| --- | --- | --- |
| arrayExpression | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |
| index | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$cmp"></a>

## $cmp(expression1, expression2) ⇒ <code>CmpOperator</code>
<p>Compares two values.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/)
for $cmp  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |
| expression2 | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$covariancePop"></a>

## $covariancePop(expression1, expression2) ⇒ <code>CovariancePopOperator</code>
<p>Returns the population covariance of two numeric expressions that are
evaluated using documents in the $setWindowFields stage window.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/covariancePop/)
for $covariancePop  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$covarianceSamp"></a>

## $covarianceSamp(expression1, expression2) ⇒ <code>CovarianceSampOperator</code>
<p>Returns the sample covariance of two numeric expressions that are evaluated
using documents in the $setWindowFields stage window.</p>
<p>Non-numeric, null and missing fields are ignored.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/covarianceSamp/)
for $covarianceSamp  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$divide"></a>

## $divide(expression1, expression2) ⇒ <code>DivideOperator</code>
<p>Divides one number by another and returns the result.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/)
for $divide  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$log"></a>

## $log(expression1, expression2) ⇒ <code>LogOperator</code>
<p>Calculates the log of a number in the specified base and returns the result
as a double.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/)
for $log  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a non-negative number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a positive number greater than 1.</p> |

<a name="$mod"></a>

## $mod(expression1, expression2) ⇒ <code>ModOperator</code>
<p>Divides one number by another and returns the remainder.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/)
for $mod  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$ne"></a>

## $ne(expression1, expression2) ⇒ <code>NeOperator</code>
<p>Compares two values and returns true when the values are not equivalent and
false when the values are equivalent.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/)
for $ne  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |
| expression2 | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$subtract"></a>

## $subtract(expression1, expression2) ⇒ <code>SubtractOperator</code>
<p>Subtracts two numbers to return the difference, or two dates to return the
difference in milliseconds, or a date and a number in milliseconds to return
the resulting date.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/)
for $subtract  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$pow"></a>

## $pow(expression1, expression2) ⇒ <code>PowOperator</code>
<p>Raises a number to the specified exponent and retuns the result.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/)
for $pow  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |

<a name="$round"></a>

## $round(expression1, expression2) ⇒ <code>RoundOperator</code>
<p>Rounds a number to a whole integer or to a specified decimal place.</p>

**Kind**: global function  
**Sample**: $round(10.5) // 10
$round(11.5) // 12
$round(12.5) // 12
$round(13.5) // 14  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/)
for $round  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to an integer between -20 and 100. Defaults to 0 if unspecified.</p> |

<a name="$setDifference"></a>

## $setDifference(expression1, expression2) ⇒ <code>SetDifferenceOperator</code>
<p>Takes two sets and returns an array containing the elements that only exist
in the first set.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setDifference/)
for $setDifference  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |
| expression2 | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |

<a name="$setIsSubset"></a>

## $setIsSubset(expression1, expression2) ⇒ <code>SetIsSubsetOperator</code>
<p>Takes two arrays and returns true when the first array is a subset of the
second, including when the first array equals the second array, and false
otherwise.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setIsSubset/)
for $setIsSubset  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |
| expression2 | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |

<a name="$split"></a>

## $split(value, delimeter) ⇒ <code>SplitOperator</code>
<p>Divides a string into an array of substrings based on a delimeter.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/split/)
for $split  

| Param | Type | Description |
| --- | --- | --- |
| value | [<code>StringExpression</code>](#StringExpression) | <p>The string to be split.</p> |
| delimeter | [<code>StringExpression</code>](#StringExpression) | <p>The delimeter to use.</p> |

<a name="$strcasecmp"></a>

## $strcasecmp(exression1, exression2) ⇒ <code>StrcasecmpOperator</code>
<p>Performs case-insensitive comparison of two strings.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strcasecmp/)
for $strcasecmp  

| Param | Type | Description |
| --- | --- | --- |
| exression1 | [<code>StringExpression</code>](#StringExpression) | <p>A string or any valid expression that resolves to a string.</p> |
| exression2 | [<code>StringExpression</code>](#StringExpression) | <p>A string or any valid expression that resolves to a string.</p> |

<a name="$trunc"></a>

## $trunc(expression1, expression2) ⇒ <code>TruncOperator</code>
<p>Truncates a number to a whole integer or to a specified decimal place.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/)
for $trunc  

| Param | Type | Description |
| --- | --- | --- |
| expression1 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to a number.</p> |
| expression2 | [<code>NumberExpression</code>](#NumberExpression) | <p>A number of any valid expression that resolves to an integer between -20 and 100. Defaults to 0 if unspecified.</p> |

<a name="$abs"></a>

## $abs(numberOrExpression) ⇒ <code>AbsOperator</code>
<p>Returns the absolute value of a number.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/)
for $abs  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$acos"></a>

## $acos(numberOrExpression) ⇒ <code>AcosOperator</code>
<p>Returns the inverse cosine (arc cosine) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/acos/)
for $acos  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expression that resolves to a number.</p> |

<a name="$acosh"></a>

## $acosh(numberOrExpression) ⇒ <code>AcoshOperator</code>
<p>Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/acosh/)
for $acosh  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expression that</p> |

<a name="$arrayToObject"></a>

## $arrayToObject(expression) ⇒ <code>ArrayToObjectOperator</code>
<p>Converts an array into a single document.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayToObject/)
for $arrayToObject  

| Param | Type | Description |
| --- | --- | --- |
| expression | <code>ArrayToObjectExpression</code> | <p>An array of two-element arrays where the first element is the field name, and the second element is the field value OR An array of documents that contains two fields, k and v where k contains the field name and v contains the value of the field.</p> |

<a name="$avg"></a>

## $avg(expression) ⇒ <code>AverageOperator</code>
<p>Returns the average value of the numeric values ignoring non-numeric values.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/)
for $avg  

| Param | Type | Description |
| --- | --- | --- |
| expression | <code>AverageExpression</code> | <p>Varies based on the stage it is being used in. See documentation.</p> |

<a name="$asin"></a>

## $asin(numberExpression) ⇒ <code>AsinOperator</code>
<p>Returns the inverse sine (arc sine) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/asin/)
for $asin  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number between -1 and 1.</p> |

<a name="$asinh"></a>

## $asinh(numberExpression) ⇒ <code>AsinhOperator</code>
<p>Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/asinh/)
for $asinh  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$atan"></a>

## $atan(numberExpression) ⇒ <code>AtanOperator</code>
<p>Returns the inverse tangent (arc tangent) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/atan/)
for $atan  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$atanh"></a>

## $atanh(numberExpression) ⇒ <code>AtanhOperator</code>
<p>Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/atanh/)
for $atanh  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number between -1 and 1.</p> |

<a name="$binarySize"></a>

## $binarySize(mixedInput) ⇒ <code>BinarySizeOperator</code>
<p>Returns the size of a given string or binary data value's content in bytes.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/binarySize/)
for $binarySize  

| Param | Type | Description |
| --- | --- | --- |
| mixedInput | <code>string</code> \| <code>Binary</code> \| <code>null</code> | <p>Refer to documentation for details.</p> |

<a name="$bsonSize"></a>

## $bsonSize(expression) ⇒ <code>BsonSizeOperator</code>
<p>Returns the size in bytes of a given document when encoded as BSON.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bsonSize/)
for $bsonSize  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>ObjectExpression</code>](#ObjectExpression) \| <code>null</code> | <p>Any valid expression that resolves an object or null.</p> |

<a name="$ceil"></a>

## $ceil(numberExpression) ⇒ <code>CeilOperator</code>
<p>Returns the smallest integer greater than or equal to the specified number.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/)
for $ceil  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$cos"></a>

## $cos(numberExpression) ⇒ <code>CosOperator</code>
<p>Returns the cosine of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cos/)
for $cos  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$cosh"></a>

## $cosh(numberExpression) ⇒ <code>CoshOperator</code>
<p>Returns the hyperbolic cosine of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cosh/)
for $cosh  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$degreesToRadians"></a>

## $degreesToRadians(numberExpression) ⇒ <code>DegreesToRadiansOperator</code>
<p>Converts the input value measured in degrees to radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/degreesToRadians/)
for $degreesToRadians  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$exp"></a>

## $exp(numberExpression) ⇒ <code>ExpOperator</code>
<p>Raises Euler's number to the specified exponent and returns the result.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/)
for $exp  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$floor"></a>

## $floor(numberExpression) ⇒ <code>FloorOperator</code>
<p>Returns the largest integer less than or equal to the specified number.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/)
for $floor  

| Param | Type | Description |
| --- | --- | --- |
| numberExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>Any valid expression that resolves to a number.</p> |

<a name="$isNumber"></a>

## $isNumber(expression) ⇒ <code>IsNumberOperator</code>
<p>Checks if the specified expression resolves to a numeric BSON type.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/)
for $isNumber  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$last"></a>

## $last(expression) ⇒ <code>LastOperator</code>
<p>Returns the result of an expression of the last document in a group of
documents. Only meaningful when documents are in a defined order.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/last/)
for $last  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$linearFill"></a>

## $linearFill(expression) ⇒ <code>LinearFillOperator</code>
<p>Fills null and missing fields in a window using linear interpolation based on
surrounding field values.</p>
<p>Only available in the $setWindowFields stage.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/linearFill/)
for $linearFill  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>A valid expression.</p> |

<a name="$literal"></a>

## $literal(value) ⇒ <code>LiteralOperator</code>
<p>Returns a value without parsing. Use for values that the aggregation pipeline
may interpret as an expression.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/literal/)
for $literal  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>any</code> | <p>Any value</p> |

<a name="$locf"></a>

## $locf(expression) ⇒ <code>LocfOperator</code>
<p>Last observation carried forward. Sets values for null and missing fields in
a window to the last non-null value for the field.</p>
<p>Only available in the $setWindowFields stage.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/locf/)
for $locf  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>A valid expression.</p> |

<a name="$log10"></a>

## $log10(numberOrExpression) ⇒ <code>Log10Operator</code>
<p>Calculates the log base 10 of a number and returns the result as a double.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/)
for $log10  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$meta"></a>

## $meta(metaDataKeyword) ⇒ <code>MetaOperator</code>
<p>Returns the metadata associated with a document when performing a search.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/meta/)
for $meta  

| Param | Type |
| --- | --- |
| metaDataKeyword | <code>MetaDataKeyword</code> | 

<a name="$not"></a>

## $not(expression) ⇒ <code>NotOperator</code>
<p>Evalutes a boolean and returns the opposite boolean value.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/)
for $not  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$sum"></a>

## $sum(expression) ⇒ <code>SumOperator</code>
<p>Calculates and returns the collective sum of numeric values. Non-numeric
values are ignored.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/)
for $sum  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Refer to documentation.</p> |

<a name="$match"></a>

## $match(fieldExpression) ⇒ <code>MatchStage</code>
<p>Filters the documents to pass only the documents that match the specified
conditions(s) to the next pipeline stage.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/)
for $match  

| Param | Type |
| --- | --- |
| fieldExpression | [<code>ObjectExpression</code>](#ObjectExpression) | 

<a name="$project"></a>

## $project(expression) ⇒ <code>ProjectStage</code>
<p>Passes along the documents with the specified fields to the next stage in
the pipeline.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/)
for $project  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>ObjectExpression</code>](#ObjectExpression) | <p>Refer to documentation.</p> |

<a name="$group"></a>

## $group(expression) ⇒ <code>GroupStage</code>
<p>Separates documents into groups according to a &quot;group key&quot;.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/)
for $group  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>ObjectExpression</code>](#ObjectExpression) | <p>Refer to documentation.</p> |

<a name="$limit"></a>

## $limit(value) ⇒ <code>LimitOperator</code>
<p>Limits the number of documents passed to the next stage in the pipeline.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/)
for $limit  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | <p>A positive 64bit integer.</p> |

<a name="$type"></a>

## $type(Any) ⇒ <code>TypeOperator</code>
<p>Returns a string that specifies the BSON type of the argument.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/)
for $type  

| Param | Type | Description |
| --- | --- | --- |
| Any | [<code>Expression</code>](#Expression) | <p>valid expression.</p> |

<a name="$objectToArray"></a>

## $objectToArray(object) ⇒ <code>ObjectToArrayOperator</code>
<p>Converts a document to an array.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/objectToArray/)
for $objectToArray  

| Param | Type | Description |
| --- | --- | --- |
| object | [<code>ObjectExpression</code>](#ObjectExpression) | <p>Any valid expression that evaluates to an expression.</p> |

<a name="$radiansToDegrees"></a>

## $radiansToDegrees(numberOrExpression) ⇒ <code>RadiansToDegreesOperator</code>
<p>Converts an input value measured in radians to degrees.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/radiansToDegrees/)
for $radiansToDegrees  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$sampleRate"></a>

## $sampleRate(value) ⇒ <code>SampleRateOperator</code>
<p>Matches a random selection of input documents.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sampleRate/)
for $sampleRate  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | <p>A floating point number between 0 and 1.</p> |

<a name="$size"></a>

## $size(arrayExpression) ⇒ <code>SizeOperator</code>
<p>Counts and returns the total number of items in an array.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/)
for $size  

| Param | Type | Description |
| --- | --- | --- |
| arrayExpression | [<code>ArrayExpression</code>](#ArrayExpression) | <p>An array or a valid expression that resolves to an array.</p> |

<a name="$sin"></a>

## $sin(numberOrExpression) ⇒ <code>SinOperator</code>
<p>Returns the sine of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sin/)
for $sin  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$sinh"></a>

## $sinh(numberOrExpression) ⇒ <code>SinhOperator</code>
<p>Returns the hyperbolic sine of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sinh/)
for $sinh  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$skip"></a>

## $skip(value) ⇒ <code>SkipOperator</code>
<p>Skips over the specified number of documents that pass into the stage and
passes the remaining documents to the next stage in the pipeline.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/skip/)
for $skip  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | <p>The number of documents to skip.</p> |

<a name="$sqrt"></a>

## $sqrt(numberOrExpression) ⇒ <code>SqrtOperator</code>
<p>Calculates the square root of a positive number and returns the result as a
double.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/)
for $sqrt  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$strLenBytes"></a>

## $strLenBytes(expression) ⇒ <code>StrLenBytesOperator</code>
<p>Returns the number of UTF-9 encoded bytes in the specified string.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenBytes/)
for $strLenBytes  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>StringExpression</code>](#StringExpression) | <p>A string or a valid expression that resolves to a string.</p> |

<a name="$strLenCP"></a>

## $strLenCP(expression) ⇒ <code>StrLenCpOperator</code>
<p>Returns the number of UTF-8 code pints in the specified string.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenCP/)
for $strLenCP  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>StringExpression</code>](#StringExpression) | <p>A string or a valid expression that resolves to a string.</p> |

<a name="$tan"></a>

## $tan(numberOrExpression) ⇒ <code>TanOperator</code>
<p>Returns the tangent of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tan/)
for $tan  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$tanh"></a>

## $tanh(numberOrExpression) ⇒ <code>TanhOperator</code>
<p>Returns the hyperbolic tangent of a value that is measured in radians.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tanh/)
for $tanh  

| Param | Type | Description |
| --- | --- | --- |
| numberOrExpression | [<code>NumberExpression</code>](#NumberExpression) | <p>A number or an expresison that resolves to a number.</p> |

<a name="$toBool"></a>

## $toBool(expression) ⇒ <code>ToBoolOperator</code>
<p>Converts a value to a boolean.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/)
for $toBool  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toDate"></a>

## $toDate(expression) ⇒ <code>ToDateOperator</code>
<p>Converts a value to a date. Will produce an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/)
for $toDate  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toDecimal"></a>

## $toDecimal(expression) ⇒ <code>ToDecimalOperator</code>
<p>Converts a value to a decimal. Throws an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDecimal/)
for $toDecimal  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toDouble"></a>

## $toDouble(expression) ⇒ <code>ToDoubleOperator</code>
<p>Converts a value to a double. Throws an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/)
for $toDouble  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toInt"></a>

## $toInt(expression) ⇒ <code>ToIntOperator</code>
<p>Converts a value to an integer. Throws an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/)
for $toInt  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toLong"></a>

## $toLong(expression) ⇒ <code>ToLongOperator</code>
<p>Converts a value to a long. Throws an error if the value cannot be converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLong/)
for $toLong  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toObjectId"></a>

## $toObjectId(expression) ⇒ <code>ToObjectIdOperator</code>
<p>Converts a value to an ObjectId. Throws an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/)
for $toObjectId  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toString"></a>

## $toString(expression) ⇒ <code>ToStringOperator</code>
<p>Converts a value to a string. Throws an error if the value cannot be
converted.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/)
for $toString  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression.</p> |

<a name="$toUpper"></a>

## $toUpper(expression) ⇒ <code>ToUpperOperator</code>
<p>Returns a string converts to uppercase.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toUpper/)
for $toUpper  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>StringExpression</code>](#StringExpression) | <p>A string or a valid expression that resolves to a string.</p> |

<a name="$toLower"></a>

## $toLower(expression) ⇒ <code>ToLowerOperator</code>
<p>Returns a string converted to lowercase.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/)
for $toLower  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>StringExpression</code>](#StringExpression) | <p>A string or a valid expression that resolves to a string.</p> |

<a name="$tsIncrement"></a>

## $tsIncrement(expression) ⇒ <code>TsIncrementOperator</code>
<p>Returns the incrementing ordinal from a timestamp as a long.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsIncrement/)
for $tsIncrement  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression that resolves to a timestamp.</p> |

<a name="$tsSecond"></a>

## $tsSecond(expression) ⇒ <code>TsSecondOperator</code>
<p>Returns the seconds from a timestamp as a long.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsSecond/)
for $tsSecond  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Any valid expression that resolves to a timestamp.</p> |

<a name="$addFields"></a>

## $addFields(expression) ⇒ <code>AddFieldsStage</code>
<p>Adds new fields to documents.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/)
for $addFields  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>ObjectExpression</code>](#ObjectExpression) | <p>Specify the name of each field to add and set its value to an aggregation expression or an empty object.</p> |

**Example**  
```js
$addFields({ fullName: $.concat('$firstName', ' ', '$lastName') });
// returns { $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
```
<a name="$set"></a>

## $set(expression) ⇒ <code>SetStage</code>
<p>Adds new fields to documents. (alias of $addFields)</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/)  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>ObjectExpression</code>](#ObjectExpression) | <p>Specify the name of each field to add and set its value to an aggregation expression or an empty object.</p> |

**Example**  
```js
$set({ fullName: $.concat('$firstName', ' ', '$lastName') });
// returns { $set: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }
```
<a name="$push"></a>

## $push(expression, expression) ⇒ <code>PushOperator</code>
<p>Returns an array of all values that result from applying an expression to
documents.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/push/)
for $push  

| Param | Type | Description |
| --- | --- | --- |
| expression |  | <p>Expression</p> |
| expression | [<code>Expression</code>](#Expression) | <p>A valid expression.</p> |

<a name="$addToSet"></a>

## $addToSet(expression) ⇒ <code>AddToSetOperator</code>
<p>Returns an array of all unique values that results from applying an
expression to each document in a group.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addToSet/)
for $addToSet  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>A valid expression.</p> |

<a name="$sort"></a>

## $sort(expression) ⇒ <code>SortStage</code>
<p>Sorts all input documents and returns them to the pipeline in sorted order.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/)
for $sort  

| Param | Type | Description |
| --- | --- | --- |
| expression | [<code>Expression</code>](#Expression) | <p>Refer to documentation.</p> |

<a name="$cond"></a>

## $cond(ifExpr, [thenExpr], [elseExpr]) ⇒ <code>Condition</code>
<p>Evaluates a boolean expression to return one of the two specified return
expressions.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/)
for $cond  

| Param | Type | Description |
| --- | --- | --- |
| ifExpr | [<code>Expression</code>](#Expression) | <p>A boolean expression.</p> |
| [thenExpr] | [<code>Expression</code>](#Expression) | <p>The true case.</p> |
| [elseExpr] | [<code>Expression</code>](#Expression) | <p>The false case.</p> |

<a name="$let"></a>

## $let(varsExpr, [inExpr]) ⇒ <code>LetVarsIn</code>
<p>Binds variables for use in the specified expression and returns the result of
the expression.</p>

**Kind**: global function  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/let/)
for $let  

| Param | Type | Description |
| --- | --- | --- |
| varsExpr | [<code>Expression</code>](#Expression) | <p>Assign for the variables accessible in the in expression.</p> |
| [inExpr] | [<code>Expression</code>](#Expression) | <p>The expression to evaluate.</p> |

<a name="ObjectExpression"></a>

## ObjectExpression : <code>Object</code>
**Kind**: global typedef  
<a name="Expression"></a>

## Expression : [<code>ObjectExpression</code>](#ObjectExpression) \| <code>string</code> \| <code>number</code> \| <code>boolean</code> \| <code>null</code>
<p>A valid expression, string, number, boolean or null.</p>

**Kind**: global typedef  
<a name="NumberExpression"></a>

## NumberExpression : [<code>ObjectExpression</code>](#ObjectExpression) \| <code>number</code>
<p>A number or any valid expression that resolves to a number.</p>

**Kind**: global typedef  
<a name="ArrayExpression"></a>

## ArrayExpression : [<code>ObjectExpression</code>](#ObjectExpression) \| <code>Array.&lt;any&gt;</code>
<p>An array or any valid expression that resolves to an array.</p>

**Kind**: global typedef  
<a name="StringExpression"></a>

## StringExpression : [<code>ObjectExpression</code>](#ObjectExpression) \| <code>string</code>
<p>A string or any valid expression that resolves to a string.</p>

**Kind**: global typedef  
<a name="MergeActionWhenMatched"></a>

## MergeActionWhenMatched : <code>string</code>
<p>Enumeration of: Replace (replace), KeepExisting (keepExisting), Merge
(merge), Fail (fail) and Pipeline (pipeline).</p>

**Kind**: global typedef  
<a name="MergeActionWhenNotMatched"></a>

## MergeActionWhenNotMatched : <code>string</code>
<p>Enumeration of: Insert (insert), Discard (discard) or Fail
(fail).</p>

**Kind**: global typedef  
<a name="DefaultOrBranches"></a>

## DefaultOrBranches : [<code>Expression</code>](#Expression) \| <code>Array.&lt;Branch&gt;</code>
**Kind**: global typedef  
**Decsription**: The default path or an array of (switch) branches.  
