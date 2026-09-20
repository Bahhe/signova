import locationsData from '../data/locations.json' with { type: 'json' }

export interface CommuneLocation {
  id: string
  post_code: string
  name: string
  wilaya_id: string
  ar_name: string
  longitude?: string
  latitude?: string
}

export interface Wilaya {
  code: string
  name: string
  ar_name: string
  label: string
  ar_label: string
}

const WILAYA_NAMES: Record<string, { name: string; ar_name: string }> = {
  '1': { name: 'Adrar', ar_name: 'أدرار' },
  '2': { name: 'Chlef', ar_name: 'الشلف' },
  '3': { name: 'Laghouat', ar_name: 'الأغواط' },
  '4': { name: 'Oum El Bouaghi', ar_name: 'أم البواقي' },
  '5': { name: 'Batna', ar_name: 'باتنة' },
  '6': { name: 'Bejaia', ar_name: 'بجاية' },
  '7': { name: 'Biskra', ar_name: 'بسكرة' },
  '8': { name: 'Bechar', ar_name: 'بشار' },
  '9': { name: 'Blida', ar_name: 'البليدة' },
  '10': { name: 'Bouira', ar_name: 'البويرة' },
  '11': { name: 'Tamanghasset', ar_name: 'تمنراست' },
  '12': { name: 'Tebessa', ar_name: 'تبسة' },
  '13': { name: 'Tlemcen', ar_name: 'تلمسان' },
  '14': { name: 'Tiaret', ar_name: 'تيارت' },
  '15': { name: 'Tizi Ouzou', ar_name: 'تيزي وزو' },
  '16': { name: 'Alger', ar_name: 'الجزائر' },
  '17': { name: 'Djelfa', ar_name: 'الجلفة' },
  '18': { name: 'Jijel', ar_name: 'جيجل' },
  '19': { name: 'Setif', ar_name: 'سطيف' },
  '20': { name: 'Saida', ar_name: 'سعيدة' },
  '21': { name: 'Skikda', ar_name: 'سكيكدة' },
  '22': { name: 'Sidi Bel Abbes', ar_name: 'سيدي بلعباس' },
  '23': { name: 'Annaba', ar_name: 'عنابة' },
  '24': { name: 'Guelma', ar_name: 'قالمة' },
  '25': { name: 'Constantine', ar_name: 'قسنطينة' },
  '26': { name: 'Medea', ar_name: 'المدية' },
  '27': { name: 'Mostaganem', ar_name: 'مستغانم' },
  '28': { name: 'Msila', ar_name: 'المسيلة' },
  '29': { name: 'Mascara', ar_name: 'معسكر' },
  '30': { name: 'Ouargla', ar_name: 'ورقلة' },
  '31': { name: 'Oran', ar_name: 'وهران' },
  '32': { name: 'El Bayadh', ar_name: 'البيض' },
  '33': { name: 'Illizi', ar_name: 'إليزي' },
  '34': { name: 'Bordj Bou Arreridj', ar_name: 'برج بوعريريج' },
  '35': { name: 'Boumerdes', ar_name: 'بومرداس' },
  '36': { name: 'El Tarf', ar_name: 'الطارف' },
  '37': { name: 'Tindouf', ar_name: 'تندوف' },
  '38': { name: 'Tissemsilt', ar_name: 'تيسمسيلت' },
  '39': { name: 'El Oued', ar_name: 'الوادي' },
  '40': { name: 'Khenchela', ar_name: 'خنشلة' },
  '41': { name: 'Souk Ahras', ar_name: 'سوق أهراس' },
  '42': { name: 'Tipaza', ar_name: 'تيبازة' },
  '43': { name: 'Mila', ar_name: 'ميلة' },
  '44': { name: 'Ain Defla', ar_name: 'عين الدفلى' },
  '45': { name: 'Naama', ar_name: 'النعامة' },
  '46': { name: 'Ain Temouchent', ar_name: 'عين تموشنت' },
  '47': { name: 'Ghardaia', ar_name: 'غرداية' },
  '48': { name: 'Relizane', ar_name: 'غليزان' },
  '49': { name: 'Timimoun', ar_name: 'تيميمون' },
  '50': { name: 'Bordj Badji Mokhtar', ar_name: 'برج باجي مختار' },
  '51': { name: 'Ouled Djellal', ar_name: 'أولاد جلال' },
  '52': { name: 'Beni Abbes', ar_name: 'بني عباس' },
  '53': { name: 'In Salah', ar_name: 'عين صالح' },
  '54': { name: 'In Guezzam', ar_name: 'عين قزام' },
  '55': { name: 'Touggourt', ar_name: 'تقرت' },
  '56': { name: 'Djanet', ar_name: 'جانت' },
  '57': { name: "El M'Ghair", ar_name: 'المغير' },
  '58': { name: 'El Menia', ar_name: 'المنيعة' },
}

