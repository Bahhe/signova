import type { Product } from './types.ts'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-aero-keyboard',
    title: 'لوحة مفاتيح ميكانيكية إيرو - إصدار لونار',
    slug: 'aero-mechanical-keyboard',
    description: `صُممت للدقة الفائقة والتناغم الصوتي مع هيكل ألمنيوم CNC ومفاتيح خطية مخصصة لتجربة كتابة استثنائية على مكتبك.

أغطية مفاتيح PBT متينة بنقش مزدوج مقاوم للتآكل. تدعم التوصيل اللاسلكي فائق السرعة 2.4 جيجاهرتز، وبلوتوث 5.2، وسلك USB-C قابل للفصل.`,
    price: '24,500 دج',
    category: 'مساحة العمل',
    badge: 'الأكثر مبيعاً',
    published: true,
    features: [
      'هيكل متين من الألمنيوم 6063 المصقول بتقنية CNC',
      'نظام تثبيت حشايا مرن (Gasket Mount) مع عزل صوتي متقدم',
      'مفاتيح خطية مشحمة مصنعياً لاستجابة ناعمة وسريعة',
      'لوحة إلكترونية قابلة للتبديل السريع (Hot-swappable 3/5-pin)',
      'اتصال ثلاثي الأوضاع: 2.4G لاسلكي، وبلوتوث 5.2، وUSB-C',
      'إضاءة RGB خلفية قابلة للتخصيص بالكامل',
    ],
    ctaText: 'اطلب إصدار لونار الآن',
    ctaUrl: '#order',
    images: [
      {
        id: 'img-aero-1',
        name: 'aero-hero.jpg',
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-aero-2',
        name: 'aero-detail.jpg',
        url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-aero-3',
        name: 'aero-switches.jpg',
        url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-aero-4',
        name: 'aero-desk.jpg',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    createdAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'prod-solstice-pack',
    title: 'حقيبة الظهر اليومية سولستيس',
    slug: 'solstice-everyday-daypack',
    description: `حقيبة يومية عصرية ومقاومة للعوامل الجوية مصممة خصيصاً للمبدعين والمسافرين. مصنوعة من نسيج نايلون معاد تدويره عالي المتانة مع لمسات جلدية طبيعية وسحابات YKK المقاومة للماء.

تحتوي على حجرة مبطنة محمية مخصصة للحواسيب المحمولة حتى 16 بوصة، مع أحزمة كتف شبكية مريحة للاستخدام طوال اليوم.`,
    price: '18,900 دج',
    category: 'معدات وحقائب',
    badge: 'اختيار مميز',
    published: true,
    features: [
      'قماش نايلون 840D معاد تدويره ومقاوم للظروف الجوية',
      'جيب مبطن ومعلق لحماية الكمبيوتر المحمول حتى 16 بوصة',
      'مشبك صدري مغناطيسي Fidlock® للإغلاق السريع',
      'حزام خلفي للتثبيت على حقائب السفر بعجلات',
      'جيوب جانبية مخفية لحمل قارورة الماء بأمان',
      'بطانة خلفية مريحة وقابلة للتهوية لمنع التعرق',
    ],
    ctaText: 'احصل على حقيبتك الآن',
    ctaUrl: '#order',
    images: [
      {
        id: 'img-sol-1',
        name: 'daypack-front.jpg',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-sol-2',
        name: 'daypack-lifestyle.jpg',
        url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-sol-3',
        name: 'daypack-details.jpg',
        url: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    createdAt: '2026-09-17T11:30:00.000Z',
    updatedAt: '2026-09-17T11:30:00.000Z',
  },
  {
    id: 'prod-artisan-dripper',
    title: 'قمع تقطير القهوة الخزفي الحرفي كورو',
    slug: 'kuro-ceramic-coffee-dripper',
    description: `مصنوع يدوياً على دفعات صغيرة من الخزف البركاني الغني بالمعادن. يعمل قمع كورو على موازنة تدفق الماء بفضل الزعانف الحلزونية الدقيقة لاستخلاص أعمق النكهات العطرية من القهوة المختصة.

يأتي مع قاعدة نحاسية مذهبة تثبت بإحكام على أي إبريق أو كوب تقديم.`,
    price: '8,900 دج',
    category: 'مستلزمات القهوة',
    badge: 'إصدار محدود',
    published: true,
    features: [
      'خزف حجري بركاني مصنوع ومشكل يدوياً',
      'أضلاع حلزونية هندسية لاستخلاص مثالي متوازن',
      'قاعدة تثبيت متينة من النحاس المصقول المقاوم للصدأ',
      'متوافق مع فلاتر القهوة المخروطية القياسية مقاس 02',
      'احتفاظ حراري ممتاز لاستقرار درجة حرارة التقطير',
    ],
    ctaText: 'اطلب القمع الآن',
    ctaUrl: '#order',
    images: [
      {
        id: 'img-kuro-1',
        name: 'dripper-main.jpg',
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-kuro-2',
        name: 'dripper-pour.jpg',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'img-kuro-3',
        name: 'dripper-detail.jpg',
        url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    createdAt: '2026-09-17T12:00:00.000Z',
    updatedAt: '2026-09-17T12:00:00.000Z',
  },
]
