/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { App } from '../src/app/App';

test('renders the navigation shell and defaults to the Home tab', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  // Proves the navigator actually mounted the Home screen (not a blank
  // shell) and that the Zustand store reflects it via ActiveTabBanner —
  // not just that *something* rendered without crashing. JSX children are
  // separate array entries ("Active tab: ", "Home"), so join per-Text-node
  // rather than substring-matching the raw render tree.
  const renderedText = tree!.root
    .findAllByType(Text)
    .map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children,
    )
    .join(' | ');

  expect(renderedText).toContain('Active tab: Home');
});
