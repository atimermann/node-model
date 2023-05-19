// https://www.prisma.io/docs/concepts/components/prisma-client/custom-models

import Model from '../model.mjs'
import ProductModel from './product.model.mjs'

import { DateTime } from 'luxon'

export default class InventoryModel extends Model {
  static prismaModel = 'inventory'

  static schema = {
    type: 'object',
    required: ['costPrice', 'purchaseDate', 'origin']

    // properties: {
    //   id: { type: 'integer' },
    //   statusId: { type: 'integer' },
    //   costPrice: { type: 'number' },
    //   productId: { type: 'integer' },
    //   origin: { type: 'string', minLength: 1 },
    //   tags: { type: 'string', minLength: 1 },
    //   tracking: {
    //     type: 'string',
    //     minLength: 1
    //   },
    //   tax: {
    //     type: 'number',
    //     nullable: true
    //   }
    // }
  }

  static relations = {
    product: ProductModel
  }

  static async getOne (id, trx) {
    const inventory = await this.Service.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            productCategory: true
          }
        },
        correiosTrackingOrder: true
      }
    })

    return InventoryModel.create(inventory/*, { nestTables: true } */)
  }

  static async getAll (trx) {
    const inventoryCollectionRaw = await this.Service.findMany({
      include: {
        product: {
          include: {
            productCategory: true
          }
        },
        correiosTrackingOrder: true
      }
    })

    const inventoryCollection = this.createCollection(inventoryCollectionRaw)

    // await this.updateTrackingInCollection(inventoryCollection)

    return inventoryCollection
  }

  static async insert (data, trx) {
    const hasExternalTrx = (trx !== undefined)

    const insertData = {
      purchaseDate: DateTime.fromISO(data.purchaseDate).toISODate(),
      costPrice: data.costPrice,
      tax: data.tax,
      tracking: data.tracking,
      tags: JSON.stringify(data.tags),
      origin: data.origin
    }

    if (!data.product) throw new Error('Product is required')

    if (data.product.name) {
      if (!hasExternalTrx) {
        trx = await this.Service.startTransaction()
      }
      try {
        const newProduct = await ProductService
          .insert({
            name: data.product.name, productCategoryId: data.product.productCategory.id
          }, trx)

        const newInventoryItem = await this.Service
          .query(trx)
          .insert({
            ...insertData, productId: newProduct.id
          })
        if (!hasExternalTrx) {
          await trx.commit()
        }

        return newInventoryItem
      } catch (err) {
        await trx.rollback()
        throw err
      }
    } else if (data.product.id) {
      return await this.Service.query(trx)
        .insert({
          ...insertData, productId: data.product.id
        })
    } else {
      throw new Error('Invalid Request')
    }
  }
}
