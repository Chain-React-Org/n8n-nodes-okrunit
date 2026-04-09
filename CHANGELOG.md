# Changelog

## 0.9.2 (2026-04-09)

### Fixed
- **Wait for Decision now works with self-hosted n8n.** When n8n runs on localhost or a private network, the node automatically switches from callback (which OKRunit cannot reach) to polling mode. It polls the approval status every 5 seconds until a decision is made. Cloud/public n8n instances continue to use the instant callback approach.

## 0.9.0 (2026-04-08)

### Breaking
- **Removed standalone "OKRunit Request Approval" node.** Its functionality has been consolidated into the main OKRunit node. Existing workflows using the standalone node will need to be updated to use the OKRunit node with the "Create an Approval Request" operation and "Wait for Decision" enabled.
- **Removed standalone "New Approval Trigger" and "Approval Decided Trigger" nodes.** Both have been consolidated into a single "OKRunit Trigger" node with an Event selector. Existing trigger workflows will need to be updated.

### Added
- **Template field on Create Approval.** Select a saved template to pre-fill fields when creating an approval request.
- **"Wait for Decision" toggle on Create Approval.** When enabled, the workflow pauses until a human approves or rejects, then resumes automatically. Replaces the need for the standalone Request Approval node.
- **Unified "OKRunit Trigger" node** with Event dropdown: "New Approval Request" and "Approval Decided". Replaces the two standalone trigger nodes.

### Changed
- Converted OKRunit node from declarative to programmatic style to support the wait-for-decision flow.
- Removed unused declarative routing from all property definitions.
- Package now ships only two nodes: OKRunit (actions) and OKRunit Trigger (events).

## 0.4.0 (2026-04-07)

### Added
- **OKRunit Trigger node.** Polling trigger with two events:
  - **New Approval Request** - fires when new approvals are created, with status and priority filters
  - **Approval Decided** - fires when approvals are approved or rejected, with decision type and priority filters
- Trigger supports both API Key and OAuth2 authentication

## 0.3.3 (2026-04-07)

### Changed
- Renamed operations with proper Title Case capitalization for node subtitles.
- Switched icon from PNG to SVG per n8n community node requirements.

## 0.3.2 (2026-04-06)

### Added
- **Create Activity Log** operation. Log activities for audit/tracking without creating an approval request. Matches the Zapier "Create Activity Log" action.
- **Dynamic Action Type dropdown.** Create Approval now loads your organization's action types from the API. Custom values can be entered via expression mode and are auto-registered in your organization.
- **Comment source attribution.** Comments created from n8n now display with the n8n logo and "App" badge in the OKRunit dashboard instead of generic "API".

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
