# Changelog

All notable changes to the Conviva DPI JS SDK GTM Template project are documented in this file.

## [1.0.0] - Initial release

### Added

- **Conviva DPI JS SDK** tag type for Google Tag Manager with 8 tag types:
  - **Initialize (init)** – Load SDK (Conviva-hosted or Customer-hosted), initialize with Customer Key, App ID, App Version. Optional: User ID, Client ID, default Custom Tags, Enable Client ID in cookies, Device Metadata, Cohort Replay.
  - **Set User ID (setUserId)** – Set viewer/user ID.
  - **Track Page View (trackPageView)** – Send page view with optional title override.
  - **Track Custom Event (trackCustomEvent)** – Send named event with optional data (table and/or object variable).
  - **Track Revenue (trackRevenue)** – Send `conviva_revenue_event` with required order amount, transaction ID, currency; optional tax, shipping, discount, cart size, items array, payment fields, and extra metadata.
  - **Set Custom Tags (setCustomTags)** – Set global key/value tags (table and/or object variable).
  - **Unset Custom Tags (unsetCustomTags)** – Remove tag keys by comma-separated list.
  - **Track Error (trackError)** – Report error with message, optional filename, optional error object.
- **Cohort Replay** – Optional; loads Conviva Session Replay SDK before the main SDK. Supports Conviva-hosted (versioned) and Customer-hosted URLs.
- **Pre-init queue** – Commands issued before Init completes are buffered and replayed automatically (SDK v2.0.0+).
- **Device Metadata** – Optional group: brand, manufacturer, model, type, version, OS name/version, category, framework name/version.
- Sandboxed JS using GTM APIs: `injectScript`, `copyFromWindow`, `createQueue`, `setInWindow`, `callInWindow`, `makeTableMap`, `makeNumber`, `makeString`, `getType`, `Object`, `JSON`, `logToConsole`.
- Permissions: `inject_script` (sensor.conviva.com CDN), `access_globals` (apptracker, apptracker.q, apptracker.q.push, GlobalConvivaNamespace, ConvivaReplay), `logging` (debug only).
- 35 unit test scenarios covering all tag types, Cohort Replay, customer-hosted URLs, pre-init queue, and failure paths.
- README, GTM_SETUP.md, INTEGRATION_GUIDE.md, LICENSE (Apache 2.0), and metadata.yaml for Community Template Gallery submission.
