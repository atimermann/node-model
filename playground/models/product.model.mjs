/**
 * **Created on 29/01/2023**
 *
 * src/apps/inventory/models/product.mjs
 * @author André Timermann <andre@timermann.com.br>
 *
 */

import Model from '../model.mjs'
import ProductCategoryModel from './product-category.model.mjs'

export default class ProductModel extends Model {
  static prismaModel = 'product'

  static relations = {
    productCategory: ProductCategoryModel
  }
}
