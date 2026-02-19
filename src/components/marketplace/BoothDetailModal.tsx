'use client';
import React, { useState } from 'react';
import type { MarketplaceBooth } from '@/types/database';
import { BOOTH_STATUS_COLORS, BOOTH_STATUS_LABELS } from '@/lib/booth-helpers';

interface Props {
  booth: MarketplaceBooth;
  onClose: () => void;
}

export default function BoothDetailModal({ booth, onClose }: Props) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({ requester_name: '', company: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = booth.booth_profiles?.[0] ?? null;
  const isAvailable = booth.status === 'available';
  const canWaitlist = booth.status === 'reserved' || booth.status === 'sold';
  const obj = booth.floor_plan_object;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/booths/${booth.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Booth {booth.booth_number}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: BOOTH_STATUS_COLORS[booth.status] }}
            >
              {BOOTH_STATUS_LABELS[booth.status]}
            </span>
            {booth.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {booth.category}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {obj && obj.width && obj.height && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dimensions</span>
              <span className="font-medium">{obj.width.toFixed(1)}m × {obj.height.toFixed(1)}m</span>
            </div>
          )}
          {booth.size_sqm != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Area</span>
              <span className="font-medium">{booth.size_sqm} sqm</span>
            </div>
          )}
          {booth.pricing_tier && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pricing Tier</span>
              <span className="font-medium">{booth.pricing_tier}</span>
            </div>
          )}
          {booth.price != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-semibold text-green-700">${booth.price.toLocaleString()}</span>
            </div>
          )}
          {booth.amenities && booth.amenities.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Amenities</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {booth.amenities.map((a) => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Exhibitor info if sold */}
          {profile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Exhibitor</div>
              <div className="flex items-center gap-2">
                {profile.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <span className="font-medium text-sm">{profile.company_name || 'Unnamed'}</span>
              </div>
              {profile.description && (
                <p className="text-xs text-gray-600 mt-1">{profile.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100">
          {submitted ? (
            <div className="text-center text-green-700 text-sm font-medium py-2">
              ✓ {canWaitlist ? 'Added to waitlist!' : 'Request submitted!'}
            </div>
          ) : showRequestForm ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Your Name"
                value={formData.requester_name}
                onChange={(e) => setFormData((f) => ({ ...f, requester_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData((f) => ({ ...f, company: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Message (optional)"
                value={formData.message}
                onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {isAvailable && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Request This Booth
                </button>
              )}
              {canWaitlist && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                >
                  Join Waitlist
                </button>
              )}
              {booth.status === 'blocked' && (
                <p className="text-center text-gray-400 text-sm">This booth is not available</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
