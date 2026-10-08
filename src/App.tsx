import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { LightboxProvider } from './components/Photo';
import { DevBanner } from './components/DevBanner';
import { Hero } from './sections/Hero';
import { IntroSection } from './sections/IntroSection';
import { PhotoStory } from './sections/PhotoStory';
import { DetailsSection } from './sections/DetailsSection';
import { RsvpSection } from './sections/RsvpSection';
import { WishlistSection } from './sections/WishlistSection';
import { ClosingScene } from './sections/ClosingScene';

export default function App() {
  return (
    // reducedMotion="user": respekterer «reduser bevegelse» i telefonens innstillinger.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <LightboxProvider>
          {import.meta.env.DEV && <DevBanner />}
          <Hero nextSectionId="atlas" />
          <main>
            <IntroSection id="atlas" />
            <PhotoStory />
            <DetailsSection />
            <RsvpSection id="svar" />
            <WishlistSection />
          </main>
          <ClosingScene />
        </LightboxProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
