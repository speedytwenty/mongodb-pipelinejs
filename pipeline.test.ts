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
        it('resolves collection name from collection object', () => {
          expect($.lookup({ s: { namespace: { collection: 'colName' } } }, 'asName')).toEqual({ $lookup: { from: 'colName', as: 'asName' } });
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
    });
  });
  describe('operators', () => {
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
      it('returns expected result', () => {
        const expected = { $cond: { if: 1, then: 2, else: 3 } };
        expect($.cond(1).then(2).else(3)).toEqual(expected);
        expect($.cond(1, 2, 3)).toEqual(expected);
      });
    });

    describe('$redact', () => {
      it('exports expected vars', () => {
        expect($.redact).toBeDefined();
        expect($.$redact).toBeDefined();
        expect($.redact).toStrictEqual($.$redact);
      });
      it('returns expected result', () => {
        expect($.redact(1).then('$$PRUNE').else('$$KEEP')).toEqual({
          $redact: {
            $cond: {
              if: 1,
              then: '$$PRUNE',
              else: '$$KEEP',
            },
          },
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

      describe('branch/case', () => {
        it('exports expected vars', () => {
          expect($.branch).toBeDefined();
          // @ts-expect-error
          expect($.$branch).not.toBeDefined();
          expect($.case).toBeDefined();
          // @ts-expect-error
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
