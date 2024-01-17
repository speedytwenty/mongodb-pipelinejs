[![view on npm](http://img.shields.io/npm/v/mongodb-pipelinejs.svg)](https://www.npmjs.org/package/mongodb-pipelinejs)
[![npm module downloads](http://img.shields.io/npm/dt/mongodb-pipelinejs.svg)](https://www.npmjs.org/package/mongodb-pipelinejs)
![test workflow](https://github.com/speedytwenty/mongodb-pipelinejs/actions/workflows/test.yml/badge.svg?event=push)
[![Coverage Status](https://coveralls.io/repos/github/speedytwenty/mongodb-pipelinejs/badge.svg?branch=main)](https://coveralls.io/github/speedytwenty/mongodb-pipelinejs?branch=main)
[![Maintainability](https://codeclimate.com/github/speedytwenty/mongodb-pipelinejs/badges/gpa.svg)](https://codeclimate.com/github/speedytwenty/mongodb-pipelinejs/maintainability)

# MongoDB PipelineJS

_Abbreviated syntax for authoring MongoDB aggregation pipelines (and more)._

PipelineJS attempts to provide a concise _typed_ interface for writing MongoDB
aggregations in [nodejs](https://nodejs.org) projects.

[Other features](#built-in-extras) that may be commonly found useful are also
available.

Browse the [API Documentation](https://speedytwenty.github.io/mongodb-pipelinejs/)
for implementation details.

### Syntax Comparison

**Without PipelineJS:**

```js
{ $map: {
    input: { $filter: {
      input: '$myArray',
      as: 'item',
      cond: $and('$$item.a', $or('$$item.b', '$$item.c')),
    },
    as: 'stockedItem',
    in: { $multiply: ['$$stockedItem.quantity', '$$stockedItem.qtyDiscount'] },
} }
```

What do you do with all those braces—without PipelineJS? Your linter might
enforce one _opening_ brace per-line if your preference doesn't. Either way, the above
example is a klunky mess.

**With PipelineJS:** (Static Notation)

```js
$map(
  $filter('$myArray', 'item', $gte('$$item.quantity', 1)),
  'stockedItem',
  $multiply('$$stockedItem.quantity', '$$stockedItem.price'),
)
```

**With PipelineJS:** (Object Notation)

```js
$map($filter('$myArray').as('item').cond($gte('$$item.quanity', 1)))
  .as('stockedItem')
  .in($multiply('$$stockedItem.quantity', '$$stockedItem.price'))
```

**With PipelineJS:** (Mixed Notation)

```js
// Using object notation with $map for clean meaningful lines
// Using static notation with $filter since it fits on a single line cleanly
$map($filter('$myArray', 'item', $and('$$item.a', $or('$$item.b', '$$item.c')))).
  .as('stockedItem')
  .in($multiply('$$stockedItem.quantity', '$$stockedItem.price'))
```

**With PipelineJS:** (Upcoming release)

```js
// Use default variable name
$map($filter('$myArray', '$$this.inStock')).in($multiply('$$this.quantity', '$$this.price'))
```

**PipelineJS is what you already expect!**
PipelineJS nearly mimics the MongoDB aggregation syntax. There is nominal
learning required to start writing cleaner aggregations today!


MongoDB has numerous pipeline stages and operators. PipelineJS aims to support
them all. As demonstrated above, PipelineJS provides the means to compose
aggregations in an abbreviated fashion.

### Built-in Extras

PipelineJS includes some extras that provide additional functionality beyond
MongoDB's supported operators.

* **Safe-Operators**<br>
  _Avoid runtime type errors using Safe Operators._ [details](#safe-operators)
* **Utility Operators**<br>
  _Some extra operator-like helpers that can be useful._ [details](#utility-operators)
* **Standard Rounding**<br>
  _Provides alternative numerical rounding commonly expected._ [details](#rounding)

## Installation

_Add `mongodb-pipelinejs` to your MongoDB project:_

With Yarn: `yarn add mongodb-pipelinejs`

With NPM: `npm install mongodb-pipelinejs`

_It is recommended to lock npm to the patch version (using "~") since breaking
changes may be introduced in minor versions prior to a stable 1.0 release._

## Usage

_Typescript support is included but needs refinement._

The example below depicts an example aggregation using PipelineJS. What's not
shown here is the default syntax that is replaced.

```js
// Using the dollar-sign ($) closely resembles MongoDB's operator naming
// convention and provides quick access to all operators.
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

### Use Minified Build

```js
const $ = require('mongodb-pipelinejs/min');
```

OR

```ts
import * as $ from 'mongodb-pipelinejs/min';
```

### Explicit Inclusion Style

```js
// Include stages an operators only as needed
const { $match, $group, $sort } = require('mongodb-pipelinejs');
```

## Purpose

In a nutshell, PipelineJS can allow for writing aggregations with less
syntatical characters—less array brackets (`[` & `]`) and fewer object
braces (`{` & `}`).

For some linting configurations, using PipelineJS can result
in fewer nominal lines. Eg. Less lines that contain a single opening or closing
delimeter.

For those who use it, PipelineJS can offer the advantage of _code completion_
and similar inflection utilities.

### Safe Operators

Some operators, commonly _mathematical_ operators, will cause the database
server to complain if input to the operator doesn't resolve to the expected
type.

PipelineJS's "Safe Operators" are simply shorts that ensure the operator input
resolves to the correct type—often times avoiding a fatal error.

Some safe operators are presently included for these circumstances:

  * [$addSafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24addSafe) 
  * [$concatArraysSafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24concatArraysSafe)
  * [$concatSafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24concatSafe)
  * [$divideSafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24divideSafe)
  * [$multiplySafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24multiplySafe)
  * [$subtractSafe](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24subtractSafe)

### Utility Operators

These operators are exclusive to PipelineJS.

  * [$arrayElemFirst](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24arrayElemFirst)
  * [$arrayElemLast](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24arrayElemLast)
  * [$ensureArray](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24ensureArray)
  * [$ensureNumber](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24ensureNumber)
  * [$ensureString](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24ensureString)
  * [$if](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24if)
  * [$increment](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24increment)
  * [$decrement](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24decrement)
  * [$roundStandard](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24roundStandard)

### Rounding

MongoDB's built-in `$round` operator behaves differently than some might expect.
PipelineJS includes a more standard rounding operator:
[$roundStandard](https://speedytwenty.github.io/mongodb-pipelinejs/global.html#%24roundStandard).

With the sample documents:

```js
{_id : 1, "value" : 10.5},
{_id : 2, "value" : 11.5},
{_id : 3, "value" : 12.5},
{_id : 4, "value" : 13.5}
```

MongoDB's default rounding with `$round : [ "$value", 0]` results in:

```js
{_id : 1, "value" : 10},
{_id : 2, "value" : 12},
{_id : 3, "value" : 12},
{_id : 4, "value" : 14}
```

PipelineJS's rounding with `$roundStandard('$value', 0)` results in:

```js
{_id : 1, "value" : 11},
{_id : 2, "value" : 12},
{_id : 3, "value" : 13},
{_id : 4, "value" : 14}
```

#### Mongo Round

PipelineJS can be used in lieu of [mongo-round](https://www.npmjs.com/package/mongo-round)
which is no longer maintained.

Change:

```js
const round = require('mongo-round');
```

To:

```js
const { roundStandard: round } = require('mongodb-pipelinejs');`
```

## Documentation

Aside from a few niceties, the documentation is an abbreviation of the official
MongoDB documentation—with specific API/interface information and usage
examples.

**[Browse API Documentation &raquo;](https://speedytwenty.github.io/mongodb-pipelinejs/)**

## Feedback (bugs, feature requests, etc)

Found a missing or incorrect operator?.. have an idea for a super handy
operator? Let us know by
[posting an issue](https://github.com/speedytwenty/mongodb-pipelinejs/issues)

## Contributing

Pull requests are always welcome.

## Next Steps

- [PipelineJS Documentation](https://www.mongodb.com/docs/manual/)
- [Star us on GitHub](https://github.com/speedytwenty/mongodb-pipelinejs)

## License

[Apache 2.0](LICENSE.md)
