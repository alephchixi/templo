# Hosted response policy

`public/_headers` is copied by Vite and consumed by Cloudflare Workers static
assets. The initial policy adds MIME protection, same-origin framing and a
restricted referrer policy. HSTS starts at one day for this hostname only;
includeSubDomains and preload are not enabled by this change. TLS 1.2 and a
valid certificate chain were verified before preparing it.

The site-specific CSP starts in report-only mode. It preserves bundled WebGL,
audio/worklet/blob use and existing Cloudflare Analytics. No new reporting destination is configured. Inspect hosted browser policy diagnostics
and normal controls before considering CSP enforcement or longer HSTS.

CI retains every existing audit, unit/build and browser gate; the public
artifact allowlist adds only `_headers`, preserving path/privacy/hash checks.
Deployment still requires the exact qualified artifact and retained rollback;
CI alone does not prove Cloudflare served these headers. Revert the specific
header file or restore the prior immutable version on a compatibility failure.
