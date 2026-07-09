// ── Demo seed for the حِرف workspace ──────────────────────────────────
// Mirrors the Supabase schema; swap the repositories in "@/services" to
// the Supabase implementation and this file becomes dead weight.

import type {
  ActivityItem,
  CatalogItem,
  AppNotification,
  AuditEntry,
  CalendarEvent,
  Campaign,
  Client,
  Department,
  Employee,
  Expense,
  FileItem,
  Invoice,
  MonthPoint,
  Project,
  Quotation,
  Store,
  Task,
  TaskComment,
  Tenant,
} from "@/types";

export const TENANT_ID = "t-hirf";

export const tenant: Tenant = {
  id: TENANT_ID,
  name: "حِرف",
  nameEn: "HIRF",
  legalStatus: "freelance",
  freelanceLicense: "FL-346-1198",
  mobile: "+966 55 210 4478",
  email: "hello@hirf.sa",
  // Freelance business — CR & VAT stay empty until registered (optional in settings)
  cr: "",
  vatNumber: "",
  city: "الرياض",
  plan: "pro",
};

export const catalog: CatalogItem[] = [
  { id: "ci-1", tenantId: TENANT_ID, kind: "service", name: "هوية بصرية كاملة", category: "التصميم", sku: "SRV-BRND-01", unit: "مشروع", price: 85000, cost: 32000, vatApplicable: true, active: true, description: "استراتيجية العلامة، الشعار، النظام البصري ودليل الاستخدام." },
  { id: "ci-2", tenantId: TENANT_ID, kind: "service", name: "تصميم شعار", category: "التصميم", sku: "SRV-LOGO-01", unit: "مشروع", price: 12000, cost: 4500, vatApplicable: true, active: true, description: "ثلاثة مقترحات مع جولتي تعديل وملفات نهائية." },
  { id: "ci-3", tenantId: TENANT_ID, kind: "service", name: "تطوير متجر سلة", category: "التطوير", sku: "SRV-SALLA-01", unit: "مشروع", price: 45000, cost: 18000, vatApplicable: true, active: true, description: "ثيم مخصص بالكامل مع تحسين السرعة وتجربة الجوال." },
  { id: "ci-4", tenantId: TENANT_ID, kind: "service", name: "موقع تسويقي تفاعلي", category: "التطوير", sku: "SRV-WEB-01", unit: "مشروع", price: 65000, cost: 26000, vatApplicable: true, active: true, description: "تصميم وتطوير موقع تعريفي متعدد الصفحات." },
  { id: "ci-5", tenantId: TENANT_ID, kind: "service", name: "إدارة حملات إعلانية", category: "التسويق", sku: "SRV-ADS-01", unit: "شهر", price: 15000, cost: 6000, vatApplicable: true, active: true, description: "إدارة شهرية للحملات عبر منصتين مع تقرير أداء." },
  { id: "ci-6", tenantId: TENANT_ID, kind: "service", name: "إدارة حسابات التواصل", category: "التسويق", sku: "SRV-SMM-01", unit: "شهر", price: 9500, cost: 3800, vatApplicable: true, active: true, description: "١٦ منشورًا شهريًا مع الردود والتقارير." },
  { id: "ci-7", tenantId: TENANT_ID, kind: "service", name: "جلسة تصوير منتجات", category: "الإنتاج", sku: "SRV-PHOTO-01", unit: "جلسة", price: 7500, cost: 3000, vatApplicable: true, active: true, description: "حتى ٣٠ منتجًا مع معالجة الصور." },
  { id: "ci-8", tenantId: TENANT_ID, kind: "service", name: "فيديو موشن جرافيك", category: "الإنتاج", sku: "SRV-MOTION-01", unit: "دقيقة", price: 9000, cost: 3600, vatApplicable: true, active: false, description: "سيناريو وتعليق صوتي وموسيقى مرخصة." },
  { id: "ci-9", tenantId: TENANT_ID, kind: "product", name: "استضافة سحابية سنوية", category: "منتجات رقمية", sku: "PRD-HOST-01", unit: "سنة", price: 1200, cost: 640, vatApplicable: true, active: true, description: "استضافة مُدارة مع شهادة SSL ونسخ احتياطي يومي." },
  { id: "ci-10", tenantId: TENANT_ID, kind: "product", name: "نطاق .sa", category: "منتجات رقمية", sku: "PRD-DOM-01", unit: "سنة", price: 220, cost: 140, vatApplicable: false, active: true, description: "تسجيل وإدارة نطاق سعودي لمدة سنة." },
  { id: "ci-11", tenantId: TENANT_ID, kind: "service", name: "عقد صيانة ودعم", category: "اشتراكات", sku: "SRV-CARE-01", unit: "شهر", price: 4500, cost: 1700, vatApplicable: true, active: true, description: "تحديثات ومراقبة ودعم فني خلال ساعات العمل." },
  { id: "ci-12", tenantId: TENANT_ID, kind: "service", name: "اشتراك إدارة متجر", category: "اشتراكات", sku: "SRV-STORE-01", unit: "شهر", price: 6000, cost: 2400, vatApplicable: true, active: true, description: "تشغيل المتجر وتحديث المنتجات وتقارير شهرية." },
];

export const departments: Department[] = [
  { id: "d-1", tenantId: TENANT_ID, name: "الإدارة", headId: "e-1", color: "var(--chart-1)" },
  { id: "d-2", tenantId: TENANT_ID, name: "التصميم", headId: "e-3", color: "var(--chart-3)" },
  { id: "d-3", tenantId: TENANT_ID, name: "التطوير", headId: "e-2", color: "var(--chart-2)" },
  { id: "d-4", tenantId: TENANT_ID, name: "التسويق", headId: "e-5", color: "var(--chart-4)" },
  { id: "d-5", tenantId: TENANT_ID, name: "المالية", headId: "e-8", color: "var(--chart-5)" },
];

