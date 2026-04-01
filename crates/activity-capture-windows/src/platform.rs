use std::time::SystemTime;

use hypr_activity_capture_interface::{
    CaptureError, CapturePolicy, CaptureStream, ContentLevel, EventCoalescer, Snapshot,
    SnapshotSource, Transition, WatchOptions,
};
use windows::Win32::{
    Foundation::HWND,
    System::Threading::{GetWindowThreadProcessId, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION},
    UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW},
};

fn get_process_name(pid: u32) -> Option<String> {
    use windows::Win32::System::Threading::QueryFullProcessImageNameW;
    use windows::Win32::System::Threading::PROCESS_NAME_FORMAT;

    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 1024];
        let mut size = buf.len() as u32;
        QueryFullProcessImageNameW(handle, PROCESS_NAME_FORMAT(0), &mut buf, &mut size).ok()?;
        let path = String::from_utf16_lossy(&buf[..size as usize]);
        let _ = windows::Win32::Foundation::CloseHandle(handle);
        path.rsplit('\\').next().map(|s| s.to_string())
    }
}

fn foreground_snapshot() -> Option<Snapshot> {
    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        let title_len = GetWindowTextLengthW(hwnd);
        let window_title = if title_len > 0 {
            let mut buf = vec![0u16; (title_len + 1) as usize];
            let copied = GetWindowTextW(hwnd, &mut buf);
            if copied > 0 {
                Some(String::from_utf16_lossy(&buf[..copied as usize]))
            } else {
                None
            }
        } else {
            None
        };

        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return None;
        }

        let app_name = get_process_name(pid).unwrap_or_else(|| "Unknown".to_string());

        Some(Snapshot {
            captured_at: SystemTime::now(),
            pid: pid as i32,
            app_name,
            bundle_id: None,
            window_title,
            url: None,
            visible_text: None,
            content_level: ContentLevel::Metadata,
            source: SnapshotSource::Workspace,
        })
    }
}

pub fn snapshot(
    _policy: &CapturePolicy,
) -> Result<Option<Snapshot>, CaptureError> {
    Ok(foreground_snapshot())
}

pub fn watch(
    policy: CapturePolicy,
    options: WatchOptions,
) -> Result<CaptureStream, CaptureError> {
    let stream = async_stream::stream! {
        let mut coalescer = EventCoalescer::default();
        let interval_duration = options.poll_interval;

        if options.emit_initial {
            let snap = foreground_snapshot();
            if let Some(transition) = coalescer.push(snap) {
                yield Ok::<Transition, CaptureError>(transition);
            }
        }

        let mut interval = tokio::time::interval(interval_duration);
        interval.tick().await; // skip first tick

        loop {
            interval.tick().await;
            let snap = foreground_snapshot();
            if let Some(transition) = coalescer.push(snap) {
                yield Ok(transition);
            }
        }
    };

    Ok(Box::pin(stream))
}
