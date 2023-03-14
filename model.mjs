/**
 * **Created on 29/01/2023**
 *
 * src/apps/inventory/models/inventory.model.mjs
 * @author André Timermann <andre@timermann.com.br>
 *
 *   Transpofrmar no projeto node-models
 *
 *   Modelo foi criado para ser usado pela API e não pelo banco de dados, então as proprieadades devem estar pronta para
 *   consumo pela api.
 *
 *   exemplo: console.log(this) retorna os dados já no formato usado pela API
 *
 *   Dados devem ser formatados para o banco no momento da gravação na base (MODEM => SERVICE)
 *    Utilizar o método:
 *    getFormattedDataForDatabase()
 *
 *    === Transaction with Prisma  ===
 *       https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide#interactive-transactions
 *
 * // TODO: Criar opção para Habilitar Decimal do Prisma, quebra validação
 *
 */

/**
 * @typedef {object} Options
 * @description Objeto de configuração
 *
 * @property {boolean} [validate=true] - Indica se a validação deve ser feita ao criar a instância.
 * @property {boolean} [ignoreRequired=false] - Se true, ignora validação de campo obrigatório (útil para update parcial)
 * @property {boolean} [validateDeep=false] - Se true, Realiza validação profunda, ou seja, das subinstancias relacionada
 */

import isObject from 'lodash/isObject.js'
import cloneDeep from 'lodash/cloneDeep.js'
import Ajv from 'ajv'
import Decimal from 'decimal.js'

export default class PrismaModel {
  /**
   * Instancia de PrismaClient, obrigatório ser definodo pelo usuário
   * @type  {PrismaClient<Prisma.PrismaClientOptions, "log" extends keyof Prisma.PrismaClientOptions ? (Prisma.PrismaClientOptions["log"] extends Array<Prisma.LogLevel|Prisma.LogDefinition> ? Prisma.GetEvents<Prisma.PrismaClientOptions["log"]> : never) : never, "rejectOnNotFound" extends keyof Prisma.PrismaClientOptions ? Prisma.PrismaClientOptions["rejectOnNotFound"] : false>}
   */
  static prismaClient = null

  /**
   * Prisma schema model relacionada a este model
   * Normalmente defino em schama.prisma
   * Ref: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/use-custom-model-and-field-names
   *
   * **Nota:** Anterormente era tableName, porém o prisma já realiza o mapeamento com banco de dados no schamea.prisma
   *  devemos agora definor o nome do model prisma relacionado com este model
   *
   * @type {String}
   */
  static prismaModel = null

  /**
   * Lista de atributos da instância da classe que não são visíveis por padrão.
   *
   * @type {Array}
   */
  static hidden = []

  static relations = {}

  /**
   * Schema de validação usado pelo ADV
   * REF: https://ajv.js.org/
   * @type {null}
   */
  static schema = null

  /**
   * Objeto de validação, gerado da primeira vez que o validator é chamado
   * @type {import("ajv").ValidateFunction}
   * @private
   */
  static _validatorCache

  /**
   * Validador ignorando se é obrigatório (Útil para update)
   * @private
   */
  static _validatorIgnoreRequiredCache

  /**
   * Dicionario cacheado que mapeia as chaves estrangeiras para o nome da relação usado pelo nestResult
   *
   * @type {*}
   * @private
   */
  static _nestedConvertionDictCache = undefined
  static _flattenConvertionDictCache = undefined

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Métodos estáticos
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Retorna instancia de prisma client já com model definido, chamando de service
   *
   * exemplo para model user:
   *
   *  this.service.findMany()
   *
   * é equivalente a:
   *  - prisma.user.findMany()
   *  - this.prisma.user.findMany()
   *  - this.prisma[this.prismaModel].findMany()
   *
   * REFS:
   * https://www.prisma.io/docs/concepts/components/prisma-client/custom-models
   * https://www.prisma.io/docs/getting-started/quickstart#41-create-a-new-user-record
   *
   * @returns {*}
   */
  static get Service () {
    if (!this.prismaModel) throw new Error('Static property prismaModel not defined.')
    return this.prisma[this.prismaModel]
  }

  /**
   * Retorna objeto prismaClient para montagem de consultas
   *
   * REF: https://www.prisma.io/docs/concepts/components/prisma-client
   *
   * @returns {PrismaClient<Prisma.PrismaClientOptions, "log" extends keyof Prisma.PrismaClientOptions ? (Prisma.PrismaClientOptions["log"] extends Array<Prisma.LogLevel|Prisma.LogDefinition> ? Prisma.GetEvents<Prisma.PrismaClientOptions["log"]> : never) : never, "rejectOnNotFound" extends keyof Prisma.PrismaClientOptions ? Prisma.PrismaClientOptions["rejectOnNotFound"] : false>}
   */
  static get prisma () {
    const errorExampleText = `            
Create a base class by extending PrismaModel and define prismaClient like this:

  import { PrismaClient } from '@prisma/client'
  
  export default class Model extends PrismaModel {
      static prismaClient = new PrismaClient()
  }
`
    if (!this.prismaClient) {
      throw new Error(`Static property "prismaClient" not defined. ${errorExampleText}`)
    }

    if (!this.prismaClient._clientVersion) {
      throw new Error(`Static property "prismaClient" is invalid.  ${errorExampleText}`)
    }

    return this.prismaClient
  }

