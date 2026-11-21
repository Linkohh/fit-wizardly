import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router-dom";
import { BackButton } from "@/components/navigation/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Scale, Lock, Shield, Heart, FilePenLine } from "lucide-react";

const LEGAL_TABS = ['disclaimer', 'privacy', 'terms'] as const;
type LegalTab = (typeof LEGAL_TABS)[number];

/** Stable anchor Google Play links to: /legal?tab=privacy#delete-account */
const DELETE_ACCOUNT_SECTION_ID = 'delete-account';

/**
 * Values still to come from Lincoln (L9 review). Each is shown in square
 * brackets so the draft is obviously unfinished. Replace here, in one place.
 */
const POLICY_VALUES = {
    region: '[Supabase region: Lincoln to provide]',
    email: '[support email: Lincoln to provide]',
    jurisdiction: '[governing law: Lincoln to provide]',
    effective: '[set at launch]',
    updated: '2026-11-21',
    age: '13 [Lincoln to confirm]',
    backup: '[backup period: Lincoln to confirm]',
} as const;

/** One translated string: i18n key plus its English fallback. */
type Line = readonly [key: string, fallback: string];
/** A list item, optionally followed by a link to a third party's privacy policy. */
type Item = readonly [key: string, fallback: string, href?: string];

interface PolicySection {
    id: string;
    title: Line;
    paragraphs?: readonly Line[];
    items?: readonly Item[];
    closing?: readonly Line[];
}

