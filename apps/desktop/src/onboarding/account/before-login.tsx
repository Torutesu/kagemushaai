import { commands as analyticsCommands } from "@hypr/plugin-analytics";

import { OnboardingButton, OnboardingCharIcon } from "../shared";

import { useAuth } from "~/auth";
import { useTranslation } from "~/i18n/useTranslation";

export function BeforeLogin({ onContinue }: { onContinue: () => void }) {
  const auth = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-3">
          <OnboardingButton
            onClick={() => {
              void auth?.signIn();
            }}
            className="flex items-center gap-2"
          >
            <OnboardingCharIcon inverted />
            Sign in
          </OnboardingButton>
        </div>
        <div className="flex flex-col items-start gap-1 pt-1">
          <button
            type="button"
            onClick={() => {
              void analyticsCommands.event({
                event: "onboarding_login_skipped",
              });
              onContinue();
            }}
            className="text-sm text-neutral-500/70 transition-colors hover:text-neutral-700"
          >
            {t("onboarding.localMode")}
          </button>
          <span className="text-xs text-neutral-400">
            {t("onboarding.localModeHint")}
          </span>
        </div>
      </div>
    </div>
  );
}
