# MongoDB PipelineJS

_Aggregation Syntax for Javascript_; Use Javascript syntax—instead of JSON—to
compose MongoDB aggregations.

[Browse Reference Documentation &raquo;](./REFERENCE.md)

## Installation

_Add `mongodb-pipelinejs` to your MongoDB project:_

With Yarn: `yarn add mongodb-pipelinejs`

With NPM: `npm install mongodb-pipelinejs`

## Usage

_Example needs refinement..._

```js
const $ = require('mongodb-pipelinejs');

mongoDB.collection('transactions').aggregate([
  $.match({
    userId: MY_USER_ID,
    amount: $.gte(100),
    type: $.in(['sale', 'transfer']),
    status: $.neq('new'),
  }),
  $.redact($.switch('$$PRUNE')
    .case($.eq('$type', 'sale')),
  }),
  $.addFields({
    payments: $.filter('$payments', 'payment', $.in('$$payment.status', ['complete', 'approved'])),
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