export const ALL_COMMUNES: CommuneLocation[] =
  locationsData

// Additional fallback communes for newly created wilayas (49-58)
const NEW_WILAYA_COMMUNES: Record<string, { name: string; ar_name: string }[]> = {
  '49': [{ name: 'Timimoun', ar_name: 'تيميمون' }, { name: 'Aougrout', ar_name: 'أوقروت' }, { name: 'Tinerkouk', ar_name: 'تينركوك' }],
  '50': [{ name: 'Bordj Badji Mokhtar', ar_name: 'برج باجي مختار' }, { name: 'Timiaouine', ar_name: 'تيمياوين' }],
  '51': [{ name: 'Ouled Djellal', ar_name: 'أولاد جلال' }, { name: 'Sidi Khaled', ar_name: 'سيدي خالد' }],
  '52': [{ name: 'Beni Abbes', ar_name: 'بني عباس' }, { name: 'Kerzaz', ar_name: 'كرزاز' }, { name: 'El Ouata', ar_name: 'الواتة' }],
  '53': [{ name: 'In Salah', ar_name: 'عين صالح' }, { name: 'Foggaret Ezzaouia', ar_name: 'فقارة الزاوية' }, { name: 'In Ghar', ar_name: 'عين غار' }],
  '54': [{ name: 'In Guezzam', ar_name: 'عين قزام' }, { name: 'Tin Zouatine', ar_name: 'تين زواتين' }],
  '55': [{ name: 'Touggourt', ar_name: 'تقرت' }, { name: 'Nezla', ar_name: 'النزلة' }, { name: 'Tebesbest', ar_name: 'تبسبست' }],
  '56': [{ name: 'Djanet', ar_name: 'جانت' }, { name: 'Bordj El Haouas', ar_name: 'برج الحواس' }],
  '57': [{ name: "El M'Ghair", ar_name: 'المغير' }, { name: 'Djamaa', ar_name: 'جامعة' }],
  '58': [{ name: 'El Menia', ar_name: 'المنيعة' }, { name: 'Hassi Gara', ar_name: 'حاسي قارة' }],
}

// Generate sorted Wilayas list (1 to 58)
export const WILAYAS: Wilaya[] = Array.from({ length: 58 }, (_, i) => {
  const code = String(i + 1)
  const info = WILAYA_NAMES[code] || {
    name: `Wilaya ${code}`,
    ar_name: `ولاية ${code}`,
  }
  return {
    code,
    name: info.name,
    ar_name: info.ar_name,
    label: `${code.padStart(2, '0')} - ${info.name} (${info.ar_name})`,
    ar_label: `${code.padStart(2, '0')} - ${info.ar_name} (${info.name})`,
  }
})

// Index communes by wilaya_id for instant O(1) lookups
const communesByWilaya: Record<string, CommuneLocation[]> = {}

for (const commune of ALL_COMMUNES) {
  if (!communesByWilaya[commune.wilaya_id]) {
    communesByWilaya[commune.wilaya_id] = []
  }
  communesByWilaya[commune.wilaya_id].push(commune)
}

// Inject fallback communes for Wilayas 49 to 58 if not present
for (const [wCode, cList] of Object.entries(NEW_WILAYA_COMMUNES)) {
  if (!communesByWilaya[wCode] || communesByWilaya[wCode].length === 0) {
    communesByWilaya[wCode] = cList.map((c, idx) => ({
      id: `${wCode}-${idx + 1}`,
      post_code: `${wCode}000`,
      name: c.name,
      wilaya_id: wCode,
      ar_name: c.ar_name,
    }))
  }
}

// Sort communes alphabetically by name within each wilaya
for (const code of Object.keys(communesByWilaya)) {
  communesByWilaya[code]?.sort((a, b) => a.name.localeCompare(b.name))
}

export function getWilayas(): Wilaya[] {
  return WILAYAS
}

export function getWilayaByCode(code: string): Wilaya | undefined {
  return WILAYAS.find((w) => w.code === String(code))
}

export function getCommunesForWilaya(wilayaId: string): CommuneLocation[] {
  return communesByWilaya[String(wilayaId)] || []
}
