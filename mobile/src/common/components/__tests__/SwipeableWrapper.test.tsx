import React from 'react';
import { render } from '@testing-library/react-native';
import { SwipeableWrapper } from '../SwipeableWrapper';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }: React.ComponentProps<typeof View>) => (
        <View {...props}>{children}</View>
      ),
    },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: (factory: () => object) => factory(),
    withTiming: (value: number) => value,
    interpolate: (value: number, inputRange: number[], outputRange: number[]) => {
      if (value <= inputRange[0]) return outputRange[0];
      if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
      return outputRange[0];
    },
    Extrapolate: { CLAMP: 'clamp' },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  let latestHandlers: Record<string, ((event: any) => void) | undefined> | null = null;

  const createPanGesture = () => {
    const handlers: Record<string, ((event: any) => void) | undefined> = {};
    const gesture = {
      enabled: () => gesture,
      minPointers: () => gesture,
      maxPointers: () => gesture,
      activeOffsetX: () => gesture,
      failOffsetY: () => gesture,
      shouldCancelWhenOutside: () => gesture,
      enableTrackpadTwoFingerGesture: () => gesture,
      onStart: (fn: (event: any) => void) => {
        handlers.onStart = fn;
        latestHandlers = handlers;
        return gesture;
      },
      onUpdate: (fn: (event: any) => void) => {
        handlers.onUpdate = fn;
        latestHandlers = handlers;
        return gesture;
      },
      onEnd: (fn: (event: any) => void) => {
        handlers.onEnd = fn;
        latestHandlers = handlers;
        return gesture;
      },
    };

    latestHandlers = handlers;
    return gesture;
  };

  return {
    Gesture: {
      Pan: createPanGesture,
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    __getLatestPanHandlers: () => latestHandlers,
  };
});

describe('SwipeableWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSwipeDelete when swipe passes the threshold in either direction and deleteOnSwipeOpen is enabled', () => {
    const onSwipeDelete = jest.fn();

    render(
      <SwipeableWrapper onSwipeDelete={onSwipeDelete} deleteOnSwipeOpen={true}>
        <></>
      </SwipeableWrapper>,
    );

    const { __getLatestPanHandlers } = require('react-native-gesture-handler');
    const handlers = __getLatestPanHandlers();

    handlers?.onStart?.({});
    handlers?.onUpdate?.({ translationX: 60 });
    handlers?.onEnd?.({ velocityX: 0 });

    expect(onSwipeDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onSwipeDelete on swipe end when deleteOnSwipeOpen is disabled', () => {
    const onSwipeDelete = jest.fn();

    render(
      <SwipeableWrapper onSwipeDelete={onSwipeDelete} allowedSwipeDirection="left">
        <></>
      </SwipeableWrapper>,
    );

    const { __getLatestPanHandlers } = require('react-native-gesture-handler');
    const handlers = __getLatestPanHandlers();

    handlers?.onStart?.({});
    handlers?.onUpdate?.({ translationX: -60 });
    handlers?.onEnd?.({ velocityX: 0 });

    expect(onSwipeDelete).not.toHaveBeenCalled();
  });
});