const PRIVACY_SECTIONS: readonly PolicySection[] = [
    {
        id: 'summary',
        title: ['legal.privacy.summary.title', 'In short'],
        paragraphs: [
            ['legal.privacy.summary.p1', "FitWizard works without an account. If you don't sign in, your training data is kept on your device and is not sent to us."],
            ['legal.privacy.summary.p2', 'If you sign in, your training data is also saved to our cloud database so you can use it on other devices.'],
            ['legal.privacy.summary.p3', 'Some optional features send limited data to other services, and only after you turn them on. Each one is listed below. We do not sell your data, show ads, or track you across other apps and websites.'],
        ],
    },
    {
        id: 'what-we-collect',
        title: ['legal.privacy.collect.title', 'What we collect'],
        paragraphs: [['legal.privacy.collect.intro', 'Depending on the features you use, FitWizard stores:']],
        items: [
            ['legal.privacy.collect.training', 'Training data: workout plans, workout logs (sets, reps, weight and effort), a workout in progress, personal records, your current week and your preferred weight unit.'],
            ['legal.privacy.collect.nutrition', 'Nutrition data: the meals and foods you log, with calories and macros, and your nutrition profile (age, sex, height, weight, activity level, goal and water goal), targets, custom foods, favourite foods and saved meals.'],
            ['legal.privacy.collect.body', 'Body and recovery data: body measurements (such as body weight, body-fat percentage and tape measurements) and daily readiness check-ins (ratings for sleep quality, muscle soreness, energy and stress).'],
            ['legal.privacy.collect.progress', 'Progress and library data: achievements, badges and streaks, custom exercises you create, favourite exercises, collections, filter presets, recently viewed exercises and library settings. When you are signed in, we also record which exercises you view.'],
            ['legal.privacy.collect.setup', 'Setup answers: your answers in the plan wizard (goal, experience, equipment, muscles, schedule, and limits such as avoiding overhead work) and in onboarding (avatar, role and interests).'],
            ['legal.privacy.collect.account', 'Account data, if you sign in: your email address and a profile with a display name (taken from your email address) and your timezone. To sign in, we email you a link and a 6-digit code. The code is used once and is not stored by the app.'],
            ['legal.privacy.collect.settings', 'Settings and choices: your privacy choices, language, theme and similar settings, and the bookkeeping sync needs (which items changed and when, never their content).'],
            ['legal.privacy.collect.technical', 'Technical data: like any website, our hosting provider receives your IP address and browser or device details with every request.'],
        ],
        closing: [['legal.privacy.collect.not_collected', 'FitWizard does not access your location, contacts, camera, photos, or health records from other apps.']],
    },
    {
        id: 'where-it-is-stored',
        title: ['legal.privacy.storage.title', 'Where your data is stored'],
        items: [
            ['legal.privacy.storage.device', "On your device: in the app's own storage (IndexedDB in a browser, app storage files on iPhone and Android) and, for small settings, in browser storage. FitWizard adds no encryption of its own; your device's protections, such as a screen lock, apply."],
            ['legal.privacy.storage.cloud', 'In our cloud database, if you sign in: we use Supabase, and your data is stored in {{region}}. Each account can read and change only its own records.'],
            ['legal.privacy.storage.sync', 'What syncs: your plans, workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises and favourite exercises. The app syncs when you sign in, when your device comes back online, when you return to the app, and shortly after each change. Nothing is sent while you are offline or signed out; changes made while signed out are sent the next time you sign in.'],
            ['legal.privacy.storage.first_sign_in', "The first time you sign in on a device, the app keeps your account's copy of any record that exists in both places, and uploads only the records that exist only on that device."],
            ['legal.privacy.storage.sign_out', 'Signing out does not yet remove your training data from the device. After signing out, you can remove it with Erase data on this device (see Delete your account below).'],
            ['legal.privacy.storage.transfers', 'Some of the services listed below are in other countries, so your data may be processed outside the country where you live.'],
        ],
    },
    {
        id: 'who-receives-it',
        title: ['legal.privacy.recipients.title', 'Who receives your data'],
        paragraphs: [['legal.privacy.recipients.intro', "We share data only with the services that run FitWizard's features:"]],
        items: [
            ['legal.privacy.recipients.supabase', 'Supabase runs accounts, sign-in emails and the cloud database. It receives your email address, profile and synced data when you sign in.', 'https://supabase.com/privacy'],
            ['legal.privacy.recipients.vercel', 'Vercel hosts the app and our server functions. It receives your IP address and device details with every request. If you allow analytics, Vercel Web Analytics also records page views (the page, the referring page, device type and country).', 'https://vercel.com/legal/privacy-policy'],
            ['legal.privacy.recipients.open_food_facts', 'Open Food Facts provides food search, only if you turn on food lookup. It receives the barcode or search text and your IP address. Without food lookup, nothing is sent.', 'https://world.openfoodfacts.org/privacy'],
            ['legal.privacy.recipients.wger', "wger provides the exercise catalogue. Catalogue and search requests go through our servers, so wger sees our server's address, not yours. Exercise pictures load directly from wger, so wger sees your IP address.", 'https://wger.de'],
            ['legal.privacy.recipients.api_ninjas', 'API Ninjas provides a backup exercise search and the daily quote. Requests go through our servers, and it receives only the search text.', 'https://api-ninjas.com'],
            ['legal.privacy.recipients.sentry', 'Sentry receives crash reports, only if you allow them. A report contains the error, the app version, your browser or device type and the page, but not your name, email address, account or training data. Sentry sees your IP address when a report is sent. Crash reporting is not switched on yet.', 'https://sentry.io/privacy/'],
            ['legal.privacy.recipients.posthog', "PostHog (planned) will receive product events if you allow analytics, such as 'plan generated' or 'workout completed', never weights, measurements, readiness or food. It is not in use yet; we will update this policy before it is.", 'https://posthog.com/privacy'],
        ],
        closing: [
            ['legal.privacy.recipients.app_stores', 'Apple and Google distribute the app and collect their own data under their own policies. Workout reminders and rest-timer alerts (coming soon) are scheduled on your device and are not sent to anyone.'],
            ['legal.privacy.recipients.off_features', 'Social circles and the coach portal are switched off and collect nothing. We will update this policy before turning either on.'],
            ['legal.privacy.recipients.no_sale', 'We do not sell or rent your data, and we do not share it for advertising.'],
        ],
    },
    {
        id: 'why-we-use-it',
        title: ['legal.privacy.purposes.title', 'Why we use it'],
        items: [
            ['legal.privacy.purposes.features', 'To provide the app: build plans, log workouts and meals, and show your history and progress.'],
            ['legal.privacy.purposes.sync', 'To keep your data in your account and on your other devices, if you sign in.'],
            ['legal.privacy.purposes.sign_in', 'To sign you in and keep your account secure.'],
            ['legal.privacy.purposes.lookups', 'To look up foods and exercises when you ask.'],
            ['legal.privacy.purposes.crashes', 'To find and fix crashes, if you allow crash reports.'],
            ['legal.privacy.purposes.analytics', 'To understand which parts of the app are used, if you allow analytics.'],
            ['legal.privacy.purposes.abuse', 'To protect our server functions from abuse (see How long we keep it).'],
        ],
    },
    {
        id: 'how-long-we-keep-it',
        title: ['legal.privacy.retention.title', 'How long we keep it'],
        items: [
            ['legal.privacy.retention.device', "On your device: until you delete it in the app, use Erase data on this device, clear the app's or the browser's data, or uninstall the app."],
            ['legal.privacy.retention.cloud', 'In your account: until you delete it, or delete your account. Deleted plans are removed straight away. Other synced items are marked as deleted so that your other devices remove them too; the marked record is removed for good when you delete your account.'],
            ['legal.privacy.retention.account', 'Your email address, your profile and the record of which exercises you viewed are kept until you delete your account.'],
            ['legal.privacy.retention.code', 'Sign-in codes work once and expire after a short time.'],
            ['legal.privacy.retention.ip', "To limit each address to 60 requests a minute, our server functions keep your IP address in memory with a request count. They never write it to disk, log it or share it, but it can stay in memory until that server instance shuts down. Vercel's own request logs follow Vercel's policy."],
            ['legal.privacy.retention.third_parties', 'Sentry keeps crash reports for about 90 days. Vercel Web Analytics, Open Food Facts, wger and API Ninjas keep what they receive under their own policies.'],
        ],
    },
    {
        id: 'your-choices',
        title: ['legal.privacy.choices.title', 'Your choices'],
        items: [
            ['legal.privacy.choices.consent', 'Privacy settings: choose whether to allow analytics (which also covers crash reports for now) and food lookup. Change them at any time in Profile → Details → Privacy Settings. If you say no, those services receive nothing from you.'],
            ['legal.privacy.choices.export', 'Export: Profile → Details → Export Data (JSON) saves a file with what the app keeps about you: plans (including a workout in progress), workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, your wizard and onboarding answers, your privacy choices and settings, and, if you are signed in, your account email and profile.'],
            ['legal.privacy.choices.delete_items', 'Delete items: you can delete plans, meals, custom foods, saved meals and body measurements in the app.'],
            ['legal.privacy.choices.guest', 'No account: use FitWizard without signing in, and your training data stays on your device.'],
            ['legal.privacy.choices.rights', 'Depending on where you live, you may have the right to access, correct, delete or move your data, or to object to how we use it. Contact us to use these rights.'],
        ],
    },
    {
        id: DELETE_ACCOUNT_SECTION_ID,
        title: ['legal.privacy.delete_account.title', 'Delete your account'],
        paragraphs: [['legal.privacy.delete_account.intro', 'You can delete your account and your data at any time.']],
        items: [
            ['legal.privacy.delete_account.in_app', "In the app: open Profile, go to Details, tap Delete account, type DELETE and confirm. This permanently deletes your account and everything stored with it on our servers: your email address and profile, plans, workout history, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, and the record of which exercises you viewed. The FitWizard data on that device is erased at the same time. Deletion happens straight away and can't be undone, so download a copy first with Profile → Details → Export Data (JSON)."],
            ['legal.privacy.delete_account.guest', "Not signed in? Your data is only on your device. Remove it with Profile → Details → Erase data on this device (type DELETE to confirm), or by uninstalling the app or clearing the site's data in your browser."],
            ['legal.privacy.delete_account.by_email', "Can't sign in, or don't have the app? Email {{email}} from the address on your account, with the subject 'Delete my account'. We will confirm that the address is yours and delete the account within 30 days."],
            ['legal.privacy.delete_account.circles', 'If you created a circle or challenge, it stays for its other members, with you removed as its creator.'],
            ['legal.privacy.delete_account.other_devices', 'Other devices where you were signed in keep their copy on the device until you sign out and erase it there, or uninstall the app.'],
            ['legal.privacy.delete_account.what_may_remain', "What may remain: copies in our database provider's routine backups until they expire ({{backup}}), and data already sent to the services listed above, which they keep under their own policies."],
        ],
    },
    {
        id: 'security',
        title: ['legal.privacy.security.title', 'Security'],
        paragraphs: [['legal.privacy.security.p1', 'Data travels over encrypted connections (HTTPS). In our cloud database, access rules let each account read and change only its own records, and the key that can delete accounts is kept only on our server. No storage is perfectly secure, so please keep your device and your email account secure too.']],
    },
    {
        id: 'children',
        title: ['legal.privacy.children.title', 'Children'],
        paragraphs: [['legal.privacy.children.p1', 'FitWizard is not directed at children under {{age}}, and we do not knowingly collect their data. If you believe a child has given us data, contact us and we will delete it.']],
    },
    {
        id: 'contact',
        title: ['legal.privacy.contact.title', 'Contact'],
        paragraphs: [['legal.privacy.contact.p1', 'Questions or requests about your privacy: {{email}}.']],
    },
    {
        id: 'changes',
        title: ['legal.privacy.changes.title', 'Changes to this policy'],
        paragraphs: [['legal.privacy.changes.p1', 'We will update this page when what the app collects or shares changes, and change the date at the top. For significant changes, we will tell you in the app before they take effect.']],
    },
];

