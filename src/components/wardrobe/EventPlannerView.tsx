/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlannedEvent, WardrobeOutfit, WardrobeItem } from '../../types/wardrobe';
import {
  Calendar,
  CloudSun,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Briefcase,
  X,
} from 'lucide-react';

interface EventPlannerViewProps {
  events: PlannedEvent[];
  outfits: WardrobeOutfit[];
  wardrobeItems: WardrobeItem[];
  onAddEvent: (event: Omit<PlannedEvent, 'id'>) => void;
  onRemoveEvent?: (eventId: string) => void;
  onAssignOutfit: (eventId: string, outfitId: string) => void;
  onAskStylist: (prompt: string) => void;
  onSendToTryOn: (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => void;
}

export const EventPlannerView: React.FC<EventPlannerViewProps> = ({
  events,
  outfits,
  wardrobeItems,
  onAddEvent,
  onRemoveEvent,
  onAssignOutfit,
  onAskStylist,
  onSendToTryOn,
}) => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('Fri, 07 Nov');
  const [newEventTime, setNewEventTime] = useState('19:00');
  const [newEventLocation, setNewEventLocation] = useState('Cape Town Waterfront');
  const [newEventOccasion, setNewEventOccasion] = useState('Cocktail Evening');
  const [newEventWeather, setNewEventWeather] = useState('21°C Mild Evening');
  const [newEventNotes, setNewEventNotes] = useState('');

  const [activeAssignEventId, setActiveAssignEventId] = useState<string | null>(null);

  const handleSubmitNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    onAddEvent({
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      location: newEventLocation,
      occasion: newEventOccasion,
      weatherForecast: newEventWeather,
      notes: newEventNotes,
      completed: false,
    });

    setIsAddEventOpen(false);
    setNewEventTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
            Event Calendar & Outfit Planner
          </h2>
          <p className="text-xs text-[#5C585E] mt-0.5">
            Coordinate looks ahead of time with local weather forecasts and itinerary requirements.
          </p>
        </div>

