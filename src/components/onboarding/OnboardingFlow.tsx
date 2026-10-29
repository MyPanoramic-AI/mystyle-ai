/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserProfile, TemporaryPhotos, PersonalDetails, ClothingSizes, ColourPreferences, ShoppingPreferences, ShoePreferences, StylistPersona } from '../../types';
import { Step1Welcome } from './Step1Welcome';
import { Step2PersonalDetails } from './Step2PersonalDetails';
import { Step3ClothingSizes } from './Step3ClothingSizes';
import { Step4PersonalStyle } from './Step4PersonalStyle';
import { Step5ColoursPreferences } from './Step5ColoursPreferences';
import { Step6ShoppingPreferences } from './Step6ShoppingPreferences';
import { Step7StylistPersona } from './Step7StylistPersona';
import { Step7Photographs } from './Step7Photographs';
import { Step8Completion } from './Step8Completion';
import { ArrowLeft, X } from 'lucide-react';
import { ONBOARDING_STEP_COUNT } from './onboardingSteps';

const ONBOARDING_STEP_KEY = 'mystyle_onboarding_step';

function readStoredStep(): number {
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_STEP_KEY);
    const value = raw ? Number(raw) : 1;
    if (Number.isInteger(value) && value >= 1 && value <= ONBOARDING_STEP_COUNT) return value;
  } catch {
    // Ignore private-mode failures.
  }
  return 1;
}

interface OnboardingFlowProps {
  initialProfile: UserProfile;
  initialPhotos?: TemporaryPhotos;
  onComplete: (profile: UserProfile, photos: TemporaryPhotos) => void | Promise<void>;
  onExit: () => void | Promise<void>;
  saveError?: string | null;
  usesAccount?: boolean;
  storageConsentGranted?: boolean;
  onGrantStorageConsent?: () => Promise<void>;
  onUploadPhotoSlot?: (slot: import('../../services/accountApi').ProfilePhotoSlot, imageBase64: string) => Promise<{ mediaId: string }>;
  onDeletePhotoSlot?: (slot: import('../../services/accountApi').ProfilePhotoSlot) => Promise<void>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  initialPhotos = {},
  onComplete,
  onExit,
  saveError,
  usesAccount = false,
  storageConsentGranted = false,
  onGrantStorageConsent,
  onUploadPhotoSlot,
  onDeletePhotoSlot,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(() => readStoredStep());
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [photos, setPhotos] = useState<TemporaryPhotos>(initialPhotos);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const totalSteps = ONBOARDING_STEP_COUNT;

  useEffect(() => {
    try {
      window.sessionStorage.setItem(ONBOARDING_STEP_KEY, String(currentStep));
    } catch {
      // Ignore private-mode failures.
    }
  }, [currentStep]);

  const clearStoredStep = () => {
    try {
      window.sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {
      // Ignore private-mode failures.
    }
  };

  const handlePersonalDetails = (data: PersonalDetails) => {
    setProfile((prev) => ({ ...prev, personal: data }));
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSizes = (data: ClothingSizes, shoePreferences: ShoePreferences) => {
    setProfile((prev) => ({ ...prev, sizes: data, shoePreferences }));
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStyles = (styles: string[]) => {
    setProfile((prev) => ({ ...prev, styles }));
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleColours = (data: ColourPreferences) => {
    setProfile((prev) => ({ ...prev, colours: data }));
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShopping = (data: ShoppingPreferences) => {
    setProfile((prev) => ({ ...prev, shopping: data }));
    setCurrentStep(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStylistPersona = (stylistPersona: StylistPersona) => {
    setProfile((prev) => ({ ...prev, stylistPersona }));
    setCurrentStep(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotographs = () => {
    setCurrentStep(9);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = async () => {
    if (finishing) return;
    const finished: UserProfile = {
      ...profile,
      isOnboardingCompleted: true,
      onboardingStatus: 'completed',
      lastUpdated: new Date().toISOString(),
    };
    setFinishing(true);
    setFinishError(null);
    try {
      await onComplete(finished, photos);
      clearStoredStep();
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : 'The profile could not be saved.');
    } finally {
      setFinishing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      clearStoredStep();
      void onExit();
    }
  };

  const handleSkipCurrentStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2EC] flex flex-col">
      {/* Onboarding Header */}
      <header className="sticky top-0 z-40 bg-[#F6F2EC]/90 backdrop-blur-md border-b border-[#242326]/8 py-3 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Back Action */}
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              aria-label="Previous step"
              className="flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <div className="font-serif text-lg font-bold text-[#242326]">
              MyStyle <span className="text-[10px] uppercase tracking-widest text-[#B49361] font-sans">AI</span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex-1 max-w-xs mx-auto text-center px-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#5C585E] mb-1.5">
              <span>Personal Style Setup</span>
              <span className="font-mono">{currentStep} of {totalSteps}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5CDBE]/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#9C6A61] transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Skip / Exit Action */}
          <button
            onClick={() => {
              clearStoredStep();
              void onExit();
            }}
            className="flex items-center gap-1 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer py-1"
          >
            <span className="hidden sm:inline">Skip to App</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Step Body */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full flex flex-col justify-center">
        {currentStep === 1 && (
          <Step1Welcome
            onNext={() => setCurrentStep(2)}
            onSkip={() => {
              clearStoredStep();
              void onExit();
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2PersonalDetails
            initialData={profile.personal}
            onContinue={handlePersonalDetails}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 3 && (
          <Step3ClothingSizes
            initialData={profile.sizes}
            initialShoePreferences={profile.shoePreferences}
            onContinue={handleSizes}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 4 && (
          <Step4PersonalStyle
            initialStyles={profile.styles}
            onContinue={handleStyles}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 5 && (
          <Step5ColoursPreferences
            initialData={profile.colours}
            onContinue={handleColours}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 6 && (
          <Step6ShoppingPreferences
            initialData={profile.shopping}
            onContinue={handleShopping}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 7 && (
          <Step7StylistPersona
            initialPersona={profile.stylistPersona}
            onContinue={handleStylistPersona}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
          />
        )}

        {currentStep === 8 && (
          <Step7Photographs
            photos={photos}
            onUpdatePhotos={setPhotos}
            onContinue={handlePhotographs}
            onBack={handleBack}
            onSkip={handleSkipCurrentStep}
            usesAccount={usesAccount}
            storageConsentGranted={storageConsentGranted}
            onGrantStorageConsent={onGrantStorageConsent}
            onUploadSlot={onUploadPhotoSlot}
            onDeleteSlot={onDeletePhotoSlot}
          />
        )}

        {currentStep === 9 && (
          <Step8Completion
            profile={profile}
            photos={photos}
            onExplore={() => { void handleFinish(); }}
          />
        )}
        {finishing ? <p className="mt-4 text-sm text-[#5C585E]">Saving your style profile…</p> : null}
        {finishError || saveError ? <p className="mt-4 text-sm text-[#9C6A61]" role="alert">{finishError || saveError}</p> : null}
      </main>
    </div>
  );
};
