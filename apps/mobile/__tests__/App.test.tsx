/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { App } from '../src/app/App';
import { useProfileStore } from '../src/state/profileStore';
import { useUiStore } from '../src/state/uiStore';

describe('App', () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    // Unmount before resetting the store — otherwise the previous test's
    // tree is still subscribed when setState fires, outside of act().
    act(() => {
      tree?.unmount();
    });
    tree = undefined;
    useProfileStore.setState({ status: 'loading', profile: null });
  });

  test('renders the navigation shell and defaults to the Home tab once a profile exists', async () => {
    useProfileStore.setState({
      status: 'loaded',
      profile: {
        handedness: 'right',
        skillLevel: 'beginner',
        primaryClub: 'driver',
        units: 'imperial',
        privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
      },
    });

    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    // Proves the navigator actually mounted the Home screen (not a blank
    // shell) — not just that *something* rendered without crashing — and
    // that the Zustand tab-tracking store reflects it, read directly rather
    // than via a rendered debug string (that string used to be real UI
    // content here; it was leftover developer instrumentation never meant
    // to be user-facing, removed once that became clear).
    expect(
      tree!.root.findAllByProps({ testID: 'home-record-cta' }).length,
    ).toBeGreaterThan(0);
    expect(useUiStore.getState().activeTab).toBe('Home');
  });

  test('shows onboarding before a profile exists, and the tab shell after completing it', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    expect(
      tree!.root.findAllByProps({ testID: 'onboarding-privacy' }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'privacy-accept-button' })
        .props.onPress();
    });

    expect(
      tree!.root.findAllByProps({ testID: 'onboarding-profile' }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      tree!.root.findByProps({ testID: 'profile-save-button' }).props.onPress();
    });

    expect(
      tree!.root.findAllByProps({ testID: 'home-record-cta' }).length,
    ).toBeGreaterThan(0);
    expect(useUiStore.getState().activeTab).toBe('Home');
  });
});
