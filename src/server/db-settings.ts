import fs from 'node:fs'
import path from 'node:path'
import { eq, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import type { DbStorefrontSettings } from '#/db/schema.ts'
import { storefrontSettings } from '#/db/schema.ts'
import type { StorefrontSettings } from '../lib/types.ts'
import { DEFAULT_STOREFRONT_SETTINGS } from '../lib/types.ts'

const SETTINGS_FILE = path.join(
  process.cwd(),
  'data',
  'storefront-settings.json',
)

function mapDbToSettings(row: DbStorefrontSettings): StorefrontSettings {
  return {
    id: row.id,
    storeName: row.storeName || DEFAULT_STOREFRONT_SETTINGS.storeName,
    storeDescription:
      row.storeDescription || DEFAULT_STOREFRONT_SETTINGS.storeDescription,
    phone: row.phone || DEFAULT_STOREFRONT_SETTINGS.phone,
    secondaryPhone: row.secondaryPhone || '',
    email: row.email || DEFAULT_STOREFRONT_SETTINGS.email,
    location: row.location || DEFAULT_STOREFRONT_SETTINGS.location,
    locationUrl: row.locationUrl || DEFAULT_STOREFRONT_SETTINGS.locationUrl,
    workingHours: row.workingHours || DEFAULT_STOREFRONT_SETTINGS.workingHours,
    socialLinks: row.socialLinks,
    metaPixelId: row.metaPixelId || '',
    logoUrl: row.logoUrl || '',
    faviconUrl: row.faviconUrl || '',
    deliveryRates: row.deliveryRates || DEFAULT_STOREFRONT_SETTINGS.deliveryRates,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function readFromFile(): StorefrontSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      return {
        ...DEFAULT_STOREFRONT_SETTINGS,
        ...parsed,
        metaPixelId: parsed.metaPixelId || '',
        logoUrl: parsed.logoUrl || '',
        faviconUrl: parsed.faviconUrl || '',
        deliveryRates:
          parsed.deliveryRates || DEFAULT_STOREFRONT_SETTINGS.deliveryRates,
        socialLinks: {
          ...DEFAULT_STOREFRONT_SETTINGS.socialLinks,
          ...(parsed.socialLinks || {}),
        },
      }
    }
  } catch (err) {
    console.warn('Could not read storefront settings from file fallback:', err)
  }
  return DEFAULT_STOREFRONT_SETTINGS
}

function writeToFile(settings: StorefrontSettings): void {
  try {
    const dir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Could not write storefront settings to file fallback:', err)
  }
}

let isInitialized = false

async function ensureSeed(): Promise<void> {
  if (isInitialized) return
  try {
    try {
      await db.execute(sql`
        ALTER TABLE storefront_settings ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
        ALTER TABLE storefront_settings ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT '';
        ALTER TABLE storefront_settings ADD COLUMN IF NOT EXISTS delivery_rates jsonb;
      `)
    } catch {
      // Safe to ignore if table doesn't exist yet
    }

    const rows = await db
      .select()
      .from(storefrontSettings)
      .where(eq(storefrontSettings.id, 'storefront'))
      .limit(1)

    if (rows.length === 0) {
      console.log('Seeding default storefront settings into PostgreSQL...')
      const initial = readFromFile()
      await db.insert(storefrontSettings).values({
        id: 'storefront',
        storeName: initial.storeName,
        storeDescription: initial.storeDescription,
        phone: initial.phone,
        secondaryPhone: initial.secondaryPhone || '',
        email: initial.email,
        location: initial.location,
        locationUrl: initial.locationUrl || '',
        workingHours: initial.workingHours || '',
        socialLinks: initial.socialLinks,
        metaPixelId: initial.metaPixelId || '',
        logoUrl: initial.logoUrl || '',
        faviconUrl: initial.faviconUrl || '',
        deliveryRates:
          initial.deliveryRates || DEFAULT_STOREFRONT_SETTINGS.deliveryRates,
        updatedAt: new Date(),
      })
      writeToFile(initial)
      console.log('Storefront settings seeded successfully!')
    }
    isInitialized = true
  } catch (err) {
    console.warn('Could not ensure seed for storefront settings in DB:', err)
  }
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  try {
    await ensureSeed()
    const rows = await db
      .select()
      .from(storefrontSettings)
      .where(eq(storefrontSettings.id, 'storefront'))
      .limit(1)

    if (rows.length > 0) {
      const mapped = mapDbToSettings(rows[0])
      return mapped
    }
  } catch (err) {
    console.error('Error fetching storefront settings from PostgreSQL:', err)
  }

  return readFromFile()
}

