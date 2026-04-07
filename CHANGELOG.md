# Changelog

## 0.3.3 (2026-04-07)

### Changed
- Renamed operations with proper Title Case capitalization for node subtitles.
- Switched icon from PNG to SVG per n8n community node requirements.

## 0.3.2 (2026-04-06)

### Added
- **Create Activity Log** operation — Log activities for audit/tracking without creating an approval request. Matches the Zapier "Create Activity Log" action.
- **Dynamic Action Type dropdown** — Create Approval now loads your organization's action types from the API. Custom values can be entered via expression mode and are auto-registered in your organization.
- **Comment source attribution** — Comments created from n8n now display with the n8n logo and "App" badge in the OKRunit dashboard instead of generic "API".

### Fixed
- **Comment Get Many** now correctly unwraps the API response and returns individual comment objects with full details (id, body, source, user_id, connection_id, created_at).

## 0.3.1 (2026-04-03)

### Changed
- Updated credentials, icon, and node implementation.

## 0.3.0 (2026-04-03)

### Added
- Initial verified publish to npm.
- API Key and OAuth2 authentication support.
- Approval resource: Create, Get, Get Many operations.
- Comment resource: Create, Get Many operations.
- Declarative node with routing-based API calls.