const TERMS_SECTIONS: readonly PolicySection[] = [
    {
        id: 'terms-acceptance',
        title: ['legal.terms.acceptance.title', 'Agreeing to these terms'],
        paragraphs: [['legal.terms.acceptance.p1', 'By using FitWizard, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the app.']],
    },
    {
        id: 'terms-not-medical-advice',
        title: ['legal.terms.not_medical.title', 'Not medical advice'],
        paragraphs: [['legal.terms.not_medical.p1', 'FitWizard gives general fitness information only. It is not medical advice, diagnosis or treatment, and it does not replace a doctor, physiotherapist or other qualified professional. Read the Medical Disclaimer before you start training.']],
    },
    {
        id: 'terms-your-responsibility',
        title: ['legal.terms.responsibility.title', 'Your responsibility'],
        items: [
            ['legal.terms.responsibility.check', 'Check with a healthcare professional before starting a new program, especially if you have a health condition or an injury.'],
            ['legal.terms.responsibility.limits', 'Train within your limits, use good form and suitable equipment, and stop if you feel pain, dizziness or shortness of breath.'],
            ['legal.terms.responsibility.accuracy', 'Enter accurate information, such as your weight or injuries, because plans and targets depend on it.'],
            ['legal.terms.responsibility.security', 'Keep your device and the email account you sign in with secure.'],
        ],
    },
    {
        id: 'terms-accounts',
        title: ['legal.terms.accounts.title', 'Accounts'],
        paragraphs: [['legal.terms.accounts.p1', 'An account is optional. To sign in, you need access to your email address. You can delete your account at any time (see Delete your account in the Privacy Policy).']],
    },
    {
        id: 'terms-acceptable-use',
        title: ['legal.terms.acceptable_use.title', 'Acceptable use'],
        paragraphs: [['legal.terms.acceptable_use.intro', 'Please do not:']],
        items: [
            ['legal.terms.acceptable_use.unlawful', 'use FitWizard for anything unlawful;'],
            ['legal.terms.acceptable_use.access', "try to get into other people's accounts or data, or get around the app's security or rate limits;"],
            ['legal.terms.acceptable_use.overload', 'overload, scrape or attack the app or its server functions;'],
            ['legal.terms.acceptable_use.redistribute', 'copy, resell or redistribute the app, except where its licences allow.'],
        ],
    },
    {
        id: 'terms-licence',
        title: ['legal.terms.licence.title', 'Licence and content'],
        paragraphs: [['legal.terms.licence.p1', 'You may use FitWizard for your own personal, non-commercial purposes. Exercise data comes from wger and food data from Open Food Facts. Their communities provide it under their own licences, and we cannot guarantee that it is complete or accurate.']],
    },
    {
        id: 'terms-no-warranty',
        title: ['legal.terms.warranty.title', 'No warranty'],
        paragraphs: [['legal.terms.warranty.p1', "FitWizard is provided 'as is' and 'as available', without warranties of any kind, to the extent the law allows. We do not promise that it will be free of errors or always available, or that saved data will never be lost, so export your data if it matters to you."]],
    },
    {
        id: 'terms-liability',
        title: ['legal.terms.liability.title', 'Limitation of liability'],
        paragraphs: [['legal.terms.liability.p1', 'To the extent the law allows, the creators of FitWizard are not liable for any injury, loss or damage that results from using the app or following its plans. Nothing in these terms limits rights that the law does not allow to be limited.']],
    },
    {
        id: 'terms-changes',
        title: ['legal.terms.changes.title', 'Changes and ending'],
        paragraphs: [['legal.terms.changes.p1', 'We may update these terms. We will change the date at the top and tell you in the app about significant changes. You can stop using FitWizard at any time, and we may suspend access for misuse.']],
    },
    {
        id: 'terms-governing-law',
        title: ['legal.terms.law.title', 'Governing law'],
        paragraphs: [['legal.terms.law.p1', 'These terms are governed by the laws of {{jurisdiction}}.']],
    },
    {
        id: 'terms-contact',
        title: ['legal.terms.contact.title', 'Contact'],
        paragraphs: [['legal.terms.contact.p1', 'Questions about these terms: {{email}}.']],
    },
];

