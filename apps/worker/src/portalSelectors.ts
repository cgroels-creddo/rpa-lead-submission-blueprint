diff --git a/apps/worker/src/portalSelectors.ts b/apps/worker/src/portalSelectors.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f036cf31ec44d5ddaee886c1cfb69326b180d5ef
--- /dev/null
+++ b/apps/worker/src/portalSelectors.ts
@@ -0,0 +1,50 @@
+export interface PortalSelectors {
+  login: {
+    username: string;
+    password: string;
+    submit: string;
+  };
+  form: {
+    adviserEmail: string;
+    adviserKvk: string;
+    amount: string;
+    yearlyRevenue: string;
+    whenNeededVandaag: string;
+    useOfFunds: string;
+    firstName: string;
+    lastName: string;
+    email: string;
+    phone: string;
+    companyName: string;
+    kvk: string;
+    submitButton: string;
+    successToast: string;
+  };
+}
+
+// Centralized selector registry.
+// Preferred strategy in practice: role/label locators.
+// Fallback strategy used here: name/CSS selectors.
+export const portalSelectors: PortalSelectors = {
+  login: {
+    username: 'input[name="email"]',
+    password: 'input[name="password"]',
+    submit: 'button:has-text("Inloggen")'
+  },
+  form: {
+    adviserEmail: 'input[name="advisorEmail"]',
+    adviserKvk: 'input[name="advisorKvk"]',
+    amount: 'input[name="amount"]',
+    yearlyRevenue: 'select[name="yearlyRevenue"]',
+    whenNeededVandaag: 'label:has-text("Vandaag")',
+    useOfFunds: 'select[name="useOfFunds"]',
+    firstName: 'input[name="firstName"]',
+    lastName: 'input[name="lastName"]',
+    email: 'input[name="customerEmail"]',
+    phone: 'input[name="customerPhone"]',
+    companyName: 'input[name="companyName"]',
+    kvk: 'input[name="companyKvk"]',
+    submitButton: 'button:has-text("Versturen")',
+    successToast: 'text=Aanvraag is succesvol verstuurd'
+  }
+};
