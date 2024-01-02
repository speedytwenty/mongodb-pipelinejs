# MongoDB PipelineJS - API Reference

_[&laquo; View README](./README.md)_

## Constants

<dl>
<dt><a href="#$addFields">$addFields</a> ⇒ <code>AddFieldsStage</code></dt>
<dd><p>$addFields Stage</p></dd>
<dt><a href="#$set">$set</a> ⇒ <code>SetStage</code></dt>
<dd><p>$set Stage (alias of $addFields)</p></dd>
</dl>

<a name="$addFields"></a>

## $addFields ⇒ <code>AddFieldsStage</code>
<p>$addFields Stage</p>

**Kind**: global constant  
**Stage(&#x27;addfields&#x27;)**:   
**Sample({**: a: 1, b: 2 })  
**Sample({**: fullName: $.concat('$firstName', ' ', '$lastName'),
  birthDate: $.toString('$birthDate'),
  firstName: '$REMOVE',
  lastName: '$REMOVE',
})  

| Param | Description |
| --- | --- |
| fieldsExpression | <p>FieldExpression</p> |

<a name="$set"></a>

## $set ⇒ <code>SetStage</code>
<p>$set Stage (alias of $addFields)</p>

**Kind**: global constant  
**Stage(&#x27;set&#x27;)**:   
**Sample({**: a: 1, b: 2 })  
**Sample({**: fullName: $.concat('$firstName', ' ', '$lastName'),
  birthDate: $.toString('$birthDate'),
  firstName: '$REMOVE',
  lastName: '$REMOVE',
})  
**See**: [MongoDB reference](https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/)
for $set  

| Param | Description |
| --- | --- |
| fieldsExpression | <p>FieldExpression</p> |