function isLegalTab(value: string | null): value is LegalTab {
    return value !== null && (LEGAL_TABS as readonly string[]).includes(value);
}

/** The tab to show: the `?tab=` value, else privacy for its deletion anchor, else the disclaimer. */
function resolveTab(requestedTab: string | null, hashTarget: string): LegalTab {
    if (isLegalTab(requestedTab)) return requestedTab;
    return hashTarget === DELETE_ACCOUNT_SECTION_ID ? 'privacy' : 'disclaimer';
}

function useText() {
    const { t } = useTranslation();
    return ([key, fallback]: Line | Item) => t(key, { defaultValue: fallback, ...POLICY_VALUES });
}

function PolicySections({ sections }: { sections: readonly PolicySection[] }) {
    const { t } = useTranslation();
    const text = useText();

    return (
        <div className="prose dark:prose-invert max-w-none">
            {sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
                    <h3 id={`${section.id}-title`}>{text(section.title)}</h3>
                    {section.paragraphs?.map((line) => <p key={line[0]}>{text(line)}</p>)}
                    {section.items && (
                        <ul>
                            {section.items.map((item) => (
                                <li key={item[0]}>
                                    {text(item)}
                                    {item[2] && (
                                        <>
                                            {' '}
                                            <a href={item[2]} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                                                {t('legal.privacy.policy_link', 'Privacy policy')}
                                            </a>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {section.closing?.map((line) => <p key={line[0]}>{text(line)}</p>)}
                </section>
            ))}
        </div>
    );
}

function DraftNotice() {
    const text = useText();
    return (
        <Alert>
            <FilePenLine className="h-4 w-4" />
            <AlertTitle>{text(['legal.draft.title', 'Draft for review'])}</AlertTitle>
            <AlertDescription>
                <p>{text(['legal.draft.text', 'This is a draft. It has not yet been reviewed by a qualified professional and may change before launch. Text in square brackets is still to be filled in.'])}</p>
                <p className="mt-1 text-muted-foreground">
                    {text(['legal.draft.dates', 'Last updated {{updated}}. Effective date: {{effective}}.'])}
                </p>
            </AlertDescription>
        </Alert>
    );
}

export default function LegalPage() {
    const { t } = useTranslation();
    // `?tab=privacy|terms|disclaimer` deep-links to a section (footer, consent modal);
    // `#delete-account` scrolls to the deletion section (Google Play's account-deletion URL).
    const [searchParams, setSearchParams] = useSearchParams();
    const { hash } = useLocation();
    const hashTarget = decodeURIComponent(hash.replace(/^#/, ''));
    const activeTab = resolveTab(searchParams.get('tab'), hashTarget);

    useEffect(() => {
        if (!hashTarget) return;
        document.getElementById(hashTarget)?.scrollIntoView?.({ block: 'start' });
    }, [activeTab, hashTarget]);

    const handleTabChange = (value: string) => {
        if (isLegalTab(value)) {
            setSearchParams({ tab: value }, { replace: true });
        }
    };

    const triggerClassName = "py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg gap-1";

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 min-h-screen">
            <BackButton className="mb-2" />
            <h1 className="text-3xl font-bold mb-6 gradient-text">{t('legal.page_title')}</h1>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto glass-card border border-primary/15 p-1">
                    <TabsTrigger value="disclaimer" className={triggerClassName}>
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        {t('legal.tabs.medical')}
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className={triggerClassName}>
                        <Lock className="w-4 h-4 mr-2" />
                        {t('legal.tabs.privacy')}
                    </TabsTrigger>
                    <TabsTrigger value="terms" className={triggerClassName}>
                        <Scale className="w-4 h-4 mr-2" />
                        {t('legal.tabs.terms')}
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="disclaimer">
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-primary/50 via-secondary/40 to-transparent" />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-destructive font-display">
                                    <Heart className="w-6 h-6 mr-2 text-primary" />
                                    {t('legal.medical.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>{t('legal.medical.warning_title')}</AlertTitle>
                                    <AlertDescription>
                                        {t('legal.medical.warning_text')}
                                    </AlertDescription>
                                </Alert>

                                <div className="prose dark:prose-invert max-w-none">
                                    <p>
                                        {t('legal.medical.content_p1')}
                                    </p>
                                    <p>
                                        {t('legal.medical.content_p2')}
                                    </p>
                                    <p className="font-bold">
                                        {t('legal.medical.content_p3')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-primary/50 via-secondary/40 to-transparent" />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-primary font-display">
                                    <Lock className="w-6 h-6 mr-2 text-secondary" />
                                    {t('legal.privacy.title', 'Privacy Policy')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DraftNotice />
                                <PolicySections sections={PRIVACY_SECTIONS} />
                            </CardContent>
                        </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="terms">
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-primary/50 via-secondary/40 to-transparent" />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center font-display">
                                    <Shield className="w-6 h-6 mr-2 text-primary" />
                                    {t('legal.terms.title', 'Terms of Service')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DraftNotice />
                                <PolicySections sections={TERMS_SECTIONS} />
                            </CardContent>
                        </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Liability note for generated plans; the site footer carries the copyright. */}
            <p className="mx-auto mt-12 max-w-md pb-8 text-center text-sm text-muted-foreground">
                {t('legal.footer.guidance')}
            </p>
        </div>
    );
}
