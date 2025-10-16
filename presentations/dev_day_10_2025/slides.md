---
# Global settings for the presentation
background: "linear-gradient(to right, #1e293b, #111827)"
theme: geist
highlight:
  theme: monokai
layout: cover
---

# Auth Rework & Vue Best Practices

---

# Agenda

1.  **The Problem**
    <br> <span v-click class="text-pink-400">What was wrong with our initial auth implementation?</span>

2.  **The Solution**
    <br> <span v-click class="text-cyan-400">How can we leverage the Nuxt Lifecycle to fix it?</span>

3.  **The Implementation**
    <br> <span v-click class="text-green-400">How did I solve it? A look at the new components.</span>

4.  **Vue Best Practices**
    <br> <span v-click class="text-purple-400">Writing better components and composables.</span>

---
layout: cover
---

# Auth Rework

---
layout: section
---

# 1. The Problem
<div class="text-red-200">Client-Side Redirects & Poor Performance</div>

---

# What Was Wrong?

Our old authentication was handled client-side in Nuxt Middleware (Step 5 of the lifecycle). This created several major issues:

<div v-click class="mt-4">

**Multiple Redirects**

Authenticated users experienced **4+ redirects** on every single page load.

</div>
<div v-click class="mt-4">

**Slow Performance**

The browser had to load the Vue/Nuxt app, run middleware, *then* redirect, causing significant delays.

</div>
<div v-click class="mt-4">

**Logic-Only Pages**

Pages like `/login` and `/callback` did nothing except handle OAuth logic. Why render a full Vue app for that?

</div>
<div v-click class="mt-4">

**Late Execution**

The auth check happened far too late in the request lifecycle.

</div>

---
layout: section
---

# 2. The Solution
<div class="text-teal-100">A Server-First Approach Using the Nuxt Lifecycle</div>

---

# Server-first Approach

The new architecture is built on a server-first approach for speed and security.

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

- **Server Middleware First**
  <br> Auth validation happens in Nitro (Step 2), before the heavy Nuxt app initializes.

- **Zero-Redirect Navigation**
  <br> Authenticated users experience no auth-related redirects.

</div>
<div>

- **Fast OAuth Callbacks**
  <br> Server middleware handles OAuth callbacks directly for the fastest response.

- **Simple Client Logic**
  <br> Client middleware and components focus on data loading and UI, not security.

</div>
</div>

---
layout: two-cols-header
---

# The Nuxt Lifecycle: Server vs. Client

::left::

### Server-Side (Initial Load)

1.  Nitro Server & Plugins
2.  **Nitro Server Middleware** <span class="ml-2 text-green-400 font-bold bg-green-900/50 px-2 py-1 rounded">Our logic now lives here</span>
3.  Nuxt App & Plugins
4.  Route Validation
5.  **Nuxt App Middleware** <s class="ml-2 text-pink-400">Where our old logic lived</s>
6.  Render Page & Components
7.  Generate & Send HTML

::right::

### Client-Side (In Browser)

1.  Parse HTML
2.  Nuxt App & Plugins
3.  Route Validation
4.  **Nuxt App Middleware** <span class="text-blue-400 text-sm">Still runs, but now for business logic, not security.</span>
5.  Mount Vue App (Hydration)
6.  Page is Interactive

---
layout: section
---

# 3. The Implementation
<div class="text-green-200">The New Architecture</div>

---

# Core Components

The new architecture is a system with a clear separation of concerns.

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

**1. `session-guard.ts`** (Server Middleware)
<br> The server-side gatekeeper. Protects routes, handles OAuth, and refreshes tokens.

**2. `authStore.ts`** (Pinia Store)
<br> The client-side source of truth for auth state (`accessToken`, `user`).

</div>
<div>

**3. `useAuth.ts`** (Composable)
<br> The high-level API for Vue components (`signIn()`, `signOut()`).

</div>
</div>

---

# Redirect Flow: Before (Client-Side Auth)

<div class="text-center mb-4 text-red-300 font-bold">4+ Redirects on Every Page Load</div>

```mermaid
graph LR
    A["/welcome<br/>(Vue Page)"] -->|"1. No token"| B["/login<br/>(Vue Page)"]
    B -->|"2. Redirect"| C["Cognitor OAuth"]
    C -->|"3. Callback"| D["/callback<br/>(Vue Page)"]
    D -->|"4. Process token"| E["/welcome<br/>(Vue Page)"]

    style A fill:#991b1b,stroke:#fff,color:#fff
    style B fill:#991b1b,stroke:#fff,color:#fff
    style C fill:#991b1b,stroke:#fff,color:#fff
    style D fill:#991b1b,stroke:#fff,color:#fff
    style E fill:#991b1b,stroke:#fff,color:#fff
```

<div v-click class="mt-4 text-red-200 text-base">

- Full Vue app loads for /login and /callback pages
- Every page navigation triggers auth checks
- Poor performance and user experience

</div>

---

# Redirect Flow: Fresh Login (Server-Side Auth)

<div class="text-center mb-4 text-amber-300 font-bold">3 Redirects (OAuth Minimum)</div>

