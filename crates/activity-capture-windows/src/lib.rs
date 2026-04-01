use hypr_activity_capture_interface::{
    ActivityCapture, Capabilities, CaptureError, CapturePolicy, CaptureStream, WatchOptions,
};

#[cfg(target_os = "windows")]
mod platform;

pub struct WindowsCapture {
    #[allow(dead_code)]
    policy: CapturePolicy,
}

impl WindowsCapture {
    pub fn new() -> Self {
        Self {
            policy: CapturePolicy::default(),
        }
    }

    pub fn with_policy(policy: CapturePolicy) -> Self {
        Self { policy }
    }
}

impl Default for WindowsCapture {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(not(target_os = "windows"))]
impl ActivityCapture for WindowsCapture {
    fn capabilities(&self) -> Capabilities {
        Capabilities::default()
    }

    fn snapshot(
        &self,
    ) -> Result<Option<hypr_activity_capture_interface::Snapshot>, CaptureError> {
        Err(CaptureError::unsupported(
            "activity-capture-windows is only available on Windows",
        ))
    }

    fn watch(&self, _options: WatchOptions) -> Result<CaptureStream, CaptureError> {
        Err(CaptureError::unsupported(
            "activity-capture-windows is only available on Windows",
        ))
    }
}

#[cfg(target_os = "windows")]
impl ActivityCapture for WindowsCapture {
    fn capabilities(&self) -> Capabilities {
        Capabilities {
            can_watch: true,
            can_capture_visible_text: false,
            can_capture_browser_url: false,
            requires_accessibility_permission: false,
        }
    }

    fn snapshot(
        &self,
    ) -> Result<Option<hypr_activity_capture_interface::Snapshot>, CaptureError> {
        platform::snapshot(&self.policy)
    }

    fn watch(&self, options: WatchOptions) -> Result<CaptureStream, CaptureError> {
        platform::watch(self.policy.clone(), options)
    }
}
