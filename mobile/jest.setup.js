/**
 * Jest setup for React Native / Expo tests.
 * Mocks native and Expo modules so tests run in Node without a native runtime.
 */

// AsyncStorage - required by cache layers and sync queue before any repo loads
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// expo-modules-core - required by expo-crypto, expo-updates, expo-secure-store
jest.mock('expo-modules-core', () => ({
  EventEmitter: function EventEmitter() {
    return { addListener: jest.fn(), removeSubscription: jest.fn() };
  },
  requireNativeModule: () => ({}),
}));

// expo-crypto - used by sync queue and repos; avoid native module load
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  digestStringAsync: jest.fn(() => Promise.resolve('mock-digest')),
}));

// expo-updates - used by i18n; avoid native module load
jest.mock('expo-updates', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  getUpdateIdAsync: jest.fn(() => Promise.resolve(null)),
  getNativeBuildVersion: jest.fn(() => Promise.resolve(null)),
  reloadAsync: jest.fn(() => Promise.resolve()),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isNew: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({})),
  isEmbeddedLaunch: true,
  isEmergencyLaunch: false,
}));

// expo-secure-store - used by auth tokenStorage; avoid native module load
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// NativeEventEmitter - allow null argument so Keyboard (and others) load when native module is missing
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class NativeEventEmitter {
    constructor(_nativeModule) {
      this._listeners = [];
    }
    addListener(_event, listener) {
      this._listeners.push({ remove: jest.fn() });
      return this._listeners[this._listeners.length - 1];
    }
    removeAllListeners() {
      this._listeners = [];
    }
  };
});

// TurboModuleRegistry - so react-native can load in Jest without native binary.
// All stubs defined inside factory so jest.mock() does not reference out-of-scope variables.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const mockDeviceInfoConstants = {
    Dimensions: {
      window: { width: 750, height: 1334, scale: 2, fontScale: 1 },
      screen: { width: 750, height: 1334, scale: 2, fontScale: 1 },
    },
  };
  const mockPlatformConstants = {
    isTesting: true,
    isDisableAnimations: true,
    reactNativeVersion: { major: 0, minor: 0, patch: 0, prerelease: null },
    forceTouchAvailable: false,
    osVersion: '0',
    systemName: 'Test',
    interfaceIdiom: 'phone',
    isMacCatalyst: false,
  };
  const mockNativeAnimatedStub = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    getValue: jest.fn(),
    startListeningToAnimatedNodeValue: jest.fn(),
    stopListeningToAnimatedNodeValue: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    startAnimatingNode: jest.fn(),
    setAnimatedNodeValue: jest.fn(),
    setAnimatedNodeOffset: jest.fn(),
    flattenAnimatedNodeOffset: jest.fn(),
    extractAnimatedNodeOffset: jest.fn(),
    addAnimatedEventToView: jest.fn(),
    removeAnimatedEventFromView: jest.fn(),
    dropAnimatedNode: jest.fn(),
    queueAndExecuteBatchedOperations: jest.fn(),
  };
  return {
    getEnforcing: (name) => {
      if (name === 'DeviceInfo') return { getConstants: () => mockDeviceInfoConstants };
      if (name === 'PlatformConstants') return { getConstants: () => mockPlatformConstants };
      if (name === 'NativeAnimatedModule') return mockNativeAnimatedStub;
      if (name === 'SettingsManager') return { getConstants: () => ({ settings: {} }), setValues: jest.fn(), deleteValues: jest.fn() };
      return { addListener: jest.fn(), remove: jest.fn(), removeListeners: jest.fn() };
    },
    get: (name) => {
      if (name === 'DeviceInfo') return { getConstants: () => mockDeviceInfoConstants };
      if (name === 'PlatformConstants') return { getConstants: () => mockPlatformConstants };
      if (name === 'NativeAnimatedModule') return mockNativeAnimatedStub;
      if (name === 'SettingsManager') return { getConstants: () => ({ settings: {} }), setValues: jest.fn(), deleteValues: jest.fn() };
      return null;
    },
  };
});

// Minimal document/window for useClickOutside (web-only hook) when tests run in Node.
// Tracks listeners so dispatchEvent can invoke them.
if (typeof document === 'undefined') {
  const listenerMap = new Map();
  // useClickOutside registers with capture: true; only invoke listeners for that key.
  function invokeListeners(event) {
    const key = `${event.type}-true`;
    const list = listenerMap.get(key) || [];
    list.forEach((fn) => fn(event));
  }
  const createElement = jest.fn(() => {
    const el = {
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      contains: jest.fn(() => false),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      dispatchEvent(event) {
        if (event.target == null) event.target = el;
        invokeListeners(event);
        return true;
      },
    };
    return el;
  });
  const body = createElement();
  body.contains = jest.fn((node) => node === body);
  body.appendChild = jest.fn();
  body.removeChild = jest.fn();
  global.document = {
    addEventListener: jest.fn((type, fn, capture) => {
      const key = `${type}-${!!capture}`;
      if (!listenerMap.has(key)) listenerMap.set(key, []);
      listenerMap.get(key).push(fn);
    }),
    removeEventListener: jest.fn((type, fn, capture) => {
      const key = `${type}-${!!capture}`;
      const list = listenerMap.get(key);
      if (list) {
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
      }
    }),
    createElement,
    body,
    createEvent: jest.fn(() => ({ initEvent: jest.fn() })),
    querySelector: jest.fn(() => null),
  };
  if (typeof window === 'undefined') {
    global.window = { document: global.document };
  }
}
// MouseEvent for useClickOutside tests (Node has no DOM types)
if (typeof global.MouseEvent === 'undefined') {
  global.MouseEvent = class MouseEvent extends Event {
    constructor(type, opts = {}) {
      super(type, opts);
      this.bubbles = opts.bubbles ?? false;
      this.cancelable = opts.cancelable ?? false;
    }
  };
}
