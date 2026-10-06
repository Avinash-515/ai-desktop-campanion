import React from "react";
import { DesktopOverlayCompanion } from "./DesktopOverlayCompanion";

export function AvatarAlert({
  alert,
  onDismiss,
  onComplete,
  onSnooze,
  soundEnabled = true,
  avatarConfig
}) {
  if (!alert) return null;

  return (
    <div className="avatar-desktop-corner-wrapper" onClick={onDismiss}>
      <div className="avatar-desktop-corner-dock" onClick={(e) => e.stopPropagation()}>
        <DesktopOverlayCompanion
          reminder={alert}
          onFinish={onDismiss}
          onComplete={onComplete}
          onSnooze={onSnooze}
          soundEnabled={soundEnabled}
          characterConfig={avatarConfig}
        />
      </div>
    </div>
  );
}
