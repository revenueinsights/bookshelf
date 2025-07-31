'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Button from '@/components/ui/button/Button';
import { Loader2 } from 'lucide-react';

interface SettingsData {
  name: string;
  email: string;
  bookScouterToken: string;
  autoAddToInventory: boolean;
  preferredCondition: string;
  defaultBatchId: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface Batch {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          throw new Error('Failed to load settings');
        }
        const data = await res.json();
        setSettings({
          name: data.name || '',
          email: data.email,
          bookScouterToken: data.bookScouterToken || '',
          autoAddToInventory: data.userPreferences?.autoAddToInventory ?? false,
          preferredCondition: data.userPreferences?.preferredCondition ?? 'GOOD',
          defaultBatchId: data.userPreferences?.defaultBatchId ?? null,
          emailNotifications: data.userPreferences?.emailNotifications ?? true,
          pushNotifications: data.userPreferences?.pushNotifications ?? false,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }

      // Fetch batches for default batch selection
      try {
        const batchRes = await fetch('/api/batches');
        if (batchRes.ok) {
          const list = await batchRes.json();
          setBatches(list);
        }
      } catch {
        /* ignore */
      }
    }

    fetchData();
  }, []);

  const handleChange = (field: keyof SettingsData, value: any) => {
    if (!settings) return;
    setSettings((prev) => ({ ...(prev as SettingsData), [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Settings" description="Manage your account settings and preferences" />

      {error && <div className="text-red-600 font-medium">{error}</div>}
      {success && <div className="text-green-600 font-medium">{success}</div>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={settings.email}
              disabled
              className="w-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BookScouter Token</label>
            <input
              type="text"
              value={settings.bookScouterToken}
              onChange={(e) => handleChange('bookScouterToken', e.target.value)}
              placeholder="Enter BookScouter API token"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md p-2"
            />
          </div>
        </div>

        <hr className="my-4" />

        {/* Preferences */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoAddToInventory}
                onChange={(e) => handleChange('autoAddToInventory', e.target.checked)}
                className="form-checkbox"
              />
              <span>Auto add scanned books to inventory</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Condition</label>
            <select
              value={settings.preferredCondition}
              onChange={(e) => handleChange('preferredCondition', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
            >
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="VERY_GOOD">Very Good</option>
              <option value="GOOD">Good</option>
              <option value="ACCEPTABLE">Acceptable</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Batch</label>
            <select
              value={settings.defaultBatchId || ''}
              onChange={(e) => handleChange('defaultBatchId', e.target.value || null)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2"
            >
              <option value="">None</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-4" />

        {/* Notifications */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                className="form-checkbox"
              />
              <span>Email Notifications</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                className="form-checkbox"
              />
              <span>Push Notifications</span>
            </label>
          </div>
        </div>

        <div>
          <Button type="submit" disabled={saving} className="mt-4">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 