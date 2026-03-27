# Conviva DPI JS SDK -- Google Tag Manager Integration Guide

Deploy the [Conviva JavaScript DPI SDK](https://github.com/Conviva/conviva-js-script-appanalytics) through Google Tag Manager -- no site code changes required.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Add the Template to GTM](#2-add-the-template-to-gtm)
3. [Create Variables](#3-create-variables)
4. [Create Triggers](#4-create-triggers)
5. [Create Tags](#5-create-tags)
   - [Initialize](#51-initialize-init)
   - [Track Page View](#52-track-page-view)
   - [Track Custom Event](#53-track-custom-event)
   - [Track Revenue](#54-track-revenue)
   - [Set User ID](#55-set-user-id)
   - [Set Custom Tags](#56-set-custom-tags)
   - [Unset Custom Tags](#57-unset-custom-tags)
   - [Track Error](#58-track-error)
6. [dataLayer Reference](#6-datalayer-reference)
7. [Script Source Options](#7-script-source-options)
8. [Advanced Configuration](#8-advanced-configuration)
9. [Testing Your Implementation](#9-testing-your-implementation)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before you begin, gather the following:

| Item | Where to find it |
|------|-------------------|
| **Conviva Customer Key** | [Pulse -> My Profile -> Applications](https://pulse.conviva.com/app/profile/applications) |
| **App ID** | Choose a name for your application (e.g. `"WEB App"`, `"LGTV Web App"`). |
| **GTM Container** | An existing container, or [create one](https://tagmanager.google.com/) -- select **Web** as the target platform. |

---

## 2. Add the Template to GTM

### Option A: Community Template Gallery (recommended)

1. Open your GTM container -> **Templates** tab.
2. Under **Tag Templates**, click **Search Gallery**.
3. Search for **"Conviva"** and select **Conviva DPI JS SDK**.
4. Click **Add to workspace** -> **Add**.

### Option B: Manual Import

1. Download `template.tpl` from the [GitHub repository](https://github.com/Conviva/conviva-dpi-js-sdk-gtm).
2. In GTM: **Templates** -> **Tag Templates** -> **New** -> three-dot menu (**...**) -> **Import**.
3. Select the downloaded file and click **Save**.

---

## 3. Create Variables

Create these in **Variables -> User-Defined Variables -> New**. Use the exact names below so your tags can reference them.

### Constant Variables

| Variable Name | Type | Value |
|---------------|------|-------|
| Conviva -- Customer Key | Constant | Your Conviva Customer Key |
| Conviva -- App ID | Constant | e.g. `WEB App` |
| Conviva -- App Version | Constant | e.g. `1.0.0` |

### Data Layer Variables

For each variable below, set **Data Layer Variable Version** to **Version 2**.

#### General

| Variable Name | Data Layer Key | Used By |
|---------------|----------------|---------|
| Conviva -- Custom Event Name | `convivaEventName` | Track Custom Event |
| Conviva -- Custom Event Data | `convivaEventData` | Track Custom Event |
| Conviva -- User ID | `convivaUserId` | Set User ID / Init |
| Conviva -- Page View Title | `convivaPageViewTitle` | Track Page View |
| Conviva -- Error Message | `convivaErrorMessage` | Track Error |
| Conviva -- Error Filename | `convivaErrorFilename` | Track Error |
| Conviva -- Custom Tags | `convivaCustomTags` | Set Custom Tags |
| Conviva -- Unset Tag Keys | `convivaUnsetTagKeys` | Unset Custom Tags |

#### Revenue -- Required

| Variable Name | Data Layer Key | Tag Field |
|---------------|----------------|-----------|
| Conviva -- Revenue Order Amount | `convivaRevenueOrderAmount` | Total order amount (number) |
| Conviva -- Revenue Order ID | `convivaRevenueOrderId` | Order ID (string) |
| Conviva -- Revenue Currency | `convivaRevenueCurrency` | Currency (string, ISO 4217) |

#### Revenue -- Optional

Create a variable for each optional field you need and map it to the corresponding tag field. Using dedicated fields ensures the template's type validation works correctly (numeric fields are validated as numbers, string fields are validated as non-empty strings).

| Variable Name | Data Layer Key | Tag Field | Expected Type |
|---------------|----------------|-----------|---------------|
| Conviva -- Revenue Tax | `convivaRevenueTax` | Tax amount | Number |
| Conviva -- Revenue Shipping | `convivaRevenueShipping` | Shipping cost | Number |
| Conviva -- Revenue Discount | `convivaRevenueDiscount` | Discount / coupon value | Number |
| Conviva -- Revenue Cart Size | `convivaRevenueCartSize` | Cart size | Number |
| Conviva -- Revenue Payment Method | `convivaRevenuePaymentMethod` | Payment method | String |
| Conviva -- Revenue Payment Provider | `convivaRevenuePaymentProvider` | Payment provider | String |
| Conviva -- Revenue Order Status | `convivaRevenueOrderStatus` | Order status | String |
| Conviva -- Revenue Items List | `convivaRevenueItems` | Purchased items (variable) | Array of objects |

#### Revenue -- Extra Metadata

For any additional fields beyond the ones above, use the **Revenue data object (variable)** field. This is for extra metadata that does not have a dedicated tag field.

| Variable Name | Data Layer Key | Tag Field |
|---------------|----------------|-----------|
| Conviva -- Revenue Data | `convivaRevenueData` | Revenue data object (variable) |

---

## 4. Create Triggers

Create these in **Triggers -> New**.

| Trigger Name | Type | Event Name | Used By |
|--------------|------|------------|---------|
| Conviva -- Init | Initialization -- All Pages | _(no filters)_ | Init tag |
| Conviva -- DOM Ready | DOM Ready | _(no filters)_ | Page View tag |
| Conviva -- History Change | History Change | _(no filters)_ | Page View tag (SPA/hybrid) |
| Conviva -- Custom Event | Custom Event | `conviva_customEvent` | Custom Event tag |
| Conviva -- Revenue | Custom Event | `conviva_revenue` | Revenue tag |
| Conviva -- Set User ID | Custom Event | `conviva_setUserId` | Set User ID tag |
| Conviva -- Track Error | Custom Event | `conviva_trackError` | Track Error tag |
| Conviva -- Set Custom Tags | Custom Event | `conviva_setCustomTags` | Set Custom Tags tag |
| Conviva -- Unset Custom Tags | Custom Event | `conviva_unsetCustomTags` | Unset Custom Tags tag |

**Which Page View triggers do I need?**
- **MPA (multi-page app):** Use **DOM Ready** only -- fires as soon as the page structure is ready, before images and heavy resources finish loading.
- **SPA or hybrid:** Attach both **DOM Ready** and **History Change** to the same Page View tag so both the initial load and in-app route changes are tracked.

---

## 5. Create Tags

Go to **Tags -> New**, then select the **Conviva DPI JS SDK** tag type for each tag below.

### Init Tag Ordering and Pre-Init Queue

The behavior depends on which SDK version you are using:

| SDK Version | Init Tag Ordering | Pre-Init Queue |
|-------------|-------------------|----------------|
| **v2.0.0+** (default) | **Recommended** to fire first, but not strictly required. The SDK has a built-in pre-init queue -- any tags that fire before Init completes are automatically buffered and replayed once initialization finishes. No events are lost. | Built into the SDK. No configuration needed. |
| **v1.5.5** | **Required** to fire before all other Conviva tags. Tags that fire before Init will fail because the tracker is not ready. Use the **Initialization -- All Pages** trigger for the Init tag. | Not available. You must ensure Init fires first. |

> **Recommendation:** Use SDK v2.0.0 or later for the best experience. The pre-init queue eliminates timing issues and simplifies your GTM setup -- you don't need to worry about tag firing order.

---

### 5.1 Initialize (init)

Loads the SDK and initializes tracking. Fire **once per page**.

#### Required Fields

| Field | Value |
|-------|-------|
| Conviva Customer Key | `{{Conviva -- Customer Key}}` |
| App ID | `{{Conviva -- App ID}}` |

#### Optional Fields

| Field | Description |
|-------|-------------|
| App Version | Version string, e.g. `{{Conviva -- App Version}}` |
| Script source | `Conviva-hosted (recommended)` or `Customer-hosted`. See [Script Source Options](#7-script-source-options). |
| Init with Cohort Replay | When checked, loads [Conviva Session Replay](https://github.com/Conviva/conviva-js-replay) before the main SDK. |
| User ID | Set if known at init time (e.g. `{{Conviva -- User ID}}`). Otherwise use the Set User ID tag later. |
| Client ID | Sync `clientId` from another instance (mobile app, subdomain). Leave empty to auto-generate. |
| Default Custom Tags | Key/value table applied via `setCustomTags` after init. |
| Enable Client ID in cookies | Share `clientId` across subdomains via cookies. |
| Device Metadata | See [Device Metadata](#device-metadata) in Advanced Configuration. |

#### Trigger

```
Conviva -- Init  (Initialization -- All Pages)
```

> **Note:** Even with SDK v2.0.0's pre-init queue, using **Initialization -- All Pages** is still recommended as a best practice to minimize queue buffering time.

---

### 5.2 Track Page View

Sends a page-view event. Required for correct session and page metrics.

| Field | Description |
|-------|-------------|
| Page Title Override | Optional. Leave empty to use `document.title`. Use `{{Conviva -- Page View Title}}` to override. |

#### Trigger

| Site Type | Trigger(s) |
|-----------|-----------|
| **MPA** | `Conviva -- DOM Ready` |
| **SPA / Hybrid** | `Conviva -- DOM Ready` **and** `Conviva -- History Change` (attach both to the same tag) |

---

### 5.3 Track Custom Event

Sends a named custom event with optional data.

| Field | Value |
|-------|-------|
| Event Name* | `{{Conviva -- Custom Event Name}}` |
| Event Data (table) | Optional fixed key/value pairs |
| Event Data Object (variable) | `{{Conviva -- Custom Event Data}}` |

If both the table and the variable are set, they are merged. Variable keys take priority.

#### Trigger

```
Conviva -- Custom Event  (Custom Event: conviva_customEvent)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_customEvent',
  convivaEventName: 'button_click',
  convivaEventData: { buttonId: 'cta-hero', section: 'homepage' }
});
```

---

### 5.4 Track Revenue

Sends a purchase/revenue event with fixed event name `conviva_revenue_event`. Enables revenue metrics: Total Revenue, Revenue per Visitor, Average Order Value, Average Cart Size.

#### Required Fields

| Field | Value | Expected Type |
|-------|-------|---------------|
| Total order amount* | `{{Conviva -- Revenue Order Amount}}` | Number (e.g. `49.99`). Tag **fails** if non-numeric. |
| Order ID* | `{{Conviva -- Revenue Order ID}}` | String. Tag **fails** if empty. |
| Currency* | `{{Conviva -- Revenue Currency}}` | String, ISO 4217 (e.g. `USD`). Tag **fails** if empty. |

#### Optional Fields

| Field | Expected Type | Behavior if Invalid |
|-------|---------------|---------------------|
| Tax amount | Number | Skipped with console log |
| Shipping cost | Number | Skipped with console log |
| Discount / coupon value | Number | Skipped with console log |
| Cart size | Number | Skipped with console log |
| Payment method | String | Skipped if empty |
| Payment provider | String | Skipped if empty |
| Order status | String | Skipped if empty |
| Purchased items (variable) | Array of objects | Validated as array |
| Additional metadata (table) | Key/value pairs | Extra fields added to event |
| Revenue data object (variable) | Object | For extra metadata only (fields without a dedicated tag field) |

#### Line-Item Object Keys

Each item in the **Purchased items** array supports:

`productId`, `name`, `sku`, `category`, `unitPrice`, `quantity`, `discount`, `brand`, `variant`

#### Trigger

```
Conviva -- Revenue  (Custom Event: conviva_revenue)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_revenue',
  // Required
  convivaRevenueOrderAmount: 49.99,
  convivaRevenueOrderId: 'ord_12345',
  convivaRevenueCurrency: 'USD',
  // Optional -- individual fields (type-validated by the template)
  convivaRevenueTax: 4.50,
  convivaRevenueShipping: 5.99,
  convivaRevenueDiscount: 2.00,
  convivaRevenueCartSize: 2,
  convivaRevenuePaymentMethod: 'card',
  convivaRevenuePaymentProvider: 'Stripe',
  convivaRevenueOrderStatus: 'completed',
  convivaRevenueItems: [
    { productId: 'p1', name: 'Monthly Plan', unitPrice: 24.99, quantity: 1 },
    { productId: 'p2', name: 'Add-on', unitPrice: 19.99, quantity: 1, discount: 1.00 }
  ],
  // Extra metadata -- only for fields without a dedicated tag field
  convivaRevenueData: {
    couponCode: 'SAVE10',
    channel: 'web'
  }
});
```

---

### 5.5 Set User ID

Sets or updates the viewer/user ID. Fire after login or when user identity is known.

| Field | Value |
|-------|-------|
| User ID* | `{{Conviva -- User ID}}` |

#### Trigger

```
Conviva -- Set User ID  (Custom Event: conviva_setUserId)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_setUserId',
  convivaUserId: 'user_abc123'
});
```

---

### 5.6 Set Custom Tags

Sets global key/value tags applied to all subsequent events.

| Field | Description |
|-------|-------------|
| Custom Tags (table) | Fixed key/value pairs |
| Custom Tags (variable) | `{{Conviva -- Custom Tags}}` |

If both are set, they are merged. Variable keys take priority.

#### Trigger

```
Conviva -- Set Custom Tags  (Custom Event: conviva_setCustomTags)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_setCustomTags',
  convivaCustomTags: { genre: 'sports', tier: 'premium' }
});
```

---

### 5.7 Unset Custom Tags

Removes previously set custom tag keys.

| Field | Description |
|-------|-------------|
| Tag Keys to Unset* | Comma-separated list of keys, or a GTM variable returning a string/array. Use `{{Conviva -- Unset Tag Keys}}`. |

#### Trigger

```
Conviva -- Unset Custom Tags  (Custom Event: conviva_unsetCustomTags)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_unsetCustomTags',
  convivaUnsetTagKeys: 'genre,tier'
});
```

---

### 5.8 Track Error

Reports an error for error-rate analysis.

| Field | Value |
|-------|-------|
| Error Message* | `{{Conviva -- Error Message}}` |
| Error Filename | `{{Conviva -- Error Filename}}` (optional) |
| Error Object (variable) | Optional GTM variable returning the full error object |

#### Trigger

```
Conviva -- Track Error  (Custom Event: conviva_trackError)
```

#### dataLayer Push

```javascript
dataLayer.push({
  event: 'conviva_trackError',
  convivaErrorMessage: 'Video playback failed',
  convivaErrorFilename: 'player.js'
});
```

---

## 6. dataLayer Reference

Quick reference for all supported events. Push the `event` key and data keys in the same `dataLayer.push()` call.

| Event | Required Keys | Optional Keys |
|-------|--------------|---------------|
| `conviva_customEvent` | `convivaEventName` | `convivaEventData` |
| `conviva_setUserId` | `convivaUserId` | -- |
| `conviva_trackError` | `convivaErrorMessage` | `convivaErrorFilename` |
| `conviva_revenue` | `convivaRevenueOrderAmount`, `convivaRevenueOrderId`, `convivaRevenueCurrency` | `convivaRevenueTax`, `convivaRevenueShipping`, `convivaRevenueDiscount`, `convivaRevenueCartSize`, `convivaRevenuePaymentMethod`, `convivaRevenuePaymentProvider`, `convivaRevenueOrderStatus`, `convivaRevenueItems`, `convivaRevenueData` |
| `conviva_setCustomTags` | `convivaCustomTags` | -- |
| `conviva_unsetCustomTags` | `convivaUnsetTagKeys` | -- |

---

## 7. Script Source Options

### Main SDK

| Option | Description |
|--------|-------------|
| **Conviva-hosted** (default) | Loads from Conviva CDN (`sensor.conviva.com`). Select a version from the dropdown (default: v2.0.1), or type a custom version to override. |
| **Customer-hosted** | Provide the full URL to your self-hosted `convivaAppTracker.js`. |

> **Note:** SDK v2.0.1 (default) includes the built-in pre-init queue. If you select v1.5.5, see [Init Tag Ordering and Pre-Init Queue](#init-tag-ordering-and-pre-init-queue) for important differences.

### Cohort Replay SDK

When **Init with Cohort Replay** is enabled:

| Option | Description |
|--------|-------------|
| **Conviva-hosted** (default) | Loads from Conviva CDN. Select a version (default: v1.0.2), or type a custom version. |
| **Customer-hosted** | Provide the full URL to your self-hosted replay bundle. |

Replay always loads **before** the main SDK. The template handles this automatically.

### Customer-Hosted Permissions

The template only allows scripts from `sensor.conviva.com` by default. If you host scripts on your own domain, you must update the template permissions:

1. In GTM: **Templates** -> open the **Conviva DPI JS SDK** template.
2. Click the **Permissions** tab.
3. Under **Injects scripts**, add your domain (e.g. `https://cdn.example.com/*`).
4. Save the template.

Without this step, GTM will block the script silently.

---

## 8. Advanced Configuration

### Consent Mode

To gate tracking on user consent, assign the Init tag to a consent-based trigger instead of "Initialization -- All Pages". All other Conviva tags depend on Init, so gating Init effectively gates all tracking.

> **Note (v2.0.0+):** With the pre-init queue, tags that fire before a consent-gated Init are automatically buffered and replayed once consent is granted and Init runs. On v1.5.5, those tags would fail.

### Cross-Subdomain Client ID

Check **Enable Client ID in cookies** in the Init tag to share `clientId` across subdomains (e.g. `app.example.com` and `www.example.com`).

### Client ID from URL or dataLayer

To sync `clientId` from another context (e.g. a mobile app passing it via URL), create a **Custom JavaScript** variable named `Conviva -- Client ID`:

```javascript
function() {
  var q = window.location.search || '';
  var match = /[?&]convivaClientId=([^&]*)/.exec(q);
  if (match && match[1]) return decodeURIComponent(match[1].replace(/\+/g, ' '));
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i].convivaClientId) return String(dl[i].convivaClientId).trim();
  }
  return '';
}
```

Set the Init tag's **Client ID** field to `{{Conviva -- Client ID}}`.

### Avoiding Merged Event Data

GTM merges all `dataLayer.push()` calls into one global state. If you push multiple custom events rapidly, variables may return stale data from a previous push. To always read the most recent push, use **Custom JavaScript** variables instead of Data Layer Variables for the Custom Event tag:

**Conviva -- Custom Event Name (from last push):**

```javascript
function() {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i].event === 'conviva_customEvent' && dl[i].convivaEventName)
      return dl[i].convivaEventName;
  }
  return '';
}
```

**Conviva -- Custom Event Data (from last push):**

```javascript
function() {
  var dl = window.dataLayer || [];
  for (var i = dl.length - 1; i >= 0; i--) {
    if (dl[i].event === 'conviva_customEvent' && dl[i].convivaEventData != null)
      return dl[i].convivaEventData;
  }
  return {};
}
```

Then in your Custom Event tag, set Event Name to `{{Conviva -- Custom Event Name (from last push)}}` and Event Data Object to `{{Conviva -- Custom Event Data (from last push)}}`.

### Device Metadata

Expand the **Device Metadata** group in the Init tag to pass device information. All fields are optional.

| Field | Example Values |
|-------|---------------|
| Device Brand | `Apple`, `Samsung SmartTV` |
| Device Manufacturer | `Samsung`, `Apple` |
| Device Model | `iPhone 6 Plus`, `MacBookPro` |
| Device Type | Dropdown: Desktop, Mobile, Tablet, Smart TV, Games Console, Set Top Box, Vehicle, Other |
| Device Version | `NAForMac` |
| OS Name | `MAC`, `WINDOWS`, `LINUX`, `IOS`, `ANDROID` |
| OS Version | `10.13.6`, `8.1` |
| Device Category | Dropdown: WEB, AND, APL, CHR, LGTV, SAMSUNGTV, TV, STB, PS, XB, RK, etc. |
| Framework Name | `Web` |
| Framework Version | `1.0.0` |

### Tag Sequencing

With SDK v2.0.0+, tag sequencing is generally not needed -- the pre-init queue handles timing automatically. However, if you are using v1.5.5, or want explicit ordering for other reasons, use **Tag Sequencing**:

1. Open the dependent tag -> **Advanced Settings -> Tag Sequencing**.
2. Check **"Fire a tag before [this tag] fires"** and select your Init tag.

---

## 9. Testing Your Implementation

### GTM Preview Mode

1. In GTM, click **Preview** (top-right corner).
2. Enter your site URL and click **Connect**.
3. In the debug panel, verify:
   - The **Init** tag fires on page load (should be the first Conviva tag).
   - **Page View** fires on navigation.
   - Other tags fire when the corresponding `dataLayer.push()` occurs.
4. Click each fired tag to inspect the variable values passed.

### Browser Developer Tools

1. **Console** -- check for errors related to Conviva or the tracker.
2. **Network** -- filter for `conviva` to verify SDK load and telemetry requests.
3. Verify the tracker is ready:

```javascript
typeof window.apptracker  // should return "function"
```

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| **Events not appearing in Pulse** | Verify the Init tag fires in GTM Preview. Double-check the Customer Key. |
| **Tags firing before Init (v1.5.5)** | Ensure Init uses the **Initialization -- All Pages** trigger. On v1.5.5, tags that fire before Init will fail. Upgrade to v2.0.0 for automatic pre-init queueing. |
| **Tags firing before Init (v2.0.0+)** | Events are automatically queued and replayed -- no action needed. Verify Init eventually fires successfully. |
| **dataLayer variable returns stale data** | Use the Custom JavaScript variables from [Avoiding Merged Event Data](#avoiding-merged-event-data). |
| **Script blocked by CSP** | Add `sensor.conviva.com` and `*.conviva.com` to your `script-src` CSP header. Add your own domain if using customer-hosted scripts. |
| **Cohort Replay not working** | Verify **Init with Cohort Replay** is checked. Check the Network tab for the replay script request. If it fails, the main SDK still loads (graceful degradation). |
| **Customer-hosted script not loading** | Add your domain to the template's Permissions. See [Customer-Hosted Permissions](#customer-hosted-permissions). |
| **Revenue tag failing** | `totalOrderAmount` must be numeric; `transactionId` and `currency` must be non-empty strings. Open GTM Preview to see the logged error. |
| **Multiple SDK versions conflict** | If another Conviva SDK is on the page (e.g. from a video player), ensure only one AppAnalytics tracker instance is active. |

---

## Links

- [Conviva JavaScript DPI SDK](https://github.com/Conviva/conviva-js-script-appanalytics)
- [Conviva Session Replay SDK](https://github.com/Conviva/conviva-js-replay)
- [SDK Releases / Changelog](https://github.com/Conviva/conviva-js-script-appanalytics/releases)
- [Conviva Pulse -- Applications](https://pulse.conviva.com/app/profile/applications) (Customer Key)
- [GTM Community Template Gallery](https://tagmanager.google.com/gallery/)
- [GTM Data Layer Documentation](https://developers.google.com/tag-platform/tag-manager/datalayer)