export const employees: Employee[] = [
  { id: "e-1", tenantId: TENANT_ID, name: "عبدالله الغامدي", nameEn: "Abdullah Alghamdi", email: "abdullah@hirf.sa", phone: "+966 55 210 4478", jobTitle: "الرئيس التنفيذي", departmentId: "d-1", role: "owner", joinedAt: "2022-03-01", attendance: "present", hoursThisMonth: 142, tasksCompleted: 18, utilization: 72 },
  { id: "e-2", tenantId: TENANT_ID, name: "أحمد الشمري", nameEn: "Ahmed Alshammari", email: "ahmed@hirf.sa", phone: "+966 50 331 8892", jobTitle: "قائد فريق التطوير", departmentId: "d-3", role: "manager", joinedAt: "2022-06-15", attendance: "present", hoursThisMonth: 168, tasksCompleted: 34, utilization: 91 },
  { id: "e-3", tenantId: TENANT_ID, name: "سارة القحطاني", nameEn: "Sarah Alqahtani", email: "sarah@hirf.sa", phone: "+966 54 771 2035", jobTitle: "مديرة التصميم", departmentId: "d-2", role: "manager", joinedAt: "2022-09-01", attendance: "remote", hoursThisMonth: 155, tasksCompleted: 29, utilization: 86 },
  { id: "e-4", tenantId: TENANT_ID, name: "محمد العتيبي", nameEn: "Mohammed Alotaibi", email: "mohammed@hirf.sa", phone: "+966 56 909 1240", jobTitle: "مطور واجهات أمامية", departmentId: "d-3", role: "member", joinedAt: "2023-02-12", attendance: "present", hoursThisMonth: 171, tasksCompleted: 41, utilization: 94 },
  { id: "e-5", tenantId: TENANT_ID, name: "نورة الدوسري", nameEn: "Noura Aldossary", email: "noura@hirf.sa", phone: "+966 53 448 6617", jobTitle: "مديرة الأداء الإعلاني", departmentId: "d-4", role: "manager", joinedAt: "2023-05-20", attendance: "present", hoursThisMonth: 149, tasksCompleted: 22, utilization: 83 },
  { id: "e-6", tenantId: TENANT_ID, name: "خالد الحربي", nameEn: "Khalid Alharbi", email: "khalid@hirf.sa", phone: "+966 59 172 5583", jobTitle: "مطور متاجر إلكترونية", departmentId: "d-3", role: "member", joinedAt: "2023-08-07", attendance: "remote", hoursThisMonth: 160, tasksCompleted: 31, utilization: 88 },
  { id: "e-7", tenantId: TENANT_ID, name: "ريم العنزي", nameEn: "Reem Alanazi", email: "reem@hirf.sa", phone: "+966 58 605 3390", jobTitle: "مصممة جرافيك", departmentId: "d-2", role: "member", joinedAt: "2024-01-14", attendance: "onLeave", hoursThisMonth: 96, tasksCompleted: 17, utilization: 61 },
  { id: "e-8", tenantId: TENANT_ID, name: "لينا السبيعي", nameEn: "Lina Alsubaie", email: "lina@hirf.sa", phone: "+966 55 862 7714", jobTitle: "محاسبة أولى", departmentId: "d-5", role: "accountant", joinedAt: "2024-04-01", attendance: "present", hoursThisMonth: 152, tasksCompleted: 12, utilization: 78 },
];

export const clients: Client[] = [
  {
    id: "cl-1", tenantId: TENANT_ID, name: "شركة نماء القابضة", industry: "الاستثمار والتطوير",
    status: "active", city: "الرياض", address: "طريق الملك فهد، حي العليا، الرياض 12212",
    cr: "1010456782", vatNumber: "310045678200003", website: "namaa.sa",
    email: "info@namaa.sa", phone: "+966 11 464 8890",
    contacts: [
      { name: "فهد المطيري", title: "مدير التسويق", email: "fahad@namaa.sa", phone: "+966 55 400 1122" },
      { name: "هند العساف", title: "مسؤولة المشتريات", email: "hind@namaa.sa", phone: "+966 54 300 8871" },
    ],
    tags: ["عقد سنوي", "VIP"], since: "2023-02-10",
    notes: "عميل استراتيجي — يفضّل التقارير الشهرية المفصلة واجتماع مراجعة كل ربع.",
    lastActivity: "2026-06-29T10:20:00Z",
  },
  {
    id: "cl-2", tenantId: TENANT_ID, name: "متجر لمسة", industry: "التجارة الإلكترونية",
    status: "active", city: "جدة", address: "شارع الأمير سلطان، حي الزهراء، جدة 23425",
    cr: "4030298811", vatNumber: "300029881100003", website: "lamsa.store",
    email: "hello@lamsa.store", phone: "+966 12 606 7712",
    contacts: [{ name: "أمل باناجه", title: "المؤسسة", email: "amal@lamsa.store", phone: "+966 56 771 9034" }],
    tags: ["سلة", "متاجر"], since: "2023-09-05",
    notes: "متجر عطور ومستحضرات — موسم الذروة رمضان والأعياد.",
    lastActivity: "2026-06-30T14:05:00Z",
  },
  {
    id: "cl-3", tenantId: TENANT_ID, name: "عيادات ابتسامة", industry: "الرعاية الصحية",
    status: "active", city: "الرياض", address: "طريق العروبة، حي الورود، الرياض 12251",
    cr: "1010512204", vatNumber: "310051220400003", website: "ibtisama.clinic",
    email: "care@ibtisama.clinic", phone: "+966 11 205 3341",
    contacts: [
      { name: "د. طارق السويلم", title: "المدير الطبي", email: "tariq@ibtisama.clinic", phone: "+966 50 118 4420" },
    ],
    tags: ["حملات مستمرة"], since: "2024-01-18",
    notes: "التركيز على حملات حجز المواعيد — سناب شات الأعلى تحويلًا.",
    lastActivity: "2026-07-01T09:00:00Z",
  },
  {
    id: "cl-4", tenantId: TENANT_ID, name: "مطاعم ذواقة", industry: "المطاعم والضيافة",
    status: "active", city: "الدمام", address: "شارع الملك سعود، حي الشاطئ، الدمام 32414",
    cr: "2050334190", vatNumber: "302033419000003", website: "thawaqa.sa",
    email: "info@thawaqa.sa", phone: "+966 13 833 9021",
    contacts: [{ name: "بدر القحطاني", title: "مدير العمليات", email: "badr@thawaqa.sa", phone: "+966 55 662 8103" }],
    tags: ["فروع متعددة"], since: "2024-06-02",
    notes: "ثلاثة فروع — يخططون لافتتاح فرع الرياض في Q4 2026.",
    lastActivity: "2026-06-27T16:45:00Z",
  },
  {
    id: "cl-5", tenantId: TENANT_ID, name: "أكاديمية مهارة", industry: "التعليم والتدريب",
    status: "active", city: "الرياض", address: "طريق الأمير محمد بن سلمان، حي النرجس، الرياض 13325",
    cr: "1010601175", vatNumber: "310060117500003", website: "mahara.academy",
    email: "info@mahara.academy", phone: "+966 11 520 7788",
    contacts: [{ name: "منى الشهراني", title: "مديرة النمو", email: "mona@mahara.academy", phone: "+966 54 209 6641" }],
    tags: ["منصة تعليمية"], since: "2024-11-20",
    notes: "إطلاق منصة الدورات الجديدة مرتبط بحملة سبتمبر.",
    lastActivity: "2026-06-25T11:30:00Z",
  },
  {
    id: "cl-6", tenantId: TENANT_ID, name: "ورد وعود", industry: "الهدايا والزهور",
    status: "active", city: "جدة", address: "شارع التحلية، حي الأندلس، جدة 23326",
    cr: "4030412236", vatNumber: "300041223600003", website: "wardoud.com",
    email: "orders@wardoud.com", phone: "+966 12 263 5540",
    contacts: [{ name: "ليان الحارثي", title: "المؤسسة", email: "layan@wardoud.com", phone: "+966 58 812 7736" }],
    tags: ["زد", "مواسم"], since: "2025-02-14",
    notes: "الطلب يتضاعف في اليوم الوطني وعيد الأم — جهّز الحملات مبكرًا.",
    lastActivity: "2026-06-20T08:15:00Z",
  },
  {
    id: "cl-7", tenantId: TENANT_ID, name: "شركة أفق للعقارات", industry: "العقارات",
    status: "lead", city: "الرياض", address: "طريق الملك عبدالعزيز، حي الياسمين، الرياض 13322",
    cr: "1010633409", vatNumber: "310063340900003", website: "ofoq.re",
    email: "contact@ofoq.re", phone: "+966 11 410 2299",
    contacts: [{ name: "سلطان بن ناصر", title: "الرئيس التنفيذي", email: "sultan@ofoq.re", phone: "+966 50 990 3312" }],
    tags: ["عرض سعر مُرسل"], since: "2026-05-11",
    notes: "مهتمون بهوية كاملة + موقع تسويقي لمشروع «تلال الياسمين».",
    lastActivity: "2026-06-18T13:00:00Z",
  },
  {
    id: "cl-8", tenantId: TENANT_ID, name: "مغاسل نقاء", industry: "الخدمات المنزلية",
    status: "inactive", city: "الخبر", address: "شارع الأمير فيصل بن فهد، حي العقربية، الخبر 34445",
    cr: "2051229087", vatNumber: "302122908700003", website: "naqaa.app",
    email: "support@naqaa.app", phone: "+966 13 894 5567",
    contacts: [{ name: "يوسف الدوسري", title: "الشريك المؤسس", email: "yousef@naqaa.app", phone: "+966 59 233 7810" }],
    tags: ["مشروع منتهي"], since: "2023-04-08",
    notes: "انتهى تطبيقهم في 2025 — فرصة لعقد صيانة سنوي.",
    lastActivity: "2026-03-12T10:00:00Z",
  },
];

