/**
 * Expo app config. Reads product version from repo root version.json and merges
 * with static config from app.json (passed as `config` by Expo).
 * Do not add a static version field back into app.json.
 *
 * EAS CLI (project:init, etc.) may invoke this with a minimal or differently
 * shaped `config`. Fall back to app.json so `expo.extra.eas` always exists when
 * defined there — otherwise EAS can throw (e.g. reading `extra.eas`).
 */
const path = require('path');
const fs = require('fs');

const staticAppJson = require('./app.json');

const versionJsonPath = path.resolve(__dirname, '..', 'version.json');

/** When building from repo root (local/CI), use version.json. When only mobile is deployed (e.g. Vercel), fall back to env or default. */
function resolveAppVersion() {
  let version = process.env.APP_VERSION || null;
  if (fs.existsSync(versionJsonPath)) {
    try {
      const versionData = JSON.parse(
        fs.readFileSync(versionJsonPath, 'utf8'),
      );
      version = versionData?.version ?? version;
    } catch (err) {
      throw new Error(
        `Invalid or unreadable version.json at ${versionJsonPath}: ${err.message}`,
      );
    }
  }
  if (typeof version !== 'string' || !version.trim()) {
    return '1.0.0';
  }
  return version;
}

function resolveExpoSubtree(config) {
  const root = config && typeof config === 'object' ? config : {};
  const fromRoot = root.expo;
  if (fromRoot && typeof fromRoot === 'object') {
    return fromRoot;
  }
  const staticExpo = staticAppJson.expo;
  if (staticExpo && typeof staticExpo === 'object') {
    return staticExpo;
  }
  return {};
}

/**
 * Expo merges `app.json` into `config` before calling this function (expo-doctor expects this pattern).
 * @param {{ config?: Record<string, unknown> }} ctx
 */
module.exports = ({ config } = {}) => {
  const version = resolveAppVersion();
  const root = config && typeof config === 'object' ? config : {};
  const expo = resolveExpoSubtree(config);

  const projectId =
    expo.extra?.eas?.projectId ??
    root.extra?.eas?.projectId ??
    staticAppJson.expo?.extra?.eas?.projectId;
  const updatesUrl =
    typeof projectId === 'string' && projectId.trim()
      ? `https://u.expo.dev/${projectId.trim()}`
      : expo.updates?.url;

  const isDevelopment = process.env.NODE_ENV === 'development';
  const updatesEnabled =
    isDevelopment === true ? false : expo.updates?.enabled !== false;

  return {
    ...root,
    expo: {
      ...expo,
      version,
      updates:
        expo.updates != null
          ? { ...expo.updates, url: updatesUrl, enabled: updatesEnabled }
          : { url: updatesUrl, enabled: updatesEnabled },
    },
  };
};
