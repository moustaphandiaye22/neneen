import 'dotenv/config'
import { parseEnvironment } from './config/environment.js'

export const env = parseEnvironment(process.env)
