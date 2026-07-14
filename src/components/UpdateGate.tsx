import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AppUpdate,
  AppUpdateAvailability,
  FlexibleUpdateInstallStatus,
} from "@capawesome/capacitor-app-update";

export function UpdateGate() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform();

    (async () => {
      try {
        const info = await AppUpdate.getAppUpdateInfo();

        if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
          return;
        }

        if (platform === "android") {
          if (info.immediateUpdateAllowed) {
            await AppUpdate.performImmediateUpdate();
            return;
          }

          if (info.flexibleUpdateAllowed) {
            await AppUpdate.startFlexibleUpdate();
            AppUpdate.addListener("onFlexibleUpdateStateChange", async (state) => {
              if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
                await AppUpdate.completeFlexibleUpdate();
              }
            });
            return;
          }
        }

        if (platform === "ios") {
          await AppUpdate.openAppStore();
        }
      } catch (err) {
        console.warn("[UpdateGate] check failed", err);
      }
    })();
  }, []);

  return null;
}
