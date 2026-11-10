export type Language = 'en' | 'fr' | 'ar';

export interface Translations {
  // Navbar
  downloaders: string;
  youtubeDownloader: string;
  youtubeDownloaderDesc: string;
  podcastClipper: string;
  podcastClipperDesc: string;
  audioExtractor: string;
  audioExtractorDesc: string;
  queue: string;
  history: string;
  analytics: string;
  pricing: string;
  settings: string;
  signIn: string;
  getStarted: string;

  // Home Hero
  freeTool: string;
  heroTitle: string;
  heroSubtitle: string;
  inputPlaceholder: string;
  downloadNow: string;
  clear: string;
  analyzing: string;

  // Home Card
  podcastMode: string;
  podcastModeDesc: string;
  proBadge: string;
  proModalTitle: string;
  proModalDesc: string;
  upgradeBtn: string;
  maybeLater: string;
  startMoment: string;
  endMoment: string;
  selectQuality: string;
  downloadVideo: string;
  downloadClip: string;
  addedToQueue: string;

  // Pricing
  pricingTitle: string;
  pricingSubtitle: string;
  freePlanTitle: string;
  freePlanPrice: string;
  freePlanPeriod: string;
  freePlanFeatures: string[];
  currentPlanBtn: string;
  proPlanTitle: string;
  proPlanPrice: string;
  proPlanPeriod: string;
  proPlanBadge: string;
  proPlanFeatures: string[];
  unlockProBtn: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    downloaders: 'Downloaders',
    youtubeDownloader: 'YouTube Video Downloader',
    youtubeDownloaderDesc: 'Download full 1080p, 4K & Shorts',
    podcastClipper: 'Podcast Moment Clipper',
    podcastClipperDesc: 'Download exact minutes from long videos',
    audioExtractor: 'Audio Extractor',
    audioExtractorDesc: 'Extract MP3 or M4A high-bitrate audio',
    queue: 'Queue',
    history: 'History',
    analytics: 'Analytics',
    pricing: 'Pricing',
    settings: 'Settings',
    signIn: 'Sign in',
    getStarted: 'Get Started',

    freeTool: 'Free Tool',
    heroTitle: 'YouTube Video Downloader',
    heroSubtitle: 'Download any YouTube video in HD, 4K, or SD. Free, instant, no software needed.',
    inputPlaceholder: 'Paste a YouTube URL or video ID...',
    downloadNow: 'Download Now',
    clear: 'Clear',
    analyzing: 'Analyzing...',

    podcastMode: 'Download Specific Moment (Podcast Mode)',
    podcastModeDesc: 'Clip only the minutes you want without downloading the full video.',
    proBadge: 'PRO',
    proModalTitle: 'Podcast Mode is a Pro Feature',
    proModalDesc: 'Download exact minutes and moments from long podcasts without downloading the entire video.',
    upgradeBtn: 'Upgrade to Pro - $9.99',
    maybeLater: 'Maybe Later',
    startMoment: 'Start',
    endMoment: 'End',
    selectQuality: 'Select Quality / Format',
    downloadVideo: 'Download Video',
    downloadClip: 'Download Clip',
    addedToQueue: 'Added to Queue',