```mermaid
graph LR
    A["/welcome"] -->|"1. No token<br/>(session-guard.ts)"| B["Cognitor OAuth"]
    B -->|"2. Returns with code"| C["/callback<br/>(session-guard.ts)"]
    C -->|"3. Token validated<br/>& stored"| D["/welcome<br/>(Vue Page)"]

    style A fill:#92400e,stroke:#fff,color:#fff
    style B fill:#92400e,stroke:#fff,color:#fff
    style C fill:#15803d,stroke:#fff,color:#fff
    style D fill:#15803d,stroke:#fff,color:#fff
```

<div v-click class="mt-4 text-amber-200 text-base">

- Server middleware (session-guard.ts) handles OAuth callback
- No Vue app rendering until authenticated
- Minimal redirect chain for OAuth flow

</div>

---

# Redirect Flow: Authenticated (Server-Side Auth)

<div class="text-center mb-4 text-green-300 font-bold">0 Redirects</div>

```mermaid
graph LR
    A["/welcome"] -->|"Token valid<br/>(session-guard.ts)"| B["/welcome<br/>(Vue Page)"]
    B -->|"Render page"| C["User sees content"]

    style A fill:#15803d,stroke:#fff,color:#fff
    style B fill:#15803d,stroke:#fff,color:#fff
    style C fill:#15803d,stroke:#fff,color:#fff
```

<div v-click class="mt-4 text-green-200 text-base">

- session-guard.ts validates token before Vue app loads
- Zero auth-related redirects
- Instant page loads and seamless navigation

</div>

---

# Token Refresh: Before (Client-Side)

<div class="text-center mb-4 text-red-300 font-bold">Token Refresh in Axios Interceptors</div>

```mermaid
graph LR
    A["User Action"] -->|"1. API Request"| B["Axios Interceptor"]
    B -->|"2. 401 Response"| C["Detect Expired"]
    C -->|"3. Request Refresh"| D["Cognitor API"]
    D -->|"4. New Token"| E["Update Store"]
    E -->|"5. Retry Request"| F["API Request Again"]

    style A fill:#991b1b,stroke:#fff,color:#fff
    style B fill:#991b1b,stroke:#fff,color:#fff
    style C fill:#991b1b,stroke:#fff,color:#fff
    style D fill:#991b1b,stroke:#fff,color:#fff
    style E fill:#991b1b,stroke:#fff,color:#fff
    style F fill:#991b1b,stroke:#fff,color:#fff
```

<div v-click class="mt-4 text-red-200 text-base">

- Token refresh only happens AFTER a failed API request (401 error)
- User experiences failed request, then retry with delay
- Slow and disruptive - visible loading states and errors
- Every API call potentially triggers this expensive flow

</div>

---

# Token Refresh: After (Server-Side)

<div class="text-center mb-4 text-cyan-300 font-bold">Proactive Token Refresh in session-guard.ts</div>

```mermaid
graph LR
    A["/welcome"] -->|"1. Token expired<br/>(session-guard.ts)"| B["Refresh Token<br/>from Cookie"]
    B -->|"2. Request new<br/>access token"| C["Cognitor API"]
    C -->|"3. New token<br/>returned"| D["Store in Cookie<br/>(session-guard.ts)"]
    D -->|"4. Continue"| E["/welcome<br/>(Vue Page)"]

    style A fill:#0e7490,stroke:#fff,color:#fff
    style B fill:#0e7490,stroke:#fff,color:#fff
    style C fill:#0e7490,stroke:#fff,color:#fff
    style D fill:#15803d,stroke:#fff,color:#fff
    style E fill:#15803d,stroke:#fff,color:#fff
```

<div v-click class="mt-4 text-cyan-200 text-base">

- session-guard.ts detects expired token BEFORE page loads
- Token refresh happens proactively, not reactively
- User never sees a redirect, loading state, or failed request
- Instantaneous - happens at server middleware level before Vue boots

</div>

---
layout: section
---

# 4. Learnings
<div class="text-amber-200">Key Takeaways</div>

---

# What I Learned

<div v-click>

**Debugging with Chrome DevTools**
<br> Network tab waterfalls revealed the redirect chains. Performance profiling showed where time was being wasted in the request lifecycle.

</div>
<div v-click class="mt-4">

**How Nitro and Nuxt Work Together**
<br> Nitro handles the server layer (middleware, routes, utilities). Nuxt handles the app layer (components, pages, plugins). Understanding this boundary is crucial.

</div>
<div v-click class="mt-4">

**Implementing Auth is Hard**
<br> OAuth flows, token management, SSR hydration, cookie security, multi-tab sync... there are many moving parts that need to work together perfectly.

</div>
<div v-click class="mt-4">

**SSR `event.context` is the Bridge**
<br> It's how we pass data (like tokens) from the server middleware to the client-side Vue app for hydration.

</div>
<div v-click class="mt-4">

**Server-First for Performance**
<br> Moving auth validation to Nitro server middleware (Step 2) eliminated the need to boot the entire Vue app just to redirect users.

