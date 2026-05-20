# App Store Review Response: Guideline 3.1.2(c)

Use this for the next App Store Connect submission/reply for the 2026-05-15 rejection.

## Rejection

- Guideline: 3.1.2(c) - Business - Payments - Subscriptions
- Submission ID: `35b2d613-60fc-48eb-8285-3ac8a96eaadf`
- Review date: 2026-05-15
- Review device: iPhone 17 Pro Max
- Version reviewed: `1.0 (94)`
- Apple issue: App Store metadata did not include a functional Terms of Use/EULA link for auto-renewable subscriptions.

## Required App Store Connect metadata changes

1. In App Store Connect, open the iOS app version metadata.
2. Ensure the Privacy Policy URL field is:

   ```text
   https://kithchensync1.vercel.app/privacy
   ```

3. Add this line to the App Description, preferably at the end of the description:

   ```text
   Terms of Use (EULA): https://kithchensync1.vercel.app/terms
   ```

4. Optional but recommended: if using a custom license agreement, also paste the plain-text terms into App Store Connect > General > App Information > License Agreement. Apple strips HTML in this field, so paste plain text only.

## App Review Information > Notes

Paste this into the Notes field for the next submission:

```text
This submission addresses the previous Guideline 3.1.2(c) subscription metadata rejection.

Metadata updates:
- The Privacy Policy URL is set to https://kithchensync1.vercel.app/privacy
- The App Description includes: Terms of Use (EULA): https://kithchensync1.vercel.app/terms

In-app subscription disclosure:
- Open the app, sign in with the review account, then navigate to Settings > Premium.
- The Premium screen shows the auto-renewable subscription title, length, price, free-trial information, billing/auto-renewal disclosure, and functional links to Privacy Policy and Terms of Use (EULA) before purchase.
- Restore Purchases is available on the Premium screen.
```

## Reply to App Review

After updating metadata and submitting a new build or metadata-only update, reply with:

```text
Hello,

We updated the App Store metadata to include the required Terms of Use (EULA) link in the App Description:
https://kithchensync1.vercel.app/terms

The Privacy Policy URL remains available in the App Store Connect Privacy Policy field:
https://kithchensync1.vercel.app/privacy

We also updated the in-app Premium purchase flow so the subscription screen displays the subscription title, duration, price/free-trial information, auto-renewal billing disclosure, and functional links to the Privacy Policy and Terms of Use (EULA) before purchase.

A screen recording showing the updated metadata and in-app Premium screen has been attached/provided in App Review Information.

Thank you.
```

## Screen recording checklist

Record an iPhone screen showing:

1. Launch app.
2. Sign in with the review/demo account.
3. Navigate to Settings > Premium.
4. Show Premium subscription title and plan cards.
5. Show yearly plan price, length, and free trial.
6. Show the auto-renewal billing disclosure.
7. Tap Privacy Policy and confirm the public page opens.
8. Return to app.
9. Tap Terms of Use (EULA) and confirm the public page opens.
10. Show Restore Purchases button.

## Public URL verification

Both URLs must return HTTP 200 before submission:

```text
https://kithchensync1.vercel.app/privacy
https://kithchensync1.vercel.app/terms
```