export const projects: Project[] = [
  {
    id: "pr-1", tenantId: TENANT_ID, clientId: "cl-1", name: "الهوية الرقمية الموحدة لنماء",
    service: "هوية بصرية", status: "inProgress", priority: "high", progress: 68,
    budget: 180000, spent: 112000, startDate: "2026-03-01", deadline: "2026-08-15",
    managerId: "e-3", teamIds: ["e-3", "e-7", "e-4"], hoursLogged: 412,
    milestones: [
      { id: "m-1", title: "استراتيجية العلامة", dueDate: "2026-04-01", done: true },
      { id: "m-2", title: "الشعار والنظام البصري", dueDate: "2026-05-20", done: true },
      { id: "m-3", title: "دليل الهوية الشامل", dueDate: "2026-07-15", done: false },
      { id: "m-4", title: "تطبيقات الهوية والتسليم", dueDate: "2026-08-15", done: false },
    ],
    description: "بناء هوية بصرية موحدة لشركة نماء وشركاتها التابعة الخمس مع دليل استخدام شامل.",
  },
  {
    id: "pr-2", tenantId: TENANT_ID, clientId: "cl-2", name: "إعادة إطلاق متجر لمسة على سلة",
    service: "تطوير متاجر", status: "inProgress", priority: "urgent", progress: 82,
    budget: 95000, spent: 71000, startDate: "2026-04-10", deadline: "2026-07-20",
    managerId: "e-2", teamIds: ["e-2", "e-6", "e-7"], hoursLogged: 356,
    milestones: [
      { id: "m-5", title: "تصميم تجربة الشراء", dueDate: "2026-05-05", done: true },
      { id: "m-6", title: "تطوير الثيم المخصص", dueDate: "2026-06-15", done: true },
      { id: "m-7", title: "نقل البيانات والاختبار", dueDate: "2026-07-10", done: false },
      { id: "m-8", title: "الإطلاق", dueDate: "2026-07-20", done: false },
    ],
    description: "ثيم سلة مخصص بالكامل مع تحسين سرعة الصفحات وتجربة شراء محسّنة للجوال.",
  },
  {
    id: "pr-3", tenantId: TENANT_ID, clientId: "cl-3", name: "حملات حجز المواعيد Q3",
    service: "إدارة إعلانات", status: "inProgress", priority: "high", progress: 35,
    budget: 60000, spent: 18500, startDate: "2026-06-01", deadline: "2026-09-30",
    managerId: "e-5", teamIds: ["e-5", "e-7"], hoursLogged: 88,
    milestones: [
      { id: "m-9", title: "استراتيجية الربع", dueDate: "2026-06-10", done: true },
      { id: "m-10", title: "إطلاق حملات يوليو", dueDate: "2026-07-05", done: false },
      { id: "m-11", title: "تقرير منتصف الربع", dueDate: "2026-08-15", done: false },
    ],
    description: "إدارة حملات سناب شات وتيك توك وميتا لزيادة حجوزات العيادة بنسبة 40٪.",
  },
  {
    id: "pr-4", tenantId: TENANT_ID, clientId: "cl-5", name: "منصة دورات مهارة",
    service: "تطوير ويب", status: "review", priority: "high", progress: 91,
    budget: 240000, spent: 208000, startDate: "2026-01-15", deadline: "2026-07-30",
    managerId: "e-2", teamIds: ["e-2", "e-4", "e-6", "e-3"], hoursLogged: 1240,
    milestones: [
      { id: "m-12", title: "تصميم المنصة", dueDate: "2026-02-28", done: true },
      { id: "m-13", title: "تطوير الواجهات", dueDate: "2026-05-01", done: true },
      { id: "m-14", title: "بوابة الدفع والاشتراكات", dueDate: "2026-06-15", done: true },
      { id: "m-15", title: "اختبار القبول النهائي", dueDate: "2026-07-25", done: false },
    ],
    description: "منصة تعليمية متكاملة: دورات مسجلة، بث مباشر، شهادات، واشتراكات شهرية.",
  },
  {
    id: "pr-5", tenantId: TENANT_ID, clientId: "cl-4", name: "تطبيق ولاء ذواقة",
    service: "تطبيقات جوال", status: "planning", priority: "medium", progress: 12,
    budget: 150000, spent: 9000, startDate: "2026-06-20", deadline: "2026-11-30",
    managerId: "e-2", teamIds: ["e-2", "e-4"], hoursLogged: 42,
    milestones: [
      { id: "m-16", title: "ورشة المتطلبات", dueDate: "2026-07-08", done: false },
      { id: "m-17", title: "النماذج الأولية", dueDate: "2026-08-10", done: false },
    ],
    description: "تطبيق نقاط ولاء وطلب مسبق لفروع ذواقة الثلاثة مع ربط بنظام الكاشير.",
  },
  {
    id: "pr-6", tenantId: TENANT_ID, clientId: "cl-6", name: "حملة اليوم الوطني — ورد وعود",
    service: "إدارة إعلانات", status: "planning", priority: "medium", progress: 8,
    budget: 45000, spent: 2500, startDate: "2026-07-15", deadline: "2026-09-25",
    managerId: "e-5", teamIds: ["e-5", "e-7"], hoursLogged: 12,
    milestones: [
      { id: "m-18", title: "المفهوم الإبداعي", dueDate: "2026-08-01", done: false },
      { id: "m-19", title: "إطلاق الحملة", dueDate: "2026-09-10", done: false },
    ],
    description: "حملة موسمية شاملة للـيوم الوطني ٩٦ مع تصاميم خاصة وعروض باقات.",
  },
  {
    id: "pr-7", tenantId: TENANT_ID, clientId: "cl-2", name: "اشتراك إدارة متجر لمسة",
    service: "إدارة متاجر", status: "inProgress", priority: "low", progress: 50,
    budget: 72000, spent: 36000, startDate: "2026-01-01", deadline: "2026-12-31",
    managerId: "e-6", teamIds: ["e-6", "e-5"], hoursLogged: 210,
    milestones: [
      { id: "m-20", title: "مراجعة النصف الأول", dueDate: "2026-07-01", done: true },
    ],
    description: "عقد سنوي: تشغيل المتجر، تحديث المنتجات، تقارير شهرية، ودعم فني.",
  },
  {
    id: "pr-8", tenantId: TENANT_ID, clientId: "cl-8", name: "تطبيق نقاء للخدمات المنزلية",
    service: "تطبيقات جوال", status: "completed", priority: "medium", progress: 100,
    budget: 130000, spent: 126500, startDate: "2025-03-01", deadline: "2025-10-30",
    managerId: "e-2", teamIds: ["e-2", "e-4", "e-3"], hoursLogged: 980,
    milestones: [
      { id: "m-21", title: "التسليم النهائي", dueDate: "2025-10-30", done: true },
    ],
    description: "تطبيق حجز خدمات غسيل بنظام اشتراكات — سُلِّم وأُغلق المشروع.",
  },
];

