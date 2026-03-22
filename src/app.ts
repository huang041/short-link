import express from 'express'
import { urlRoutes } from './urls/url.routes'
import { redirectRoutes } from './redirects/redirect.routes'
import { analyticsRoutes } from './analytics/analytics.routes'
import { authRoutes } from './auth/auth.routes'
import { referralRoutes } from './referrals/referral.routes'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/urls', urlRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/', redirectRoutes) // redirect 放最後，catch short codes

app.use(errorHandler)

export default app
