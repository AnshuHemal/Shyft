import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    description:
      "Sign up in seconds, invite your team, and connect the tools you already use. No lengthy onboarding required.",
  },
  {
    step: "02",
    title: "Track time naturally",
    description:
      "Start a timer with one click, or let SHYFT suggest entries based on your calendar and activity. Log time the way that works for you.",
  },
  {
    step: "03",
    title: "Get clear on where time goes",
    description:
      "Weekly reports, project budgets, and team dashboards give you the full picture — so you can make better decisions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-widest">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Three simple steps to a clearer, calmer workday.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, index) => (
              <div key={step.step} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step number */}
                <div
                  className={cn(
                    "relative z-10 flex size-16 items-center justify-center rounded-2xl border-2 font-semibold text-lg mb-6 transition-colors",
                    index === 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {step.step}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
