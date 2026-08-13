import { Text, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native';
import { typography } from '../theme/theme';

// Named text roles as components, not raw fontSize/fontWeight pairs
// copy-pasted per screen — title text (22/700) alone was independently
// duplicated across five files before this existed.
export function Title(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />;
}

export function Heading(props: TextProps) {
  return <Text {...props} style={[styles.heading, props.style]} />;
}

export function Body(props: TextProps) {
  return <Text {...props} style={[styles.body, props.style]} />;
}

export function BodyStrong(props: TextProps) {
  return <Text {...props} style={[styles.bodyStrong, props.style]} />;
}

export function Caption(props: TextProps) {
  return <Text {...props} style={[styles.caption, props.style]} />;
}

export function Label(props: TextProps) {
  return <Text {...props} style={[styles.label, props.style]} />;
}

const styles = StyleSheet.create({
  title: typography.title,
  heading: typography.heading,
  body: typography.body,
  bodyStrong: typography.bodyStrong,
  caption: typography.caption,
  label: typography.label,
});
