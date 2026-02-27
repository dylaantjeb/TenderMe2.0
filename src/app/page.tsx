'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Brain,
  Target,
  Shield,
  ArrowRight,
  BarChart3,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">TenderMe</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Functionaliteiten
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Prijzen
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Hoe het werkt
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Inloggen
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Gratis starten
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered EMVI/BPKV platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Win aanbestedingen met{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI-precision
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            TenderMe analyseert aanbestedingsdocumenten, extraheert gunningscriteria en genereert
            score-geoptimaliseerde EMVI antwoorden. De AI-equivalent van een professionele
            tenderafdeling van €150.000/jaar.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="xl" variant="premium">
                Start gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="xl" variant="outline">
                Bekijk demo
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Geen creditcard nodig
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14 dagen gratis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              GDPR-compliant
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Alles wat u nodig heeft om aanbestedingen te winnen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Van document analyse tot score-geoptimaliseerde antwoorden — volledig geautomatiseerd.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Document Analyse',
                description:
                  'Upload PDF, DOCX of ZIP bestanden. AI extraheert automatisch alle gunningscriteria, wegingen en knock-out eisen.',
              },
              {
                icon: Brain,
                title: '5-Laags AI Pipeline',
                description:
                  'Context analyse, criteria intelligence, score-geoptimaliseerde generatie, zelf-scoring en EMVI compliance filter.',
              },
              {
                icon: Target,
                title: 'Score Optimalisatie',
                description:
                  'Iteratieve verbetering met AI zelf-scoring. Streeft naar 9+ scores op elk criterium.',
              },
              {
                icon: BarChart3,
                title: 'Live Score Dashboard',
                description:
                  'Real-time inzicht in uw score per criterium. Zie exact waar punten te winnen zijn.',
              },
              {
                icon: Shield,
                title: 'Enterprise Beveiliging',
                description:
                  'GDPR-compliant, versleutelde opslag, audit logs, team rollen en versie beheer.',
              },
              {
                icon: Sparkles,
                title: 'Professionele Export',
                description:
                  'Exporteer naar Word of PDF in professioneel aanbestedingsformat, klaar voor indiening.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Van aanbesteding naar winnend antwoord in 4 stappen
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Upload aanbestedingsdocumenten',
                description:
                  'Upload de aanbestedingsleidraad, beschrijvend document en bijlagen. TenderMe ondersteunt PDF, DOCX en ZIP.',
              },
              {
                step: '02',
                title: 'AI analyseert en extraheert criteria',
                description:
                  'Onze 5-laags AI pipeline analyseert de documenten, extraheert alle gunningscriteria en identificeert het scoringsmodel.',
              },
              {
                step: '03',
                title: 'Score-geoptimaliseerde antwoorden',
                description:
                  'Per criterium wordt een professioneel antwoord gegenereerd met begrip, oplossing, bewijs, risicobeheersing en meetbare resultaten.',
              },
              {
                step: '04',
                title: 'Review, verfijn en exporteer',
                description:
                  'Bekijk de live scores, verfijn waar nodig en exporteer naar professioneel Word of PDF format.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 items-start group"
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Investeer een fractie, bespaar tienduizenden
            </h2>
            <p className="text-muted-foreground">
              Vergelijk: een externe tenderconsultant kost €5.000–€15.000 per aanbesteding.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '€299',
                period: '/maand',
                description: 'Voor individuele tender professionals',
                features: [
                  '5 tenders per maand',
                  '1 gebruiker',
                  'PDF & DOCX upload',
                  'AI analyse & generatie',
                  'Score dashboard',
                  'Word export',
                  'Email support',
                ],
                cta: 'Start met Starter',
                highlighted: false,
              },
              {
                name: 'Professional',
                price: '€799',
                period: '/maand',
                description: 'Voor tenderteams en bureaus',
                features: [
                  '25 tenders per maand',
                  '5 gebruikers',
                  'Alle importmogelijkheden',
                  'Geavanceerde AI pipeline',
                  'Team samenwerking',
                  'Versie beheer',
                  'Word & PDF export',
                  'Prioriteit support',
                ],
                cta: 'Start met Professional',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Op maat',
                period: '',
                description: 'Voor grote organisaties',
                features: [
                  'Onbeperkte tenders',
                  'Onbeperkte gebruikers',
                  'SSO & SAML',
                  'Custom AI fine-tuning',
                  'API toegang',
                  'SLA garantie',
                  'Dedicated account manager',
                  'On-premise optie',
                ],
                cta: 'Contact sales',
                highlighted: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-card shadow-lg ring-1 ring-primary/20 relative'
                    : 'bg-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Meest gekozen
                  </div>
                )}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <Button
                  className="w-full mb-6"
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Klaar om aanbestedingen te winnen?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start vandaag nog en ervaar hoe AI uw tender kwaliteit naar het hoogste niveau tilt.
          </p>
          <Link href="/register">
            <Button size="xl" variant="premium">
              Gratis proberen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <FileText className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">TenderMe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-gegenereerde content dient als concept en moet worden gecontroleerd door professionals.
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TenderMe. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
}