        <button
          onClick={() => setIsAddEventOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan New Occasion</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-5">
        {events.length === 0 && (
          <p className="text-xs text-[#5C585E]">No outfits are planned yet.</p>
        )}
        {events.map((event) => {
          const assignedOutfit = outfits.find((o) => o.id === event.outfitId);
          const resolvedPieces = assignedOutfit
            ? [
                assignedOutfit.slots.topId,
                assignedOutfit.slots.bottomId,
                assignedOutfit.slots.dressId,
                assignedOutfit.slots.outerwearId,
                assignedOutfit.slots.shoesId,
                assignedOutfit.slots.bagId,
              ]
                .filter(Boolean)
                .map((id) => wardrobeItems.find((i) => i.id === id))
                .filter(Boolean) as WardrobeItem[]
            : [];

          return (
            <div
              key={event.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-[#242326]/8 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Event Metadata */}
              <div className="space-y-2.5 max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#F6F2EC] rounded-lg text-xs font-semibold text-[#242326] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9C6A61]" />
                    <span>{event.date}</span>
                  </span>
                  {event.time && (
                    <span className="text-xs text-[#5C585E] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </span>
                  )}
                  <span className="text-xs text-[#9C6A61] font-mono uppercase font-medium">
                    {event.occasion}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#242326] leading-snug">
                  {event.title}
                </h3>
                {onRemoveEvent && (
                  <button type="button" onClick={() => onRemoveEvent(event.id)} className="text-[11px] text-[#9C6A61] hover:underline cursor-pointer">
                    Remove
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C585E]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B49361]" />
                    <span>{event.location}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#242326] font-medium bg-[#F6F2EC]/60 px-2 py-0.5 rounded-md">
                    <CloudSun className="w-3.5 h-3.5 text-[#B49361]" />
                    <span>{event.weatherForecast}</span>
                  </span>
                </div>

                {event.notes && (
                  <p className="text-xs text-[#5C585E] italic bg-[#FBF8F5] p-2.5 rounded-xl border border-[#242326]/6">
                    "{event.notes}"
                  </p>
                )}
              </div>

              {/* Assigned Outfit Showcase or Empty State */}
              <div className="md:w-1/2 flex flex-col justify-between pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#242326]/6 md:pl-6 space-y-3">
                {assignedOutfit ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#5C585E] font-medium">
                        Assigned Wardrobe Look:
                      </span>
                      <button
                        onClick={() => setActiveAssignEventId(event.id)}
                        className="text-[11px] text-[#9C6A61] hover:underline cursor-pointer"
                      >
                        Change Look
                      </button>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#FBF8F5] rounded-2xl border border-[#242326]/6">
                      <div className="flex -space-x-3 overflow-hidden shrink-0">
                        {resolvedPieces.slice(0, 4).map((p) => (
                          <img
                            key={p.id}
                            src={p.imageUrl}
                            alt={p.name}
                            className="inline-block w-10 h-10 rounded-full ring-2 ring-white object-cover shadow-2xs"
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-[#242326] truncate">
                          {assignedOutfit.title}
                        </h4>
                        <span className="text-[10px] text-[#B49361] font-semibold">
                          {assignedOutfit.harmonyScore}% Harmony
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSendToTryOn(assignedOutfit, resolvedPieces)}
                        className="flex-1 py-1.5 px-3 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Preview in Try-On
                      </button>
                      <button
                        onClick={() =>
                          onAskStylist(
                            `I'm attending "${event.title}" on ${event.date} at ${event.location} (${event.weatherForecast}). I'm planning to wear "${assignedOutfit.title}". What coat or footwear adjustments would you suggest?`
                          )
                        }
                        className="p-2 text-[#5C585E] hover:text-[#242326] bg-white border border-[#242326]/12 hover:border-[#242326]/30 rounded-xl transition-colors cursor-pointer"
                        title="Stylist Check"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F6F2EC]/40 rounded-2xl border border-dashed border-[#242326]/20 text-center space-y-2">
                    <p className="text-xs text-[#5C585E]">No outfit assigned for this date yet.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveAssignEventId(event.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#9C6A61] rounded-xl hover:bg-[#8A5B53] cursor-pointer"
                      >
                        Assign From Outfits
                      </button>
                      <button
                        onClick={() =>
                          onAskStylist(
                            `I need an outfit recommendation for "${event.title}" in ${event.location} on ${event.date} (${event.weatherForecast}). What pieces from my wardrobe should I wear?`
                          )
                        }
                        className="px-3 py-1.5 text-xs font-medium text-[#242326] bg-white border border-[#242326]/12 rounded-xl hover:bg-[#F6F2EC] cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-[#B49361]" />
                        <span>Ask Stylist</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add Event */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 border border-[#242326]/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242326]/8">
              <h3 className="font-serif text-lg font-bold text-[#242326]">
                Plan New Event & Look
              </h3>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#5C585E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEvent} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#242326] block mb-1">
                  Occasion / Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Kirstenbosch Sunset Concert, Wine Farm Wedding"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#242326] block mb-1">Date</label>
                  <input
                    type="text"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    placeholder="e.g. Sat, 15 Nov"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#242326] block mb-1">Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="e.g. 18:30"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#242326] block mb-1">Location</label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="e.g. Stellenbosch, Sandton"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#242326] block mb-1">Weather Forecast</label>
                  <input
                    type="text"
                    value={newEventWeather}
                    onChange={(e) => setNewEventWeather(e.target.value)}
                    placeholder="e.g. 24°C Sunny"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#242326] block mb-1">Styling Notes</label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder="Dress code, grass lawn footwear requirements, layer recommendations..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer mt-2"
              >
                Add Event to Planner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Outfit */}
      {activeAssignEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl p-6 border border-[#242326]/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242326]/8">
              <h3 className="font-serif text-lg font-bold text-[#242326]">
                Select Outfit for Event
              </h3>
              <button
                onClick={() => setActiveAssignEventId(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#5C585E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {outfits.map((outfit) => (
                <div
                  key={outfit.id}
                  onClick={() => {
                    onAssignOutfit(activeAssignEventId, outfit.id);
                    setActiveAssignEventId(null);
                  }}
                  className="p-3 bg-[#F6F2EC]/60 hover:bg-[#E5CDBE]/30 rounded-2xl border border-[#242326]/6 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#242326]">{outfit.title}</h4>
                    <span className="text-[10px] text-[#5C585E] capitalize">{outfit.occasion} • {outfit.season}</span>
                  </div>
                  <span className="text-xs font-bold text-[#B49361]">{outfit.harmonyScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
