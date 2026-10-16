/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, ProductOffer } from '../../types/shop';
import { Button } from '../common/Button';
import {
  X,
  Scale,
  CheckCircle2,
  Truck,
  Sparkles,
  Info,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface PriceComparisonModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Find offer with the lowest estimated total
  const sortedOffers = [...product.offers].sort(
    (a, b) => a.estimatedTotalZar - b.estimatedTotalZar
  );
  const lowestTotal = sortedOffers[0]?.estimatedTotalZar || product.demoPriceZar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242326]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#242326]/8 bg-[#FAF7F2]/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">
                  Price Comparison Engine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold">
                  Demonstration Prototype
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326] mt-0.5">
                {product.name}
              </h2>
              <p className="text-xs text-[#5C585E]">
                Comparing simulated retail pricing across South African fashion stockists.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5C585E] hover:text-[#242326] hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Disclaimer Banner */}
          <div className="p-3.5 rounded-2xl bg-[#F6F2EC] border border-[#242326]/10 flex items-start gap-2.5 text-xs text-[#5C585E]">
            <Info className="w-4 h-4 text-[#B49361] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#242326]">
                Prototype Demonstration Data:
              </span>{' '}
              All offers, prices, delivery rates, and stock availability shown below are illustrative models designed for interface testing. Real merchant APIs and automated inventory matching will be integrated in Phase 2.
            </div>
          </div>

          {/* Comparison Offers List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242326] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#9C6A61]" />
              Simulated Retailer Offers ({product.offers.length})
            </h3>

            {sortedOffers.map((offer) => {
              const isBestPrice = offer.estimatedTotalZar === lowestTotal;
              return (
                <div
                  key={offer.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isBestPrice
                      ? 'bg-gradient-to-r from-[#FAF7F2] to-white border-[#B49361]/60 shadow-xs'
                      : 'bg-white border-[#242326]/10 hover:border-[#242326]/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Retailer Info & Status */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-semibold text-[#242326]">
                          {offer.retailer}
                        </span>

                        {isBestPrice && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B49361]/20 text-[#8b6f43] flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Lowest Demo Total
                          </span>
                        )}

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            offer.status === 'Exact Match'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {offer.status}
                        </span>

                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
                          {offer.dataQualityState}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#5C585E]">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#9C6A61]" />
                          {offer.deliveryEstimate}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242326]/6">
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                        <span className="text-xs text-[#5C585E]">
                          Demo Item: R{offer.priceZar} + R{offer.deliveryFeeZar} delivery
                        </span>
                        <div className="font-serif text-lg font-bold text-[#242326]">
                          Est. Total: R{offer.estimatedTotalZar}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Size Availability Row */}
                  <div className="mt-3 pt-3 border-t border-[#242326]/6 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-[#5C585E]">Demo Sizes:</span>
                      {offer.availableSizes.map((sz) => (
                        <span
                          key={sz}
                          className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#242326]/8 text-[11px] font-medium text-[#242326]"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        alert(
                          `Simulated checkout for ${offer.retailer}.\nIn Phase 2, this will redirect to the authentic retailer checkout link.`
                        )
                      }
                      className="text-xs font-semibold text-[#9C6A61] hover:underline cursor-pointer"
                    >
                      Demo View →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#242326]/8 bg-[#FAF7F2]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#5C585E]">
            All prices quoted in South African Rand (ZAR)
          </span>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
};
