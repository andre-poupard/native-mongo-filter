> Easily filter nested objects using MongoDB-like syntax!

## Install

yarn install native-mongo-filter

## Usage

> Filter by greater than and greater than equal to:
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 1,
  },
  {
    a: 2,
  },
  {
    a: 3,
  }
]

const filter = MongoFilter({
  a: {
    $gt: 1,
    $gte: 2,
  }
})

filter(data)
/*
returns [
  {
    a: 2,
  },
  {
    a: 3,
  }
]
*/
```

> Filter by less than, less than equal to:
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 0,
  },
  {
    a: 1,
  },
  {
    a: 2,
  }
]

const filter = MongoFilter({
  a: {
    $lt: 1,
    $lte: 2,
  }
})

filter(data)
/*
returns [
  {
    a: 0,
  }
]
*/
```


> Filter by equal to and not equal to
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 0,
  },
  {
    a: 1,
  },
  {
    a: 2,
  }
]

const filter = MongoFilter({
  a: {
    $eq: 1,
    $ne: 2,
  }
})

filter(data)
/*
returns [
  {
    a: 1,
  }
]
*/
```

> Filter by size of arrays
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 1,
    b: [1, 2, 3]
  },
  {
    a: 1,
    b: [1, 2, 3, 4]
  },
  {
    a: 1,
    b: [1, 2, 3, 4, 5]
  },
]

const filter = MongoFilter({
  a: {
    $eq: 1,
  },
  b: {
    $size: 5,
  }
})

filter(data)
/*
returns [{
    a: 1,
    b: [1, 2, 3, 4, 5]
  }
}]
*/
```

> Filter by whether in array or not
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 1,
    b: 7
  },
  {
    a: 2,
    b: 8
  },
  {
    a: 3,
    b: 9
  },
]

const filter = MongoFilter({
  a: {
    $in: [1, 2, 3] // in
  },
  b: {
    $nin: [4, 8, 9] // not in
  }
})

filter(data)
/*
returns [{
    a: 1,
    b: 7
  },
}]
*/
```
> Use "and" and "or" clauses
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  },
  {
    a: 123,
    b: 124,
    c: 24,
    d: 23,
  },
  {
    a: 1,
    b: 2,
    c: 3,
    e: 4,
  },
]

const filter = MongoFilter({
  $and: [
    { b: 1, a: 2 },
    { c: 3 }
  ],
})

filter(data)
/*
returns [{
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  },
  {
    a: 1,
    b: 2,
    c: 3,
    e: 4,
  },
}]
*/
```
> Example combining many filters 
```js
const MongoFilter = require('native-mongo-filter')

const data = [
  { 
    a: {
      b: 4,
      c: 2,
      d: 5,
      e: 12
    }
  },
  { 
    a: {
      b: 4,
      c: 2,
      d: 5,
      e: 11
    }
  },
]

const filter = MongoFilter({
  a: {
    b: {
      $gt: 3,
      $lt: 10,
    },
    c: {
      $in: [1, 2, 3]
    },
    d: 5,
    e: {
      $ne: 12
    }
  }
})

filter(data)
/*
returns [
  { 
    a: {
      b: 4,
      c: 2,
      d: 5,
      e: 11
    }
  },
}]
*/
```
## License

MIT © Andre Poupard
