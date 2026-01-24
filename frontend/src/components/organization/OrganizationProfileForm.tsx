// components/employer/organization/OrganizationProfileForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Organization,
  OrganizationRequest,
  CompanySize,
} from "@/types";
import { FileService } from "@/lib/api/services/files";

interface OrganizationProfileFormProps {
  initialData: Organization | null;
  onSubmit: (data: OrganizationRequest) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  mode: "create" | "edit";
}

interface FormState {
  name: string;
  description: string;
  industry: string;
  companySize: CompanySize | "";
  headquartersLocation: string;
  website: string;
  contactEmail: string;
  phone: string;
  additionalLocations: string[];
  foundedOn: string;
  mission: string;
  benefitsOverview: string;
  companyCulture: string;
  logoUrl: string;
}

export default function OrganizationProfileForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Organization Profile",
  mode,
}: OrganizationProfileFormProps) {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    industry: "",
    companySize: "",
    headquartersLocation: "",
    website: "",
    contactEmail: "",
    phone: "",
    additionalLocations: [],
    foundedOn: "",
    mission: "",
    benefitsOverview: "",
    companyCulture: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        industry: initialData.industry || "",
        companySize: initialData.company_size || "",
        headquartersLocation: initialData.headquarters_location || "",
        website: initialData.website || "",
        contactEmail: initialData.contact_email || "",
        phone: initialData.phone || "",
        additionalLocations: initialData.additional_locations || [],
        foundedOn: initialData.founded_on || "",
        mission: initialData.mission || "",
        benefitsOverview: initialData.benefits_overview || "",
        companyCulture: initialData.company_culture || "",
        logoUrl: initialData.logo_url || "",
      });
    }
  }, [initialData]);

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationInput, setLocationInput] = useState("");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeValidation = FileService.validateFileSize(file, 5);
    if (!sizeValidation.isValid) {
      alert(sizeValidation.error);
      return;
    }

    const typeValidation = FileService.validateImageFile(file);
    if (!typeValidation.isValid) {
      alert(typeValidation.error);
      return;
    }

    setUploadingLogo(true);
    try {
      if (formData.logoUrl) {
        await FileService.deleteOrganizationLogo();
      }
      const response = await FileService.uploadOrganizationLogo(file);
      if (response.success && response.data) {
        updateFormData({ logoUrl: response.data.file_url });
      } else {
        alert(response.errors || "Failed to upload logo");
      }
    } catch (error) {
      alert("Error uploading logo");
      console.error(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!formData.logoUrl) return;
    if (!confirm("Are you sure you want to delete your organization logo?")) return;

    setUploadingLogo(true);
    try {
      const response = await FileService.deleteOrganizationLogo();
      if (response.success) {
        updateFormData({ logoUrl: "" });
      } else {
        alert(response.errors || "Failed to delete logo");
      }
    } catch (error) {
      alert("Error deleting logo");
      console.error(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !formData.additionalLocations.includes(locationInput.trim())) {
      updateFormData({ additionalLocations: [...formData.additionalLocations, locationInput.trim()] });
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    updateFormData({ additionalLocations: formData.additionalLocations.filter((l) => l !== location) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const organizationData: OrganizationRequest = {
      organization: {
        name: formData.name.trim(),
        description: formData.description.trim(),
        industry: formData.industry.trim(),
        company_size: formData.companySize as CompanySize,
        headquarters_location: formData.headquartersLocation.trim(),
        website: formData.website.trim() || undefined,
        contact_email: formData.contactEmail.trim(),
        phone: formData.phone.trim(),
        additional_locations: formData.additionalLocations.length > 0 ? formData.additionalLocations : undefined,
        founded_on: formData.foundedOn || undefined,
        mission: formData.mission.trim() || undefined,
        benefits_overview: formData.benefitsOverview.trim() || undefined,
        company_culture: formData.companyCulture.trim() || undefined,
        logo_url: formData.logoUrl || undefined,
        is_active: true,
      },
    };

    await onSubmit(organizationData);
  };

  const steps = [
    { id: 0, label: "Basic Info", icon: "🏢" },
    { id: 1, label: "Contact", icon: "📞" },
    { id: 2, label: "About Us", icon: "✨" },
  ];

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 p-6  md:p-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          <div className="hidden md:block absolute top-8 left-0 w-full h-1 bg-gray-200">
            <div
              className="h-full bg-gray-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all duration-300 ${
                  index <= currentStep ? 'bg-gray-300 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.icon}
              </button>
              <span className={`text-sm md:text-xs font-medium md:mt-2 transition-colors flex-1 md:flex-none text-left md:text-center ${
                index <= currentStep ? 'text-black-700' : 'text-gray-500'
              }`}>
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <div className="md:hidden flex-shrink-0 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-500 ${
                    index < currentStep ? 'w-full' : 'w-0'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden py-10">
          <div className="p-8 md:p-12">
            {currentStep === 0 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Organization Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl text-white">🏢</span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        disabled={uploadingLogo}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-all hover:scale-110 disabled:opacity-50"
                        title="Delete logo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {uploadingLogo && (
                    <span className="text-sm text-purple-600 mt-2 animate-pulse">Uploading...</span>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Max size: 5MB (JPG, PNG, GIF, WebP)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Brief description of your organization..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Industry *</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => updateFormData({ industry: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Technology, Healthcare, Finance..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Size *</label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => updateFormData({ companySize: e.target.value as CompanySize })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Size</option>
                      <option value={CompanySize.SIZE_1_10}>1-10 employees</option>
                      <option value={CompanySize.SIZE_11_50}>11-50 employees</option>
                      <option value={CompanySize.SIZE_51_200}>51-200 employees</option>
                      <option value={CompanySize.SIZE_201_500}>201-500 employees</option>
                      <option value={CompanySize.SIZE_501_1000}>501-1000 employees</option>
                      <option value={CompanySize.SIZE_1000_PLUS}>1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Founded Date</label>
                  <input
                    type="date"
                    value={formData.foundedOn}
                    onChange={(e) => updateFormData({ foundedOn: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h2>
                  <p className="text-gray-600">How can people reach your organization?</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Headquarters Location *</label>
                  <input
                    type="text"
                    value={formData.headquartersLocation}
                    onChange={(e) => updateFormData({ headquartersLocation: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="San Francisco, CA, USA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Locations</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                      placeholder="Enter location"
                      className="w-full sm:flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addLocation}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.additionalLocations.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full font-medium shadow-sm"
                      >
                        📍 {loc}
                        <button
                          type="button"
                          onClick={() => removeLocation(loc)}
                          className="text-purple-600 hover:text-purple-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email *</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateFormData({ contactEmail: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateFormData({ website: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">About Your Organization</h2>
                  <p className="text-gray-600">Share your mission and culture</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mission Statement</label>
                  <textarea
                    value={formData.mission}
                    onChange={(e) => updateFormData({ mission: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="What drives your organization? What are your core values?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Culture</label>
                  <textarea
                    value={formData.companyCulture}
                    onChange={(e) => updateFormData({ companyCulture: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Describe your work environment and company culture..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Benefits Overview</label>
                  <textarea
                    value={formData.benefitsOverview}
                    onChange={(e) => updateFormData({ benefitsOverview: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="List the benefits you offer (health insurance, remote work, paid time off, etc.)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-6 md:pb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg'
              }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-purple-600'
                      : index < currentStep
                        ? 'w-2 bg-purple-400'
                        : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                // style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem' }}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ✓ {submitButtonText}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}