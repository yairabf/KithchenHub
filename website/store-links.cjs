'use strict';

const STORE_URL_ENV_KEYS = Object.freeze({
  appStore: 'FULLHOUSE_APP_STORE_URL',
  googlePlay: 'FULLHOUSE_GOOGLE_PLAY_URL',
});

const DEFAULT_STORE_URLS = Object.freeze({
  appStore: 'https://apps.apple.com/us/app/fullhouse-household-manager/id6761058717',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.kitchenhub.app',
});

const STORE_URL_RULES = Object.freeze({
  appStore: Object.freeze({
    label: 'App Store URL',
    host: 'apps.apple.com',
  }),
  googlePlay: Object.freeze({
    label: 'Google Play URL',
    host: 'play.google.com',
  }),
});

function normalizeStoreUrl(value, rule) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${rule.label} must be a valid absolute URL`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${rule.label} must use https:`);
  }

  if (url.hostname !== rule.host) {
    throw new Error(`${rule.label} must use host ${rule.host}`);
  }

  url.hash = '';
  return url.toString();
}

function getPublicStoreUrls(env = process.env) {
  return {
    appStore: normalizeStoreUrl(
      env[STORE_URL_ENV_KEYS.appStore] || DEFAULT_STORE_URLS.appStore,
      STORE_URL_RULES.appStore,
    ),
    googlePlay: normalizeStoreUrl(
      env[STORE_URL_ENV_KEYS.googlePlay] || DEFAULT_STORE_URLS.googlePlay,
      STORE_URL_RULES.googlePlay,
    ),
  };
}

function replaceAll(source, searchValue, replacement) {
  return source.split(searchValue).join(replacement);
}

function renderStoreLinks(html, env = process.env) {
  const urls = getPublicStoreUrls(env);
  return replaceAll(
    replaceAll(html, DEFAULT_STORE_URLS.appStore, urls.appStore),
    DEFAULT_STORE_URLS.googlePlay,
    urls.googlePlay,
  );
}

module.exports = {
  DEFAULT_STORE_URLS,
  STORE_URL_ENV_KEYS,
  getPublicStoreUrls,
  renderStoreLinks,
};
