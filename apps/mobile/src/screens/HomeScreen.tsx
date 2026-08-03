import { ActiveTabBanner } from '../components/ActiveTabBanner';
import { ScreenContainer } from '../components/ScreenContainer';

export function HomeScreen() {
  return (
    <ScreenContainer title="Home">
      <ActiveTabBanner />
    </ScreenContainer>
  );
}
