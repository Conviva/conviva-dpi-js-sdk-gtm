# Conviva DPI JS SDK – Google Tag Manager Template

Deploy the [Conviva JavaScript DPI SDK](https://github.com/Conviva/conviva-js-script-appanalytics) via Google Tag Manager without editing site code.

## Installation

For a full container setup (variables, tags, triggers, and dataLayer event names), see **[GTM_SETUP.md](docs/GTM_SETUP.md)**.

1. **Import the template** into your GTM container:
   - In GTM: **Templates** → **Tag Configuration** → **New** → **Import** and select the `template.tpl` file,  
   - Or install from the **Community Template Gallery** (when published): search for "Conviva DPI JS SDK" and add the tag type.

2. **Create tags** from the "Conviva DPI JS SDK" tag type and configure by tag type (see below).

## Tag types

| Tag type | Purpose | Recommended trigger |
|----------|---------|---------------------|
| **Initialize (init)** | Load the SDK and initialize with Customer Key, App ID, App Version. Optionally set User ID and default custom tags. | **Initialization – All Pages** (or Consent Initialization when using consent mode) |
| **Set User ID (setUserId)** | Set the viewer/user ID (e.g. after login). | When user is identified (e.g. Custom Event or DOM Ready with variable) |
| **Track Page View (trackPageView)** | Send a page view. Required for SPA/MPA correctness. | **DOM Ready** or **Window Loaded** (MPA), or **History Change** (SPA) |
| **Track Custom Event (trackCustomEvent)** | Send a custom event with name and optional data. | **Custom Event** from dataLayer (or other trigger) |
| **Track Revenue (trackRevenue)** | Send a revenue/purchase event (`conviva_revenue_event`) with order amount and transaction ID; optional currency, tax, shipping, discount, line items, and extra metadata. | On purchase/checkout (e.g. Custom Event or thank-you page) |
| **Set Custom Tags (setCustomTags)** | Set global key/value tags applied to all events. | As needed |
| **Unset Custom Tags (unsetCustomTags)** | Remove previously set custom tag keys. | As needed |
| **Track Error (trackError)** | Report an error (message, optional filename, optional error object). | On error (e.g. Custom Event with error payload) |

## Init tag (required once per page)

- **Conviva Customer Key*** – From [Pulse → My Profile → Applications](https://pulse.conviva.com/app/profile/applications).
- **App ID*** – Application name (e.g. `"WEB App"`, `"LGTV Web App"`).
- **App Version** – Optional string (e.g. `"1.1.0"`).
- **Script source** – **Conviva-hosted (recommended)** or **Customer-hosted**. If customer-hosted, provide the full URL to `convivaAppTracker.js`.
- **Init with Cohort Replay** – When enabled, loads and initialises [Conviva Session Replay](https://github.com/Conviva/conviva-js-replay) (conviva-replay.umd.min.js from the Conviva CDN, [sensor.conviva.com](https://sensor.conviva.com/)) **before** the main SDK, using the same Customer Key. Replay must run before AppAnalytics.
- **Replay script version** – (Shown when Cohort Replay is enabled.) Dropdown to select replay SDK version (e.g. `1.0.1`). **Replay custom version (optional)** overrides the dropdown when set (e.g. `main`, `1.0.1`).
- **User ID** – Optional; if set, `setUserId` is called immediately after init.
- **Default Custom Tags** – Optional key/value table; applied via `setCustomTags` after init.

**Trigger:** Fire the Init tag on **All Pages** (or Consent Initialization) so the SDK loads before other Conviva tags.

## Page View tag

- **Page Title Override** – Optional; if empty, the SDK uses `document.title`.

**Triggers:** MPA: **DOM Ready** or **Window Loaded**. SPA: **History Change** or a Custom Event that fires on route change.

## Custom Event tag

- **Event Name*** – Required.
- **Event Data** – Optional; key/value table and/or a variable that returns an object.

**Trigger:** Usually a **Custom Event** that pushes to `dataLayer` with event name and data.

## Revenue tag

Sends a custom event with fixed name `conviva_revenue_event` and data suitable for revenue metrics (Total Revenue, Revenue per visitor, Average Order Value, Average Cart Size). Same API as Custom Event.

- **Total order amount*** – Required.
- **Order ID (transaction ID)*** – Required.
- **Optional:** Currency, Tax amount, Shipping cost, Discount/coupon value, Cart size, **Purchased items (variable)** – GTM variable that returns an array of line-item objects (recommended keys per item: productId, name, sku, category, unitPrice, quantity, discount, brand, variant), Payment method, Payment provider, Order status.
- **Additional metadata** – Key/value table for any extra fields.
- **Revenue data object (variable)** – Optional variable returning an object; merged with the above.

**Trigger:** On purchase/checkout success (e.g. thank-you page or Custom Event with order data).

## Security & Privacy (Reviewer Reference)

This section documents every permission the template requests, what data flows where, and the privacy posture — intended to help reviewers evaluate the template quickly.

### Permissions Summary

| Permission | Scope | Why it is needed |
|------------|-------|------------------|
| **inject_script** | `https://sensor.conviva.com/dpi/releases/*` | Load the Conviva DPI AppAnalytics SDK (versioned release path). |
| **inject_script** | `https://sensor.conviva.com/replay/releases/*` | Load the optional Conviva Session Replay SDK (versioned release path). Only used when "Init with Cohort Replay" is enabled. |
| **access_globals** – `apptracker` (read/write/execute) | Single global | The SDK exposes `window.apptracker` as its public API. The template reads it to detect initialization, writes a queue stub before the script loads (pre-init buffering), and executes it to call SDK methods (`convivaAppTracker`, `trackPageView`, `trackCustomEvent`, `setUserId`, etc.). |
| **access_globals** – `GlobalConvivaNamespace` (read/write/execute) | Single global | Internal SDK bootstrap: the template creates this queue to register the `apptracker` namespace before the SDK script is loaded. Required by the SDK's pre-init design. |
| **access_globals** – `ConvivaReplay` (read/write/execute) | Single global | When Cohort Replay is enabled, the Replay SDK exposes `window.ConvivaReplay`. The template reads it to call `ConvivaReplay.init(customerKey)` after the replay script loads. Write permission is needed because `init()` mutates the object's internal state. |
| **access_globals** – `apptracker.q` (read/write) | Sub-property | The pre-init queue array. The template creates and writes to it so commands issued before the SDK finishes loading are buffered and replayed. |
| **access_globals** – `apptracker.q.push` (execute) | Sub-property | Executes `push()` on the queue array to enqueue pre-init commands. |
| **logging** | `debug` environment only | Console logging for troubleshooting in GTM Preview mode. No logging in production. |

### Scripts Loaded

| Script | Domain | When loaded | Purpose |
|--------|--------|-------------|---------|
| `convivaAppTracker.js` | `sensor.conviva.com` | Always (Init tag) | Conviva DPI AppAnalytics SDK — collects page views, custom events, revenue events, and errors. |
| `conviva-replay.umd.min.js` | `sensor.conviva.com` | Only when "Init with Cohort Replay" is enabled | Conviva Session Replay SDK — records anonymized DOM snapshots for session replay analysis. Loaded **before** the main SDK. |

Both scripts are loaded from versioned release paths on the Conviva CDN (`sensor.conviva.com`). No other external domains are contacted by the template itself. Customer-hosted script URLs are supported but require the user to manually add their domain to the template's `inject_script` permissions.

### Data Sent

All telemetry is sent by the Conviva SDK (not by the template) to Conviva's data collection endpoints (`*.conviva.com`). The template itself does not make any network requests beyond loading the SDK scripts. Data collected includes:

- **Page views** — page URL, title, referrer
- **Custom events** — event name and user-supplied key/value data
- **Revenue events** — order amount, order ID, currency, and optional line items
- **Errors** — error message, optional filename
- **Session metadata** — Customer Key, App ID, App Version, optional User ID, optional Client ID, optional device metadata

### Identifiers & Storage

- **Client ID** — The SDK generates or accepts a `clientId` for session correlation. When "Enable Client ID in cookies" is checked, the SDK persists this ID in a first-party cookie for cross-subdomain tracking. Otherwise, it is session-scoped.
- **User ID** — Only set when explicitly provided by the site via the template's "User ID" field or `setUserId` tag. The template does not infer or generate user identifiers.
- The template itself does not read or write cookies, localStorage, or sessionStorage. Any storage is handled by the loaded SDK.

### Cohort Replay (Session Replay)

When enabled, the Conviva Session Replay SDK records anonymized DOM mutations for visual session replay in the Conviva Pulse dashboard. It:

- Loads **before** the main AppAnalytics SDK (required by the SDK's initialization order).
- Is initialized with the same Customer Key.
- Can be gated by consent — if the Init tag's trigger is consent-dependent, neither Replay nor the main SDK will load until consent is granted.
- Does **not** capture form field values, passwords, or sensitive inputs by default.

### Consent

The template does not implement its own consent logic. It fires when its GTM trigger fires. To gate Conviva tracking on user consent, assign the Init tag to a consent-based trigger (e.g. Consent Initialization or a CMP-triggered Custom Event). All other Conviva tags depend on Init having run, so gating Init effectively gates all tracking.

## Links

- [Conviva JavaScript DPI SDK (conviva-js-script-appanalytics)](https://github.com/Conviva/conviva-js-script-appanalytics)
- [Conviva Session Replay SDK (conviva-js-replay)](https://github.com/Conviva/conviva-js-replay)
- [Pulse – My Profile / Applications](https://pulse.conviva.com/app/profile/applications) (Customer Key)
- [GTM Community Template Gallery](https://tagmanager.google.com/gallery/)
- [Conviva Terms of Use](https://pulse.conviva.com/learning-center/content/a_common/terms_of_use.htm)
- [Conviva Privacy Policy](https://www.conviva.com/privacy-policy/)
