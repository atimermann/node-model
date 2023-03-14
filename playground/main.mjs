// import {PrismaClient} from '@prisma/client'

import InventoryModel from './models/inventory.model.mjs'

try {
  const inventory = await InventoryModel.getOne(8)

  console.log(inventory.costPrice + 1)

  // console.log(await InventoryModel.deleteById(114))
  //
  // const inventory = InventoryModel.create(
  //   {
  //     costPrice: 100000,
  //     purchaseDate: new Date(),
  //     origin: 'Além',
  //     productId: 38
  //   }
  // )
  //
  // console.log(await inventory.save())
  // console.log(await inventory.save())
  //
  // console.log(await inventory.delete())

  // console.log(await InventoryModel.getAll())

  // console.log(prisma.inventory)
  // const user = await prisma.inventory.findFirst()
  // console.log(user)
} catch (e) {
  console.error(e)
  process.exit(1)
}
