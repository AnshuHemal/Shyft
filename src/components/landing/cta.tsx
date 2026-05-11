import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20 text-center">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
              Ready to respect your team's time?
            </h2>
            <p className="text-white/75 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of teams who use SHYFT to work smarter, bill
              accurately, and protect their most valuable resource.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                nativeButton={false}
                className="w-full sm:w-auto gap-2 px-6 bg-white text-primary hover:bg-white/90"
                render={<Link href="/signup" />}
              >
                Start for free
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                nativeButton={false}
                className="w-full sm:w-auto text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/login" />}
              >
                Sign in to your account
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/50">
              No credit card required · Free forever plan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
