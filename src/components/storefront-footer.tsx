import {
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Store,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
} from 'lucide-react'
import type { StorefrontSettings } from '#/lib/types'
import { useStorefrontSettings } from '#/lib/use-storefront-settings'

// Custom SVGs for platforms not in standard Lucide
function TikTokIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.361 0 .708.069 1.026.195V9.458a6.34 6.34 0 0 0-1.026-.083C5.975 9.375 3.125 12.225 3.125 15.672 3.125 19.119 5.975 22 9.483 22c3.508 0 6.358-2.85 6.358-6.328V9.176a8.216 8.216 0 0 0 5.184 1.83V7.561a4.832 4.832 0 0 1-1.436-.875z" />
    </svg>
  )
}

function WhatsAppIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.004 2c-5.518 0-9.996 4.479-9.996 9.998 0 1.763.46 3.488 1.332 5.002L2 22l5.132-1.328a9.96 9.96 0 0 0 4.872 1.258c5.518 0 9.996-4.478 9.996-9.997 0-5.519-4.478-9.998-9.996-9.998zm0 18.283c-1.522 0-3.013-.409-4.316-1.183l-.31-.184-3.208.83.856-3.126-.201-.321a8.26 8.26 0 0 1-1.267-4.402c0-4.57 3.717-8.287 8.286-8.287 4.568 0 8.285 3.717 8.285 8.287 0 4.57-3.717 8.286-8.285 8.286zm4.542-6.208c-.248-.124-1.468-.724-1.696-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.249-.124-1.049-.387-1.999-1.233-.739-.659-1.238-1.474-1.383-1.722-.145-.248-.015-.382.109-.505.112-.111.248-.29.373-.435.124-.145.166-.248.249-.414.083-.166.041-.311-.021-.435-.062-.124-.56-1.35-.767-1.85-.202-.487-.407-.421-.56-.429l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.87 0.85-.87 2.073 0 1.223.891 2.405 1.015 2.571.124.166 1.753 2.678 4.247 3.755.593.256 1.056.409 1.417.524.596.19 1.138.163 1.567.099.478-.071 1.468-.6 1.676-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29z" />
    </svg>
  )
}

function TelegramIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  )
}

interface StorefrontFooterProps {
  settings?: StorefrontSettings | null
}

