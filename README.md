# MongoDB PipelineJS

_Aggregation Syntax for Javascript_; Use Javascript syntax—instead of JSON—to
compose MongoDB aggregations.

## Installation

_Add `mongo-js-syntax` to your MongoDB project:_

With Yarn: `yarn add mongo-js-syntax`

With NPM: `npm install mongo-js-syntax`

## Usage

```js
import { pipeline, $ } from 'mongo-js-syntax';


mongoDB.collection('transactions').aggregate(pipline()
  .match({
    userId: MY_USER_ID,
    amount: $.gte(100),
    type: $.in(['sale', 'transfer']),
    status: $.neq('new'),
  })
  .redact($.switch('$$PRUNE')
    .case($.eq(
  })
  .addFields({
    payments: $.filter('$payments', 'payment', $.in('$$payment.status', ['complete', 'approved'])),
  })
  .unwind('$payments')
  .group({
    _id: '$transactionId',
    payments: $.push('$payments.paymentId'),
    amountDue: $.last('$amount'),
    amountPaid: $.sum('$payments.amount'),
  })
  .unwind('$payments', true)
);

```

Which would otherwise be written something like this (JSON):

```js
mongoDB.collection('transactions').aggregate([{
  $match: {
    userId: MY_USER_ID,
    amount: { $gte: 100 },
    type: { $in: ['sale', 'transfer'] },
    status: { $neq: 'new' },
  },
  $redact: {
    $cond: {
      if: { $not: '$authorized' },
      then: '$$PRUNE',
      else: '$$KEEP',
    },
  },
  $unwind: { path: '$payments', preserveNullAndEmptyArrays: true },
}]);
```


* [See All Examples &raquo;](./EXAMPLES.md)
* [Browse Reference Documentation &raquo;](./REFERENCE.md)
