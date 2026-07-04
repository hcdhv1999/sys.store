"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, KeyRound, Plug, Plus, ShieldCheck, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { auditLog, employees, tenant } from "@/lib/data/seed";
import type { MessageKey } from "@/lib/i18n/en";
import type { Role } from "@/types";

const optionalStr = (schema: z.ZodString) => schema.optional().or(z.literal(""));

const companySchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().min(2),
  freelanceLicense: z.string().min(4),
  mobile: z.string().min(9),
  email: z.string().email(),
  // Freelance business — CR & VAT stay optional until registered
  cr: optionalStr(z.string().regex(/^\d{10}$/)),
  vatNumber: optionalStr(z.string().regex(/^\d{15}$/)),
  city: z.string().min(2),
});
type CompanyForm = z.infer<typeof companySchema>;

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "member", "accountant", "viewer"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

interface Integration {
  name: string;
  description: string;
  connected: boolean;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? "bg-accent" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all ${checked ? "ltr:left-5.5 rtl:right-5.5" : "ltr:left-0.5 rtl:right-0.5"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();

  // Users & roles
  const [roles, setRoles] = useState<Record<string, Role>>(
    Object.fromEntries(employees.map((e) => [e.id, e.role])),
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState<{ email: string; role: Role }[]>([]);

  // Branding
  const [primary, setPrimary] = useState("#2E4F4F");
  const [accent, setAccent] = useState("#D88935");

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "k-1", name: "تكامل سلة", prefix: "hirf_live_4f2a", createdAt: "2026-06-28T14:44:00Z" },
    { id: "k-2", name: "تقارير Zapier", prefix: "hirf_live_9c1d", createdAt: "2026-05-12T09:10:00Z" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // Security
  const [twoFactor, setTwoFactor] = useState(true);
  const [backups, setBackups] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("12h");

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: "Salla سلة", description: "مزامنة الطلبات والمنتجات", connected: true },
    { name: "Zid زد", description: "مزامنة المتاجر والتقارير", connected: true },
    { name: "Meta Ads", description: "استيراد أداء الحملات تلقائيًا", connected: true },
    { name: "Google Ads", description: "استيراد أداء الحملات تلقائيًا", connected: false },
    { name: "TikTok Ads", description: "استيراد أداء الحملات تلقائيًا", connected: false },
    { name: "Slack", description: "إشعارات الفريق الفورية", connected: false },
  ]);

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: tenant.name,
      nameEn: tenant.nameEn,
      freelanceLicense: tenant.freelanceLicense,
      mobile: tenant.mobile,
      email: tenant.email,
      cr: tenant.cr,
      vatNumber: tenant.vatNumber,
      city: tenant.city,
    },
  });

  const onSaveCompany = companyForm.handleSubmit(() => toast(`${t("common.save")} ✓`));

  const inviteForm = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { role: "member" } });
  const onInvite = inviteForm.handleSubmit((values) => {
    setInvited((prev) => [...prev, values]);
    inviteForm.reset({ role: "member" });
    setInviteOpen(false);
    toast(`${t("settings.invite")}: ${values.email} ✓`);
  });

  function applyBranding() {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--ring", accent);
    document.documentElement.style.setProperty("--sidebar", primary);
    toast(`${t("settings.branding")} ✓`);
  }

  function createApiKey() {
    const name = newKeyName.trim();
    if (name.length < 2) return;
    const secret = `hirf_live_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    setApiKeys((prev) => [{ id: `k-${Date.now()}`, name, prefix: secret.slice(0, 14), createdAt: new Date().toISOString() }, ...prev]);
    setRevealedKey(secret);
    setNewKeyName("");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t("settings.company")}</TabsTrigger>
          <TabsTrigger value="branding">{t("settings.branding")}</TabsTrigger>
          <TabsTrigger value="users">{t("settings.users")}</TabsTrigger>
          <TabsTrigger value="apiKeys">{t("settings.apiKeys")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
          <TabsTrigger value="audit">{t("settings.audit")}</TabsTrigger>
          <TabsTrigger value="integrations">{t("settings.integrations")}</TabsTrigger>
        </TabsList>

        {/* Company */}
        <TabsContent value="company" className="mt-4">
          <Card className="max-w-2xl">
            <CardBody>
              <form onSubmit={onSaveCompany} className="grid gap-4 sm:grid-cols-2" noValidate>
                <Field label={t("settings.companyName")} error={companyForm.formState.errors.name && t("common.invalidValue")}>
                  <Input {...companyForm.register("name")} />
                </Field>
                <Field label={t("settings.companyNameEn")} error={companyForm.formState.errors.nameEn && t("common.invalidValue")}>
                  <Input dir="ltr" {...companyForm.register("nameEn")} />
                </Field>
                <Field label={t("settings.freelanceLicense")} error={companyForm.formState.errors.freelanceLicense && t("common.invalidValue")}>
                  <Input dir="ltr" {...companyForm.register("freelanceLicense")} />
                </Field>
                <Field label={t("clients.mobile")} error={companyForm.formState.errors.mobile && t("common.invalidValue")}>
                  <Input dir="ltr" {...companyForm.register("mobile")} />
                </Field>
                <Field label={t("common.email")} error={companyForm.formState.errors.email && t("common.invalidValue")}>
                  <Input type="email" dir="ltr" {...companyForm.register("email")} />
                </Field>
                <Field label={`${t("clients.cr")} (${t("common.optionalMark")})`} error={companyForm.formState.errors.cr && t("common.invalidValue")}>
                  <Input dir="ltr" maxLength={10} {...companyForm.register("cr")} />
                </Field>
                <Field label={`${t("clients.vatNumber")} (${t("common.optionalMark")})`} error={companyForm.formState.errors.vatNumber && t("common.invalidValue")}>
                  <Input dir="ltr" maxLength={15} {...companyForm.register("vatNumber")} />
                </Field>
                <Field label={t("common.city")} error={companyForm.formState.errors.city && t("common.invalidValue")}>
                  <Input {...companyForm.register("city")} />
                </Field>
                <div className="flex items-end">
                  <Button type="submit">{t("common.save")}</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader title={t("settings.branding")} subtitle={t("brand.tagline")} />
            <CardBody className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("settings.primaryColor")}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
                      aria-label={t("settings.primaryColor")}
                    />
                    <Input value={primary} onChange={(e) => setPrimary(e.target.value)} dir="ltr" className="font-mono" />
                  </div>
                </Field>
                <Field label={t("settings.accentColor")}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
                      aria-label={t("settings.accentColor")}
                    />
                    <Input value={accent} onChange={(e) => setAccent(e.target.value)} dir="ltr" className="font-mono" />
                  </div>
                </Field>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: primary }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: accent }}>
                  ح
                </span>
                <span className="text-lg font-bold text-white">{tenant.name}</span>
              </div>
              <Button onClick={applyBranding}>{t("common.save")}</Button>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Users & roles */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader
              title={t("settings.users")}
              action={
                <Button variant="accent" size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  {t("settings.invite")}
                </Button>
              }
            />
            <CardBody className="p-0 pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-bold text-ink-3 uppercase">
                      <th className="px-5 py-2.5 text-start">{t("common.name")}</th>
                      <th className="px-5 py-2.5 text-start">{t("common.email")}</th>
                      <th className="px-5 py-2.5 text-start">{t("common.role")}</th>
                      <th className="px-5 py-2.5 text-start">{t("settings.lastActive")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => (
                      <tr key={e.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-3">
                            <Avatar name={e.name} />
                            <span>
                              <span className="block font-semibold text-ink">{e.name}</span>
                              <span className="block text-xs text-ink-3">{e.jobTitle}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-ink-2" dir="ltr">{e.email}</td>
                        <td className="px-5 py-3">
                          {e.role === "owner" ? (
                            <Badge tone="accent">{t("role.owner")}</Badge>
                          ) : (
                            <Select
                              value={roles[e.id]}
                              onChange={(ev) => {
                                setRoles((prev) => ({ ...prev, [e.id]: ev.target.value as Role }));
                                toast(`${t("common.updated")}: ${e.name}`, "info");
                              }}
                              className="h-8 w-32 text-xs"
                              aria-label={t("common.role")}
                            >
                              {(["admin", "manager", "member", "accountant", "viewer"] as const).map((role) => (
                                <option key={role} value={role}>{t(`role.${role}` as MessageKey)}</option>
                              ))}
                            </Select>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-3">{t("common.today")}</td>
                      </tr>
                    ))}
                    {invited.map((inv) => (
                      <tr key={inv.email} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3 text-ink-3">—</td>
                        <td className="px-5 py-3 text-ink-2" dir="ltr">{inv.email}</td>
                        <td className="px-5 py-3"><Badge tone="warning">{t(`role.${inv.role}` as MessageKey)} · {t("status.pending")}</Badge></td>
                        <td className="px-5 py-3 text-xs text-ink-3">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        {/* API keys */}
        <TabsContent value="apiKeys" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader title={t("settings.apiKeys")} />
            <CardBody className="space-y-4">
              <div className="flex gap-2">
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder={t("common.name")} />
                <Button onClick={createApiKey} disabled={newKeyName.trim().length < 2}>
                  <Plus className="h-4 w-4" />
                  {t("settings.createKey")}
                </Button>
              </div>
              {revealedKey ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-success-bg p-3.5">
                  <code className="truncate text-xs font-bold text-success" dir="ltr">{revealedKey}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(revealedKey);
                      toast(`${t("common.download")} ✓`, "info");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <ul className="space-y-2">
                {apiKeys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                    <span className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-accent" />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{key.name}</span>
                        <code className="block text-xs text-ink-3" dir="ltr">{key.prefix}••••••••</code>
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-ink-3 tabular-nums">{formatDateTime(key.createdAt, locale)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
                          toast(`${t("common.delete")} ✓`, "info");
                        }}
                      >
                        <span className="text-danger">{t("common.delete")}</span>
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <Card className="max-w-2xl">
            <CardBody className="divide-y divide-border">
              <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    {t("settings.twoFactor")}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-2">{t("settings.twoFactorHint")}</p>
                </div>
                <Toggle checked={twoFactor} onChange={(v) => { setTwoFactor(v); toast(`${t("common.updated")} ✓`, "info"); }} label={t("settings.twoFactor")} />
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-bold text-ink">{t("settings.sessionTimeout")}</p>
                </div>
                <Select value={sessionTimeout} onChange={(e) => { setSessionTimeout(e.target.value); toast(`${t("common.updated")} ✓`, "info"); }} className="w-32" aria-label={t("settings.sessionTimeout")}>
                  <option value="1h">1h</option>
                  <option value="12h">12h</option>
                  <option value="24h">24h</option>
                  <option value="7d">7d</option>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-ink">{t("settings.backups")}</p>
                  <p className="mt-0.5 text-xs text-ink-2">{t("settings.backupsHint")}</p>
                </div>
                <Toggle checked={backups} onChange={(v) => { setBackups(v); toast(`${t("common.updated")} ✓`, "info"); }} label={t("settings.backups")} />
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Audit log */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold text-ink-3 uppercase">
                    <th className="px-5 py-3 text-start">{t("common.date")}</th>
                    <th className="px-5 py-3 text-start">{t("common.name")}</th>
                    <th className="px-5 py-3 text-start">{t("common.activity")}</th>
                    <th className="px-5 py-3 text-start">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 text-ink-2 tabular-nums">{formatDateTime(entry.at, locale)}</td>
                      <td className="px-5 py-3 font-semibold text-ink" dir="ltr">{entry.actor}</td>
                      <td className="px-5 py-3 text-ink-2">{entry.event}</td>
                      <td className="px-5 py-3 text-ink-3 tabular-nums" dir="ltr">{entry.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration, i) => (
            <Card key={integration.name} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
                  <Plug className="h-5 w-5 text-accent" />
                </span>
                {integration.connected ? <Badge tone="success">{t("settings.connected")}</Badge> : null}
              </div>
              <p className="mt-3 font-bold text-ink">{integration.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{integration.description}</p>
              <Button
                variant={integration.connected ? "outline" : "primary"}
                size="sm"
                className="mt-4"
                onClick={() => {
                  setIntegrations((prev) => prev.map((item, j) => (j === i ? { ...item, connected: !item.connected } : item)));
                  toast(`${integration.name}: ${integration.connected ? t("common.archive") : t("settings.connected")} ✓`, "info");
                }}
              >
                {integration.connected ? t("common.delete") : t("settings.connect")}
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title={t("settings.invite")}
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onInvite}>{t("common.send")}</Button>
          </>
        }
      >
        <form onSubmit={onInvite} className="space-y-4" noValidate>
          <Field label={t("common.email")} error={inviteForm.formState.errors.email && t("common.invalidValue")}>
            <Input type="email" dir="ltr" {...inviteForm.register("email")} />
          </Field>
          <Field label={t("common.role")}>
            <Select {...inviteForm.register("role")}>
              {(["admin", "manager", "member", "accountant", "viewer"] as const).map((role) => (
                <option key={role} value={role}>{t(`role.${role}` as MessageKey)}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