export function StorefrontFooter({
  settings: initialSettings,
}: StorefrontFooterProps) {
  const { settings } = useStorefrontSettings(initialSettings)

  const currentYear = new Date().getFullYear()

  // Format WhatsApp Link
  const formatWhatsAppUrl = (val?: string) => {
    if (!val) return ''
    if (val.startsWith('http://') || val.startsWith('https://')) return val
    const cleanNumber = val.replace(/[^\d]/g, '')
    return `https://wa.me/${cleanNumber}`
  }

  // Format Social URL
  const formatUrl = (val?: string) => {
    if (!val) return ''
    if (val.startsWith('http://') || val.startsWith('https://')) return val
    return `https://${val}`
  }

  const socialLinks = settings.socialLinks

  const activeSocials = [
    {
      name: 'Facebook',
      url: formatUrl(socialLinks.facebook),
      icon: Facebook,
      color: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      name: 'Instagram',
      url: formatUrl(socialLinks.instagram),
      icon: Instagram,
      color: 'hover:bg-[#E4405F] hover:text-white',
    },
    {
      name: 'WhatsApp',
      url: formatWhatsAppUrl(socialLinks.whatsapp),
      icon: WhatsAppIcon,
      color: 'hover:bg-[#25D366] hover:text-white',
    },
    {
      name: 'TikTok',
      url: formatUrl(socialLinks.tiktok),
      icon: TikTokIcon,
      color:
        'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
    },
    {
      name: 'Telegram',
      url: formatUrl(socialLinks.telegram),
      icon: TelegramIcon,
      color: 'hover:bg-[#229ED9] hover:text-white',
    },
    {
      name: 'YouTube',
      url: formatUrl(socialLinks.youtube),
      icon: Youtube,
      color: 'hover:bg-[#FF0000] hover:text-white',
    },
    {
      name: 'Twitter / X',
      url: formatUrl(socialLinks.twitter),
      icon: Twitter,
      color:
        'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
    },
    {
      name: 'LinkedIn',
      url: formatUrl(socialLinks.linkedin),
      icon: Linkedin,
      color: 'hover:bg-[#0A66C2] hover:text-white',
    },
  ].filter((item) => Boolean(item.url && item.url.trim()))

  return (
    <footer
      dir="rtl"
      className="mt-16 border-t border-border/80 bg-card/60 backdrop-blur-md text-foreground font-arabic transition-colors"
    >
      {/* Top Value Propositions / Trust Bar */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-right">
            <div className="flex items-center gap-3 p-2">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Truck className="size-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  توصيل سريع 58 ولاية
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  لباب منزلك أو المكتب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  الدفع عند الاستلام
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  تسوق براحة وأمان تام
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="size-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  ضمان الجودة والاستبدال
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  منتجات أصلية ومفحوصة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Headphones className="size-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  خدمة الزبائن
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  مرافقة مستمرة لطلبك
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & About (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'Store Logo'}
                  className="h-10 w-auto max-w-40 object-contain rounded-md"
                />
              ) : (
                <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                  <Store className="size-5" />
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight">
                {settings.storeName || 'SignovaPub'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
              {settings.storeDescription ||
                'وجهتكم الأولى للتسوق الموثوق، نقدم لكم منتجات مختارة بعناية فائقة مع تجربة شراء سلسة وضمان حقيقي.'}
            </p>

            {/* Social Media Links Section */}
            {activeSocials.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  تابعنا على منصات التواصل:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeSocials.map((social) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`size-9 rounded-lg border border-border bg-card text-muted-foreground flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-2xs ${social.color}`}
                        title={social.name}
                        aria-label={social.name}
                      >
                        <Icon className="size-4.5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
              معلومات الاتصال والطلب
            </h3>

            <ul className="space-y-3 text-xs sm:text-sm">
              {/* Primary Phone */}
              {settings.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Phone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        رقم الهاتف الأساسي
                      </div>
                      <div
                        className="font-bold font-sans text-foreground group-hover:text-primary dir-ltr text-right"
                        dir="ltr"
                      >
                        {settings.phone}
                      </div>
                    </div>
                  </a>
                </li>
              )}

              {/* Secondary Phone */}
              {settings.secondaryPhone && (
                <li>
                  <a
                    href={`tel:${settings.secondaryPhone.replace(/\s+/g, '')}`}
                    className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <PhoneCall className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        رقم الهاتف الثانوي / واتساب
                      </div>
                      <div
                        className="font-bold font-sans text-foreground group-hover:text-primary dir-ltr text-right"
                        dir="ltr"
                      >
                        {settings.secondaryPhone}
                      </div>
                    </div>
                  </a>
                </li>
              )}

              {/* Email */}
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        البريد الإلكتروني
                      </div>
                      <div
                        className="font-medium font-sans text-foreground group-hover:text-primary truncate"
                        dir="ltr"
                      >
                        {settings.email}
                      </div>
                    </div>
                  </a>
                </li>
              )}

              {/* Working Hours */}
              {settings.workingHours && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-medium">
                      أوقات العمل والدعم
                    </div>
                    <div className="text-xs text-foreground font-medium">
                      {settings.workingHours}
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Location & Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
              الموقع والمقر
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
              {settings.location && (
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-medium">
                      عنوان المتجر والمستودع
                    </div>
                    <p className="font-semibold text-foreground text-xs leading-relaxed mt-0.5">
                      {settings.location}
                    </p>
                    {settings.locationUrl && (
                      <a
                        href={settings.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline mt-1.5"
                      >
                        <span>عرض على الخريطة</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border/40 flex items-start gap-3">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ExternalLink className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground font-medium">
                    روابط سريعة
                  </div>
                  <ul className="space-y-1.5 mt-1.5">
                    <li>
                      <a
                        href="/p"
                        className="group inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        <span className="size-1 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                        <span>تصفح جميع المنتجات</span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#order"
                        className="group inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        <span className="size-1 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                        <span>طلب فوري والدفع عند الاستلام</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {currentYear} {settings.storeName || 'SignovaPub'}. جميع الحقوق
            محفوظة.
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>تسوق آمن ومضمون 100% • دفع نقدي عند وصول الطلب</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
