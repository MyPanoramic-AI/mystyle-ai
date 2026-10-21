/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BeautyCategory,
  CompleteBeautyLook,
  HairstyleItem,
  HairColorItem,
  MakeupItem,
  NailItem,
  BeautyProductItem,
  SavedBeautyLook,
} from '../../types/beauty';
import {
  DEMO_COMPLETE_LOOKS,
  DEMO_HAIRSTYLES,
  DEMO_HAIR_COLOURS,
  DEMO_MAKEUP_LOOKS,
  DEMO_NAILS,
  BEAUTY_PRODUCTS,
} from '../../data/beautyData';
import {
  getSavedBeautyLooks,
  saveBeautyLook,
  removeSavedBeautyLook,
  getBeautyShoppingBag,
  addProductToBeautyBag,
  removeProductFromBeautyBag,
} from '../../services/beautyService';
import { beautyStatus, rankByPreference, type AccountBeauty, type AccountBeautyLook, type BeautyPreferenceRecord } from '../../services/beautyAccount';
import type { AccountWardrobe } from '../../services/wardrobeAccount';
import { BeautyLookCard } from './BeautyLookCard';
import { BeautyItemCard } from './BeautyItemCard';
import { BeautyDetailModal } from './BeautyDetailModal';
import {
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  Bookmark,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface BeautyStudioScreenProps {
  onBack: () => void;
  onSendToShop: (products: BeautyProductItem[], outfitTitle?: string) => void;
  onAskStylist: (prompt: string) => void;
  initialTab?: BeautyCategory | 'saved' | 'bag';
  accountBeauty?: AccountBeauty | null;
  accountWardrobe?: AccountWardrobe | null;
}

export const BeautyStudioScreen: React.FC<BeautyStudioScreenProps> = ({
  onBack,
  onSendToShop,
  onAskStylist,
  initialTab = 'complete-looks',
  accountBeauty = null,
  accountWardrobe = null,
}) => {
  const [activeTab, setActiveTab] = useState<BeautyCategory | 'saved' | 'bag'>(initialTab);
  const [savedLooks, setSavedLooks] = useState<SavedBeautyLook[]>([]);
  const [accountLooks, setAccountLooks] = useState<AccountBeautyLook[]>([]);
  const [preferences, setPreferences] = useState<BeautyPreferenceRecord | null>(null);
  const [outfitChoices, setOutfitChoices] = useState<{ id: string; title: string }[]>([]);
  const [planChoices, setPlanChoices] = useState<{ id: string; title: string }[]>([]);
  const [beautyBag, setBeautyBag] = useState<BeautyProductItem[]>([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState<
    CompleteBeautyLook | HairstyleItem | HairColorItem | MakeupItem | NailItem | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(Boolean(accountBeauty));
  const [lookName, setLookName] = useState('Wedding Guest Look');
  const [lookOccasion, setLookOccasion] = useState('Wedding');
  const [lookHair, setLookHair] = useState(DEMO_HAIRSTYLES[0]?.id ?? '');
  const [lookColour, setLookColour] = useState(DEMO_HAIR_COLOURS[0]?.id ?? '');
  const [lookMakeup, setLookMakeup] = useState(DEMO_MAKEUP_LOOKS[0]?.id ?? '');
  const [lookNails, setLookNails] = useState(DEMO_NAILS[0]?.id ?? '');
  const [lookNotes, setLookNotes] = useState('');

  useEffect(() => {
    if (!accountBeauty) {
      setSavedLooks(getSavedBeautyLooks());
      setBeautyBag(getBeautyShoppingBag());
      return;
    }
    let cancelled = false;
    setLoadingAccount(true);
    void Promise.all([
      accountBeauty.loadLooks(),
      accountBeauty.loadPreferences(),
      accountWardrobe ? accountWardrobe.load() : Promise.resolve(null),
    ]).then(([looks, prefs, wardrobe]) => {
      if (cancelled) return;
      setAccountLooks(looks);
      setPreferences(prefs);
      setOutfitChoices(wardrobe ? wardrobe.outfits.map((outfit) => ({ id: outfit.id, title: outfit.title })) : []);
      setPlanChoices(wardrobe ? wardrobe.events.map((event) => ({ id: event.id, title: event.title })) : []);
      setLoadingAccount(false);
    }).catch((error) => {
      if (cancelled) return;
      setToastMessage(beautyStatus(error));
      setLoadingAccount(false);
    });
    return () => {
      cancelled = true;
    };
  }, [accountBeauty, accountWardrobe]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveLook = (look: CompleteBeautyLook) => {
    if (accountBeauty) {
      const already = accountLooks.some((item) => item.sourceKey === look.id);
      if (already) {
        showToast('That inspiration is already saved.');
        return;
      }
      void accountBeauty.saveLook(accountBeauty.completeBody(look)).then((saved) => {
        setAccountLooks((current) => [saved, ...current]);
        showToast('Look saved successfully.');
      }).catch((error) => showToast(beautyStatus(error)));
      return;
    }
    const isAlreadySaved = savedLooks.some((s) => s.look?.id === look.id);
    if (isAlreadySaved) {
      const match = savedLooks.find((s) => s.look?.id === look.id);
      if (match) {
        removeSavedBeautyLook(match.id);
        setSavedLooks(getSavedBeautyLooks());
        showToast('Removed from saved beauty looks');
      }
    } else {
      saveBeautyLook(look);
      setSavedLooks(getSavedBeautyLooks());
      showToast(`Saved "${look.title}" to your Beauty Collection`);
    }
  };

  const rememberPreference = (next: BeautyPreferenceRecord) => {
    if (!accountBeauty) return;
    void accountBeauty.savePreferences(next).then(setPreferences).catch((error) => showToast(beautyStatus(error)));
  };

  const handleSaveItem = (item: HairstyleItem | HairColorItem | MakeupItem | NailItem) => {
    if (!accountBeauty) return;
    const sourceKey = `${item.category}:${item.id}`;
    if (accountLooks.some((saved) => saved.sourceKey === sourceKey)) {
      showToast('That inspiration is already saved.');
      return;
    }
    void accountBeauty.saveLook(accountBeauty.inspirationBody(item)).then((saved) => {
      setAccountLooks((current) => [saved, ...current]);
      if (preferences) {
        const next = { ...preferences };
        if (item.category === 'hairstyles') next.hairstyles = [...new Set([...next.hairstyles, item.texture])];
        if (item.category === 'hair-colours') next.hairColours = [...new Set([...next.hairColours, item.shadeFamily])];
        if (item.category === 'makeup') next.makeupStyles = [...new Set([...next.makeupStyles, item.style])];
        if (item.category === 'nails') {
          next.nailStyles = [...new Set([...next.nailStyles, item.style])];
          next.nailColours = [...new Set([...next.nailColours, item.title])];
        }
        rememberPreference(next);
      }
      showToast('Look saved successfully.');
    }).catch((error) => showToast(beautyStatus(error)));
  };

  const handleSaveComposedLook = () => {
    if (!accountBeauty) return;
    const hair = DEMO_HAIRSTYLES.find((item) => item.id === lookHair);
    const colour = DEMO_HAIR_COLOURS.find((item) => item.id === lookColour);
    const makeup = DEMO_MAKEUP_LOOKS.find((item) => item.id === lookMakeup);
    const nails = DEMO_NAILS.find((item) => item.id === lookNails);
    if (!lookName.trim() || !hair || !colour || !makeup || !nails) {
      showToast('Unable to save look.');
      return;
    }
    void accountBeauty.saveLook({
      category: 'complete-looks',
      title: lookName.trim(),
      occasion: lookOccasion,
      notes: lookNotes || null,
      sourceKey: `custom:${lookName.trim().toLowerCase()}`,
      sourceLabel: 'Customer selection',
      parts: [
        { kind: 'hairstyle', title: hair.title, styleLabel: hair.texture },
        { kind: 'hair-colour', title: colour.title, colourLabel: colour.shadeFamily },
        { kind: 'makeup', title: makeup.title, styleLabel: makeup.style },
        { kind: 'nails', title: nails.title, styleLabel: nails.shape },
      ],
    }).then((saved) => {
      setAccountLooks((current) => [saved, ...current]);
      showToast('Look saved successfully.');
      setActiveTab('saved');
    }).catch((error) => showToast(beautyStatus(error)));
  };

  const removeAccountLook = (id: string) => {
    if (!accountBeauty || !window.confirm('Remove this saved beauty look?')) return;
    void accountBeauty.deleteLook(id).then(() => {
      setAccountLooks((current) => current.filter((item) => item.id !== id));
    }).catch((error) => showToast(beautyStatus(error)));
  };

  const saveAccountNotes = (look: AccountBeautyLook, notes: string) => {
    if (!accountBeauty) return;
    void accountBeauty.updateLook(look.id, { notes }).then((saved) => {
      setAccountLooks((current) => current.map((item) => item.id === saved.id ? saved : item));
      showToast('Changes saved.');
    }).catch((error) => showToast(beautyStatus(error)));
  };

  const attachOutfit = (look: AccountBeautyLook, value: string) => {
    if (!accountBeauty || !value) return;
    const [kind, id] = value.split(':');
    const action = kind === 'plan' ? accountBeauty.linkPlan(look.id, id) : accountBeauty.linkOutfit(look.id, id);
    void action.then((saved) => {
      setAccountLooks((current) => current.map((item) => item.id === saved.id ? saved : item));
      showToast('Changes saved.');
    }).catch((error) => showToast(beautyStatus(error)));
  };

  const handleAddToBag = (product: BeautyProductItem) => {
    if (accountBeauty) {
      setBeautyBag((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
      showToast('Added to the demonstration list. These prices are not verified shop prices.');
      return;
    }
    addProductToBeautyBag(product);
    setBeautyBag(getBeautyShoppingBag());
    showToast(`Added ${product.name} to Beauty Shopping Bag`);
  };

  const handleRemoveFromBag = (productId: string) => {
    if (accountBeauty) {
      setBeautyBag((current) => current.filter((item) => item.id !== productId));
      return;
    }
    removeProductFromBeautyBag(productId);
    setBeautyBag(getBeautyShoppingBag());
    showToast('Removed item from bag');
  };

  const handleSendLookToShop = (look: CompleteBeautyLook) => {
    onSendToShop(look.curatedProducts, look.title);
  };

  const handleSendBagToShop = () => {
    if (beautyBag.length === 0) return;
    onSendToShop(beautyBag, 'Curated Beauty Essentials');
  };

  const bagTotalZar = beautyBag.reduce((sum, p) => sum + p.priceZar, 0);
  const savedCount = accountBeauty ? accountLooks.length : savedLooks.length;
  const hairstyles = rankByPreference(DEMO_HAIRSTYLES, preferences?.hairstyles ?? [], (item) => `${item.title} ${item.texture}`);
  const hairColours = rankByPreference(DEMO_HAIR_COLOURS, preferences?.hairColours ?? [], (item) => `${item.title} ${item.shadeFamily}`);
  const makeupLooks = rankByPreference(DEMO_MAKEUP_LOOKS, preferences?.makeupStyles ?? [], (item) => `${item.title} ${item.style}`);
  const nailLooks = rankByPreference(DEMO_NAILS, preferences?.nailStyles ?? [], (item) => `${item.title} ${item.style}`);

  return (
    <div className="min-h-screen bg-[#FBF8F5] pb-24">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#242326] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-[#B49361]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-[#242326]/8 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-[#5C585E] hover:text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#B49361] uppercase font-semibold">
                  Personal Consultation
                </span>
                <span className="text-[10px] bg-[#E5CDBE]/40 text-[#9C6A61] px-2 py-0.5 rounded-md font-medium">
                  Beauty Studio
                </span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
                AI Beauty Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('saved')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                activeTab === 'saved'
                  ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                  : 'bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#242326]/30'
              }`}
              title="Saved Beauty Looks"
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B49361] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bag')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                activeTab === 'bag'
                  ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                  : 'bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#242326]/30'
              }`}
              title="Beauty Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {beautyBag.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#9C6A61] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {beautyBag.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-1">
          {[
            { id: 'complete-looks', label: 'Complete Looks' },
            { id: 'hairstyles', label: 'Hairstyles' },
            { id: 'hair-colours', label: 'Hair Colours' },
            { id: 'makeup', label: 'Makeup & Glow' },
            { id: 'nails', label: 'Nail Art' },
            { id: 'saved', label: `Saved (${savedCount})` },
            { id: 'bag', label: `Shopping Bag (${beautyBag.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#242326] text-white shadow-xs'
                    : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326] hover:bg-[#E5CDBE]/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <p className="mb-4 rounded-2xl border border-[#B49361]/30 bg-[#E5CDBE]/30 px-4 py-3 text-xs text-[#242326]">
          {accountBeauty
            ? 'These cards are editorial inspiration, not a makeover of you. Preview generation is not yet available. Saved selections stay on this account.'
            : 'Demonstration saves stay in this browser. They are not part of a saved account, and these photographs are not a makeover.'}
        </p>
        {/* TAB 1: Complete Looks */}
        {activeTab === 'complete-looks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#242326]">
                  Curated Complete Ensembles
                </h2>
                <p className="text-xs text-[#5C585E]">
                  Harmonised hair, makeup, and nail directions paired with South African occasions and wardrobe palettes.
                </p>
              </div>
              <button
                onClick={() =>
                  onAskStylist(
                    'I need a complete head-to-toe beauty look for an upcoming formal dinner in Cape Town. Which makeup palette and hairstyle would best complement an ivory slip dress?'
                  )
                }
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                <span>Custom Beauty Consultation</span>
              </button>
            </div>

            {accountBeauty && (
              <form
                className="bg-white rounded-2xl border border-[#242326]/8 p-4 sm:p-5 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSaveComposedLook();
                }}
              >
                <h3 className="font-serif text-base font-semibold text-[#242326]">Save a coordinated look</h3>
                <p className="text-xs text-[#5C585E]">Choose inspiration styles. This stores your selection. It does not generate a photograph.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={lookName} onChange={(event) => setLookName(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Look name" />
                  <input value={lookOccasion} onChange={(event) => setLookOccasion(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Occasion" />
                  <select value={lookHair} onChange={(event) => setLookHair(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Hairstyle">
                    {DEMO_HAIRSTYLES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                  <select value={lookColour} onChange={(event) => setLookColour(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Hair colour">
                    {DEMO_HAIR_COLOURS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                  <select value={lookMakeup} onChange={(event) => setLookMakeup(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Makeup">
                    {DEMO_MAKEUP_LOOKS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                  <select value={lookNails} onChange={(event) => setLookNails(event.target.value)} className="rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" aria-label="Nails">
                    {DEMO_NAILS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </div>
                <textarea value={lookNotes} onChange={(event) => setLookNotes(event.target.value)} placeholder="Optional notes" className="w-full rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm" />
                <button type="submit" className="px-4 py-2 bg-[#9C6A61] text-white text-xs font-medium rounded-xl cursor-pointer">Save look</button>
              </form>
            )}

            <div className="space-y-6">
              {DEMO_COMPLETE_LOOKS.map((look) => (
                <BeautyLookCard
                  key={look.id}
                  look={look}
                  isSaved={accountBeauty ? accountLooks.some((item) => item.sourceKey === look.id) : savedLooks.some((s) => s.look?.id === look.id)}
                  onSelect={(l) => setSelectedItemForModal(l)}
                  onSave={handleSaveLook}
                  onSendToShop={handleSendLookToShop}
                  onAskStylist={(l) =>
                    onAskStylist(
                      `How can I adapt the "${l.title}" beauty look for my personal undertone and upcoming event?`
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Hairstyles */}
        {activeTab === 'hairstyles' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242326]">
                Hairstyle Architectures
              </h2>
              <p className="text-xs text-[#5C585E]">
                From sleek gala chignons to protective goddess braids and modern blowouts.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {hairstyles.map((hair) => (
                <BeautyItemCard
                  key={hair.id}
                  item={hair}
                  isSaved={accountLooks.some((saved) => saved.sourceKey === `hairstyles:${hair.id}`)}
                  onSave={accountBeauty ? handleSaveItem : undefined}
                  onInspect={(it) => setSelectedItemForModal(it)}
                  onAskStylist={(it) =>
                    onAskStylist(
                      `Will the "${it.title}" hairstyle work well with my face shape and an off-shoulder neckline?`
                    )
                  }
                  onAddToBag={(it) => {
                    if (it.productsUsed && it.productsUsed[0]) {
                      handleAddToBag(it.productsUsed[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Hair Colours */}
        {activeTab === 'hair-colours' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242326]">
                Hair Colour & Dimension
              </h2>
              <p className="text-xs text-[#5C585E]">
                Luminous balayage, deep obsidian glazes, and spiced cinnamon undertones.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {hairColours.map((color) => (
                <BeautyItemCard
                  key={color.id}
                  item={color}
                  isSaved={accountLooks.some((saved) => saved.sourceKey === `hair-colours:${color.id}`)}
                  onSave={accountBeauty ? handleSaveItem : undefined}
                  onInspect={(it) => setSelectedItemForModal(it)}
                  onAskStylist={(it) =>
                    onAskStylist(
                      `Would "${it.title}" complement warm olive skin undertones and autumn wardrobe staples?`
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Makeup */}
        {activeTab === 'makeup' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242326]">
                Makeup & Complexion Glow
              </h2>
              <p className="text-xs text-[#5C585E]">
                High-finish editorial palettes, velvet statement lips, and diffused evening glam.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {makeupLooks.map((makeup) => (
                <BeautyItemCard
                  key={makeup.id}
                  item={makeup}
                  isSaved={accountLooks.some((saved) => saved.sourceKey === `makeup:${makeup.id}`)}
                  onSave={accountBeauty ? handleSaveItem : undefined}
                  onInspect={(it) => setSelectedItemForModal(it)}
                  onAskStylist={(it) =>
                    onAskStylist(
                      `What South African foundation and lip formula best recreates "${it.title}"?`
                    )
                  }
                  onAddToBag={(it) => {
                    if (it.productsUsed && it.productsUsed[0]) {
                      handleAddToBag(it.productsUsed[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Nails */}
        {activeTab === 'nails' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242326]">
                Nail Architecture & Lacquers
              </h2>
              <p className="text-xs text-[#5C585E]">
                Glazed cashmere chromes, Western Cape pinotage merlots, and modern micro-French details.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {nailLooks.map((nail) => (
                <BeautyItemCard
                  key={nail.id}
                  item={nail}
                  isSaved={accountLooks.some((saved) => saved.sourceKey === `nails:${nail.id}`)}
                  onSave={accountBeauty ? handleSaveItem : undefined}
                  onInspect={(it) => setSelectedItemForModal(it)}
                  onAskStylist={(it) =>
                    onAskStylist(
                      `Which nail design between "${nail.title}" and a nude chrome matches best with gold jewelry?`
                    )
                  }
                  onAddToBag={(it) => {
                    if (it.productsUsed && it.productsUsed[0]) {
                      handleAddToBag(it.productsUsed[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Saved Looks */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#242326]">
                Your Saved Beauty Looks ({savedCount})
              </h2>
              <p className="text-xs text-[#5C585E]">
                {accountBeauty ? 'Selections saved on this account. Preview generation is not yet available.' : 'Curated beauty ensembles saved for your upcoming galas, weddings, and presentations.'}
              </p>
            </div>

            {loadingAccount ? <p className="text-sm text-[#5C585E]">Loading saved looks.</p> : null}

            {savedCount === 0 && !loadingAccount ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#242326]/8 p-8">
                <Bookmark className="w-8 h-8 text-[#5C585E]/40 mx-auto mb-2" />
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  No beauty looks saved
                </h3>
                <p className="text-xs text-[#5C585E] mt-1 max-w-sm mx-auto">
                  Save your first look from the inspiration cards.
                </p>
                <button
                  onClick={() => setActiveTab('complete-looks')}
                  className="mt-4 px-4 py-2 bg-[#9C6A61] text-white text-xs font-medium rounded-xl hover:bg-[#8A5B53] cursor-pointer"
                >
                  Explore Complete Looks
                </button>
              </div>
            ) : null}

            {accountBeauty && accountLooks.length > 0 ? (
              <div className="space-y-4">
                {accountLooks.map((item) => (
                  <article key={item.id} className="bg-white rounded-2xl border border-[#242326]/8 p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#9C6A61]">{item.category}{item.occasion ? ` · ${item.occasion}` : ''}</p>
                        <h3 className="font-serif text-lg text-[#242326]">{item.title}</h3>
                        {item.parts.length > 0 ? <p className="text-xs text-[#5C585E] mt-1">{item.parts.map((part) => part.title).join(' · ')}</p> : null}
                        <p className="text-[11px] text-[#5C585E] mt-1">{item.sourceLabel || 'Editorial inspiration'}</p>
                      </div>
                      <button type="button" onClick={() => removeAccountLook(item.id)} className="text-xs text-[#9C6A61] cursor-pointer">Remove</button>
                    </div>
                    <label className="block text-xs text-[#5C585E]">
                      Notes
                      <input
                        defaultValue={item.notes || ''}
                        onBlur={(event) => {
                          if (event.target.value !== (item.notes || '')) saveAccountNotes(item, event.target.value);
                        }}
                        className="mt-1 block w-full rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#242326]"
                      />
                    </label>
                    <label className="block text-xs text-[#5C585E]">
                      Link one of your outfits or plans
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          attachOutfit(item, event.target.value);
                          event.target.value = '';
                        }}
                        className="mt-1 block w-full rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#242326]"
                      >
                        <option value="">Choose</option>
                        {outfitChoices.map((outfit) => <option key={outfit.id} value={`outfit:${outfit.id}`}>{outfit.title}</option>)}
                        {planChoices.map((plan) => <option key={plan.id} value={`plan:${plan.id}`}>{plan.title}</option>)}
                      </select>
                    </label>
                    {item.links.length > 0 ? <p className="text-xs text-[#5C585E]">{item.links.length} outfit link{item.links.length === 1 ? '' : 's'} saved</p> : null}
                  </article>
                ))}
              </div>
            ) : null}

            {!accountBeauty && savedLooks.length > 0 ? (
              <div className="space-y-4">
                {savedLooks.map((item) => {
                  if (item.look) {
                    return (
                      <div key={item.id} className="relative">
                        <BeautyLookCard
                          look={item.look}
                          isSaved={true}
                          onSelect={(l) => setSelectedItemForModal(l)}
                          onSave={handleSaveLook}
                          onSendToShop={handleSendLookToShop}
                          onAskStylist={(l) =>
                            onAskStylist(
                              `Help me personalize this saved look: "${l.title}". What shade nuances work best?`
                            )
                          }
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 7: Beauty Shopping Bag */}
        {activeTab === 'bag' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#242326]">
                  Beauty Shopping Bag ({beautyBag.length})
                </h2>
                <p className="text-xs text-[#5C585E]">
                  {accountBeauty
                    ? 'Demonstration list only. These names and prices are not verified shop listings.'
                    : 'Cosmetics, hair treatments, and luxury nail lacquers curated from South African retailers.'}
                </p>
              </div>
              {beautyBag.length > 0 && (
                <button
                  onClick={handleSendBagToShop}
                  className="px-4 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Send All to Smart Shopping</span>
                </button>
              )}
            </div>

            {beautyBag.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#242326]/8 p-8">
                <ShoppingBag className="w-8 h-8 text-[#5C585E]/40 mx-auto mb-2" />
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Your beauty bag is currently empty
                </h3>
                <p className="text-xs text-[#5C585E] mt-1 max-w-sm mx-auto">
                  Browse hairstyles, makeup, and curated ensembles to add recommended products from Woolworths Beauty and Arc Store.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#242326]/8 overflow-hidden divide-y divide-[#242326]/6 shadow-xs">
                {beautyBag.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#F6F2EC]"
                      />
                      <div>
                        <span className="text-[10px] font-mono text-[#9C6A61] uppercase block font-semibold">
                          {prod.brand} • {prod.productType.replace('-', ' ')}
                        </span>
                        <h4 className="text-xs font-semibold text-[#242326]">{prod.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C585E]">
                          <span>{prod.retailer}</span>
                          {prod.shade && (
                            <>
                              <span>•</span>
                              <span>Shade: {prod.shade}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-[#242326]">
                        Demo R{prod.priceZar.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRemoveFromBag(prod.id)}
                        className="p-1.5 text-[#5C585E] hover:text-[#9C6A61] transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-[#F6F2EC]/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#5C585E]">Demonstration estimate:</span>
                    <div className="text-base font-bold text-[#242326]">Demo R{bagTotalZar.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={handleSendBagToShop}
                    className="px-4 py-2 bg-[#9C6A61] text-white text-xs font-medium rounded-xl hover:bg-[#8A5B53] cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open demonstration shop</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Inspector */}
      <BeautyDetailModal
        item={selectedItemForModal}
        isOpen={Boolean(selectedItemForModal)}
        onClose={() => setSelectedItemForModal(null)}
        onAskStylist={onAskStylist}
        onAddToBag={handleAddToBag}
        onSendLookToShop={handleSendLookToShop}
      />
    </div>
  );
};