  /**
   * Cria uma instância da classe.
   *
   * @param {object} data - Os dados para definir na instância.
   * @param {Options} [options] - As opções para criar a instância.
   * @returns {Model} - A nova instância da classe.
   */
  static create (data, options) {
    const instance = new this()
    instance.setValues(data, options)
    instance._makeGettersAndSettersEnumerable()
    return instance
  }

  /**
   * Atalho para método "create"  ajustado para atualização
   *
   * - ignoreRequired definido true
   * - Id pode ser enviado pro argumento separadamente
   *
   * @param id
   * @param data
   * @param {Options} [options] - As opções para criar a instância.
   * @returns {Model}
   */
  static createForUpdate (id, data, options) {
    return this.create({ ...data, id }, { ...options, ignoreRequired: true })
  }

  /**
   * Cria uma coleção de instâncias
   * @param collectionData
   * @param {Options} [options] - As opções para criar a instância.
   * @returns {[Model]}
   */
  static createCollection (collectionData, options) {
    if (!Array.isArray(collectionData)) {
      throw new Error('Collection data must be an array')
    }

    return collectionData.map(data => this.create(data, options))
  }

  static flattenData (rowData) {
    if (!rowData === null || rowData === undefined) return rowData

    if (Array.isArray(rowData)) {
      return rowData.map(data => this.flattenData(data))
    }

    const flattenData = {}
    for (const [columnName, columnValue] of Object.entries(rowData)) {
      const foreignKeyName = this.flattenConvertionDict[columnName]

      if (typeof columnValue === 'object' && foreignKeyName) {
        flattenData[foreignKeyName] = columnValue.id
      } else {
        flattenData[columnName] = columnValue
      }
    }

    return flattenData
  }

  /**
   * Altera resultado convertendo chave estrangeira em objeto aninhado com ‘id’
   * Deve ser usado com nestTables = false. Para nestTable configurar o select corretamente e utilizarformatNestedResult
   *
   * @param rowData
   * @returns {{}}
   */
  static nestData (rowData) {
    if (!rowData === null || rowData === undefined) return rowData

    if (Array.isArray(rowData)) {
      return rowData.map(data => this.nestData(data))
    }

    const nestedData = {}
    for (const [columnName, columnValue] of Object.entries(rowData)) {
      const relation = this.nestedConvertionDict[`${this.prismaModel}.${columnName}`]
      if (relation) {
        nestedData[relation] = {
          id: columnValue
        }
      } else {
        nestedData[columnName] = columnValue
      }
    }

    return nestedData
  }

  /**
   * Retorna um objeto validator, criando um cache na primeira execução
   * @returns {import("ajv").ValidateFunction} - o objeto validator
   */
  static get validator () {
    // Validation disabled
    if (!this.schema) {
      return () => true
    }

    const ajv = new Ajv({
      allErrors: true, verbose: true
      // coerceTypes: true,
      // $data: true,
      // nullable: true
    })

    if (!this._validatorCache) {
      this._validatorCache = ajv.compile(this.schema)

      this._validatorIgnoreRequiredCache = ajv.compile({
        ...this.schema, required: []
      })
    }

    return (data, ignoreRequired = false) => {
      const valid = ignoreRequired ? this._validatorIgnoreRequiredCache(data) : this._validatorCache(data)

      if (!valid) {
        throw new Error(ajv.errorsText(this._validatorCache.errors, { dataVar: `'${this.prismaModel}'` }))
      }

      return true
    }
  }

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Métodos de consulta
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Retorna primeiro registro
   *
   * @param trx
   * @returns {Promise<Model|*>}
   */
  static async getFirst (trx) {
    const data = await this.Service.findFirst()
    if (!data) return data
    return this.create(data)
  }

  /**
   * Retorna um registro
   *
   * @param id
   * @param trx
   * @returns {Promise<Model|*>}
   */
  static async getOne (id, trx) {
    const data = await this.Service.findUnique({ where: { id } })

    if (!data) return data
    return this.create(data)
  }

  /**
   * Retorna todos os registros
   *
   * @param trx
   * @returns {Promise<Model[]>}
   */
  static async getAll (trx) {
    const collectionData = await this.Service.findMany()

    return this.createCollection(collectionData)
  }

  /**
   * Remove registro unico
   *
   * @returns {Promise<number>}
   */
  static async deleteById (id, trx) {
    try {
      return await this.Service.delete({ where: { id } })
    } catch (e) {
      if (e.code !== 'P2025') {
        throw e
      }
      return false
    }
  }