export const tasks: Task[] = [
  { id: "tk-1", tenantId: TENANT_ID, projectId: "pr-2", title: "اختبار تجربة الدفع على الجوال", status: "inProgress", priority: "urgent", assigneeId: "e-6", dueDate: "2026-07-06", labels: ["متجر", "اختبار"], estimateH: 8, spentH: 5, subtasksDone: 3, subtasksTotal: 5, comments: 4, attachments: 1 },
  { id: "tk-2", tenantId: TENANT_ID, projectId: "pr-2", title: "نقل بيانات المنتجات من المتجر القديم", status: "inProgress", priority: "high", assigneeId: "e-2", dueDate: "2026-07-08", labels: ["متجر"], estimateH: 12, spentH: 7, subtasksDone: 2, subtasksTotal: 4, comments: 2, attachments: 0 },
  { id: "tk-3", tenantId: TENANT_ID, projectId: "pr-1", title: "تصميم دليل استخدام الهوية — الفصل الثالث", status: "inProgress", priority: "high", assigneeId: "e-7", dueDate: "2026-07-09", labels: ["تصميم"], estimateH: 16, spentH: 9, subtasksDone: 1, subtasksTotal: 3, comments: 6, attachments: 3 },
  { id: "tk-4", tenantId: TENANT_ID, projectId: "pr-4", title: "إصلاح ملاحظات اختبار القبول (12 ملاحظة)", status: "inProgress", priority: "urgent", assigneeId: "e-4", dueDate: "2026-07-07", labels: ["تطوير", "جودة"], estimateH: 20, spentH: 11, subtasksDone: 7, subtasksTotal: 12, comments: 9, attachments: 2 },
  { id: "tk-5", tenantId: TENANT_ID, projectId: "pr-3", title: "إعداد إعلانات سناب شات لشهر يوليو", status: "todo", priority: "high", assigneeId: "e-5", dueDate: "2026-07-04", labels: ["إعلانات"], estimateH: 6, spentH: 0, subtasksDone: 0, subtasksTotal: 3, comments: 1, attachments: 0 },
  { id: "tk-6", tenantId: TENANT_ID, projectId: "pr-3", title: "تصميم إعلانات فيديو للعيادة (3 مقاطع)", status: "todo", priority: "medium", assigneeId: "e-7", dueDate: "2026-07-11", labels: ["تصميم", "فيديو"], estimateH: 14, spentH: 0, subtasksDone: 0, subtasksTotal: 3, comments: 0, attachments: 1 },
  { id: "tk-7", tenantId: TENANT_ID, projectId: "pr-4", title: "توثيق واجهات API للعميل", status: "todo", priority: "medium", assigneeId: "e-2", dueDate: "2026-07-15", labels: ["توثيق"], estimateH: 10, spentH: 0, subtasksDone: 0, subtasksTotal: 2, comments: 0, attachments: 0 },
  { id: "tk-8", tenantId: TENANT_ID, projectId: "pr-5", title: "تجهيز ورشة متطلبات تطبيق ذواقة", status: "todo", priority: "medium", assigneeId: "e-2", dueDate: "2026-07-07", labels: ["اجتماع"], estimateH: 4, spentH: 0, subtasksDone: 1, subtasksTotal: 4, comments: 2, attachments: 1 },
  { id: "tk-9", tenantId: TENANT_ID, projectId: "pr-1", title: "مراجعة تطبيقات الهوية على القرطاسية", status: "review", priority: "medium", assigneeId: "e-3", dueDate: "2026-07-05", labels: ["تصميم", "مراجعة"], estimateH: 5, spentH: 5, subtasksDone: 2, subtasksTotal: 2, comments: 3, attachments: 4 },
  { id: "tk-10", tenantId: TENANT_ID, projectId: "pr-4", title: "مراجعة أمنية لبوابة الدفع", status: "review", priority: "urgent", assigneeId: "e-6", dueDate: "2026-07-06", labels: ["أمان", "دفع"], estimateH: 8, spentH: 8, subtasksDone: 4, subtasksTotal: 4, comments: 5, attachments: 1 },
  { id: "tk-11", tenantId: TENANT_ID, projectId: "pr-7", title: "تقرير أداء متجر لمسة — يونيو", status: "review", priority: "low", assigneeId: "e-5", dueDate: "2026-07-03", labels: ["تقارير"], estimateH: 3, spentH: 3, subtasksDone: 1, subtasksTotal: 1, comments: 1, attachments: 1 },
  { id: "tk-12", tenantId: TENANT_ID, projectId: "pr-2", title: "تصميم صفحات الهبوط للإطلاق", status: "done", priority: "high", assigneeId: "e-7", dueDate: "2026-06-28", labels: ["تصميم"], estimateH: 10, spentH: 12, subtasksDone: 3, subtasksTotal: 3, comments: 4, attachments: 5 },
  { id: "tk-13", tenantId: TENANT_ID, projectId: "pr-4", title: "ربط بوابة الدفع (تاب + مدى)", status: "done", priority: "urgent", assigneeId: "e-4", dueDate: "2026-06-15", labels: ["تطوير", "دفع"], estimateH: 24, spentH: 26, subtasksDone: 6, subtasksTotal: 6, comments: 11, attachments: 2 },
  { id: "tk-14", tenantId: TENANT_ID, projectId: "pr-1", title: "تسليم ملفات الشعار النهائية", status: "done", priority: "high", assigneeId: "e-3", dueDate: "2026-05-20", labels: ["تصميم", "تسليم"], estimateH: 4, spentH: 3, subtasksDone: 2, subtasksTotal: 2, comments: 2, attachments: 6 },
  { id: "tk-15", tenantId: TENANT_ID, projectId: null, title: "تحديث عرض خدمات الوكالة 2026", status: "inProgress", priority: "low", assigneeId: "e-1", dueDate: "2026-07-20", labels: ["داخلي"], estimateH: 6, spentH: 2, subtasksDone: 1, subtasksTotal: 3, comments: 0, attachments: 1 },
  { id: "tk-16", tenantId: TENANT_ID, projectId: "pr-6", title: "بحث ترندات اليوم الوطني ٩٦", status: "todo", priority: "low", assigneeId: "e-5", dueDate: "2026-07-25", labels: ["بحث", "إعلانات"], estimateH: 5, spentH: 0, subtasksDone: 0, subtasksTotal: 2, comments: 0, attachments: 0 },
  { id: "tk-17", tenantId: TENANT_ID, projectId: null, title: "إقفال فواتير الربع الثاني", status: "inProgress", priority: "high", assigneeId: "e-8", dueDate: "2026-07-10", labels: ["مالية"], estimateH: 8, spentH: 4, subtasksDone: 2, subtasksTotal: 5, comments: 1, attachments: 2 },
  { id: "tk-18", tenantId: TENANT_ID, projectId: "pr-8", title: "عرض عقد صيانة سنوي على نقاء", status: "todo", priority: "medium", assigneeId: "e-1", dueDate: "2026-07-14", labels: ["مبيعات"], estimateH: 3, spentH: 0, subtasksDone: 0, subtasksTotal: 1, comments: 1, attachments: 0 },
  { id: "tk-19", tenantId: TENANT_ID, projectId: "pr-3", title: "تصميم بانر إعلاني للنسخة القديمة", status: "cancelled", priority: "low", assigneeId: "e-7", startDate: "2026-06-20", dueDate: "2026-06-30", labels: ["تصميم"], estimateH: 4, spentH: 1, notes: "أُلغي بعد تغيير اتجاه الحملة.", subtasksDone: 0, subtasksTotal: 0, comments: 0, attachments: 0 },
];

