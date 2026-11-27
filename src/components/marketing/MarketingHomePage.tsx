/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Bell,
  Camera,
  CreditCard,
  FolderArchive,
  Home,
  Layers,
  LogIn,
  MessageSquare,
  Palette,
  Scan,
  Share2,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';
import heroEditorialImg from '../../assets/images/hero_editorial_fashion_1791978397716.jpg';

interface MarketingHomePageProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

/** Every signed-in workspace surface users can open after login. */
const APP_FUNCTIONS = [
  {
    icon: Home,
    title: 'Home',
    body: 'Daily styling brief, occasion ideas, curated looks, and shortcuts into every other workspace.',
  },
  {
    icon: MessageSquare,
    title: 'My Stylist',
    body: 'Chat or talk with your AI stylist. Get outfits for occasions, save chats, generate look visuals, and refine tone, name, and spoken voice.',
  },
  {
    icon: Camera,
    title: 'Fitting Room',
    body: 'Preview garments and full looks against your private photographs before you buy or wear them.',
  },
  {
    icon: ShoppingBag,
    title: 'Shop',
    body: 'Browse South African retailers, filter by category, compare prices in rand, save products, and Shop the Look from stylist outfits.',
  },
  {
    icon: FolderArchive,
    title: 'Wardrobe',
    body: 'Digitise clothes you own, organise by category, and mix pieces into outfits in the wardrobe studio.',
  },
  {
    icon: Layers,
    title: 'Capsule',
    body: 'Build a focused capsule wardrobe that covers seasons and occasions without endless buying.',
  },
  {
    icon: Sparkles,
    title: 'Discover looks',
    body: 'Explore editorial outfit inspiration, save favourites, and send pieces into Shop or the Fitting Room.',
  },
  {
    icon: Palette,
    title: 'Beauty Studio',
    body: 'Pair hairstyles, makeup, and nail direction with each outfit so finishing touches match the clothes.',
  },
  {
    icon: Users,
    title: 'Family styling',
    body: 'Manage family profiles, plan coordinated event outfits, and invite another adult account by email.',
  },
  {
    icon: UserRound,
    title: 'My Profile',
    body: 'Aesthetic DNA, sizes, colours, retailers, stylist persona, photographs, and silhouette preferences.',
  },
  {
    icon: Scan,
    title: 'Silhouette & photos',
    body: 'Upload styling photographs and estimate body silhouette so cuts and try-ons stay personal.',
  },
  {
    icon: CreditCard,
    title: 'Membership & credits',
    body: 'See your Free, Personal, or Family entitlement, test credit balance, credit history, and plan catalogue.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    body: 'Choose push, email, and styling alert preferences — including weather, wardrobe, and credit reminders.',
  },
  {
    icon: Share2,
    title: 'Share & privacy',
    body: 'Share looks with a friend, manage privacy controls, and keep account security on your signed-in profile.',
  },
];

export const MarketingHomePage: React.FC<MarketingHomePageProps> = ({
  onSignIn,
  onCreateAccount,
}) => {
  return (
    <div className="min-h-screen bg-[#F6F2EC] text-[#242326]">
      <header className="sticky top-0 z-40 bg-[#F6F2EC]/95 backdrop-blur-sm border-b border-[#242326]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <p className="font-serif text-xl sm:text-2xl tracking-tight">IStyleU</p>
          <div className="flex items-center gap-2">
            <Button
              variant="charcoal"
              size="sm"
              onClick={onSignIn}
              icon={<LogIn className="w-3.5 h-3.5" />}
              className="min-w-[7.5rem]"
            >
              Log in
            </Button>
            <Button variant="primary" size="sm" onClick={onCreateAccount}>
              Create account
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[78vh] sm:min-h-[86vh] overflow-hidden bg-[#E5CDBE]/35">
        <ImageWithFallback
          src={heroEditorialImg}
          alt="IStyleU fashion editorial"
          fallbackTitle="IStyleU"
          className="absolute inset-0 w-full h-full"
          imageClassName="object-cover object-[70%_center] sm:object-[center_20%] motion-safe:animate-[marketing-pan_32s_ease-in-out_infinite_alternate]"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F2EC] via-[#F6F2EC]/88 to-[#F6F2EC]/15 sm:via-[#F6F2EC]/72 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F2EC] via-transparent to-[#F6F2EC]/40 sm:to-[#F6F2EC]/20" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[78vh] sm:min-h-[86vh] flex flex-col justify-end sm:justify-center pb-14 sm:pb-20 pt-24">
          <div className="max-w-xl motion-safe:animate-[marketing-rise_0.9s_ease-out]">
            <p className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#242326] tracking-tight">
              IStyleU
            </p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl text-[#242326] leading-tight">
              Your private fashion, beauty, and shopping companion.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#5C585E] leading-relaxed">
              Sign in to use every workspace — stylist, fitting room, shop, wardrobe, capsule, beauty, family, and membership — saved to your account.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="charcoal"
                size="lg"
                onClick={onSignIn}
                icon={<LogIn className="w-4 h-4" />}
                className="sm:min-w-[12rem]"
              >
                Log in to your account
              </Button>
              <Button variant="primary" size="lg" onClick={onCreateAccount} icon={<ArrowRight className="w-4 h-4" />}>
                Create free account
              </Button>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-[#5C585E]">
              Already registered? Use <button type="button" onClick={onSignIn} className="font-semibold text-[#242326] underline underline-offset-2 cursor-pointer">Log in</button> in the header or the button above.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#242326]/8 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#866a40]">Everything in the app</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight">
              All IStyleU functions, in one signed-in workspace.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5C585E] leading-relaxed">
              After you log in, these are the tools available from the navigation and your profile. Nothing here requires a demonstration browse — create an account or log in to start.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {APP_FUNCTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3 sm:gap-4">
                  <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-[#E5CDBE]/45 text-[#9C6A61] flex items-center justify-center">
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl tracking-tight text-[#242326]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[#5C585E] leading-relaxed">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-[#242326] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361]">Account access</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl tracking-tight">
              Log in to open your stylist, wardrobe, and shop.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/75 leading-relaxed">
              Your style profile, photographs, credits, family links, and notification preferences stay on your account. Use Log in if you already have one, or Create account to begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              variant="gold"
              size="lg"
              onClick={onSignIn}
              icon={<LogIn className="w-4 h-4" />}
              className="sm:min-w-[11rem]"
            >
              Log in
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onCreateAccount}
              className="bg-white text-[#242326] border-0 sm:min-w-[11rem]"
            >
              Create account
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#242326]/8 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C585E]">
          <p className="font-serif text-base text-[#242326]">IStyleU</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onSignIn} className="font-medium text-[#242326] underline underline-offset-2 cursor-pointer">
              Log in
            </button>
            <button type="button" onClick={onCreateAccount} className="font-medium text-[#242326] underline underline-offset-2 cursor-pointer">
              Create account
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marketing-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marketing-pan {
          from { transform: scale(1.02) translate3d(0, 0, 0); }
          to { transform: scale(1.06) translate3d(-1%, 0, 0); }
        }
      `}</style>
    </div>
  );
};
