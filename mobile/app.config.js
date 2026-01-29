/**
 * Expo app config. Reads product version from repo root version.json and merges
 * with app.json. expo.version is set only from version.json (store release version).
 * Do not add a static version field back into app.json.
 */
const path = require('path');
const fs = require('fs');

const versionJsonPath = path.resolve(__dirname, '..', 'version.json');

if (!fs.existsSync(versionJsonPath)) {
  throw new Error(
    `version.json not found at ${versionJsonPath}. Product version must be defined at repo root.`
  );
}

let versionData;
try {
  versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
} catch (err) {
  throw new Error(
    `Invalid or unreadable version.json at ${versionJsonPath}: ${err.message}`
  );
}

const version = versionData?.version;
if (typeof version !== 'string' || !version.trim()) {
  throw new Error(
    `version.json must contain a non-empty "version" string. Got: ${JSON.stringify(versionData)}`
  );
}

const appJson = require('./app.json');

/** Build updates.url from extra.eas.projectId when set (after eas init). Single source of truth for EAS project ID. Falls back to app.json expo.updates.url when projectId is unset or not a non-empty string. */
const projectId = appJson.expo?.extra?.eas?.projectId ?? appJson.extra?.eas?.projectId;
const updatesUrl =
  typeof projectId === 'string' && projectId.trim()
    ? `https://u.expo.dev/${projectId.trim()}`
    : appJson.expo?.updates?.url;

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    version,
    updates:
      appJson.expo?.updates != null
        ? { ...appJson.expo.updates, url: updatesUrl }
        : { url: updatesUrl },
  },
};
