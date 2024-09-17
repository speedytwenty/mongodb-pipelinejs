import $ from '.';

afterEach(() => jest.clearAllMocks());

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
    describe('$facet', () => {
      it('exports expected vars', () => {
        expect($.facet).toBeDefined();
        expect($.$facet).toBeDefined();
        expect($.facet).toStrictEqual($.$facet);
      });
      const expected = { $facet: { x: [{ $foo: 1 }], y: [{ $bar: 2}] } };
      it('returns expected result', () => {
        expect($.facet({ x: [{ $foo: 1 }] , y: [{ $bar: 2 }] })).toEqual(expected);
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
    describe('$replaceWith', () => {
      it('exports expected vars', () => {
        expect($.replaceWith).toBeDefined();
        expect($.$replaceWith).toBeDefined();
        expect($.replaceWith).toStrictEqual($.$replaceWith);
      });
      it('returns expected result', () => {
        expect($.replaceWith('subdoc')).toEqual({ $replaceWith: 'subdoc' });
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
    describe('$sortByCount', () => {
      it('exports expected vars', () => {
        expect($.sortByCount).toBeDefined();
        expect($.$sortByCount).toBeDefined();
        expect($.sortByCount).toStrictEqual($.$sortByCount);
      });
      it('returns expected result', () => {
        expect($.sortByCount('$x')).toEqual({ $sortByCount: '$x' });
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
    describe('$all', () => {
      it('exports expected vars', () => {
        expect($.all).toBeDefined();
        expect($.$all).toBeDefined();
        expect($.all).toStrictEqual($.$all);
      });
      it('returns expected result', () => {
        expect($.all(1, 2, 3)).toEqual({ $all: [1, 2, 3] });
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
    describe('$anyElementTrue', () => {
      it('exports expected vars', () => {
        expect($.anyElementTrue).toBeDefined();
        expect($.$anyElementTrue).toBeDefined();
        expect($.anyElementTrue).toStrictEqual($.$anyElementTrue);
      });
      it('returns expected result', () => {
        expect($.anyElementTrue('$a', '$b', ['$c', '$d'])).toEqual({ $anyElementTrue: ['$a', '$b', ['$c', '$d']] });
        expect($.anyElementTrue(['$a', '$b', '$c'])).toEqual({ $anyElementTrue: [['$a', '$b', '$c']] });
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
    describe('$arrayElemFirst', () => {
      it('exports expected vars', () => {
        expect($.arrayElemFirst).toBeDefined();
        expect($.$arrayElemFirst).toBeDefined();
        expect($.arrayElemFirst).toStrictEqual($.$arrayElemFirst);
      });
      it('returns expected result', () => {
        expect($.arrayElemFirst('$x')).toEqual({ $arrayElemAt: ['$x', 0] });
      });
    });
    describe('$arrayElemLast', () => {
      it('exports expected vars', () => {
        expect($.arrayElemLast).toBeDefined();
        expect($.$arrayElemLast).toBeDefined();
        expect($.arrayElemLast).toStrictEqual($.$arrayElemLast);
      });
      it('returns expected result', () => {
        const expected = {
          $let: {
            vars: { inputArray: '$x' },
            in: {
              $let: {
                vars: { length: { $size: '$$inputArray' } },
                in: { $arrayElemAt: [
                  '$$inputArray',
                  { $cond: { if: '$$length', then: { $subtract: ['$$length', 1] }, else: 0 } },
                ] },
              },
            },
          },
        };
        expect($.arrayElemLast('$x')).toEqual(expected);
      });
    });
    describe('$arrayToObject', () => {
      it('exports expected vars', () => {
        expect($.arrayToObject).toBeDefined();
        expect($.$arrayToObject).toBeDefined();
        expect($.arrayToObject).toStrictEqual($.$arrayToObject);
      });
      describe('key-value object input', () => {
        it('returns expected result', () => {
          expect($.arrayToObject([{ k: 'item', v: 'abc123' }, { k: 'qty', v: '$qty' }]))
            .toEqual({ $arrayToObject: [{ k: 'item', v: 'abc123' }, { k: 'qty', v: '$qty' }]});
        });
      });
      describe('key-value pair input', () => {
        it('returns expected result', () => {
          expect($.arrayToObject([['item', 'abc123'], ['qty', '$qty']]))
            .toEqual({ $arrayToObject: [['item', 'abc123'], ['qty', '$qty']]});
        });
      });
    });
    describe('$asin', () => {
      it('exports expected vars', () => {
        expect($.asin).toBeDefined();
        expect($.$asin).toBeDefined();
        expect($.asin).toStrictEqual($.$asin);
      });
      it('returns expected result', () => {
        expect($.asin($.divide('$side_a', '$hypotenuse'))).toEqual({ $asin: { $divide: ['$side_a', '$hypotenuse'] } });
      });
    });
    describe('$asinh', () => {
      it('exports expected vars', () => {
        expect($.asinh).toBeDefined();
        expect($.$asinh).toBeDefined();
        expect($.asinh).toStrictEqual($.$asinh);
      });
      it('returns expected result', () => {
        expect($.asinh('$x-coordinate')).toEqual({ $asinh: '$x-coordinate' });
      });
    });
    describe('$atan', () => {
      it('exports expected vars', () => {
        expect($.atan).toBeDefined();
        expect($.$atan).toBeDefined();
        expect($.atan).toStrictEqual($.$atan);
      });
      it('returns expected result', () => {
        expect($.atan('$value')).toEqual({ $atan: '$value' });
      });
    });
    describe('$atanh', () => {
      it('exports expected vars', () => {
        expect($.atanh).toBeDefined();
        expect($.$atanh).toBeDefined();
        expect($.atanh).toStrictEqual($.$atanh);
      });
      it('returns expected result', () => {
        expect($.atan('$value')).toEqual({ $atan: '$value' });
      });
    });
    describe('$avg', () => {
      it('exports expected vars', () => {
        expect($.avg).toBeDefined();
        expect($.$avg).toBeDefined();
        expect($.avg).toStrictEqual($.$avg);
      });
      it('returns expected result', () => {
        expect($.avg('$quantity')).toEqual({ $avg: '$quantity' });
      });
    });
    describe('$binarySize', () => {
      it('exports expected vars', () => {
        expect($.binarySize).toBeDefined();
        expect($.$binarySize).toBeDefined();
        expect($.binarySize).toStrictEqual($.$binarySize);
      });
      it('returns expected result', () => {
        expect($.binarySize('$value')).toEqual({ $binarySize: '$value' });
      });
    });
    describe('$bitAnd', () => {
      it('exports expected vars', () => {
        expect($.bitAnd).toBeDefined();
        expect($.$bitAnd).toBeDefined();
        expect($.bitAnd).toStrictEqual($.$bitAnd);
      });
      it('returns expected result', () => {
        expect($.bitAnd('$a', '$b')).toEqual({ $bitAnd: ['$a', '$b'] });
      });
      it('supports array input', () => {
        expect($.bitAnd(['$a', '$b'])).toEqual({ $bitAnd: ['$a', '$b'] });
      });
    });
    describe('$bsonSize', () => {
      it('exports expected vars', () => {
        expect($.bsonSize).toBeDefined();
        expect($.$bsonSize).toBeDefined();
        expect($.bsonSize).toStrictEqual($.$bsonSize);
      });
      it('returns expected result', () => {
        expect($.bsonSize('$$ROOT')).toEqual({ $bsonSize: '$$ROOT' });
      });
    });
    describe('$ceil', () => {
      it('exports expected vars', () => {
        expect($.ceil).toBeDefined();
        expect($.$ceil).toBeDefined();
        expect($.ceil).toStrictEqual($.$ceil);
      });
      it('returns expected result', () => {
        expect($.ceil('$value')).toEqual({ $ceil: '$value' });
      });
    });
    describe('$comment', () => {
      it('exports expected vars', () => {
        expect($.comment).toBeDefined();
        expect($.$comment).toBeDefined();
        expect($.comment).toStrictEqual($.$comment);
      });
      it('returns expected result', () => {
        expect($.comment('foo')).toEqual({ $comment: 'foo' });
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
    describe('$concat', () => {
      it('exports expected vars', () => {
        expect($.concat).toBeDefined();
        expect($.$concat).toBeDefined();
        expect($.concat).toStrictEqual($.$concat);
      });
      it('returns expected result', () => {
        expect($.concat('$item', ' - ', '$description')).toEqual({ $concat: ['$item', ' - ', '$description'] });
      });
      it('supports array input as first argument', () => {
        expect($.concat(['$item', ' - ', '$description'])).toEqual({ $concat: ['$item', ' - ', '$description'] });
      });
    });
    describe('$concatSafe', () => {
      it('exports expected vars', () => {
        expect($.concatSafe).toBeDefined();
        expect($.$concatSafe).toBeDefined();
        expect($.concatSafe).toStrictEqual($.$concatSafe);
      });
      const expected = { $concat: [
        { $convert: { input: '$item', to: 2, onNull: '', onError: '' } },
        ' - ',
        { $convert: { input: '$description', to: 2, onNull: '', onError: '' } },
      ]};
      it('returns expected result', () => {
        expect($.concatSafe('$item', ' - ', '$description')).toEqual(expected);
      });
      it('supports array input as first argument', () => {
        expect($.concatSafe(['$item', ' - ', '$description'])).toEqual(expected);
      });
    });
    describe('$concatArrays', () => {
      it('exports expected vars', () => {
        expect($.concatArrays).toBeDefined();
        expect($.$concatArrays).toBeDefined();
        expect($.concatArrays).toStrictEqual($.$concatArrays);
      });
      it('returns expected result', () => {
        expect($.concatArrays('$myArr', [1, 2])).toEqual({ $concatArrays: ['$myArr', [1, 2]] });
        expect($.concatArrays([1, 2], '$myArr', [3])).toEqual({ $concatArrays: [[1, 2], '$myArr', [3]] });
      });
    });
    describe('$concatArraysSafe', () => {
      it('exports expected vars', () => {
        expect($.concatArraysSafe).toBeDefined();
        expect($.$concatArraysSafe).toBeDefined();
        expect($.concatArraysSafe).toStrictEqual($.$concatArraysSafe);
      });
      it('returns expected result', () => {
        expect($.concatArraysSafe([1, 2], [4, 5], '$c')).toEqual({
          $concatArrays: [
            [1, 2],
            [4, 5],
            { $let: {
              vars: { input: '$c' },
              in: { $cond: { if: { $isArray: '$$input' }, then: '$$input', else: [] } },
            } },
          ],
        });
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
    describe('$convert', () => {
      it('exports expected vars', () => {
        expect($.convert).toBeDefined();
        expect($.$convert).toBeDefined();
        expect($.convert).toStrictEqual($.$convert);
      });
      describe('static notation', () => {
        it('returns expected result', () => {
          expect($.convert('$value', 2)).toEqual({ $convert: { input: '$value', to: 2 } });
          expect($.convert('$value', 'string')).toEqual({ $convert: { input: '$value', to: 'string' } });
          expect($.convert('$value', 'string', 'N/A')).toEqual({ $convert: { input: '$value', to: 'string', onError: 'N/A', onNull: 'N/A' } });
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          expect($.convert('$value', 2)).toEqual({ $convert: { input: '$value', to: 2 } });
          expect($.convert('$value', 'string').default('N/A')).toEqual({ $convert: { input: '$value', to: 'string', onError: 'N/A', onNull: 'N/A' } });
          expect($.convert('$value', 'string').onError('e').onNull('n'))
            .toEqual({ $convert: { input: '$value', to: 'string', onError: 'e', onNull: 'n' } });
        });
      });
    });
    describe('$cos', () => {
      it('exports expected vars', () => {
        expect($.cos).toBeDefined();
        expect($.$cos).toBeDefined();
        expect($.cos).toStrictEqual($.$cos);
      });
      it('returns expected result', () => {
        expect($.cos('$value')).toEqual({ $cos: '$value' });
      });
    });
    describe('$cosh', () => {
      it('exports expected vars', () => {
        expect($.cosh).toBeDefined();
        expect($.$cosh).toBeDefined();
        expect($.cosh).toStrictEqual($.$cosh);
      });
      it('returns expected result', () => {
        expect($.cosh('$value')).toEqual({ $cosh: '$value' });
      });
    });
    describe('$covariancePop', () => {
      it('exports expected vars', () => {
        expect($.covariancePop).toBeDefined();
        expect($.$covariancePop).toBeDefined();
        expect($.covariancePop).toStrictEqual($.$covariancePop);
      });
      it('returns expected result', () => {
        expect($.covariancePop($.year('$orderDate'), '$qty')).toEqual({ $covariancePop: [{ $year: '$orderDate' }, '$qty'] });
      });
    });
    describe('$covarianceSamp', () => {
      it('exports expected vars', () => {
        expect($.covarianceSamp).toBeDefined();
        expect($.$covarianceSamp).toBeDefined();
        expect($.covarianceSamp).toStrictEqual($.$covarianceSamp);
      });
      it('returns expected result', () => {
        expect($.covarianceSamp($.year('$orderDate'), '$qty')).toEqual({ $covarianceSamp: [{ $year: '$orderDate' }, '$qty'] });
      });
    });
    describe('$decrement', () => {
      it('exports expected vars', () => {
        expect($.decrement).toBeDefined();
        expect($.$decrement).toBeDefined();
        expect($.decrement).toStrictEqual($.$decrement);
      });
      it('returns expected result', () => {
        expect($.decrement('$value')).toEqual({ $subtract: ['$value', 1] });
      });
    });
    describe('$degreesToRadians', () => {
      it('exports expected vars', () => {
        expect($.degreesToRadians).toBeDefined();
        expect($.$degreesToRadians).toBeDefined();
        expect($.degreesToRadians).toStrictEqual($.$degreesToRadians);
      });
      it('returns expected result', () => {
        expect($.degreesToRadians('$value')).toEqual({ $degreesToRadians: '$value' });
      });
    });
    // TODO $denseRank
    describe('$divide', () => {
      it('exports expected vars', () => {
        expect($.divide).toBeDefined();
        expect($.$divide).toBeDefined();
        expect($.divide).toStrictEqual($.$divide);
      });
      it('returns expected result', () => {
        expect($.divide('$a', '$b')).toEqual({ $divide: ['$a', '$b'] });
      });
    });
    describe('$divideSafe', () => {
      it('exports expected vars', () => {
        expect($.divideSafe).toBeDefined();
        expect($.$divideSafe).toBeDefined();
        expect($.divideSafe).toStrictEqual($.$divideSafe);
      });
      it('returns expected result', () => {
        expect($.divideSafe('$a', '$b')).toEqual({
          $let: {
            vars: {
              dividend: { $ifNull: ['$a', 0] },
              divisor: { $ifNull: ['$b', 0] },
            },
            in: { $cond: {
              if: { $eq: ['$$divisor', 0] },
              then: '$$REMOVE',
              else: { $divide: ['$$dividend', '$$divisor'] },
            } },
          },
        });
      });
      describe('literal input', () => {
        expect($.divideSafe(9, 3)).toEqual({ $divide: [9, 3] });
        expect($.divideSafe(true, 3)).toEqual(0);
        expect($.divideSafe(9, false)).toEqual(0);
        expect($.divideSafe(9, null)).toEqual(0);
        expect($.divideSafe(null, 3)).toEqual(0);
      });
    });
    describe('$documentNumber', () => {
      it('exports expected vars', () => {
        expect($.documentNumber).toBeDefined();
        expect($.$documentNumber).toBeDefined();
        expect($.documentNumber).toStrictEqual($.$documentNumber);
      });
      it('returns expected result', () => {
        expect($.documentNumber()).toEqual({ $documentNumber: {} });
      });
    });
    describe('$ensureArray', () => {
      it('exports expected vars', () => {
        expect($.ensureArray).toBeDefined();
        expect($.$ensureArray).toBeDefined();
        expect($.ensureArray).toStrictEqual($.$ensureArray);
      });
      it('returns expected result', () => {
        expect($.ensureArray('$myVar'))
          .toEqual({ $let: {
            vars: { input: '$myVar' },
            in: { $cond: { if: { $isArray: '$$input' }, then: '$$input', else: [] } }
          }});
      });
      describe('literal input', () => {
        it('returns expected result', () => {
          expect($.ensureArray('myVar')).toEqual([]);
          expect($.ensureArray(123)).toEqual([]);
          expect($.ensureArray(123.4)).toEqual([]);
          expect($.ensureArray(true)).toEqual([]);
          expect($.ensureArray(false)).toEqual([]);
          expect($.ensureArray(null)).toEqual([]);
          expect($.ensureArray(undefined)).toEqual([]);
        });
      });
    });
    describe('$ensureNumber', () => {
      it('exports expected vars', () => {
        expect($.ensureNumber).toBeDefined();
        expect($.$ensureNumber).toBeDefined();
        expect($.ensureNumber).toStrictEqual($.$ensureNumber);
      });
      it('returns expected result', () => {
        expect($.ensureNumber('$myVar'))
          .toEqual({ $let: {
            vars: { input: '$myVar' },
            in: { $cond: {
              if: { $isNumber: '$$input' },
              then: '$$input',
              else: { $convert: { input: '$$input', to: 1, onError: 0, onNull: 0 } },
            } },
          }});
      });
      describe('literal input', () => {
        it('returns expected result', () => {
          expect($.ensureNumber('myVar')).toEqual({ $toDouble: 'myVar' });
          expect($.ensureNumber(123)).toEqual(123);
          expect($.ensureNumber(123.4)).toEqual(123.4);
          expect($.ensureNumber(true)).toEqual(1);
          expect($.ensureNumber(false)).toEqual(0);
          expect($.ensureNumber(null)).toEqual(0);
          expect($.ensureNumber(undefined)).toEqual(0);
        });
      });
    });
    describe('$ensureString', () => {
      it('exports expected vars', () => {
        expect($.ensureString).toBeDefined();
        expect($.$ensureString).toBeDefined();
        expect($.ensureString).toStrictEqual($.$ensureString);
      });
      it('returns expected result', () => {
        expect($.ensureString('$myVar')).toEqual({ $convert: { input: '$myVar', to: 2, onError: '', onNull: '' } });
      });
      describe('literal input', () => {
        it('returns expected result', () => {
          expect($.ensureString('value')).toEqual('value');
          expect($.ensureString(123)).toEqual('123');
          expect($.ensureString(123.4)).toEqual('123.4');
          expect($.ensureString(true)).toEqual('true');
          expect($.ensureString(false)).toEqual('false');
          expect($.ensureString(null, '-')).toEqual('-');
        });
      });
    });
    describe('$each', () => {
      it('exports expected vars', () => {
        expect($.each).toBeDefined();
        expect($.$each).toBeDefined();
        expect($.each).toStrictEqual($.$each);
      });
      it('returns expected result', () => {
        expect($.each('$value')).toEqual({ $each: '$value' });
      });
    });
    describe('$elemMatch', () => {
      it('exports expected vars', () => {
        expect($.elemMatch).toBeDefined();
        expect($.$elemMatch).toBeDefined();
        expect($.elemMatch).toStrictEqual($.$elemMatch);
      });
      it('returns expected result', () => {
        expect($.elemMatch('$value')).toEqual({ $elemMatch: '$value' });
      });
    });
    describe('$eq', () => {
      it('exports expected vars', () => {
        expect($.eq).toBeDefined();
        expect($.$eq).toBeDefined();
        expect($.eq).toStrictEqual($.$eq);
      });
      it('returns expected result', () => {
        expect($.eq('$value', 1)).toEqual({ $eq: ['$value', 1] });
        expect($.eq(['$value'], 1)).toEqual({ $eq: [['$value'], 1] });
      });
    });
    describe('$exists', () => {
      it('exports expected vars', () => {
        expect($.exists).toBeDefined();
        expect($.$exists).toBeDefined();
        expect($.exists).toStrictEqual($.$exists);
      });
      it('returns expected result', () => {
        expect($.exists('$value')).toEqual({ $exists: '$value' });
      });
    });
    describe('$exp', () => {
      it('exports expected vars', () => {
        expect($.exp).toBeDefined();
        expect($.$exp).toBeDefined();
        expect($.exp).toStrictEqual($.$exp);
      });
      it('returns expected result', () => {
        expect($.exp('$value')).toEqual({ $exp: '$value' });
      });
    });
    describe('$expr', () => {
      it('exports expected vars', () => {
        expect($.expr).toBeDefined();
        expect($.$expr).toBeDefined();
        expect($.expr).toStrictEqual($.$expr);
      });
      it('returns expected result', () => {
        expect($.expr('$value')).toEqual({ $expr: '$value' });
      });
    });
    describe('$filter', () => {
      it('exports expected vars', () => {
        expect($.filter).toBeDefined();
        expect($.$filter).toBeDefined();
        expect($.filter).toStrictEqual($.$filter);
      });
      describe('static notation', () => {
        it('returns expected result', () => {
          expect($.filter('$myArray', 'item', '$$item.sold'))
            .toEqual({ $filter: { input: '$myArray', as: 'item', cond: '$$item.sold' } });
          expect($.filter('$myArray', 'item', '$$item.sold', 10))
            .toEqual({ $filter: { input: '$myArray', as: 'item', cond: '$$item.sold', limit: 10 } });
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          expect($.filter('$myArray').as('item').cond('$$item.sold').limit(10))
            .toEqual({ $filter: { input: '$myArray', as: 'item', cond: '$$item.sold', limit: 10 } });
        });
      });
    });
    describe('$find', () => {
      it('exports expected vars', () => {
        expect($.find).toBeDefined();
        expect($.$find).toBeDefined();
        expect($.find).toStrictEqual($.$find);
      });
      it('returns expected result', () => {
        expect($.find('$input', 'foo', '$cond')).toEqual({
          $arrayElemAt: [{
            $filter: {
              input: '$input',
              as: 'foo',
              cond: '$cond',
            },
          }, 0],
        });
      });
    });
    describe('$first', () => {
      it('exports expected vars', () => {
        expect($.first).toBeDefined();
        expect($.$first).toBeDefined();
        expect($.first).toStrictEqual($.$first);
      });
      it('returns expected result', () => {
        expect($.first('$value')).toEqual({ $first: '$value' });
      });
    });
    describe('$floor', () => {
      it('exports expected vars', () => {
        expect($.floor).toBeDefined();
        expect($.$floor).toBeDefined();
        expect($.floor).toStrictEqual($.$floor);
      });
      it('returns expected result', () => {
        expect($.floor('$value')).toEqual({ $floor: '$value' });
      });
    });
    describe('$getField', () => {
      it('exports expected vars', () => {
        expect($.getField).toBeDefined();
        expect($.$getField).toBeDefined();
        expect($.getField).toStrictEqual($.$getField);
      });
      it('returns expected result', () => {
        expect($.getField('foo')).toEqual({ $getField: { field: 'foo' } });
        expect($.getField('foo', '$doc')).toEqual({ $getField: { field: 'foo', input: '$doc' } });
      });
    });
    describe('$gt', () => {
      it('exports expected vars', () => {
        expect($.gt).toBeDefined();
        expect($.$gt).toBeDefined();
        expect($.gt).toStrictEqual($.$gt);
      });
      it('returns expected result', () => {
        expect($.gt('$value', 1)).toEqual({ $gt: ['$value', 1] });
      });
    });
    describe('$gte', () => {
      it('exports expected vars', () => {
        expect($.gte).toBeDefined();
        expect($.$gte).toBeDefined();
        expect($.gte).toStrictEqual($.$gte);
      });
      it('returns expected result', () => {
        expect($.gte(['$value', 1])).toEqual({ $gte: ['$value', 1] });
      });
    });
    describe('$if', () => {
      it('exports expected vars', () => {
        expect($.if).toBeDefined();
        expect($.$if).toBeDefined();
        expect($.if).toStrictEqual($.$if);
      });
      it('returns expected result', () => {
        const expected = { $cond: { if: 1, then: 2, else: 3 } };
        expect($.if(1).then(2).else(3)).toEqual(expected);
      });
      it('prevents redundant calls to methods', () => {
        expect(() => $.if(1).then(2).then(3)).toThrow(/redundant/i);
        expect(() => $.if(1).else(2).else(3)).toThrow(/redundant/i);
      });
    });
    describe('ifNull', () => {
      it('exports expected vars', () => {
        expect($.ifNull).toBeDefined();
        expect($.$ifNull).toBeDefined();
        expect($.ifNull).toStrictEqual($.$ifNull);
      });
      it('returns expected result', () => {
        expect($.ifNull('$value', 1)).toEqual({ $ifNull: ['$value', 1] });
      });
    });
    describe('$isArray', () => {
      it('exports expected vars', () => {
        expect($.isArray).toBeDefined();
        expect($.$isArray).toBeDefined();
        expect($.isArray).toStrictEqual($.$isArray);
      });
      it('returns expected result', () => {
        expect($.isArray('$value')).toEqual({ $isArray: '$value' });
      });
    });
    describe('$isNumber', () => {
      it('exports expected vars', () => {
        expect($.isNumber).toBeDefined();
        expect($.$isNumber).toBeDefined();
        expect($.isNumber).toStrictEqual($.$isNumber);
      });
      it('returns expected result', () => {
        expect($.isNumber('$value')).toEqual({ $isNumber: '$value' });
      });
    });
    describe('$last', () => {
      it('exports expected vars', () => {
        expect($.last).toBeDefined();
        expect($.$last).toBeDefined();
        expect($.last).toStrictEqual($.$last);
      });
      it('returns expected result', () => {
        expect($.last('$value')).toEqual({ $last: '$value' });
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
    describe('$linearFill', () => {
      it('exports expected vars', () => {
        expect($.linearFill).toBeDefined();
        expect($.$linearFill).toBeDefined();
        expect($.linearFill).toStrictEqual($.$linearFill);
      });
      it('returns expected result', () => {
        expect($.linearFill('$value')).toEqual({ $linearFill: '$value' });
      });
    });
    describe('$literal', () => {
      it('exports expected vars', () => {
        expect($.literal).toBeDefined();
        expect($.$literal).toBeDefined();
        expect($.literal).toStrictEqual($.$literal);
      });
      it('returns expected result', () => {
        expect($.literal('value')).toEqual({ $literal: 'value' });
      });
    });
    describe('$locf', () => {
      it('exports expected vars', () => {
        expect($.locf).toBeDefined();
        expect($.$locf).toBeDefined();
        expect($.locf).toStrictEqual($.$locf);
      });
      it('returns expected result', () => {
        expect($.locf('$value')).toEqual({ $locf: '$value' });
      });
    });
    describe('$log', () => {
      it('exports expected vars', () => {
        expect($.log).toBeDefined();
        expect($.$log).toBeDefined();
        expect($.log).toStrictEqual($.$log);
      });
      it('returns expected result', () => {
        expect($.log('$int', 2)).toEqual({ $log: ['$int', 2] });
      });
    });
    describe('$log10', () => {
      it('exports expected vars', () => {
        expect($.log10).toBeDefined();
        expect($.$log10).toBeDefined();
        expect($.log10).toStrictEqual($.$log10);
      });
      it('returns expected result', () => {
        expect($.log10('$value')).toEqual({ $log10: '$value' });
      });
    });
    describe('$lt', () => {
      it('exports expected vars', () => {
        expect($.lt).toBeDefined();
        expect($.$lt).toBeDefined();
        expect($.lt).toStrictEqual($.$lt);
      });
      it('returns expected result', () => {
        expect($.lt('$value', 1)).toEqual({ $lt: ['$value', 1] });
      });
    });
    describe('$lte', () => {
      it('exports expected vars', () => {
        expect($.lte).toBeDefined();
        expect($.$lte).toBeDefined();
        expect($.lte).toStrictEqual($.$lte);
      });
      it('returns expected result', () => {
        expect($.lte(['$value', 1])).toEqual({ $lte: ['$value', 1] });
      });
    });
    describe('$map', () => {
      it('exports expected vars', () => {
        expect($.map).toBeDefined();
        expect($.$map).toBeDefined();
        expect($.map).toStrictEqual($.$map);
      });
      describe('static notation', () => {
        it('returns expected result', () => {
          expect($.map('$myArray', 'item', '$$item.name'))
            .toEqual({ $map: { input: '$myArray', as: 'item', in: '$$item.name' } });
        });
      });
      describe('object notation', () => {
        it('returns expected result', () => {
          expect($.map('$myArray').as('item').in('$$item.name'))
            .toEqual({ $map: { input: '$myArray', as: 'item', in: '$$item.name' } });
        });
      });
    });
    describe('$max', () => {
      it('exports expected vars', () => {
        expect($.max).toBeDefined();
        expect($.$max).toBeDefined();
        expect($.max).toStrictEqual($.$max);
      });
      it('returns expected result', () => {
        expect($.max('$value')).toEqual({ $max: '$value' });
      });
      it('supports array arg', () => {
        expect($.max(['$value'])).toEqual({ $max: ['$value'] });
      });
    });
    describe('$meta', () => {
      it('exports expected vars', () => {
        expect($.meta).toBeDefined();
        expect($.$meta).toBeDefined();
        expect($.meta).toStrictEqual($.$meta);
      });
      it('returns expected result', () => {
        expect($.meta('$value')).toEqual({ $meta: '$value' });
      });
    });
    describe('$min', () => {
      it('exports expected vars', () => {
        expect($.min).toBeDefined();
        expect($.$min).toBeDefined();
        expect($.min).toStrictEqual($.$min);
      });
      it('returns expected result', () => {
        expect($.min('$value')).toEqual({ $min: '$value' });
      });
      it('supports array arg', () => {
        expect($.min(['$value'])).toEqual({ $min: ['$value'] });
      });
    });
    describe('$mod', () => {
      it('exports expected vars', () => {
        expect($.mod).toBeDefined();
        expect($.$mod).toBeDefined();
        expect($.mod).toStrictEqual($.$mod);
      });
      it('returns expected result', () => {
        expect($.mod('$hours', '$tasks')).toEqual({ $mod: ['$hours', '$tasks'] });
      });
    });
    describe('$multiply', () => {
      it('exports expected vars', () => {
        expect($.multiply).toBeDefined();
        expect($.$multiply).toBeDefined();
        expect($.multiply).toStrictEqual($.$multiply);
      });
      it('returns expected result', () => {
        expect($.multiply('$a', '$b', '$c')).toEqual({ $multiply: ['$a', '$b', '$c'] });
      });
    });
    describe('$multiplySafe', () => {
      it('exports expected vars', () => {
        expect($.multiplySafe).toBeDefined();
        expect($.$multiplySafe).toBeDefined();
        expect($.multiplySafe).toStrictEqual($.$multiplySafe);
      });
      it('returns expected result', () => {
        expect($.multiplySafe('$hours', '$tasks')).toEqual({ $multiply: [{ $ifNull: ['$hours', 0] }, { $ifNull: ['$tasks', 0] }] });
      });
    });
    describe('$ne', () => {
      it('exports expected vars', () => {
        expect($.ne).toBeDefined();
        expect($.$ne).toBeDefined();
        expect($.ne).toStrictEqual($.$ne);
      });
      it('returns expected result', () => {
        expect($.ne('$value', 3)).toEqual({ $ne: ['$value', 3] });
      });
    });
    describe('$nin', () => {
      it('exports expected vars', () => {
        expect($.nin).toBeDefined();
        expect($.$nin).toBeDefined();
        expect($.nin).toStrictEqual($.$nin);
      });
      it('returns expected result', () => {
        expect($.nin('$myArray')).toEqual({ $nin: '$myArray' });
        expect($.nin([1, 3, 5])).toEqual({ $nin: [1, 3, 5] });
        expect($.nin('$val', '$myArray')).toEqual({ $nin: ['$val', '$myArray'] });
      });
    });
    describe('$not', () => {
      it('exports expected vars', () => {
        expect($.not).toBeDefined();
        expect($.$not).toBeDefined();
        expect($.not).toStrictEqual($.$not);
      });
      it('returns expected result', () => {
        expect($.not('$value')).toEqual({ $not: '$value' });
      });
    });
    describe('$objectToArray', () => {
      it('exports expected vars', () => {
        expect($.objectToArray).toBeDefined();
        expect($.$objectToArray).toBeDefined();
        expect($.objectToArray).toStrictEqual($.$objectToArray);
      });
      it('returns expected result', () => {
        expect($.objectToArray('$value')).toEqual({ $objectToArray: '$value' });
      });
    });
    describe('$or', () => {
      it('exports expected vars', () => {
        expect($.or).toBeDefined();
        expect($.$or).toBeDefined();
        expect($.or).toStrictEqual($.$or);
      });
      it('returns expected result', () => {
        expect($.or('$a', '$b', '$c')).toEqual({ $or: ['$a', '$b', '$c'] });
        expect($.or(['$a', '$b', '$c'])).toEqual({ $or: ['$a', '$b', '$c'] });
      });
    });
    describe('$pow', () => {
      it('exports expected vars', () => {
        expect($.pow).toBeDefined();
        expect($.$pow).toBeDefined();
        expect($.pow).toStrictEqual($.$pow);
      });
      it('returns expected result', () => {
        expect($.pow('$value', 2)).toEqual({ $pow: ['$value', 2] });
      });
    });
    describe('$push', () => {
      it('exports expected vars', () => {
        expect($.push).toBeDefined();
        expect($.$push).toBeDefined();
        expect($.push).toStrictEqual($.$push);
      });
      it('returns expected result', () => {
        expect($.push('$value')).toEqual({ $push: '$value' });
      });
    });
    describe('$radiansToDegrees', () => {
      it('exports expected vars', () => {
        expect($.radiansToDegrees).toBeDefined();
        expect($.$radiansToDegrees).toBeDefined();
        expect($.radiansToDegrees).toStrictEqual($.$radiansToDegrees);
      });
      it('returns expected result', () => {
        expect($.radiansToDegrees('$value')).toEqual({ $radiansToDegrees: '$value' });
      });
    });
    describe('$round', () => {
      it('exports expected vars', () => {
        expect($.round).toBeDefined();
        expect($.$round).toBeDefined();
        expect($.round).toStrictEqual($.$round);
      });
      it('returns expected result', () => {
        expect($.round('$value')).toEqual({ $round: ['$value', 0] });
        expect($.round('$value', 2)).toEqual({ $round: ['$value', 2] });
      });
    });
    describe('$roundStandard', () => {
      it('exports expected vars', () => {
        expect($.roundStandard).toBeDefined();
        expect($.$roundStandard).toBeDefined();
        expect($.roundStandard).toStrictEqual($.$roundStandard);
      });
      describe('without decimal places', () => {
        it('returns expected result', () => {
          expect($.roundStandard('$value')).toEqual({
            $let: {
              vars: { input: '$value' },
              in: { $let: {
                vars: {
                  val: { $add: [
                    '$$input',
                    { $cond: { if: { $gte: ['$$input', 0] }, then: 0.5, else: -0.5 } },
                  ] },
                },
                in: { $subtract: ['$$val', { $mod: ['$$val', 1] }] },
              } },
            },
          });
        });
      });
      describe('with decimal places', () => {
        it('returns expected result', () => {
          expect($.roundStandard('$value', 2)).toEqual({
            $let: {
              vars: { input: '$value' },
              in: { $let: {
                vars: {
                  val: { $add: [
                    { $multiply: ['$$input', 100] },
                    { $cond: { if: { $gte: ['$$input', 0] }, then: 0.5, else: -0.5 } },
                  ] },
                },
                in: { $divide: [
                  { $subtract: ['$$val', { $mod: ['$$val', 1] }] },
                  100,
                ] },
              } },
            },
          });
        });
      });
    });
    describe('$sampleRate', () => {
      it('exports expected vars', () => {
        expect($.sampleRate).toBeDefined();
        expect($.$sampleRate).toBeDefined();
        expect($.sampleRate).toStrictEqual($.$sampleRate);
      });
      it('returns expected result', () => {
        expect($.sampleRate('$value')).toEqual({ $sampleRate: '$value' });
      });
    });
    describe('$setDifference', () => {
      it('exports expected vars', () => {
        expect($.setDifference).toBeDefined();
        expect($.$setDifference).toBeDefined();
        expect($.setDifference).toStrictEqual($.$setDifference);
      });
      it('returns expected result', () => {
        expect($.setDifference([1, 2, 3], '$value')).toEqual({ $setDifference: [[1, 2, 3], '$value'] });
        expect($.setDifference('$value', [1, 2, 3])).toEqual({ $setDifference: ['$value', [1, 2, 3]] });
      });
    });
    describe('$setField', () => {
      it('exports expected vars', () => {
        expect($.setField).toBeDefined();
        expect($.$setField).toBeDefined();
        expect($.setField).toStrictEqual($.$setField);
      });
      it('returns expected result', () => {
        expect($.setField('foo', '$value', '$doc')).toEqual({
          $setField: {
            field: 'foo',
            value: '$value',
            input: '$doc',
          },
        });
      });
    });
    describe('$setIsSubset', () => {
      it('exports expected vars', () => {
        expect($.setIsSubset).toBeDefined();
        expect($.$setIsSubset).toBeDefined();
        expect($.setIsSubset).toStrictEqual($.$setIsSubset);
      });
      it('returns expected result', () => {
        expect($.setIsSubset([1, 2, 3], '$value')).toEqual({ $setIsSubset: [[1, 2, 3], '$value'] });
        expect($.setIsSubset('$value', [1, 2, 3])).toEqual({ $setIsSubset: ['$value', [1, 2, 3]] });
      });
    });
    describe('$in', () => {
      it('exports expected vars', () => {
        expect($.in).toBeDefined();
        expect($.$in).toBeDefined();
        expect($.in).toStrictEqual($.$in);
      });
      it('returns expected result', () => {
        expect($.in('$myArray')).toEqual({ $in: '$myArray' });
        expect($.in([1, 3, 5])).toEqual({ $in: [1, 3, 5] });
        expect($.in('$val', '$myArray')).toEqual({ $in: ['$val', '$myArray'] });
      });
    });
    describe('$increment', () => {
      it('exports expected vars', () => {
        expect($.increment).toBeDefined();
        expect($.$increment).toBeDefined();
        expect($.increment).toStrictEqual($.$increment);
      });
      it('returns expected result', () => {
        expect($.increment('$value')).toEqual({ $add: ['$value', 1] });
      });
    });
    describe('$size', () => {
      it('exports expected vars', () => {
        expect($.size).toBeDefined();
        expect($.$size).toBeDefined();
        expect($.size).toStrictEqual($.$size);
      });
      it('returns expected result', () => {
        expect($.size('$myArray')).toEqual({ $size: '$myArray' });
      });
    });
    describe('$slice', () => {
      it('exports expected vars', () => {
        expect($.slice).toBeDefined();
        expect($.$slice).toBeDefined();
        expect($.slice).toStrictEqual($.$slice);
      });
      it('returns expected result', () => {
        expect($.slice('$myArray', 2)).toEqual({ $slice: ['$myArray', 2] });
      });
    });
    describe('$split', () => {
      it('exports expected vars', () => {
        expect($.split).toBeDefined();
        expect($.$split).toBeDefined();
        expect($.split).toStrictEqual($.$split);
      });
      it('returns expected result', () => {
        expect($.split('$myString', '-')).toEqual({ $split: ['$myString', '-'] });
      });
    });
    describe('$sqrt', () => {
      it('exports expected vars', () => {
        expect($.sqrt).toBeDefined();
        expect($.$sqrt).toBeDefined();
        expect($.sqrt).toStrictEqual($.$sqrt);
      });
      it('returns expected result', () => {
        expect($.sqrt('$value')).toEqual({ $sqrt: '$value' });
      });
    });
    describe('$strcasecmp', () => {
      it('exports expected vars', () => {
        expect($.strcasecmp).toBeDefined();
        expect($.$strcasecmp).toBeDefined();
        expect($.strcasecmp).toStrictEqual($.$strcasecmp);
      });
      it('returns expected result', () => {
        expect($.strcasecmp('$quarter', '13q4')).toEqual({ $strcasecmp: ['$quarter', '13q4'] });
      });
    });
    describe('$strLenBytes', () => {
      it('exports expected vars', () => {
        expect($.strLenBytes).toBeDefined();
        expect($.$strLenBytes).toBeDefined();
        expect($.strLenBytes).toStrictEqual($.$strLenBytes);
      });
      it('returns expected result', () => {
        expect($.strLenBytes('$value')).toEqual({ $strLenBytes: '$value' });
      });
    });
    describe('$strLenCP', () => {
      it('exports expected vars', () => {
        expect($.strLenCP).toBeDefined();
        expect($.$strLenCP).toBeDefined();
        expect($.strLenCP).toStrictEqual($.$strLenCP);
      });
      it('returns expected result', () => {
        expect($.strLenCP('$value')).toEqual({ $strLenCP: '$value' });
      });
    });
    describe('$subtract', () => {
      it('exports expected vars', () => {
        expect($.subtract).toBeDefined();
        expect($.$subtract).toBeDefined();
        expect($.subtract).toStrictEqual($.$subtract);
      });
      it('returns expected result', () => {
        expect($.subtract('$value', 1)).toEqual({ $subtract: ['$value', 1] });
      });
    });
    describe('$subtractSafe', () => {
      it('exports expected vars', () => {
        expect($.subtractSafe).toBeDefined();
        expect($.$subtractSafe).toBeDefined();
        expect($.subtractSafe).toStrictEqual($.$subtractSafe);
      });
      it('returns expected result', () => {
        expect($.subtractSafe('$a', '$b')).toEqual({ $subtract: [{ $ifNull: ['$a', 0] }, { $ifNull: ['$b', 0] }] });
      });
      describe('literal input', () => {
        it('returns expected result', () => {
          expect($.subtractSafe('$a', 1)).toEqual({ $subtract: [{ $ifNull: ['$a', 0] }, 1] });
          expect($.subtractSafe(3, '$b')).toEqual({ $subtract: [3, { $ifNull: ['$b', 0] }] });
          expect($.subtractSafe(3, 1)).toEqual({ $subtract: [3, 1] });
          expect($.subtractSafe(true, 1)).toEqual({ $subtract: [1, 1] });
          expect($.subtractSafe('$a', false)).toEqual({ $subtract: [{ $ifNull: ['$a', 0] }, 0] });
          expect($.subtractSafe(3, false)).toEqual({ $subtract: [3, 0] });
          expect($.subtractSafe(3, null)).toEqual({ $subtract: [3, 0] });
          expect($.subtractSafe(3, undefined)).toEqual({ $subtract: [3, 0] });
        });
      });
    });
    describe('$substr', () => {
      it('exports expected vars', () => {
        expect($.substr).toBeDefined();
        expect($.$substr).toBeDefined();
        expect($.substr).toStrictEqual($.$substr);
      });
      it('returns expected result', () => {
        expect($.substr('$value', 1)).toEqual({ $substr: ['$value', 1] });
        expect($.substr('$value', 1, 2)).toEqual({ $substr: ['$value', 1, 2] });
      });
    });
    describe('$sum', () => {
      it('exports expected vars', () => {
        expect($.sum).toBeDefined();
        expect($.$sum).toBeDefined();
        expect($.sum).toStrictEqual($.$sum);
      });
      it('returns expected result', () => {
        expect($.sum('$value')).toEqual({ $sum: '$value' });
        expect($.sum(['$value'])).toEqual({ $sum: ['$value'] });
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
    describe('$tan', () => {
      it('exports expected vars', () => {
        expect($.tan).toBeDefined();
        expect($.$tan).toBeDefined();
        expect($.tan).toStrictEqual($.$tan);
      });
      it('returns expected result', () => {
        expect($.tan('$value')).toEqual({ $tan: '$value' });
      });
    });
    describe('$tanh', () => {
      it('exports expected vars', () => {
        expect($.tanh).toBeDefined();
        expect($.$tanh).toBeDefined();
        expect($.tanh).toStrictEqual($.$tanh);
      });
      it('returns expected result', () => {
        expect($.tanh('$value')).toEqual({ $tanh: '$value' });
      });
    });
    describe('$toBool', () => {
      it('exports expected vars', () => {
        expect($.toBool).toBeDefined();
        expect($.$toBool).toBeDefined();
        expect($.toBool).toStrictEqual($.$toBool);
      });
      it('returns expected result', () => {
        expect($.toBool('$value')).toEqual({ $toBool: '$value' });
      });
    });
    describe('$toDate', () => {
      it('exports expected vars', () => {
        expect($.toDate).toBeDefined();
        expect($.$toDate).toBeDefined();
        expect($.toDate).toStrictEqual($.$toDate);
      });
      it('returns expected result', () => {
        expect($.toDate('$value')).toEqual({ $toDate: '$value' });
      });
    });
    describe('$toDecimal', () => {
      it('exports expected vars', () => {
        expect($.toDecimal).toBeDefined();
        expect($.$toDecimal).toBeDefined();
        expect($.toDecimal).toStrictEqual($.$toDecimal);
      });
      it('returns expected result', () => {
        expect($.toDecimal('$value')).toEqual({ $toDecimal: '$value' });
      });
    });
    describe('$toDouble', () => {
      it('exports expected vars', () => {
        expect($.toDouble).toBeDefined();
        expect($.$toDouble).toBeDefined();
        expect($.toDouble).toStrictEqual($.$toDouble);
      });
      it('returns expected result', () => {
        expect($.toDouble('$value')).toEqual({ $toDouble: '$value' });
      });
    });
    describe('$toInt', () => {
      it('exports expected vars', () => {
        expect($.toInt).toBeDefined();
        expect($.$toInt).toBeDefined();
        expect($.toInt).toStrictEqual($.$toInt);
      });
      it('returns expected result', () => {
        expect($.toInt('$value')).toEqual({ $toInt: '$value' });
      });
    });
    describe('$toLong', () => {
      it('exports expected vars', () => {
        expect($.toLong).toBeDefined();
        expect($.$toLong).toBeDefined();
        expect($.toLong).toStrictEqual($.$toLong);
      });
      it('returns expected result', () => {
        expect($.toLong('$value')).toEqual({ $toLong: '$value' });
      });
    });
    describe('$toLower', () => {
      it('exports expected vars', () => {
        expect($.toLower).toBeDefined();
        expect($.$toLower).toBeDefined();
        expect($.toLower).toStrictEqual($.$toLower);
      });
      it('returns expected result', () => {
        expect($.toLower('$value')).toEqual({ $toLower: '$value' });
      });
    });
    describe('$toObjectId', () => {
      it('exports expected vars', () => {
        expect($.toObjectId).toBeDefined();
        expect($.$toObjectId).toBeDefined();
        expect($.toObjectId).toStrictEqual($.$toObjectId);
      });
      it('returns expected result', () => {
        expect($.toObjectId('$value')).toEqual({ $toObjectId: '$value' });
      });
    });
    describe('$toString', () => {
      it('exports expected vars', () => {
        expect($.toString).toBeDefined();
        expect($.$toString).toBeDefined();
        expect($.toString).toStrictEqual($.$toString);
      });
      it('returns expected result', () => {
        expect($.toString('$value')).toEqual({ $toString: '$value' });
      });
    });
    describe('$toUpper', () => {
      it('exports expected vars', () => {
        expect($.toUpper).toBeDefined();
        expect($.$toUpper).toBeDefined();
        expect($.toUpper).toStrictEqual($.$toUpper);
      });
      it('returns expected result', () => {
        expect($.toUpper('$value')).toEqual({ $toUpper: '$value' });
      });
    });
    describe('$trunc', () => {
      it('exports expected vars', () => {
        expect($.trunc).toBeDefined();
        expect($.$trunc).toBeDefined();
        expect($.trunc).toStrictEqual($.$trunc);
      });
      it('returns expected result', () => {
        expect($.trunc('$myString', 12)).toEqual({ $trunc: ['$myString', 12] });
      });
    });
    describe('$tsIncrement', () => {
      it('exports expected vars', () => {
        expect($.tsIncrement).toBeDefined();
        expect($.$tsIncrement).toBeDefined();
        expect($.tsIncrement).toStrictEqual($.$tsIncrement);
      });
      it('returns expected result', () => {
        expect($.tsIncrement('$value')).toEqual({ $tsIncrement: '$value' });
      });
    });
    describe('$tsSecond', () => {
      it('exports expected vars', () => {
        expect($.tsSecond).toBeDefined();
        expect($.$tsSecond).toBeDefined();
        expect($.tsSecond).toStrictEqual($.$tsSecond);
      });
      it('returns expected result', () => {
        expect($.tsSecond('$value')).toEqual({ $tsSecond: '$value' });
      });
    });
    describe('$type', () => {
      it('exports expected vars', () => {
        expect($.type).toBeDefined();
        expect($.$type).toBeDefined();
        expect($.type).toStrictEqual($.$type);
      });
      it('returns expected result', () => {
        expect($.type('$value')).toEqual({ $type: '$value' });
      });
    });
    describe('$unsetField', () => {
      it('exports expected vars', () => {
        expect($.unsetField).toBeDefined();
        expect($.$unsetField).toBeDefined();
        expect($.unsetField).toStrictEqual($.$unsetField);
      });
      it('returns expected result', () => {
        expect($.unsetField('foo', '$obj')).toEqual({
          $unsetField: { field: 'foo', input: '$obj' },
        });
      });
    });
  });
});
