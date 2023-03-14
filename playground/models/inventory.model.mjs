// https://www.prisma.io/docs/concepts/components/prisma-client/custom-models

import Model from '../model.mjs'
import ProductModel from './product.model.mjs'

export default class InventoryModel extends Model {
  static prismaModel = 'inventory'

  static schema = {
    type: 'object',
    required: ['costPrice', 'purchaseDate', 'origin'],

    properties: {
      id: { type: 'integer' },
      statusId: { type: 'integer' },
      costPrice: { type: 'number' },
      productId: { type: 'integer' },
      origin: { type: 'string', minLength: 1 },
      tags: { type: 'string', minLength: 1 },
      tracking: {
        type: 'string',
        minLength: 1
      },
      tax: {
        type: 'number'
      }
    }
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

    // const inventory = await InventoryService
    //   .query(trx)
    //   .options({ nestTables: true })
    //   .select(
    //     'inventory.id',
    //     'inventory.costPrice',
    //     'inventory.purchaseDate',
    //     'inventory.tracking',
    //     'inventory.origin',
    //     'inventory.tags',
    //     'inventory.statusId',
    //     'product.id',
    //     'product.name',
    //     'product.brand',
    //     'product:productCategory.id',
    //     'product:productCategory.name',
    //     'product:productCategory.description',
    //     'correiosTrackingOrder.id',
    //     'correiosTrackingOrder.data'
    //   )
    //   .joinRelated('[product.[productCategory]]')
    //   .leftJoinRelated('[correiosTrackingOrder]')
    //   .findById(id)
    //
    return InventoryModel.create(inventory/*, { nestTables: true } */)
  }
}