// Threaded task discussion (mirrors the task_comments table).
export const taskComments: TaskComment[] = [
  { id: "tc-1", tenantId: TENANT_ID, taskId: "tk-1", authorId: "e-2", body: "بوابة مدى تعمل، بقي اختبار Apple Pay على iOS 17.", createdAt: "2026-07-01T09:20:00Z" },
  { id: "tc-2", tenantId: TENANT_ID, taskId: "tk-1", authorId: "e-6", body: "خلصت اختبار مدى، أرفع نتائج Apple Pay اليوم.", createdAt: "2026-07-01T14:05:00Z" },
  { id: "tc-3", tenantId: TENANT_ID, taskId: "tk-4", authorId: "e-4", body: "أنجزت 7 من 12 ملاحظة، الباقي متعلق بالـ QA.", createdAt: "2026-07-02T08:15:00Z" },
  { id: "tc-4", tenantId: TENANT_ID, taskId: "tk-3", authorId: "e-3", body: "الفصل الثالث جاهز للمراجعة، أضفت الأمثلة التطبيقية.", createdAt: "2026-06-30T16:40:00Z" },
];

export const invoices: Invoice[] = [
  { id: "inv-1", tenantId: TENANT_ID, number: "INV-2026-041", clientId: "cl-1", projectId: "pr-1", status: "paid", issueDate: "2026-05-01", dueDate: "2026-05-15", items: [{ description: "الدفعة الثانية — هوية نماء", qty: 1, unitPrice: 60000 }], paidAmount: 69000, recurring: false },
  { id: "inv-2", tenantId: TENANT_ID, number: "INV-2026-046", clientId: "cl-2", projectId: "pr-2", status: "paid", issueDate: "2026-05-20", dueDate: "2026-06-03", items: [{ description: "الدفعة الثانية — تطوير متجر لمسة", qty: 1, unitPrice: 35000 }], paidAmount: 40250, recurring: false },
  { id: "inv-3", tenantId: TENANT_ID, number: "INV-2026-049", clientId: "cl-5", projectId: "pr-4", status: "paid", issueDate: "2026-06-01", dueDate: "2026-06-15", items: [{ description: "الدفعة الرابعة — منصة مهارة", qty: 1, unitPrice: 60000 }], paidAmount: 69000, recurring: false },
  { id: "inv-4", tenantId: TENANT_ID, number: "INV-2026-050", clientId: "cl-2", projectId: "pr-7", status: "paid", issueDate: "2026-06-01", dueDate: "2026-06-10", items: [{ description: "اشتراك إدارة المتجر — يونيو", qty: 1, unitPrice: 6000 }], paidAmount: 6900, recurring: true },
  { id: "inv-5", tenantId: TENANT_ID, number: "INV-2026-052", clientId: "cl-3", projectId: "pr-3", status: "sent", issueDate: "2026-06-25", dueDate: "2026-07-09", items: [{ description: "أتعاب إدارة الحملات — يوليو", qty: 1, unitPrice: 15000 }, { description: "إنتاج محتوى إعلاني (3 فيديوهات)", qty: 3, unitPrice: 2500 }], paidAmount: 0, recurring: true },
  { id: "inv-6", tenantId: TENANT_ID, number: "INV-2026-053", clientId: "cl-1", projectId: "pr-1", status: "sent", issueDate: "2026-06-28", dueDate: "2026-07-12", items: [{ description: "الدفعة الثالثة — هوية نماء", qty: 1, unitPrice: 45000 }], paidAmount: 0, recurring: false },
  { id: "inv-7", tenantId: TENANT_ID, number: "INV-2026-044", clientId: "cl-4", projectId: "pr-5", status: "overdue", issueDate: "2026-05-10", dueDate: "2026-06-09", items: [{ description: "دفعة تعاقد — تطبيق ولاء ذواقة", qty: 1, unitPrice: 30000 }], paidAmount: 0, recurring: false },
  { id: "inv-8", tenantId: TENANT_ID, number: "INV-2026-038", clientId: "cl-6", projectId: null, status: "overdue", issueDate: "2026-04-18", dueDate: "2026-05-18", items: [{ description: "تصميم هوية موسمية — عيد الأضحى", qty: 1, unitPrice: 12000 }], paidAmount: 0, recurring: false },
  { id: "inv-9", tenantId: TENANT_ID, number: "INV-2026-051", clientId: "cl-2", projectId: "pr-7", status: "partial", issueDate: "2026-06-15", dueDate: "2026-06-29", items: [{ description: "حملة إطلاق المتجر الجديد", qty: 1, unitPrice: 18000 }], paidAmount: 10000, recurring: false },
  { id: "inv-10", tenantId: TENANT_ID, number: "INV-2026-054", clientId: "cl-2", projectId: "pr-7", status: "draft", issueDate: "2026-07-01", dueDate: "2026-07-10", items: [{ description: "اشتراك إدارة المتجر — يوليو", qty: 1, unitPrice: 6000 }], paidAmount: 0, recurring: true },
  { id: "inv-11", tenantId: TENANT_ID, number: "INV-2026-047", clientId: "cl-5", projectId: "pr-4", status: "paid", issueDate: "2026-04-01", dueDate: "2026-04-15", items: [{ description: "الدفعة الثالثة — منصة مهارة", qty: 1, unitPrice: 60000 }], paidAmount: 69000, recurring: false },
  { id: "inv-12", tenantId: TENANT_ID, number: "INV-2026-033", clientId: "cl-3", projectId: null, status: "paid", issueDate: "2026-03-25", dueDate: "2026-04-08", items: [{ description: "أتعاب إدارة الحملات — Q2", qty: 3, unitPrice: 15000 }], paidAmount: 51750, recurring: true },
];

export const expenses: Expense[] = [
  { id: "ex-1", tenantId: TENANT_ID, title: "رواتب يونيو", category: "رواتب", vendor: "مسير الرواتب", amount: 118000, date: "2026-06-27", recurring: true },
  { id: "ex-2", tenantId: TENANT_ID, title: "إيجار المكتب — Q3", category: "إيجار", vendor: "أملاك العقارية", amount: 33000, date: "2026-07-01", recurring: true },
  { id: "ex-3", tenantId: TENANT_ID, title: "اشتراكات أدوات التصميم", category: "برمجيات", vendor: "Adobe / Figma", amount: 4200, date: "2026-06-05", recurring: true },
  { id: "ex-4", tenantId: TENANT_ID, title: "استضافة وخوادم العملاء", category: "استضافة", vendor: "Hostinger / AWS", amount: 3800, date: "2026-06-03", recurring: true },
  { id: "ex-5", tenantId: TENANT_ID, title: "ميزانية إعلانات مُدارة (تُعاد فوترتها)", category: "إعلانات", vendor: "Meta / Snap / TikTok", amount: 42000, date: "2026-06-15", recurring: true },
  { id: "ex-6", tenantId: TENANT_ID, title: "تصوير منتجات لمسة", category: "إنتاج", vendor: "استوديو عدسة", amount: 7500, date: "2026-06-12", recurring: false },
  { id: "ex-7", tenantId: TENANT_ID, title: "أتعاب محاماة — مراجعة العقود", category: "مهنية", vendor: "مكتب الراجحي للمحاماة", amount: 5000, date: "2026-06-18", recurring: false },
  { id: "ex-8", tenantId: TENANT_ID, title: "تأمين طبي للموظفين", category: "موارد بشرية", vendor: "بوبا العربية", amount: 9600, date: "2026-06-01", recurring: true },
  { id: "ex-9", tenantId: TENANT_ID, title: "معدات — جهاز ماك جديد للتطوير", category: "معدات", vendor: "جرير", amount: 11500, date: "2026-06-20", recurring: false },
  { id: "ex-10", tenantId: TENANT_ID, title: "ضيافة واجتماعات عملاء", category: "تشغيلية", vendor: "متفرقات", amount: 1850, date: "2026-06-25", recurring: false },
];

