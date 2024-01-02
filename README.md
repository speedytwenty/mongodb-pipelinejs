[![view on npm](http://img.shields.io/npm/v/mongodb-pipelinejs.svg)](https://www.npmjs.org/package/mongodb-pipelinejs)
[![npm module downloads](http://img.shields.io/npm/dt/mongodb-pipelinejs.svg)](https://www.npmjs.org/package/mongodb-pipelinejs)
![test workflow](https://github.com/speedytwenty/mongodb-pipelinejs/actions/workflows/test.yml/badge.svg?event=push)
[![Coverage Status](https://coveralls.io/repos/github/speedytwenty/mongodb-pipelinejs/badge.svg?branch=main)](https://coveralls.io/github/speedytwenty/mongodb-pipelinejs?branch=main)
[![Maintainability](https://codeclimate.com/github/speedytwenty/mongodb-pipelinejs/badges/gpa.svg)](https://codeclimate.com/github/speedytwenty/mongodb-pipelinejs/maintainability)

# MongoDB PipelineJS

_Aggregation Syntax for Javascript_; Use Javascript syntax—instead of JSON—to
compose MongoDB aggregations.

_Documentation and examples are under development._

* [Browse Examples &raquo;](./EXAMPLES.md)
* [View API Documentation &raquo;](./REFERENCE.md)


## Installation

_Add `mongodb-pipelinejs` to your MongoDB project:_

With Yarn: `yarn add mongodb-pipelinejs`

With NPM: `npm install mongodb-pipelinejs`

## Usage

_Typescript support is included but needs refinement._

The example below simple depicts an example aggregation using PipelineJS. What's
not shown here is the default syntax that is replaced.

```js
// Using the dollar sign ($) closely immitates the namespacing of MongoDB's
// aggregation operators 
const $ = require('mongodb-pipelinejs');

mongoDB.collection('transactions').aggregate([
  $.match({
    userId: MY_USER_ID,
    amount: $.gte(100),
    type: $.in(['sale', 'transfer']),
    status: $.neq('new'),
  }),
  $.redact($.switch('$$PRUNE')
    .case($.eq('$type', 'sale'), '$$KEEP'),
    .case($.eq('$type', 'transfer'), '$$PRUNE'),
  }),
  $.addFields({
    payments: $.filter(
      '$payments',
      'payment',
      $.in('$$payment.status', ['complete', 'approved']),
    ),
  }),
  $.unwind('$payments'),
  $.group({
    _id: '$transactionId',
    payments: $.push('$payments.paymentId'),
    amountDue: $.last('$amount'),
    amountPaid: $.sum('$payments.amount'),
  })
  $.unwind('$payments', true)
]).toArray();

```

## Purpose

In a nutshell, PipelineJS can allow for writing aggregations with less
syntatical characters—less array brackets (`[` & `]`) and fewer object
braces (`{` & `}`).

For some linting configurations, using PipelineJS can result
in fewer nominal lines. Eg. Less lines that contain a single opening or closing
delimeter.

For those who use it, PipelineJS can offer the advantage of _code completion_
and similar inflection utilities, albeit, the user experience here likely needs
some refinement to be as helpful as it can be.

### Rounding

MongoDB's built-in `$round` operator behaves differently than some might expect.
PipelineJS includes a more standard rounding operator "roundStandard".

With the sample documents:

```
{_id : 1, "value" : 10.5},
{_id : 2, "value" : 11.5},
{_id : 3, "value" : 12.5},
{_id : 4, "value" : 13.5}
```

MongoDB's default rounding with `$round : [ "$value", 0]` results in:

```
{_id : 1, "value" : 10},
{_id : 2, "value" : 12},
{_id : 3, "value" : 12},
{_id : 4, "value" : 14}
```

PipelineJS's rounding with `$roundStandard('$value', 0)` results in:

```
{_id : 1, "value" : 11},
{_id : 2, "value" : 12},
{_id : 3, "value" : 13},
{_id : 4, "value" : 14}
```

#### Mongo Round

PipelineJS can be used in leau of [mongo-round](https://www.npmjs.com/package/mongo-round):

Change:

```js
const round = require('mongo-round');
```

To:

```js
const { roundStandard: round } = require('mongodb-pipelinejs');`
```