export async function updateStorefrontSettings(
  settings: Partial<StorefrontSettings>,
): Promise<StorefrontSettings> {
  const current = await getStorefrontSettings()
  const updated: StorefrontSettings = {
    id: 'storefront',
    storeName:
      settings.storeName !== undefined ? settings.storeName : current.storeName,
    storeDescription:
      settings.storeDescription !== undefined
        ? settings.storeDescription
        : current.storeDescription,
    phone: settings.phone !== undefined ? settings.phone : current.phone,
    secondaryPhone:
      settings.secondaryPhone !== undefined
        ? settings.secondaryPhone
        : current.secondaryPhone,
    email: settings.email !== undefined ? settings.email : current.email,
    location:
      settings.location !== undefined ? settings.location : current.location,
    locationUrl:
      settings.locationUrl !== undefined
        ? settings.locationUrl
        : current.locationUrl,
    workingHours:
      settings.workingHours !== undefined
        ? settings.workingHours
        : current.workingHours,
    metaPixelId:
      settings.metaPixelId !== undefined
        ? settings.metaPixelId
        : current.metaPixelId || '',
    logoUrl:
      settings.logoUrl !== undefined ? settings.logoUrl : current.logoUrl || '',
    faviconUrl:
      settings.faviconUrl !== undefined
        ? settings.faviconUrl
        : current.faviconUrl || '',
    deliveryRates:
      settings.deliveryRates !== undefined
        ? settings.deliveryRates
        : current.deliveryRates || DEFAULT_STOREFRONT_SETTINGS.deliveryRates,
    socialLinks: {
      ...current.socialLinks,
      ...(settings.socialLinks || {}),
    },
    updatedAt: new Date().toISOString(),
  }

  try {
    const now = new Date()
    await db
      .insert(storefrontSettings)
      .values({
        id: 'storefront',
        storeName: updated.storeName,
        storeDescription: updated.storeDescription,
        phone: updated.phone,
        secondaryPhone: updated.secondaryPhone,
        email: updated.email,
        location: updated.location,
        locationUrl: updated.locationUrl,
        workingHours: updated.workingHours,
        socialLinks: updated.socialLinks,
        metaPixelId: updated.metaPixelId,
        logoUrl: updated.logoUrl,
        faviconUrl: updated.faviconUrl,
        deliveryRates: updated.deliveryRates,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: storefrontSettings.id,
        set: {
          storeName: updated.storeName,
          storeDescription: updated.storeDescription,
          phone: updated.phone,
          secondaryPhone: updated.secondaryPhone,
          email: updated.email,
          location: updated.location,
          locationUrl: updated.locationUrl,
          workingHours: updated.workingHours,
          socialLinks: updated.socialLinks,
          metaPixelId: updated.metaPixelId,
          logoUrl: updated.logoUrl,
          faviconUrl: updated.faviconUrl,
          deliveryRates: updated.deliveryRates,
          updatedAt: now,
        },
      })
  } catch (err) {
    console.error('Error persisting storefront settings to PostgreSQL:', err)
  }

  // Always write to JSON fallback as well
  writeToFile(updated)

  return updated
}