export const quotations: Quotation[] = [
  { id: "q-1", tenantId: TENANT_ID, number: "QT-2026-018", clientId: "cl-7", title: "هوية وموقع مشروع تلال الياسمين", status: "sent", issueDate: "2026-06-15", validUntil: "2026-07-15", items: [{ description: "هوية بصرية كاملة", qty: 1, unitPrice: 85000 }, { description: "موقع تسويقي تفاعلي", qty: 1, unitPrice: 65000 }, { description: "جلسة تصوير معماري", qty: 1, unitPrice: 18000 }] },
  { id: "q-2", tenantId: TENANT_ID, number: "QT-2026-019", clientId: "cl-4", title: "إدارة حسابات التواصل — فرع الرياض", status: "draft", issueDate: "2026-06-28", validUntil: "2026-07-28", items: [{ description: "إدارة شهرية (6 أشهر)", qty: 6, unitPrice: 9500 }] },
  { id: "q-3", tenantId: TENANT_ID, number: "QT-2026-016", clientId: "cl-8", title: "عقد صيانة تطبيق نقاء السنوي", status: "sent", issueDate: "2026-06-10", validUntil: "2026-07-10", items: [{ description: "صيانة ودعم فني (12 شهر)", qty: 12, unitPrice: 4500 }] },
  { id: "q-4", tenantId: TENANT_ID, number: "QT-2026-014", clientId: "cl-5", title: "تطبيق جوال لمنصة مهارة", status: "approved", issueDate: "2026-05-20", validUntil: "2026-06-20", items: [{ description: "تطبيق iOS و Android", qty: 1, unitPrice: 165000 }] },
  { id: "q-5", tenantId: TENANT_ID, number: "QT-2026-012", clientId: "cl-6", title: "باقة اليوم الوطني الإعلانية", status: "approved", issueDate: "2026-05-05", validUntil: "2026-06-05", items: [{ description: "إدارة حملة موسمية", qty: 1, unitPrice: 25000 }, { description: "تصاميم وفيديوهات", qty: 1, unitPrice: 20000 }] },
  { id: "q-6", tenantId: TENANT_ID, number: "QT-2026-009", clientId: "cl-1", title: "فيديو تعريفي لمجموعة نماء", status: "rejected", issueDate: "2026-04-12", validUntil: "2026-05-12", items: [{ description: "فيديو موشن جرافيك 90 ثانية", qty: 1, unitPrice: 38000 }] },
];

export const campaigns: Campaign[] = [
  { id: "cp-1", tenantId: TENANT_ID, clientId: "cl-3", name: "حجوزات تقويم الأسنان — سناب", platform: "snapchat", objective: "تحويلات", status: "active", budget: 20000, spend: 12400, revenue: 86800, impressions: 1840000, clicks: 23900, conversions: 217, startDate: "2026-06-01", endDate: "2026-07-31" },
  { id: "cp-2", tenantId: TENANT_ID, clientId: "cl-3", name: "توعية زراعة الأسنان — ميتا", platform: "meta", objective: "زيارات الموقع", status: "active", budget: 12000, spend: 7800, revenue: 31200, impressions: 960000, clicks: 15400, conversions: 78, startDate: "2026-06-01", endDate: "2026-07-31" },
  { id: "cp-3", tenantId: TENANT_ID, clientId: "cl-2", name: "إطلاق متجر لمسة الجديد", platform: "tiktok", objective: "مبيعات المتجر", status: "active", budget: 18000, spend: 9200, revenue: 59800, impressions: 2210000, clicks: 41200, conversions: 342, startDate: "2026-06-15", endDate: "2026-07-30" },
  { id: "cp-4", tenantId: TENANT_ID, clientId: "cl-2", name: "استهداف مشتري العطور — قوقل", platform: "google", objective: "مبيعات المتجر", status: "active", budget: 10000, spend: 6100, revenue: 33550, impressions: 420000, clicks: 8900, conversions: 145, startDate: "2026-06-01", endDate: "2026-08-31" },
  { id: "cp-5", tenantId: TENANT_ID, clientId: "cl-5", name: "تسجيلات دفعة سبتمبر — ميتا", platform: "meta", objective: "عملاء محتملون", status: "paused", budget: 25000, spend: 4300, revenue: 12900, impressions: 380000, clicks: 6200, conversions: 43, startDate: "2026-06-20", endDate: "2026-09-15" },
  { id: "cp-6", tenantId: TENANT_ID, clientId: "cl-4", name: "أطباق الصيف — تيك توك", platform: "tiktok", objective: "زيارات الفروع", status: "active", budget: 9000, spend: 5400, revenue: 21600, impressions: 1560000, clicks: 28700, conversions: 412, startDate: "2026-06-10", endDate: "2026-07-25" },
  { id: "cp-7", tenantId: TENANT_ID, clientId: "cl-1", name: "توظيف الكفاءات — لينكدإن", platform: "linkedin", objective: "طلبات توظيف", status: "completed", budget: 15000, spend: 14200, revenue: 0, impressions: 210000, clicks: 3900, conversions: 96, startDate: "2026-04-01", endDate: "2026-05-31" },
  { id: "cp-8", tenantId: TENANT_ID, clientId: "cl-6", name: "هدايا عيد الأضحى", platform: "snapchat", objective: "مبيعات المتجر", status: "completed", budget: 14000, spend: 13750, revenue: 71500, impressions: 1980000, clicks: 31800, conversions: 286, startDate: "2026-05-15", endDate: "2026-06-08" },
];

