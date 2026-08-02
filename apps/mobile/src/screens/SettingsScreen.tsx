import { ActiveTabBanner } from '../components/ActiveTabBanner';
import { ScreenContainer } from '../components/ScreenContainer';

export function SettingsScreen() {
  return (
    <ScreenContainer title="Settings">
      <ActiveTabBanner />
    </ScreenContainer>
  );
}
