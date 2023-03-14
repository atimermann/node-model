/**
 * **Created on 13/03/2023**
 *
 * <File Reference Aqui: model>
 * @author André Timermann <andre@timermann.com.br>
 *
 */

import { PrismaClient } from '@prisma/client'
import PrismaModel from '../model.mjs'

export default class Model extends PrismaModel {
  static prismaClient = new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'],
  })
}
