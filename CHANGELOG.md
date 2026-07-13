# Changelog
## [1.2.2] - 2026-07-13

### Added

- Support for **Conviva DPI JS SDK v2.2.2** in the Script version dropdown; v2.2.2 is now the default selection for new tags. `DEFAULT_VERSION` fallback constant bumped from `v2.2.1` to `v2.2.2`.

### Tests

- Default-version URL test updated to assert that an Init tag with no version override resolves to `v2.2.2/convivaAppTracker.js`.


## [1.2.1] - 2026-07-02

### Added

- Support for **Conviva DPI JS SDK v2.2.1** in the Script version dropdown; v2.2.1 is now the default selection for new tags. `DEFAULT_VERSION` fallback constant bumped from `v2.2.0` to `v2.2.1`.

### Tests

- Default-version URL test updated to assert that an Init tag with no version override resolves to `v2.2.1/convivaAppTracker.js`.


All notable changes to the Conviva DPI JS SDK GTM Template project are documented in this file.

## [1.2.0] - 2026-05-24

### Added

- Support for **Conviva DPI JS SDK v2.2.0** in the Script version dropdown; v2.2.0 is now the default selection for new tags. `DEFAULT_VERSION` fallback constant bumped from `v2.1.0` to `v2.2.0`.
- Support for **Cohort Replay v1.0.4** in the Replay script version dropdown; v1.0.4 is now the default selection for new tags. `REPLAY_DEFAULT_VERSION` fallback constant bumped from `v1.0.3` to `v1.0.4`.
- In-template compatibility hint surfaced on both the **Script version** field help text and the **Replay script version** field help text so GTM admins see the DPI v2.2.0+ ↔ Replay v1.0.4+ pairing requirement when editing a tag.

### Compatibility

- DPI SDK **v2.2.0+** must be paired with Cohort Replay **v1.0.4+** for correct mid-session clientId synchronization. DPI v2.2.0 introduces the native WebView bridge for hybrid Android / iOS apps, which can supply the clientId after replay has already started; Replay v1.0.4 reacts to the resulting `ConvivaClientIdChanged` signal and hot-swaps its upload identity to match. The bumped defaults in this template enforce that pairing for new GTM tags. Existing tags retain their saved version values (GTM persists field values at tag-save time, so the default flip does not retroactively change existing configurations).

### Tests

- Default-version URL test updated to assert that an Init tag with no version override resolves to `v2.2.0/convivaAppTracker.js`.

## [1.1.0] - 2026-04-30

### Added

- Support for **Conviva DPI JS SDK v2.1.0** in the Script version dropdown; v2.1.0 is now the default selection for new tags. `DEFAULT_VERSION` fallback constant bumped to `v2.1.0`.

### Changed

- **Enable Client ID in cookies** checkbox now defaults to `true` so new installs get cross-subdomain `clientId` continuity out of the box. Existing tags retain their saved value (GTM persists field values at tag-save time, so the default flip does not retroactively change existing configurations).

### Fixed

- `enableClIdInCookies` was being written at the top level of the `convivaAppTracker` init payload, but the SDK reads it from `configs.enableClIdInCookies`. Ticking the checkbox had no runtime effect — cross-subdomain `clientId` sharing never activated. The flag is now correctly nested under `configs`, matching the SDK contract documented in the `conviva-js-script-appanalytics` README.

### Tests

- Added 3 scenarios (38 total): regression test asserting `enableClIdInCookies` is nested under `configs` (and absent at top level); negative test asserting `configs` is omitted entirely when the checkbox is unticked; default-version test asserting the script URL resolves to v2.1.0 when no version override is set.

## [1.0.1] - 2026-04-08

### Added

- Support for **Conviva DPI JS SDK v2.0.2** and **Cohort Replay v1.0.3** in their respective version dropdowns, with bug fixes for cohort replay reliability.

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
## [1.2.1] - 2026-07-02

### Added

- Support for **Conviva DPI JS SDK v2.2.1** in the Script version dropdown; v2.2.1 is now the default selection for new tags. `DEFAULT_VERSION` fallback constant bumped from `v2.2.0` to `v2.2.1`.

### Tests

- Default-version URL test updated to assert that an Init tag with no version override resolves to `v2.2.1/convivaAppTracker.js`.
