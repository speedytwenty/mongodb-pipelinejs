import $ = require('.');

describe('aggregation', () => {
  describe('stages', () => {
    describe('$addFields', () => {
      it('exports expects vars', () => {
        expect($.addFields).toBeDefined();
        expect($.$addFields).toBeDefined();
        expect($.addFields).toStrictEqual($.$addFields);
      });
      it('throws error for invalid arguments', () => {
        expect(() => $.addFields(1)).toThrow();
        expect(() => $.addFields([{ x: 1}])).toThrow();
      });
      it('returns expected result', () => {
        expect($.addFields({ x: 1 })).toEqual({ $addFields: { x: 1 } });
      });
    });
    describe('$bucket', () => {
      it('exports expected vars', () => {
        expect($.bucket).toBeDefined();
        expect($.$bucket).toBeDefined();
        expect($.bucket).toStrictEqual($.$bucket);
      });
      const expected = {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 200, 400],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            artwork: { $push: { title: '$title', price: '$price' } },
            averagePrice: { $avg: '$price' },
          },
        },
      };
      describe('static notation', () => {
        it('returns expected result', () => {
          const actual = $.bucket('$price', [0, 200, 400], 'Other', {
            count: $.sum(1),
            artwork: $.push({ title: '$title', price: '$price' }),
            averagePrice: $.avg('$price'),
          });
          expect(actual).toEqual(expected);
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          const actual = $.bucket('$price')
            .boundaries(0, 200, 400)
            .default('Other')
            .output({
              count: $.sum(1),
              artwork: $.push({ title: '$title', price: '$price' }),
              averagePrice: $.avg('$price'),
            });
          expect(actual).toEqual(expected);
        });
      });
    });
    describe('$bucketAuto', () => {
      it('exports expected vars', () => {
        expect($.bucketAuto).toBeDefined();
        expect($.$bucketAuto).toBeDefined();
        expect($.bucketAuto).toStrictEqual($.$bucketAuto);
      });
      const expected = {
        $bucketAuto: {
          groupBy: '$price',
          buckets: 5,
          granularity: 'R5',
          output: {
            count: { $sum: 1 },
            artwork: { $push: { title: '$title', price: '$price' } },
            averagePrice: { $avg: '$price' },
          },
        },
      };
      describe('static notation', () => {
        it('returns expected result', () => {
          const actual = $.bucketAuto('$price', 5, 'R5', {
            count: $.sum(1),
            artwork: $.push({ title: '$title', price: '$price' }),
            averagePrice: $.avg('$price'),
          });
          expect(actual).toEqual(expected);
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          const actual = $.bucketAuto('$price')
            .buckets(5)
            .granularity('R5')
            .output({
              count: $.sum(1),
              artwork: $.push({ title: '$title', price: '$price' }),
              averagePrice: $.avg('$price'),
            });
          expect(actual).toEqual(expected);
        });
      });
    });
    describe('$changeStream', () => {
      it('exports expected vars', () => {
        expect($.changeStream).toBeDefined();
        expect($.$changeStream).toBeDefined();
        expect($.changeStream).toStrictEqual($.$changeStream);
      });
      it('returns expected result', () => {
        expect($.changeStream()).toEqual({ $changeStream: {} });
      });
    });
    describe('$count', () => {
      it('exports expected vars', () => {
        expect($.count).toBeDefined();
        expect($.$count).toBeDefined();
        expect($.count).toStrictEqual($.$count);
      });
      it('returns expected result', () => {
        expect($.count()).toEqual({ $count: 'count' });
        expect($.count('myCount')).toEqual({ $count: 'myCount' });
      });
    });
    describe('$documents', () => {
      it('exports expected vars', () => {
        expect($.documents).toBeDefined();
        expect($.$documents).toBeDefined();
        expect($.documents).toStrictEqual($.$documents);
      });
      const expected = { $documents: [{ x: 1 }, { x: 2 }, { x: 3}] };
      it('returns expected result', () => {
        expect($.documents({ x: 1 }, { x: 2 }, { x: 3 })).toEqual(expected);
      });
      it('supports array input', () => {
        expect($.documents([{ x: 1 }, { x: 2 }, { x: 3 }])).toEqual(expected);
      });
    });
    describe('$group', () => {
      it('exports expected vars', () => {
        expect($.group).toBeDefined();
        expect($.$group).toBeDefined();
        expect($.group).toStrictEqual($.$group);
      });
      it('returns expected result', () => {
        expect($.group({ _id: '$category', count: $.sum(1) })).toEqual({ $group: { _id: '$category', count: { $sum: 1 } } });
      });
    });
    describe('$limit', () => {
      it('exports expected vars', () => {
        expect($.limit).toBeDefined();
        expect($.$limit).toBeDefined();
        expect($.limit).toStrictEqual($.$limit);
      });
      it('returns expected result', () => {
        expect($.limit(10)).toEqual({ $limit: 10 });
      });
    });
    describe('$lookup', () => {
      it('exports expected vars', () => {
        expect($.lookup).toBeDefined();
        expect($.$lookup).toBeDefined();
        expect($.lookup).toStrictEqual($.$lookup);
      });
      describe('basic lookup', () => {
        it('returns expected result', () => {
          const expected = {
            $lookup: {
              from: 'colName',
              as: 'asName',
              localField: 'lKey',
              foreignField: 'fKey',
            },
          };
          expect($.lookup('colName', 'asName', 'lKey', 'fKey')).toEqual(expected);
        });
        it('prevents redundant calls to methods', () => {
          expect(() => $.lookup('f', 'o').from('a').from('b')).toThrow(/redundant/i);
          expect(() => $.lookup('f', 'o').as('a').as('b')).toThrow(/redundant/i);
          expect(() => $.lookup('f', 'o').localField('a').localField('b')).toThrow(/redundant/i);
          expect(() => $.lookup('f', 'o').foreignField('a').foreignField('b')).toThrow(/redundant/i);
          expect(() => $.lookup('f', 'o').let({ v: 1 }).let({ v: 2 })).toThrow(/redundant/i);
          expect(() => $.lookup('f', 'o').pipeline([{ p: 1 }]).pipeline({ p: 2 })).toThrow(/redundant/i);
        });
        it('resolves collection name from collection object', () => {
          expect($.lookup({ s: { namespace: { collection: 'colName' } } }, 'asName')).toEqual({ $lookup: { from: 'colName', as: 'asName' } });
        });
        it('supports $documents in pipeline', () => {
          const actual = $.lookup([{ id: 1 }, { id: 2 }], 'subdocs')
            .let({ docId: '$id' })
            .pipeline($.match({ id: '$$docId' }));
          expect(actual).toEqual({
            $lookup: {
              as: 'subdocs',
              let: { docId: '$id' },
              pipeline: [
                { $documents: [{ id: 1 }, { id: 2 }] },
                { $match: { id: '$$docId' } },
              ],
            },
          });
        });
      });
      describe('advanced lookup', () => {
        it('returns expected result', () => {
          const expected = {
            $lookup: {
              from: 'colName',
              as: 'asName',
              let: { foo: 'bar' },
              pipeline: [{ $match: 1 }],
            },
          };
          expect($.lookup('colName', 'asName').let({ foo: 'bar' }).pipeline({ $match: 1 })).toEqual(expected);
          expect($.lookup('colName', 'asName').let({ foo: 'bar' }).pipeline([{ $match: 1 }])).toEqual(expected);
        });
      });
    });
    describe('$match', () => {
      it('exports expected vars', () => {
        expect($.match).toBeDefined();
        expect($.$match).toBeDefined();
        expect($.match).toStrictEqual($.$match);
      });
      it('returns expected result', () => {
        expect($.match({ x: 1 })).toEqual({ $match: { x: 1 } });
      });
    });
    describe('$merge', () => {
      it('exports expected vars', () => {
        expect($.merge).toBeDefined();
        expect($.$merge).toBeDefined();
        expect($.merge).toStrictEqual($.$merge);
      });
      it('returns expected result', () => {
        const expected = {
          $merge: {
            into: 'colName',
            on: 'onField',
            let: { foo: 'bar' },
            whenMatched: 'replace',
            whenNotMatched: 'insert',
          },
        };
        const actual = $.merge('colName', 'onField')
          .let({ foo: 'bar' })
          .whenMatched($.MergeActionWhenMatched.Replace)
          .whenNotMatched($.MergeActionWhenNotMatched.Insert);
        expect(actual).toEqual(expected);
      });
      it('prevents redundant calls to methods', () => {
        expect(() => $.merge('colName').on(2).on(3)).toThrow();
        expect(() => $.merge('colName').let(2).let(3)).toThrow();
        expect(() => $.merge('colName').whenMatched($.MergeActionWhenMatched.Fail).whenMatched($.MergeActionWhenMatched.Fail)).toThrow();
        expect(() => $.merge('colName').whenNotMatched($.MergeActionWhenNotMatched.Fail).whenNotMatched($.MergeActionWhenNotMatched.Fail)).toThrow();
      });
    });
    describe('$out', () => {
      it('exports expected vars', () => {
        expect($.out).toBeDefined();
        expect($.$out).toBeDefined();
        expect($.out).toStrictEqual($.$out);
      });
      it('returns expected result', () => {
        expect($.out('myCollection')).toEqual({ $out: 'myCollection' });
        expect($.out('myCollection', 'myDb')).toEqual({ $out: { coll: 'myCollection', db: 'myDb' } });
      });
    });
    describe('$project', () => {
      it('exports expected vars', () => {
        expect($.project).toBeDefined();
        expect($.$project).toBeDefined();
        expect($.project).toStrictEqual($.$project);
      });
      it('returns expected result', () => {
        expect($.project({ x: '$y' })).toEqual({ $project: { x: '$y' } });
      });
    });
    describe('$redact', () => {
      it('exports expected vars', () => {
        expect($.redact).toBeDefined();
        expect($.$redact).toBeDefined();
        expect($.redact).toStrictEqual($.$redact);
      });
      const expected = {
        $redact: {
          $cond: {
            if: 1,
            then: '$$PRUNE',
            else: '$$KEEP',
          },
        },
      };
      describe('static notation', () => {
        it('returns expected result', () => {
          expect($.redact(1, '$$PRUNE', '$$KEEP')).toEqual(expected);
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          expect($.redact(1).then('$$PRUNE').else('$$KEEP')).toEqual(expected);
        });
        it('prevents redundant calls to methods', () => {
          expect(() => $.redact(1).then(2).then(3)).toThrow(/redundant/i);
          expect(() => $.redact(1).else(2).else(3)).toThrow(/redundant/i);
        });
      });
    });
    describe('$replaceRoot', () => {
      it('exports expected vars', () => {
        expect($.replaceRoot).toBeDefined();
        expect($.$replaceRoot).toBeDefined();
        expect($.replaceRoot).toStrictEqual($.$replaceRoot);
      });
      it('returns expected result', () => {
        expect($.replaceRoot('subdoc')).toEqual({ $replaceRoot: { newRoot: 'subdoc' } });
      });
    });
    describe('$set', () => { // alias of $addFields
      it('exports expects vars', () => {
        expect($.set).toBeDefined();
        expect($.$set).toBeDefined();
        expect($.set).toStrictEqual($.$set);
      });
      it('throws error for invalid arguments', () => {
        expect(() => $.set(1)).toThrow();
        expect(() => $.set([{ x: 1}])).toThrow();
      });
      it('returns expected result', () => {
        expect($.set({ x: 1 })).toEqual({ $set: { x: 1 } });
      });
    });
    describe('$skip', () => {
      it('exports expected vars', () => {
        expect($.skip).toBeDefined();
        expect($.$skip).toBeDefined();
        expect($.skip).toStrictEqual($.$skip);
      });
      it('returns expected result', () => {
        expect($.skip(10)).toEqual({ $skip: 10 });
      });
    });
    describe('$sort', () => {
      it('exports expected vars', () => {
        expect($.sort).toBeDefined();
        expect($.$sort).toBeDefined();
        expect($.sort).toStrictEqual($.$sort);
      });
      it('returns expected result', () => {
        expect($.sort({ created: 1 })).toEqual({ $sort: { created: 1 } });
      });
    });
    describe('$unwind', () => {
      it('exports expected vars', () => {
        expect($.unwind).toBeDefined();
        expect($.$unwind).toBeDefined();
        expect($.unwind).toStrictEqual($.$unwind);
      });
      it('returns expected result', () => {
        expect($.unwind('$foo')).toEqual({ $unwind: '$foo' });
        expect($.unwind('$foo', true)).toEqual({ $unwind: { path: '$foo', preserveNullAndEmptyArrays: true } });
        expect($.unwind('$foo', false)).toEqual({ $unwind: { path: '$foo', preserveNullAndEmptyArrays: false } });
      });
      it('supports includeArrayIndex', () => {
        expect($.unwind('$foo').includeArrayIndex('idx')).toEqual({ $unwind: { path: '$foo', includeArrayIndex: 'idx' } });
        expect($.unwind('$foo', true).includeArrayIndex('idx'))
          .toEqual({ $unwind: { path: '$foo', preserveNullAndEmptyArrays: true, includeArrayIndex: 'idx' } });
        expect($.unwind('$foo', false).includeArrayIndex('idx'))
          .toEqual({ $unwind: { path: '$foo', preserveNullAndEmptyArrays: false, includeArrayIndex: 'idx' } });
      });
      it('prevents redundant calls to methods', () => {
        expect(() => $.unwind('p').preserveNullAndEmptyArrays(true).preserveNullAndEmptyArrays(false)).toThrow();
        expect(() => $.unwind('p', true).preserveNullAndEmptyArrays(false)).toThrow();
        expect(() => $.unwind('p', false).preserveNullAndEmptyArrays(true)).toThrow();
        // This is somewhat arbitrary
        expect(() => $.unwind('p').includeArrayIndex('x').includeArrayIndex('y')).toThrow();
      });
    });
  });
  describe('operators', () => {
    describe('$abs', () => {
      it('exports expected vars', () => {
        expect($.abs).toBeDefined();
        expect($.$abs).toBeDefined();
        expect($.abs).toStrictEqual($.$abs);
      });
      it('returns expected result', () => {
        expect($.abs(-1)).toEqual({ $abs: -1 });
        expect($.abs($.divide('$a', '$b'))).toEqual({ $abs: { $divide: ['$a', '$b'] } });
      });
    });
    describe('$acos', () => {
      it('exports expected vars', () => {
        expect($.acos).toBeDefined();
        expect($.$acos).toBeDefined();
        expect($.acos).toStrictEqual($.$acos);
      });
      it('returns expected result', () => {
        expect($.acos(-1)).toEqual({ $acos: -1 });
        expect($.acos($.divide('$a', '$b'))).toEqual({ $acos: { $divide: ['$a', '$b'] } });
      });
    });
    describe('$acosh', () => {
      it('exports expected vars', () => {
        expect($.acosh).toBeDefined();
        expect($.$acosh).toBeDefined();
        expect($.acosh).toStrictEqual($.$acosh);
      });
      it('returns expected result', () => {
        expect($.acosh(-1)).toEqual({ $acosh: -1 });
        expect($.acosh($.divide('$a', '$b'))).toEqual({ $acosh: { $divide: ['$a', '$b'] } });
      });
    });
    describe('$add', () => {
      it('exports expected vars', () => {
        expect($.add).toBeDefined();
        expect($.$add).toBeDefined();
        expect($.add).toStrictEqual($.$add);
      });
      it('returns expected result', () => {
        expect($.add(1, 2, 3)).toEqual({ $add: [1, 2, 3] });
      });
      it('accepts array as first arg', () => {
        expect($.add([1, 2, 3])).toEqual({ $add: [1, 2, 3] });
      });
    });
    describe('$addSafe', () => {
      it('exports expected vars', () => {
        expect($.addSafe).toBeDefined();
        expect($.$addSafe).toBeDefined();
        expect($.addSafe).toStrictEqual($.$addSafe);
      });
      it('returns expected result', () => {
        expect($.addSafe(1, 2, 3)).toEqual({ $add: [1, 2, 3] });
        expect($.addSafe(1, 2, '$myVar')).toEqual({ $add: [1, 2, { $ifNull: ['$myVar', 0] }] });
      });
      it('accepts array as first arg', () => {
        expect($.addSafe([1, 2, 3])).toEqual({ $add: [1, 2, 3] });
        expect($.addSafe([1, 2, '$myVar'])).toEqual({ $add: [1, 2, { $ifNull: ['$myVar', 0] }] });
      });
    });
    describe('$addToSet', () => {
      it('exports expected vars', () => {
        expect($.addToSet).toBeDefined();
        expect($.$addToSet).toBeDefined();
        expect($.addToSet).toStrictEqual($.$addToSet);
      });
      it('returns expected result', () => {
        expect($.addToSet('$myVar')).toEqual({ $addToSet: '$myVar' });
      });
    });
    describe('$allElementsTrue', () => {
      it('exports expected vars', () => {
        expect($.allElementsTrue).toBeDefined();
        expect($.$allElementsTrue).toBeDefined();
        expect($.allElementsTrue).toStrictEqual($.$allElementsTrue);
      });
      it('returns expected result', () => {
        expect($.allElementsTrue('$a', '$b', ['$c', '$d'])).toEqual({ $allElementsTrue: ['$a', '$b', ['$c', '$d']] });
        expect($.allElementsTrue(['$a', '$b', '$c'])).toEqual({ $allElementsTrue: [['$a', '$b', '$c']] });
      });
    });
    describe('$and', () => {
      it('exports expected vars', () => {
        expect($.and).toBeDefined();
        expect($.$and).toBeDefined();
        expect($.and).toStrictEqual($.$and);
      });
      it('returns expected result', () => {
        expect($.and($.or('$a', '$b'), '$c')).toEqual({ $and: [{ $or: ['$a', '$b'] }, '$c'], });
      });
      it('accepts array as first arg', () => {
        expect($.and([$.or('$a', '$b'), '$c'])).toEqual({ $and: [{ $or: ['$a', '$b'] }, '$c'], });
      });
    });
    describe('$arrayElemAt', () => {
      it('exports expected vars', () => {
        expect($.arrayElemAt).toBeDefined();
        expect($.$arrayElemAt).toBeDefined();
        expect($.arrayElemAt).toStrictEqual($.$arrayElemAt);
      });
      it('throws error for invalid arguments', () => {
        expect(() => $.arrayElemAt(1, 2, 3)).toThrow(/arrayElemAt/);
        expect(() => $.arrayElemAt(1)).toThrow(/arrayElemAt/);
      });
      it('returns expected result', () => {
        expect($.arrayElemAt('expression', 1)).toEqual({ $arrayElemAt: ['expression', 1] });
      });
    });
    describe('$cmp', () => {
      it('exports expected vars', () => {
        expect($.cmp).toBeDefined();
        expect($.$cmp).toBeDefined();
        expect($.cmp).toStrictEqual($.$cmp);
      });
      it('throws error for invalid arguments', () => {
        expect(() => $.cmp(1, 2, 3)).toThrow(/cmp/);
        expect(() => $.cmp(1)).toThrow(/cmp/);
      });
      it('returns expected result', () => {
        expect($.cmp(1, 2)).toEqual({ $cmp: [1, 2] });
      });
    });
    describe('$cond', () => {
      it('exports expected vars', () => {
        expect($.cond).toBeDefined();
        expect($.$cond).toBeDefined();
        expect($.cond).toStrictEqual($.$cond);
      });
      describe('static notation', () => {
        it('returns expected result', () => {
          const expected = { $cond: { if: 1, then: 2, else: 3 } };
          expect($.cond(1, 2, 3)).toEqual(expected);
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          const expected = { $cond: { if: 1, then: 2, else: 3 } };
          expect($.cond(1).then(2).else(3)).toEqual(expected);
        });
        it('prevents redundant calls to methods', () => {
          expect(() => $.cond(1).then(2).then(3)).toThrow(/redundant/i);
          expect(() => $.cond(1).else(2).else(3)).toThrow(/redundant/i);
        });
      });
    });
    describe('$let', () => {
      it('exports expected vars', () => {
        expect($.let).toBeDefined();
        expect($.$let).toBeDefined();
        expect($.let).toStrictEqual($.$let);
      });
      it('returns expected result', () => {
        const expected = { $let: { vars: { foo: 'bar' }, in: { y: 'z' } } };
        expect($.let({ foo: 'bar' }, { y: 'z' })).toEqual(expected);
        expect($.let({ foo: 'bar' }).in({ y: 'z' })).toEqual(expected);
      });
      it('prevents redundant calls to methods', () => {
        expect(() => $.let({ x: 1 }).vars({ y: 2 })).toThrow();
        expect(() => $.let().in({ x: 1 }).in({ y: 2 })).toThrow();
      });
    });
    describe('$switch', () => {
      it('exports expected vars', () => {
        expect($.switch).toBeDefined();
        expect($.$switch).toBeDefined();
        expect($.switch).toStrictEqual($.$switch);
      });
      it('returns expected result', () => {
        const expected = {
          $switch: {
            branches: [
              { case: 1, then: 1 },
              { case: 2, then: 2 },
            ],
            default: 0,
          },
        };
        expect($.switch(0).branches({ case: 1, then: 1 }, { case: 2, then: 2 })).toEqual(expected);
        expect($.switch().branch(1, 1).branch(2, 2).default(0)).toEqual(expected);
        expect($.switch([{ case: 1, then: 1 }, { case: 2, then: 2 }], 0)).toEqual(expected);
        // expect($.switch(0, [{ case: 1, then: 1 }, { case: 2, then: 2 }])).toEqual(expected);
      });
      it('prevents redundant calls to methods', () => {
        expect(() => $.switch(1).default(2).default(3)).toThrow(/redundant/i);
      });
      describe('branch/case', () => {
        it('exports expected vars', () => {
          expect($.branch).toBeDefined();
          // @ts-expect-error Testing for undefined
          expect($.$branch).not.toBeDefined();
          expect($.case).toBeDefined();
          // @ts-expect-error Testing for undefined
          expect($.$case).not.toBeDefined();
          expect($.branch).toStrictEqual($.case);
        });
        it('returns expected result', () => {
          expect($.case(1, 1)).toEqual({ case: 1, then: 1 });
        });
      });
    });
  });
});