export const stores: Store[] = [
  { id: "st-1", tenantId: TENANT_ID, clientId: "cl-2", name: "متجر لمسة", platform: "salla", status: "live", domain: "lamsa.store", hosting: "سلة كلاود", launchDate: "2023-10-01", monthlySales: 184000, monthlyOrders: 1240, visitors: 48200, conversionRate: 2.6, integrations: ["أرامكس", "تاب للدفع", "زد شيبينق"], pixels: ["Meta Pixel", "TikTok Pixel", "Snap Pixel", "GA4"], emails: ["hello@lamsa.store", "orders@lamsa.store"] },
  { id: "st-2", tenantId: TENANT_ID, clientId: "cl-6", name: "ورد وعود", platform: "zid", status: "live", domain: "wardoud.com", hosting: "زد كلاود", launchDate: "2025-03-20", monthlySales: 96500, monthlyOrders: 830, visitors: 27400, conversionRate: 3.0, integrations: ["سمسا", "مدى", "Apple Pay"], pixels: ["Meta Pixel", "Snap Pixel", "GA4"], emails: ["orders@wardoud.com"] },
  { id: "st-3", tenantId: TENANT_ID, clientId: "cl-4", name: "متجر ذواقة للتوصيل", platform: "shopify", status: "live", domain: "shop.thawaqa.sa", hosting: "Shopify Plus", launchDate: "2024-11-10", monthlySales: 142000, monthlyOrders: 2180, visitors: 61800, conversionRate: 3.5, integrations: ["جاهز", "هنقرستيشن", "Stripe"], pixels: ["Meta Pixel", "TikTok Pixel", "GA4"], emails: ["shop@thawaqa.sa", "support@thawaqa.sa"] },
  { id: "st-4", tenantId: TENANT_ID, clientId: "cl-5", name: "متجر دورات مهارة", platform: "woocommerce", status: "development", domain: "store.mahara.academy", hosting: "Hostinger VPS", launchDate: "2026-08-01", monthlySales: 0, monthlyOrders: 0, visitors: 0, conversionRate: 0, integrations: ["تاب للدفع", "Zapier"], pixels: ["GA4"], emails: ["store@mahara.academy"] },
  { id: "st-5", tenantId: TENANT_ID, clientId: "cl-1", name: "متجر عود نماء", platform: "salla", status: "maintenance", domain: "oud.namaa.sa", hosting: "سلة كلاود", launchDate: "2024-05-01", monthlySales: 38000, monthlyOrders: 210, visitors: 9800, conversionRate: 2.1, integrations: ["أرامكس", "مدى"], pixels: ["Meta Pixel", "GA4"], emails: ["oud@namaa.sa"] },
  { id: "st-6", tenantId: TENANT_ID, clientId: "cl-8", name: "اشتراكات نقاء", platform: "zid", status: "live", domain: "subscribe.naqaa.app", hosting: "زد كلاود", launchDate: "2025-06-15", monthlySales: 22400, monthlyOrders: 460, visitors: 8100, conversionRate: 5.7, integrations: ["مدى", "Apple Pay"], pixels: ["Snap Pixel", "GA4"], emails: ["billing@naqaa.app"] },
];

export const folders = ["العقود", "التصاميم", "الملخصات الإبداعية", "التقارير", "الفواتير", "الهويات"] as const;

export const files: FileItem[] = [
  { id: "f-1", tenantId: TENANT_ID, name: "عقد هوية نماء — موقّع.pdf", folder: "العقود", type: "pdf", sizeMB: 2.4, ownerId: "e-1", modifiedAt: "2026-03-02T09:00:00Z", versions: 2 },
  { id: "f-2", tenantId: TENANT_ID, name: "دليل هوية نماء v3.fig", folder: "الهويات", type: "design", sizeMB: 148.2, ownerId: "e-3", modifiedAt: "2026-06-29T15:20:00Z", versions: 14 },
  { id: "f-3", tenantId: TENANT_ID, name: "شعار نماء — ملفات نهائية.zip", folder: "الهويات", type: "design", sizeMB: 86.0, ownerId: "e-3", modifiedAt: "2026-05-20T12:00:00Z", versions: 3 },
  { id: "f-4", tenantId: TENANT_ID, name: "الملخص الإبداعي — حملة اليوم الوطني.docx", folder: "الملخصات الإبداعية", type: "doc", sizeMB: 0.8, ownerId: "e-5", modifiedAt: "2026-06-26T10:40:00Z", versions: 4 },
  { id: "f-5", tenantId: TENANT_ID, name: "تقرير أداء لمسة — يونيو.pdf", folder: "التقارير", type: "pdf", sizeMB: 5.1, ownerId: "e-5", modifiedAt: "2026-07-01T08:30:00Z", versions: 1 },
  { id: "f-6", tenantId: TENANT_ID, name: "تصوير منتجات لمسة — دفعة 2.zip", folder: "التصاميم", type: "image", sizeMB: 412.6, ownerId: "e-7", modifiedAt: "2026-06-14T13:10:00Z", versions: 1 },
  { id: "f-7", tenantId: TENANT_ID, name: "فيديو إعلان ابتسامة — نسخة نهائية.mp4", folder: "التصاميم", type: "video", sizeMB: 268.4, ownerId: "e-7", modifiedAt: "2026-06-22T17:45:00Z", versions: 6 },
  { id: "f-8", tenantId: TENANT_ID, name: "ميزانية الحملات Q3.xlsx", folder: "التقارير", type: "sheet", sizeMB: 0.3, ownerId: "e-8", modifiedAt: "2026-06-30T11:00:00Z", versions: 8 },
  { id: "f-9", tenantId: TENANT_ID, name: "عقد اشتراك إدارة لمسة 2026.pdf", folder: "العقود", type: "pdf", sizeMB: 1.9, ownerId: "e-1", modifiedAt: "2026-01-05T09:15:00Z", versions: 1 },
  { id: "f-10", tenantId: TENANT_ID, name: "واجهات منصة مهارة — تسليم.fig", folder: "التصاميم", type: "design", sizeMB: 224.7, ownerId: "e-3", modifiedAt: "2026-05-02T14:00:00Z", versions: 22 },
  { id: "f-11", tenantId: TENANT_ID, name: "INV-2026-053 — نماء.pdf", folder: "الفواتير", type: "pdf", sizeMB: 0.4, ownerId: "e-8", modifiedAt: "2026-06-28T09:05:00Z", versions: 1 },
  { id: "f-12", tenantId: TENANT_ID, name: "محضر اجتماع ذواقة — يونيو.docx", folder: "الملخصات الإبداعية", type: "doc", sizeMB: 0.2, ownerId: "e-2", modifiedAt: "2026-06-21T16:00:00Z", versions: 2 },
];

export const events: CalendarEvent[] = [
  { id: "ev-1", tenantId: TENANT_ID, title: "اجتماع مراجعة هوية نماء", kind: "meeting", date: "2026-07-02", time: "11:00", durationMin: 60, attendeeIds: ["e-1", "e-3", "e-7"], relatedClientId: "cl-1" },
  { id: "ev-2", tenantId: TENANT_ID, title: "مكالمة متابعة — عيادات ابتسامة", kind: "meeting", date: "2026-07-02", time: "14:30", durationMin: 30, attendeeIds: ["e-5"], relatedClientId: "cl-3" },
  { id: "ev-3", tenantId: TENANT_ID, title: "تسليم إعلانات سناب — يوليو", kind: "deadline", date: "2026-07-04", time: "17:00", durationMin: 0, attendeeIds: ["e-5", "e-7"], relatedClientId: "cl-3" },
  { id: "ev-4", tenantId: TENANT_ID, title: "ورشة متطلبات تطبيق ذواقة", kind: "meeting", date: "2026-07-08", time: "10:00", durationMin: 120, attendeeIds: ["e-1", "e-2", "e-4"], relatedClientId: "cl-4" },
  { id: "ev-5", tenantId: TENANT_ID, title: "اختبار قبول منصة مهارة", kind: "meeting", date: "2026-07-09", time: "13:00", durationMin: 90, attendeeIds: ["e-2", "e-4", "e-6"], relatedClientId: "cl-5" },
  { id: "ev-6", tenantId: TENANT_ID, title: "الموعد النهائي — نقل بيانات لمسة", kind: "deadline", date: "2026-07-10", time: "18:00", durationMin: 0, attendeeIds: ["e-2", "e-6"], relatedClientId: "cl-2" },
  { id: "ev-7", tenantId: TENANT_ID, title: "الاجتماع الأسبوعي للفريق", kind: "internal", date: "2026-07-05", time: "09:30", durationMin: 45, attendeeIds: ["e-1", "e-2", "e-3", "e-5", "e-8"], relatedClientId: null },
  { id: "ev-8", tenantId: TENANT_ID, title: "إطلاق متجر لمسة الجديد 🚀", kind: "launch", date: "2026-07-20", time: "20:00", durationMin: 0, attendeeIds: ["e-2", "e-6", "e-5"], relatedClientId: "cl-2" },
  { id: "ev-9", tenantId: TENANT_ID, title: "عرض عرض السعر — أفق العقارية", kind: "meeting", date: "2026-07-13", time: "12:00", durationMin: 60, attendeeIds: ["e-1", "e-3"], relatedClientId: "cl-7" },
  { id: "ev-10", tenantId: TENANT_ID, title: "تسليم دليل الهوية الشامل", kind: "deadline", date: "2026-07-15", time: "17:00", durationMin: 0, attendeeIds: ["e-3", "e-7"], relatedClientId: "cl-1" },
  { id: "ev-11", tenantId: TENANT_ID, title: "مراجعة مالية منتصف العام", kind: "internal", date: "2026-07-16", time: "10:00", durationMin: 90, attendeeIds: ["e-1", "e-8"], relatedClientId: null },
  { id: "ev-12", tenantId: TENANT_ID, title: "تسليم منصة مهارة النهائي", kind: "launch", date: "2026-07-30", time: "11:00", durationMin: 0, attendeeIds: ["e-2", "e-4"], relatedClientId: "cl-5" },
];

