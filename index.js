const valueOperators = [
  '$eq',
  '$gt', 
  '$gte',
  '$lt',
  '$lte',
  '$ne',
  '$regex',
  '$size',
  '$in',
  '$nin'
]

const logicalOperators = [
  '$and',
  '$or'
]

const Equals = Symbol('equals')
const GreaterThan = Symbol('greater than')
const GreaterThanEqualTo = Symbol('greater than equal to')
const LessThan = Symbol('less than')
const LessThanEqualTo = Symbol('less than equal to')
const NotEquals = Symbol('not equals')
const Regex = Symbol('regex')
const Size = Symbol('size')
const In = Symbol('in')
const NotIn = Symbol('not in')
const And = Symbol('and')
const Or = Symbol('or')

const queryStringToType = new Map([
  ['$and', And],
  ['$or', Or],
  ['$eq', Equals],
  ['$gt', GreaterThan],
  ['$gte', GreaterThanEqualTo],
  ['$lt', LessThan],
  ['$lte', LessThanEqualTo],
  ['$ne', NotEquals],
  ['$regex', Regex],
  ['$size', Size],
  ['$in', In],
  ['$nin', NotIn]
])

const queryStringToCodeEmitter = new Map([
  [And, (value) => compileLogicalOperator(value, ' && ')],
  [Or, (value) => compileLogicalOperator(value, ' || ')],
  [Equals, (path, value) => `${path} === ${value}`],
  [GreaterThan, (path, value) => `${path} > ${value}`],
  [GreaterThanEqualTo, (path, value) => `${path} >= ${value}`],
  [LessThan, (path, value) => `${path} < ${value}`],
  [LessThanEqualTo, (path, value) => `${path} <= ${value}`],
  [NotEquals, (path, value) => `${path} !== ${value}`],
  [Regex, (path, value) => `typeof ${value} === 'string' && ${value}.test(${path})`],
  [Size, (path, value) => `Array.isArray(${value}) && ${path}?.length === ${value}`],
  [In, (path, value) => `Array.isArray(${value}) && ${value}.includes(${path})`],
  [NotIn, (path, value) => `Array.isArray(${value}) && !${value}.includes(${path})`]
])

const queryTypeCheckers = new Map([
  [In, (val) => {
    if (!Array.isArray(val)) {
      throw new Error(`$in operator must have array type as value`)
    }
  }],
  [NotIn, (val) => {
    if (!Array.isArray(val)) {
      throw new Error(`$nin operator must have array type as value`)
    }
  }],
  [Regex, (val) => {
    if (!(val instanceof RegExp)) {
      throw new Error(`$regex query operator must have regex type as value`)
    }
  }]
])

const compileLogicalOperator = (value, combineOperator) => {
  return `(${value.map(ast => {
    const objectPathToAstNodes = buildOperatorPaths(ast)
    return buildJsCode(objectPathToAstNodes)
  }).join(combineOperator)})`
}

const buildQueryKeyPath = (path, queryKey) => {
  if (queryKey.includes('.')) {
    return path.concat(queryKey.split('.'))
  }
  return path.concat([queryKey])
}

const isNestedQuery = (obj) =>
  typeof obj === 'object' 
  && obj !== null 
  && !Array.isArray(obj) 
  && !(obj instanceof RegExp)

const guardTypeErrors = (type, value) => {
  const guard = queryTypeCheckers.get(type)
  if (guard) {
    guard(value)
  }
}

const parseQuery = (query, instructions = [], path = []) => {
  for (const [queryKey, value] of Object.entries(query)) {
    const newPath = buildQueryKeyPath(path, queryKey)

    const type = queryStringToType.get(queryKey)
    guardTypeErrors(type, value)

    if (logicalOperators.includes(queryKey)) {
      instructions.push({
        type,
        path,
        value: value.map(query => {
          return parseQuery(query, [], path)
        }),
      })
    } else if (isNestedQuery(value)) {
      parseQuery(value, instructions, newPath)
    } else if (valueOperators.includes(queryKey)) {
      instructions.push({
        type,
        path: newPath.slice(0, newPath.length - 1),
        value,
      })
    } else {
      instructions.push({
        type: Equals,
        path: newPath,
        value,
      })
    }
  }
  return instructions
}

const buildOperatorPaths = (ast) => {
  const pathToOperators = new Map()
  const pathToString = (path) => path.join('.')
  for (const node of ast) {
    const path = pathToString(node.path)
    const nodeList = pathToOperators.get(path)
    if (nodeList) {
      nodeList.push(node)
    } else {
      pathToOperators.set(path, [node])
    }
  }
  return pathToOperators
}

const buildJsCode = (pathToOperators) => {
  const code = []
  for (const [path, instructionList] of pathToOperators) {
    code.push(buildCode(path, instructionList))
  }
  return code
}

const compileToFunction = (code, combineOperator = ' && ') => {
  if (code.length === 0) return (id) => id
  return new Function(['array'], `return array.filter(val => ${code.join(combineOperator)})`)
}

const buildCode = (path, instructionList) => {
  const baseVariable = 'val'
  const realPath = Array.isArray(path) ? path.join('.') : path
  const pp = realPath.split('.').map(pathVal => `['${pathVal}']`).join('?.')
  const pathList = !realPath ? baseVariable : `${baseVariable}${pp}`
  
  return `(${instructionList.map(instruction => {
    const codeEmitter = queryStringToCodeEmitter.get(instruction.type)
    if (instruction.type === And || instruction.type === Or) {
      return codeEmitter(pathList, instruction.value)
    } else {
      return codeEmitter(pathList, JSON.stringify(instruction.value))
    }
  }).join(' && ')})`
}

const compile = (query) => {
  const ast = parseQuery(query)
  const objectPathToAstNodes = buildOperatorPaths(ast)
  const code = buildJsCode(objectPathToAstNodes)
  return compileToFunction(code)
}

module.exports = compile