</div>

---
layout: cover
---

# Vue Best Practices
<div class="text-purple-200">Writing Better Components & Composables</div>

---

# Anti-Pattern Example

This component has everything in one place:

```vue {4-7,10-12|all}
<script setup lang="ts">
const shown = defineModel<boolean>('shown', { required: true })

// Some logic here

const { collection } = useResourceCollection(
  CustomerAccount.api($jsonApiService).with(['profileImage']).perPage(15)
)

onMounted(async () => {
  await collection.requestItems()
})
</script>

<template>
  <HeaderModal v-model:shown="shown" label="Find People">
    <AnnyOrmList :collection="collection" />
  </HeaderModal>
</template>
```

<div v-click class="mt-4 text-red-300">

**Result:** Data fetches on every page load, even if modal never opens. Component never unmounts, so reopening doesn't refresh data.

</div>

---
layout: two-cols-header
---

# Better Pattern: Separate Content Component

Split the modal wrapper from the content logic:

::left::

```vue
<script setup lang="ts">
const showModal = ref(false)
</script>

<template>
  <!-- v-if mounts only when shown -->
  <HeaderModal
    v-model:shown="showModal"
    label="Find People"
  >
    <FindPeopleList />
  </HeaderModal>
</template>
```

::right::

```vue
<script setup lang="ts">
// ✅ This component only mounts when modal opens
const { collection } = useResourceCollection(
  CustomerAccount.api($jsonApiService)
    .with(['profileImage'])
    .perPage(15),
)

// ✅ Fetches data only when modal opens
onMounted(async () => {
  await collection.requestItems()
})
</script>

<template>
  <AnnyOrmList :collection="collection" />
</template>
```

<style>
.two-cols-header {
  column-gap: 20px; /* Adjust the gap size as needed */
}
</style>

---

# Composable Best Practices
<div class="text-purple-200">Writing Reactive Composables</div>

---

# The Problem: Lost Reactivity with Props

When you pass props directly to composables, reactivity is lost:

<div class="grid grid-cols-2 gap-4 text-sm mt-4">
<div>

**Component with Props**

```vue
<script setup lang="ts">
const { locale, amount } = defineProps<{
  locale: string
  amount: number
}>()

// ❌ Broken - loses reactivity
const formatter = useFormatter(locale)
const formatted = formatter.currency(amount)
</script>
```

</div>
<div>

**The Issue**

```ts
// When props change:
// locale: 'en-US' → 'de-DE'
// amount: 100 → 200
//
// formatted value DOES NOT update!
//
// Why? Because locale was extracted
// at component creation time, not
// tracked as a reactive dependency
```

</div>
</div>

<div v-click class="mt-4 text-red-200 text-base">

- Destructuring props breaks the reactive connection
- Composable receives a static value, not a reactive reference
- UI doesn't update when props change

</div>

---

# The Solution: MaybeRefOrGetter Pattern

Use `MaybeRefOrGetter<T>` and `toValue()` to maintain reactivity:

```ts {all|1,2|4-6|8-11|all}
export function useFormatter(
  locale?: MaybeRefOrGetter<string>
) {
  const currency = computed(() => {
    const localeValue = toValue(locale) || 'en-US'

    return (amount: number) => {
      return new Intl.NumberFormat(localeValue, {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }
  })

  return { currency }
}
```

<div v-click class="mt-2 text-cyan-200 text-sm">

**MaybeRefOrGetter** accepts: static values, refs, computed, or getter functions<br>
**toValue()** extracts the current value while maintaining reactive tracking

</div>

---

# How to Use It: Multiple Patterns

The same composable now supports all these patterns:

```ts {1-2|4-6|8-9|11-13|all}
// 1. Static value
const formatter = useFormatter('en-US')

// 2. Ref
const locale = ref('de-DE')
const formatter = useFormatter(locale)

// 3. Computed
const formatter = useFormatter(computed(() => store.locale))

// 4. Getter function (BEST for props!)
const { locale } = defineProps<{ locale: string }>()
const formatter = useFormatter(() => locale)
```

<div v-click class="mt-4 text-green-200 text-base">

- Getter functions `() => props.value` maintain prop reactivity
- Works inside computed() for automatic dependency tracking
- Flexible API - one composable, multiple usage patterns

</div>

---

# Key Takeaways

<div v-click>

**Use MaybeRefOrGetter for Composable Parameters**
<br> Allows static values, refs, computed, and getter functions - maximum flexibility

</div>
<div v-click class="mt-4">

**Use toValue() to Extract Values**
<br> Maintains reactive tracking while getting the current value

</div>
<div v-click class="mt-4">

**Use Getter Functions for Props**
<br> `() => props.value` maintains reactivity when passing props to composables

</div>
<div v-click class="mt-4">

**Combine with computed() for Reactive Returns**
<br> Wrap toValue() calls in computed() to make return values automatically reactive

</div>
<div v-click class="mt-4">

**Watch toValue() Results for Side Effects**
<br> Use watchers to respond to changes in reactive parameters

</div>