export const notifications: AppNotification[] = [
  { id: "n-1", tenantId: TENANT_ID, title: "فاتورة متأخرة", body: "فاتورة INV-2026-044 لمطاعم ذواقة متأخرة 23 يومًا (34,500 ر.س).", kind: "invoice", createdAt: "2026-07-02T06:00:00Z", read: false, href: "/finance" },
  { id: "n-2", tenantId: TENANT_ID, title: "مهمة عاجلة تقترب", body: "«اختبار تجربة الدفع على الجوال» تستحق خلال 4 أيام.", kind: "task", createdAt: "2026-07-02T05:30:00Z", read: false, href: "/tasks" },
  { id: "n-3", tenantId: TENANT_ID, title: "تم استلام دفعة", body: "سدّد متجر لمسة 10,000 ر.س من فاتورة INV-2026-051.", kind: "invoice", createdAt: "2026-07-01T14:20:00Z", read: false, href: "/finance" },
  { id: "n-4", tenantId: TENANT_ID, title: "حملة تتجاوز التوقعات", body: "حملة «إطلاق متجر لمسة» حققت ROAS 6.5× هذا الأسبوع.", kind: "campaign", createdAt: "2026-07-01T09:10:00Z", read: true, href: "/marketing" },
  { id: "n-5", tenantId: TENANT_ID, title: "اقتراب موعد نهائي", body: "مرحلة «نقل البيانات والاختبار» في مشروع لمسة تستحق 10 يوليو.", kind: "project", createdAt: "2026-06-30T16:00:00Z", read: true, href: "/projects/pr-2" },
  { id: "n-6", tenantId: TENANT_ID, title: "نسخة احتياطية مكتملة", body: "اكتمل النسخ الاحتياطي اليومي لقاعدة البيانات بنجاح.", kind: "system", createdAt: "2026-06-30T03:00:00Z", read: true, href: "/settings" },
];

export const activity: ActivityItem[] = [
  { id: "a-1", tenantId: TENANT_ID, actorId: "e-8", action: "أصدرت فاتورة", target: "INV-2026-053 لشركة نماء", href: "/finance", at: "2026-06-28T09:05:00Z" },
  { id: "a-2", tenantId: TENANT_ID, actorId: "e-4", action: "أكمل مهمة", target: "ربط بوابة الدفع (تاب + مدى)", href: "/tasks", at: "2026-06-27T15:40:00Z" },
  { id: "a-3", tenantId: TENANT_ID, actorId: "e-5", action: "أطلقت حملة", target: "إطلاق متجر لمسة الجديد — تيك توك", href: "/marketing", at: "2026-06-15T10:00:00Z" },
  { id: "a-4", tenantId: TENANT_ID, actorId: "e-3", action: "رفعت ملف", target: "دليل هوية نماء v3", href: "/files", at: "2026-06-29T15:20:00Z" },
  { id: "a-5", tenantId: TENANT_ID, actorId: "e-1", action: "أرسل عرض سعر", target: "QT-2026-018 لشركة أفق العقارية", href: "/quotations", at: "2026-06-15T12:30:00Z" },
  { id: "a-6", tenantId: TENANT_ID, actorId: "e-2", action: "حدّث تقدم مشروع", target: "منصة دورات مهارة → 91٪", href: "/projects/pr-4", at: "2026-06-30T09:00:00Z" },
  { id: "a-7", tenantId: TENANT_ID, actorId: "e-6", action: "أنهى مراجعة", target: "المراجعة الأمنية لبوابة الدفع", href: "/tasks", at: "2026-07-01T11:25:00Z" },
  { id: "a-8", tenantId: TENANT_ID, actorId: "e-5", action: "أضافت تقرير", target: "تقرير أداء لمسة — يونيو", href: "/files", at: "2026-07-01T08:30:00Z" },
];

export const auditLog: AuditEntry[] = [
  { id: "au-1", actor: "abdullah@hirf.sa", event: "تسجيل دخول ناجح", ip: "51.211.34.18", at: "2026-07-02T05:55:00Z" },
  { id: "au-2", actor: "lina@hirf.sa", event: "تصدير تقرير مالي (PDF)", ip: "51.211.34.18", at: "2026-07-01T13:12:00Z" },
  { id: "au-3", actor: "ahmed@hirf.sa", event: "تعديل صلاحيات المستخدم reem@hirf.sa", ip: "94.99.120.7", at: "2026-06-30T10:02:00Z" },
  { id: "au-4", actor: "system", event: "نسخ احتياطي تلقائي مكتمل", ip: "-", at: "2026-06-30T03:00:00Z" },
  { id: "au-5", actor: "noura@hirf.sa", event: "إنشاء مفتاح API (تكامل سلة)", ip: "51.211.34.18", at: "2026-06-28T14:44:00Z" },
  { id: "au-6", actor: "abdullah@hirf.sa", event: "دعوة مستخدم جديد lina@hirf.sa", ip: "51.211.34.18", at: "2026-06-25T09:31:00Z" },
];

// 12 months of financials ending June 2026 (SAR)
export const monthlyFinancials: MonthPoint[] = [
  { month: "2025-07", revenue: 148000, expenses: 112000 },
  { month: "2025-08", revenue: 132000, expenses: 108000 },
  { month: "2025-09", revenue: 171000, expenses: 121000 },
  { month: "2025-10", revenue: 189000, expenses: 126000 },
  { month: "2025-11", revenue: 164000, expenses: 118000 },
  { month: "2025-12", revenue: 205000, expenses: 139000 },
  { month: "2026-01", revenue: 176000, expenses: 124000 },
  { month: "2026-02", revenue: 198000, expenses: 131000 },
  { month: "2026-03", revenue: 232000, expenses: 148000 },
  { month: "2026-04", revenue: 214000, expenses: 142000 },
  { month: "2026-05", revenue: 246000, expenses: 155000 },
  { month: "2026-06", revenue: 261000, expenses: 163000 },
];

export const revenueByService = [
  { name: "تطوير الويب والمنصات", value: 820000 },
  { name: "إدارة الإعلانات", value: 465000 },
  { name: "الهوية والتصميم", value: 388000 },
  { name: "تطوير المتاجر", value: 342000 },
  { name: "إدارة واشتراكات", value: 176000 },
];
