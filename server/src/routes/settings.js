import { Router } from 'express'
import Settings from '../models/Settings.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

async function getOrCreateSettings() {
  let settings = await Settings.findById('global')
  if (!settings) settings = await Settings.create({ _id: 'global' })
  return settings
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await getOrCreateSettings())
  } catch (err) {
    next(err)
  }
})

router.patch('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings()
    Object.assign(settings, req.body)
    await settings.save()
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

export default router
