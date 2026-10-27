/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Camera,
  FolderArchive,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';
import heroEditorialImg from '../../assets/images/hero_editorial_fashion_1791978397716.jpg';
import dateNightImg from '../../assets/images/fashion_date_night_1791978397788.jpg';
import weddingGuestImg from '../../assets/images/fashion_wedding_guest_1791978399342.jpg';
import workOfficeImg from '../../assets/images/fashion_work_office_1791978399975.jpg';
import specialGalaImg from '../../assets/images/fashion_special_gala_1791978474099.jpg';
import holidayResortImg from '../../assets/images/fashion_holiday_resort_1791978473683.jpg';
import styleSportyImg from '../../assets/images/style_sporty_active_1791980329185.jpg';
import styleClassicImg from '../../assets/images/style_classic_tailored_1791980329558.jpg';
import styleMinimalImg from '../../assets/images/style_modern_minimal_1791980327769.jpg';
import styleTrendyImg from '../../assets/images/style_trendy_bold_1791980328578.jpg';

/** Clean stock imagery — several local full-body assets have AI limb artefacts. */
const shoppingLookImg =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80';
const weekendEaseImg =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80';
const familyTogetherImg =
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80';

interface MarketingHomePageProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onBrowseDemo: () => void;
}

const GALLERY = [
  { src: dateNightImg, label: 'Date night' },
  { src: workOfficeImg, label: 'Work & executive' },
  { src: weekendEaseImg, label: 'Weekend ease' },
  { src: weddingGuestImg, label: 'Celebrations' },
  { src: specialGalaImg, label: 'Evening polish' },
  { src: holidayResortImg, label: 'Holiday resort' },
  { src: styleClassicImg, label: 'Classic tailored' },
  { src: styleMinimalImg, label: 'Modern minimal' },
  { src: styleTrendyImg, label: 'Bold statements' },
  { src: styleSportyImg, label: 'Active layers' },
];

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: 'AI personal stylist',
    body: 'Describe an occasion, upload piece photos, or ask for a full look. The stylist builds outfits around your saved style profile, sizes, colours, and budget.',
    image: heroEditorialImg,
    alt: 'Editorial fashion consultation look',
  },
  {
    icon: FolderArchive,
    title: 'Digital wardrobe',
    body: 'Photograph or catalogue what you already own. Remix favourites into new outfits, spot wardrobe gaps, and plan capsules instead of buying blindly.',
    image: styleClassicImg,
    alt: 'Tailored wardrobe styling',
  },
  {
    icon: Camera,
    title: 'Virtual try-on previews',
    body: 'Preview how a dress, blazer, or full look may sit on your silhouette before you spend — so you shop with clearer confidence.',
    image: styleMinimalImg,
    alt: 'Modern minimal outfit preview',
  },
  {
    icon: ShoppingBag,
    title: 'South African shopping',
    body: 'Search looks across favourite SA retailers, compare prices, and save products that match your style profile and preferred price bands.',
    image: shoppingLookImg,
    alt: 'Shopping look inspiration with fashion bags',
  },
  {
    icon: Users,
    title: 'Family styling',
    body: 'Create profiles for family members, plan shared events, and invite another adult account by email so partners can accept or decline a link.',
    image: familyTogetherImg,
    alt: 'Family together for shared styling and occasions',
  },
  {
    icon: Sparkles,
    title: 'Beauty studio',
    body: 'Pair hairstyle, makeup, and nail direction with each outfit so your finishing touches match the clothes you choose.',
    image: dateNightImg,
    alt: 'Beauty-ready evening look',
  },
];

