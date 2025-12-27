import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Checkbox } from '../../../components/common/Checkbox';
import { showToast } from '../../../components/common/Toast';
import { Upload } from 'lucide-react';

type BannerLayout = 'none' | 'three-column' | 'single-column';

interface BannerSlot {
  image?: string; // base64 or URL
  text?: string;
}

interface BannerLayoutConfig {
  layout: BannerLayout;
  left: BannerSlot;
  center: BannerSlot;
  right: BannerSlot;
  single: BannerSlot;
}

interface PDFBrandingSettings {
  showBanner: boolean;
  header: BannerLayoutConfig;
  footer: BannerLayoutConfig;
}

const defaultSettings: PDFBrandingSettings = {
  showBanner: true,
  header: {
    layout: 'three-column',
    left: {},
    center: {},
    right: {},
    single: {},
  },
  footer: {
    layout: 'none',
    left: {},
    center: {},
    right: {},
    single: {},
  },
};

export function PDFBrandingSection() {
  const [settings, setSettings] = useState<PDFBrandingSettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pdf-branding-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old structure to new structure if needed
        if (parsed.bannerLayout && !parsed.header) {
          setSettings({
            showBanner: parsed.showBanner ?? defaultSettings.showBanner,
            header: {
              layout: parsed.bannerLayout || 'three-column',
              left: parsed.bannerLeft || {},
              center: parsed.bannerCenter || {},
              right: parsed.bannerRight || {},
              single: parsed.bannerSingle || {},
            },
            footer: defaultSettings.footer,
          });
        } else {
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (e) {
        console.error('Failed to load PDF branding settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('pdf-branding-settings', JSON.stringify(settings));
      showToast('Branding settings saved', 'success');
    } catch (e) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleImageUpload = (
    section: 'header' | 'footer',
    slot: 'left' | 'center' | 'right' | 'single'
  ) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSettings((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [slot]: {
              ...prev[section][slot],
              image: base64,
            },
          },
        }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleRemoveImage = (
    section: 'header' | 'footer',
    slot: 'left' | 'center' | 'right' | 'single'
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [slot]: {
          ...prev[section][slot],
          image: undefined,
        },
      },
    }));
  };

  const renderBannerSlot = (
    section: 'header' | 'footer',
    slot: 'left' | 'center' | 'right' | 'single',
    label: string
  ) => {
    const slotData = settings[section][slot];
    const hasImage = !!slotData.image;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {hasImage ? (
          <div className="relative">
            <img
              src={slotData.image}
              alt={label}
              className="w-full h-24 object-contain border border-gray-300 rounded bg-gray-50"
            />
            <button
              onClick={() => handleRemoveImage(section, slot)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 text-xs hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleImageUpload(section, slot)}
            className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Upload Image</span>
          </button>
        )}
        <Input
          type="text"
          placeholder="Or enter text (used if no image)"
          value={slotData.text || ''}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              [section]: {
                ...prev[section],
                [slot]: {
                  ...prev[section][slot],
                  text: e.target.value,
                },
              },
            }))
          }
        />
      </div>
    );
  };

  const renderBannerSection = (
    section: 'header' | 'footer',
    title: string
  ) => {
    const sectionData = settings[section];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="mb-4">
            <Select
              label="Layout"
              options={[
                { value: 'none', label: 'None' },
                { value: 'three-column', label: 'Three-column' },
                { value: 'single-column', label: 'One-column' },
              ]}
              value={sectionData.layout}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    layout: e.target.value as BannerLayout,
                  },
                }))
              }
            />
          </div>

          {sectionData.layout !== 'none' && (
            <>
              {sectionData.layout === 'three-column' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderBannerSlot(section, 'left', 'Left Column')}
                  {renderBannerSlot(section, 'center', 'Center Column')}
                  {renderBannerSlot(section, 'right', 'Right Column')}
                </div>
              ) : (
                <div>{renderBannerSlot(section, 'single', 'Banner')}</div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Branding</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure branding for inspection report PDFs
              </p>
            </div>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>

          <div className="space-y-6">
            {/* Show Banner Toggle - One line */}
            <div className="flex items-center justify-between">
              <label htmlFor="show-banner-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                Show banner on PDFs
              </label>
              <div className="ml-4 flex-shrink-0">
                <Checkbox
                  id="show-banner-toggle"
                  checked={settings.showBanner}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, showBanner: e.target.checked }))
                  }
                />
              </div>
            </div>

            {settings.showBanner && (
              <>
                {/* Header Banner Layout */}
                <div className="pt-4 border-t border-gray-200">
                  {renderBannerSection('header', 'Header Banner Layout')}
                </div>

                {/* Footer Banner Layout */}
                <div className="pt-4 border-t border-gray-200">
                  {renderBannerSection('footer', 'Footer Banner Layout')}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Export function to get settings (for PDF generator)
export function getPDFBrandingSettings(): PDFBrandingSettings {
  const saved = localStorage.getItem('pdf-branding-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate old structure to new structure if needed
      if (parsed.bannerLayout && !parsed.header) {
        return {
          showBanner: parsed.showBanner ?? defaultSettings.showBanner,
          header: {
            layout: parsed.bannerLayout || 'three-column',
            left: parsed.bannerLeft || {},
            center: parsed.bannerCenter || {},
            right: parsed.bannerRight || {},
            single: parsed.bannerSingle || {},
          },
          footer: defaultSettings.footer,
        };
      }
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      console.error('Failed to load PDF branding settings:', e);
    }
  }
  return defaultSettings;
}