    pricingTitle: 'Simple, transparent pricing',
    pricingSubtitle: 'Everything is free forever. The Podcast Moment Clipper is available in Pro.',
    freePlanTitle: 'Free',
    freePlanPrice: '$0',
    freePlanPeriod: 'Forever free',
    freePlanFeatures: [
      'Unlimited YouTube video downloads',
      'Full 1080p, 1440p & 4K quality',
      'High-bitrate MP3 audio extraction',
      'Download queue & history',
      'Fast & completely ad-free',
    ],
    currentPlanBtn: 'Current Plan',
    proPlanTitle: 'Pro Lifetime',
    proPlanPrice: '$9.99',
    proPlanPeriod: 'One-time payment, lifetime access',
    proPlanBadge: 'MOST POPULAR',
    proPlanFeatures: [
      'Everything in the Free plan',
      'Download Specific Moment (Podcast Mode)',
      'Cut and clip exact minutes/seconds',
      'Zero network waste: only clips are downloaded',
      'Keyframe-accurate stream slicing',
      'Lifetime updates & priority support',
    ],
    unlockProBtn: 'Get Pro Lifetime - $9.99',
  },

  fr: {
    downloaders: 'Téléchargeurs',
    youtubeDownloader: 'Téléchargeur de Vidéos YouTube',
    youtubeDownloaderDesc: 'Téléchargez en 1080p, 4K et Shorts',
    podcastClipper: 'Découpeur de Podcasts',
    podcastClipperDesc: 'Téléchargez les minutes exactes de longues vidéos',
    audioExtractor: 'Extracteur Audio',
    audioExtractorDesc: 'Extrayez l\'audio MP3 ou M4A haute qualité',
    queue: 'File d\'attente',
    history: 'Historique',
    analytics: 'Analytiques',
    pricing: 'Tarifs',
    settings: 'Paramètres',
    signIn: 'Connexion',
    getStarted: 'Commencer',

    freeTool: 'Outil Gratuit',
    heroTitle: 'Téléchargeur de Vidéos YouTube',
    heroSubtitle: 'Téléchargez n\'importe quelle vidéo YouTube en HD, 4K ou SD. Gratuit, instantané, sans logiciel.',
    inputPlaceholder: 'Collez une URL ou l\'ID de la vidéo YouTube...',
    downloadNow: 'Télécharger',
    clear: 'Effacer',
    analyzing: 'Analyse en cours...',

    podcastMode: 'Télécharger un Moment Précis (Mode Podcast)',
    podcastModeDesc: 'Découpez seulement les minutes souhaitées sans télécharger toute la vidéo.',
    proBadge: 'PRO',
    proModalTitle: 'Le Mode Podcast est une fonction Pro',
    proModalDesc: 'Découpez et téléchargez des moments exacts de longs podcasts sans télécharger l\'intégralité du fichier.',
    upgradeBtn: 'Passer à Pro - 9,99 $',
    maybeLater: 'Plus tard',
    startMoment: 'Début',
    endMoment: 'Fin',
    selectQuality: 'Sélectionnez la Qualité / Format',
    downloadVideo: 'Télécharger la Vidéo',
    downloadClip: 'Télécharger l\'Extrait',
    addedToQueue: 'Ajouté à la file',

    pricingTitle: 'Tarification simple et transparente',
    pricingSubtitle: 'Tout est gratuit pour toujours. Le découpeur de podcasts est disponible dans Pro.',
    freePlanTitle: 'Gratuit',
    freePlanPrice: '0 $',
    freePlanPeriod: 'Gratuit pour toujours',
    freePlanFeatures: [
      'Téléchargements illimités de vidéos YouTube',
      'Qualité Full HD 1080p, 1440p et 4K',
      'Extraction audio MP3 haute fidélité',
      'File d\'attente et historique complets',
      'Rapide et 100% sans publicité',
    ],
    currentPlanBtn: 'Forfait Actuel',
    proPlanTitle: 'Pro À Vie',
    proPlanPrice: '9,99 $',
    proPlanPeriod: 'Paiement unique, accès à vie',
    proPlanBadge: 'LE PLUS POPULAIRE',
    proPlanFeatures: [
      'Tout ce qui est inclus dans le plan Gratuit',
      'Télécharger un Moment Précis (Mode Podcast)',
      'Découpage précis à la minute/seconde',
      'Économie de bande passante : seul l\'extrait est téléchargé',
      'Découpe propre aux images-clés',
      'Mises à jour à vie et support prioritaire',
    ],
    unlockProBtn: 'Obtenir Pro À Vie - 9,99 $',
  },

  ar: {
    downloaders: 'برامج التنزيل',
    youtubeDownloader: 'تنزيل فيديوهات يوتيوب',
    youtubeDownloaderDesc: 'تنزيل بدقة 1080p و 4K ومقاطع Shorts',
    podcastClipper: 'قص مقاطع البودكاست',
    podcastClipperDesc: 'تنزيل دقائق محددة من مقاطع الفيديو الطويلة',
    audioExtractor: 'استخراج الصوت',
    audioExtractorDesc: 'استخراج صوت MP3 أو M4A عالي الجودة',
    queue: 'قائمة التنزيل',
    history: 'السجل',
    analytics: 'التحليلات',
    pricing: 'الأسعار',
    settings: 'الإعدادات',
    signIn: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',

    freeTool: 'أداة مجانية',
    heroTitle: 'تنزيل فيديوهات يوتيوب',
    heroSubtitle: 'قم بتنزيل أي فيديو يوتيوب بدقة HD أو 4K أو SD. مجاني وفوري وبدون أي برامج.',
    inputPlaceholder: 'الصق رابط فيديو يوتيوب هنا...',
    downloadNow: 'تنزيل الآن',
    clear: 'مسح',
    analyzing: 'جاري التحليل...',

    podcastMode: 'تنزيل مقطع محدد (وضع البودكاست)',
    podcastModeDesc: 'قم بقص وتنزيل الدقائق التي تريدها فقط دون تنزيل الفيديو كاملاً.',
    proBadge: 'برو',
    proModalTitle: 'وضع البودكاست ميزة خاصة بـ Pro',
    proModalDesc: 'قم بقص وتنزيل دقائق محددة من البودكاست ومقاطع الفيديو الطويلة دون تنزيل الفيديو بأكمله.',
    upgradeBtn: 'الترقية إلى برو - 9.99$',
    maybeLater: 'ربما لاحقاً',
    startMoment: 'البداية',
    endMoment: 'النهاية',
    selectQuality: 'اختر الجودة / الصيغة',
    downloadVideo: 'تنزيل الفيديو',
    downloadClip: 'تنزيل المقطع',
    addedToQueue: 'تمت الإضافة لقائمة التنزيل',

    pricingTitle: 'أسعار بسيطة وشفافة',
    pricingSubtitle: 'كل شيء مجاني للأبد. ميزة قص البودكاست متوفرة فقط في النسخة المدفوعة.',
    freePlanTitle: 'مجاني',
    freePlanPrice: '0$',
    freePlanPeriod: 'مجاني مدى الحياة',
    freePlanFeatures: [
      'تنزيل غير محدود لفيديوهات يوتيوب',
      'جودة فائقة Full HD 1080p و 1440p و 4K',
      'استخراج الصوت بصيغة MP3 عالية الجودة',
      'قائمة تنزيلات وسجل كامل',
      'سريع تماماً وبدون إعلانات',
    ],
    currentPlanBtn: 'خطتك الحالية',
    proPlanTitle: 'برو مدى الحياة',
    proPlanPrice: '9.99$',
    proPlanPeriod: 'دفع لمرة واحدة، وصول دائم',
    proPlanBadge: 'الأكثر طلباً',
    proPlanFeatures: [
      'كل ميزات الباقة المجانية',
      'تنزيل مقطع محدد (وضع البودكاست)',
      'قص وتنزيل الدقائق/الثواني بدقة تامة',
      'توفير استهلاك الإنترنت: تنزيل المقطع المحدد فقط',
      'قص نقي واحترافي على الإطارات المفتاحية',
      'تحديثات مستمرة مدى الحياة ودعم متميز',
    ],
    unlockProBtn: 'احصل على برو مدى الحياة - 9.99$',
  },
};

