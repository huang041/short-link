import { Router } from 'express'
import { handleRedirect } from './redirect.controller'

export const redirectRoutes = Router()

redirectRoutes.get('/:shortCode', handleRedirect)