export const MarketingHomePage: React.FC<MarketingHomePageProps> = ({
  onSignIn,
  onCreateAccount,
  onBrowseDemo,
}) => {
  return (
    <div className="min-h-screen bg-[#F6F2EC] text-[#242326]">
      <header className="sticky top-0 z-40 bg-[#F6F2EC]/90 backdrop-blur-md border-b border-[#242326]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <p className="font-serif text-xl sm:text-2xl tracking-tight">
            MyStyle <span className="text-[10px] uppercase tracking-widest text-[#B49361] font-sans align-super">AI</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSignIn} className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button variant="primary" size="sm" onClick={onCreateAccount}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[78vh] sm:min-h-[86vh] overflow-hidden bg-[#E5CDBE]/35">
        <ImageWithFallback
          src={heroEditorialImg}
          alt="MyStyle AI fashion editorial"
          fallbackTitle="MyStyle AI"
          className="absolute inset-0 w-full h-full"
          imageClassName="object-cover object-[70%_center] sm:object-[center_20%] motion-safe:animate-[marketing-pan_32s_ease-in-out_infinite_alternate]"
          loading="eager"
          fetchPriority="high"
        />
        {/* Soft ivory wash — keeps the cream editorial visible instead of a charcoal scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F2EC] via-[#F6F2EC]/88 to-[#F6F2EC]/15 sm:via-[#F6F2EC]/72 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F2EC] via-transparent to-[#F6F2EC]/40 sm:to-[#F6F2EC]/20" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[78vh] sm:min-h-[86vh] flex flex-col justify-end sm:justify-center pb-14 sm:pb-20 pt-24">
          <div className="max-w-xl motion-safe:animate-[marketing-rise_0.9s_ease-out]">
            <p className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#242326] tracking-tight">
              MyStyle <span className="text-sm sm:text-base uppercase tracking-[0.28em] text-[#B49361] font-sans align-super">AI</span>
            </p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl text-[#242326] leading-tight">
              Your private fashion, beauty, and shopping companion.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#5C585E] leading-relaxed">
              Build a style profile, digitise your wardrobe, ask an AI stylist for looks, preview try-ons, shop South African retailers, and style your family — all in one calm, personal space.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="primary" size="lg" onClick={onCreateAccount} icon={<ArrowRight className="w-4 h-4" />}>
                Create free account
              </Button>
              <Button variant="secondary" size="lg" onClick={onSignIn}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#242326]/8 bg-white/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#866a40]">What MyStyle AI is</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight">
              A complete style operating system for real life.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5C585E] leading-relaxed">
              MyStyle AI is not a single filter or feed. It is a signed-in workspace that remembers your tastes, sizes, photographs, wardrobe pieces, family members, and shopping preferences — then uses that profile to recommend outfits, beauty finishes, and products you can actually wear.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
            {GALLERY.map((item) => (
              <figure
                key={item.label}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#E5CDBE]/25"
              >
                <ImageWithFallback
                  src={item.src}
                  alt={item.label}
                  fallbackTitle={item.label}
                  className="w-full h-full"
                  imageClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 bg-gradient-to-t from-[#242326]/80 to-transparent">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-white/95">
                    {item.label}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14 sm:space-y-20">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61]">Exactly what you can do</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight">
            From closet to occasion, step by step.
          </h2>
        </div>

        {CAPABILITIES.map((item, index) => {
          const Icon = item.icon;
          const reverse = index % 2 === 1;
          return (
            <article
              key={item.title}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center ${
                reverse ? '' : ''
              }`}
            >
              <div className={`lg:col-span-6 ${reverse ? 'lg:order-2' : ''}`}>
                <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-[#E5CDBE]/20 border border-[#242326]/8">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.alt}
                    fallbackTitle={item.title}
                    className="w-full h-full"
                    imageClassName="object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
              </div>
              <div className={`lg:col-span-6 ${reverse ? 'lg:order-1' : ''}`}>
                <div className="w-11 h-11 rounded-xl bg-[#E5CDBE]/45 text-[#9C6A61] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm sm:text-base text-[#5C585E] leading-relaxed">{item.body}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="bg-[#242326] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361]">Built for privacy and South Africa</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl tracking-tight">
              Your photographs and wardrobe stay on your account.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/75 leading-relaxed">
              Sign in to keep a private style profile, silhouette scan, wardrobe items, beauty looks, and family links. Shopping suggestions lean on South African retailers and rand pricing so recommendations stay local and practical.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li className="flex gap-2"><span className="text-[#B49361]">•</span> Adult accounts with email verification and password recovery</li>
              <li className="flex gap-2"><span className="text-[#B49361]">•</span> Family link invites accepted or declined by the other person</li>
              <li className="flex gap-2"><span className="text-[#B49361]">•</span> Free exploration, with Personal and Family membership paths</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[specialGalaImg, holidayResortImg, styleTrendyImg, workOfficeImg].map((src, index) => (
              <div key={index} className={`relative overflow-hidden rounded-2xl ${index % 2 === 1 ? 'mt-6' : ''}`}>
                <ImageWithFallback
                  src={src}
                  alt="MyStyle lifestyle look"
                  fallbackTitle="Look"
                  className="aspect-[3/4] w-full"
                  imageClassName="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
        <p className="font-serif text-3xl sm:text-4xl tracking-tight">
          Ready to dress with intention?
        </p>
        <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-[#5C585E] leading-relaxed">
          Create an account to save your style profile, or browse the labelled demonstration if you want a first look without signing in.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="primary" size="lg" onClick={onCreateAccount} icon={<ArrowRight className="w-4 h-4" />}>
            Create account
          </Button>
          <Button variant="secondary" size="lg" onClick={onSignIn}>
            Sign in
          </Button>
          <Button variant="ghost" size="lg" onClick={onBrowseDemo}>
            Browse demonstration
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#242326]/8 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C585E]">
          <p className="font-serif text-base text-[#242326]">
            MyStyle <span className="text-[9px] uppercase tracking-widest text-[#B49361] font-sans">AI</span>
          </p>
          <p>Personal fashion, beauty, wardrobe, family styling, and SA shopping.</p>
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