  async save (trx) {
    const Class = this.constructor

    const id = this.id
    const data = this.getFormattedDataForDatabase()

    const updateData = id
      ? await Class.Service.update({ where: { id }, data })
      : await Class.Service.create({ data })

    await this.setValues(updateData)

    return this
  }

  /**
   * Remove registro unico
   *
   * @returns {Promise<number>}
   */
  async delete (trx) {
    if (!this.id) {
      throw new Error('Property "id" not defined!')
    }

    return await this.constructor.deleteById(this.id, trx)
  }

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Métodos de Instancia
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getFormattedDataForDatabase () {
    // TODO: Verificar necessidade, apenas para o caso do método nestData
    return this.constructor.flattenData(this)
  }

  /**
   * Adiciona varias propriedades de uma vez ao modelo.
   *
   * @param {Object} data - Um objeto contendo as propriedades a serem definidas no modelo.
   * @param {Options} [options] - As opções para criar a instância.
   */
  setValues (data, options = {}) {
    options = { ...{ validate: true, ignoreRequired: false, validateDeep: false }, ...options }

    if (!data) {
      throw new Error('The argument \'data\' was not provided or is null or undefined.')
    }

    if (!isObject(data)) {
      throw new TypeError(`The 'data' argument must be a plain object. Received: ${JSON.stringify(data)}`)
    }

    if (Array.isArray(data)) {
      throw new Error('Array is not allowed. To create collections use createCollection.')
    }

    // TODO: Verificar nestdata é util
    // const nestData = options.nestTables ? this.constructor.nestResultWithNestTables(data) : this.constructor.nestData(data)

    for (const [attrName, value] of Object.entries(data)) {
      if (value === undefined) continue
      this.setValue(attrName, value, options)
    }

    if (options.validate) {
      this.validate(options.ignoreRequired)
    }
  }

  /**
   * Define o valor de um atributo da instância do modelo.
   *
   * @param {string} attrName - O nome do atributo que deve receber o valor.
   * @param {*} value - O valor a ser atribuído ao atributo.
   * @param {Options} [options] - As opções para criar a instância.
   */
  setValue (attrName, value, options) {
    options = { ...{ validate: true, ignoreRequired: false, validateDeep: false }, ...options }

    const Class = this.constructor
    const SubClass = Class.relations[attrName]

    if (isObject(value) && SubClass) {
      this._createSubModelProperty(attrName, value, options)
    } else if (isObject(value) && Decimal.isDecimal(value)) {
      // Disable Decimal TODO: Adicionar opção para habilitar,
      this._createSimpleProperty(attrName, value.toNumber())
    } else {
      this._createSimpleProperty(attrName, value)
    }
  }

  /**
   * Valida propriedades
   *
   * @param {Boolean} ignoreRequired
   */
  validate (ignoreRequired) {
    this.constructor.validator(this, ignoreRequired)
  }

  /**
   * Habilitada o modo enumerable para todos os Getters e Setters definido na instancia
   *  - Exibir atributos do getter e Setter no template
   *
   * @private
   */
  _makeGettersAndSettersEnumerable () {
    const Class = this.constructor

    for (const [propName, propDesc] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this)))) {
      if (!propDesc.enumerable && (propDesc.get || propDesc.set)) {
        Object.defineProperty(this, propName, {
          enumerable: !Class.hidden.includes(propName), // Se for hidden mantém oculto, não altera
          configurable: false,
          set: propDesc.set,
          get: propDesc.get
        })
      }
    }
  }

  /**
   * Cria uma instância de uma Model relacionado
   *
   * @private
   * @param {string} attrName - O nome do atributo a ser criado
   * @param {*} value - O valor inicial do atributo
   * @param options
   * @private
   */
  _createSubModelProperty (attrName, value, options) {
    const Class = this.constructor
    const SubClass = Class.relations[attrName]

    if (!options.validateDeep) {
      options = { ignoreRequired: true, options }
    }

    Object.defineProperty(this, attrName, {
      enumerable: !Class.hidden.includes(attrName),
      configurable: false,
      writable: true,
      value: Array.isArray(value) ? SubClass.createCollection(value, options) : value === null ? null : SubClass.create(value, options)
    })
  }

  /**
   * Cria uma propriedade simples do modelo
   *
   * @private
   * @param {string} attrName - O nome do atributo a ser criado
   * @param {*} value - O valor inicial do atributo
   * @returns {void}
   */
  _createSimpleProperty (attrName, value) {
    const Class = this.constructor
    const ownPropertyDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this))

    // Se propriedade ainda não estiver definida (exemplo já existe getter/setter) cria
    if (ownPropertyDescriptors[attrName]) {
      this[attrName] = cloneDeep(value)
    } else {
      Object.defineProperty(this, attrName, {
        enumerable: !Class.hidden.includes(attrName), configurable: false, writable: true, value: cloneDeep(value)
      })
    }
  }
}
