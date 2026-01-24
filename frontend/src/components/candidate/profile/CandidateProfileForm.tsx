// components/candidate/profile/CandidateProfileForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  CandidateProfile,
  CandidateProfileRequest,
  Gender,
  JobType,
  WorkMode,
  SkillLevel,
  Skill,
  Experience,
  Education,
  Language,
  Certification,
  LanguageProficiency,
} from "@/types";
import { FileService } from "@/lib/api/services/files";

interface CandidateProfileFormProps {
  initialData: CandidateProfile | null;
  onSubmit: (data: CandidateProfileRequest) => Promise<void>;
  isSubmitting: boolean;
  ProfilePictureURL?: string
  submitButtonText?: string;
  mode: "create" | "edit";
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | "";
  address: string;
  professionalSummary: string;
  totalExperience: string;
  currentSalary: string;
  expectedSalary: string;
  preferredJobType: JobType | "";
  preferredWorkMode: WorkMode | "";
  preferredLocations: string[];
  noticePeriod: string;
  isAvailableForWork: boolean;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  languages: Language[];
  certifications: Certification[];
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
  profilePictureUrl: string;
}

export default function CandidateProfileForm({
  initialData,
  ProfilePictureURL,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Profile",
  mode,
}: CandidateProfileFormProps) {

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    professionalSummary: "",
    totalExperience: "",
    currentSalary: "",
    expectedSalary: "",
    preferredJobType: "",
    preferredWorkMode: "",
    preferredLocations: [],
    noticePeriod: "",
    isAvailableForWork: true,
    skills: [],
    experiences: [],
    educations: [],
    languages: [],
    certifications: [],
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    resumeUrl: "",
    profilePictureUrl: ProfilePictureURL || ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.first_name || "",
        lastName: initialData.last_name || "",
        phone: initialData.phone || "",
        dateOfBirth: initialData.date_of_birth || "",
        gender: initialData.gender || "",
        address: initialData.address || "",
        professionalSummary: initialData.professional_summary || "",
        totalExperience: initialData.total_experience?.toString() || "",
        currentSalary: initialData.current_salary?.toString() || "",
        expectedSalary: initialData.expected_salary?.toString() || "",
        preferredJobType: initialData.preferred_job_type || "",
        preferredWorkMode: initialData.preferred_work_mode || "",
        preferredLocations: initialData.preferred_locations || [],
        noticePeriod: initialData.notice_period?.toString() || "",
        isAvailableForWork: initialData.is_available_for_work ?? true,
        skills: initialData.skills || [],
        experiences: initialData.experience || [],
        educations: initialData.education || [],
        languages: initialData.languages || [],
        certifications: initialData.certifications || [],
        portfolioUrl: initialData.portfolio_url || "",
        linkedinUrl: initialData.linkedin_url || "",
        githubUrl: initialData.github_url || "",
        resumeUrl: initialData.resume_url || "",
        profilePictureUrl: ProfilePictureURL|| "",
      });
    }
  }, [initialData]);

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationInput, setLocationInput] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [expCompany, setExpCompany] = useState("");
  const [expPosition, setExpPosition] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStartYear, setEduStartYear] = useState("");
  const [eduEndYear, setEduEndYear] = useState("");
  const [eduGrade, setEduGrade] = useState("");
  const [langName, setLangName] = useState("");
  const [langProficiency, setLangProficiency] = useState<LanguageProficiency>(LanguageProficiency.BASIC);
  const [certName, setCertName] = useState("");
  const [certOrg, setCertOrg] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState("");
  const [certCredentialId, setCertCredentialId] = useState("");

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeValidation = FileService.validateFileSize(file, 10);
    if (!sizeValidation.isValid) {
      alert(sizeValidation.error);
      return;
    }

    const typeValidation = FileService.validateDocumentFile(file);
    if (!typeValidation.isValid) {
      alert(typeValidation.error);
      return;
    }

    setUploadingResume(true);
    try {
      if (formData.resumeUrl) {
        await FileService.deleteResume();
      }
      const response = await FileService.uploadResume(file);
      if (response.success && response.data) {
        updateFormData({ resumeUrl: response.data.file_url });
      } else {
        alert(response.errors || "Failed to upload resume");
      }
    } catch (error) {
      alert("Error uploading resume");
      console.error(error);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!formData.resumeUrl) return;
    if (!confirm("Are you sure you want to delete your resume?")) return;

    setUploadingResume(true);
    try {
      const response = await FileService.deleteResume();
      if (response.success) {
        updateFormData({ resumeUrl: "" });
      } else {
        alert(response.errors || "Failed to delete resume");
      }
    } catch (error) {
      alert("Error deleting resume");
      console.error(error);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingProfilePicture(true);
    try {
      if (formData.profilePictureUrl) {
        await FileService.deleteProfilePicture();
      }
      const response = await FileService.uploadProfilePicture(file);
      if (response.success && response.data) {
        updateFormData({ profilePictureUrl: response.data.file_url });
      } else {
        alert(response.errors || "Failed to upload profile picture");
      }
    } catch (error) {
      alert("Error uploading profile picture");
      console.error(error);
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const handleProfilePictureDelete = async () => {
    if (!formData.profilePictureUrl) return;
    if (!confirm("Are you sure you want to delete your profile picture?")) return;

    setUploadingProfilePicture(true);
    try {
      const response = await FileService.deleteProfilePicture();
      if (response.success) {
        updateFormData({ profilePictureUrl: "" });
      } else {
        alert(response.errors || "Failed to delete profile picture");
      }
    } catch (error) {
      alert("Error deleting profile picture");
      console.error(error);
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !formData.preferredLocations.includes(locationInput.trim())) {
      updateFormData({ preferredLocations: [...formData.preferredLocations, locationInput.trim()] });
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    updateFormData({ preferredLocations: formData.preferredLocations.filter((l) => l !== location) });
  };

  const addSkill = () => {
    if (skillName.trim() && !formData.skills.find((s) => s.name === skillName.trim())) {
      updateFormData({ skills: [...formData.skills, { name: skillName.trim(), level: skillLevel, years_experience: yearsExperience }] });
      setSkillName("");
      setSkillLevel(SkillLevel.INTERMEDIATE);
      setYearsExperience(0);
    }
  };

  const removeSkill = (skillName: string) => {
    updateFormData({ skills: formData.skills.filter((s) => s.name !== skillName) });
  };

  const addExperience = () => {
    if (expCompany.trim() && expPosition.trim() && expStartDate) {
      updateFormData({
        experiences: [
          ...formData.experiences,
          {
            company: expCompany.trim(),
            position: expPosition.trim(),
            start_date: expStartDate,
            end_date: expIsCurrent ? undefined : expEndDate,
            description: expDescription.trim(),
            is_current_job: expIsCurrent,
          },
        ],
      });
      setExpCompany("");
      setExpPosition("");
      setExpStartDate("");
      setExpEndDate("");
      setExpDescription("");
      setExpIsCurrent(false);
    }
  };

  const removeExperience = (index: number) => {
    updateFormData({ experiences: formData.experiences.filter((_, i) => i !== index) });
  };

  const addEducation = () => {
    if (eduInstitution.trim() && eduDegree.trim() && eduField.trim() && eduStartYear) {
      updateFormData({
        educations: [
          ...formData.educations,
          {
            institution: eduInstitution.trim(),
            degree: eduDegree.trim(),
            field_of_study: eduField.trim(),
            start_year: parseInt(eduStartYear),
            end_year: eduEndYear ? parseInt(eduEndYear) : undefined,
            grade: eduGrade.trim() || undefined,
          },
        ],
      });
      setEduInstitution("");
      setEduDegree("");
      setEduField("");
      setEduStartYear("");
      setEduEndYear("");
      setEduGrade("");
    }
  };

  const removeEducation = (index: number) => {
    updateFormData({ educations: formData.educations.filter((_, i) => i !== index) });
  };

  const addLanguage = () => {
    if (langName.trim() && !formData.languages.find((l) => l.name === langName.trim())) {
      updateFormData({
        languages: [...formData.languages, { name: langName.trim(), proficiency: langProficiency }],
      });
      setLangName("");
      setLangProficiency(LanguageProficiency.BASIC);
    }
  };

  const removeLanguage = (langName: string) => {
    updateFormData({ languages: formData.languages.filter((l) => l.name !== langName) });
  };

  const addCertification = () => {
    if (certName.trim() && certOrg.trim() && certIssueDate) {
      updateFormData({
        certifications: [
          ...formData.certifications,
          {
            name: certName.trim(),
            issuing_organization: certOrg.trim(),
            issue_date: certIssueDate,
            expiry_date: certExpiryDate || undefined,
            credential_id: certCredentialId.trim() || undefined,
          },
        ],
      });
      setCertName("");
      setCertOrg("");
      setCertIssueDate("");
      setCertExpiryDate("");
      setCertCredentialId("");
    }
  };

  const removeCertification = (index: number) => {
    updateFormData({ certifications: formData.certifications.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: CandidateProfileRequest = {
      candidate: {
        first_name: formData.firstName.trim() || undefined,
        last_name: formData.lastName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        professional_summary: formData.professionalSummary.trim() || undefined,
        total_experience: formData.totalExperience ? parseFloat(formData.totalExperience) : undefined,
        current_salary: formData.currentSalary ? parseFloat(formData.currentSalary) : undefined,
        expected_salary: formData.expectedSalary ? parseFloat(formData.expectedSalary) : undefined,
        preferred_job_type: formData.preferredJobType || undefined,
        preferred_work_mode: formData.preferredWorkMode || undefined,
        preferred_locations: formData.preferredLocations.length > 0 ? formData.preferredLocations : undefined,
        notice_period: formData.noticePeriod ? parseInt(formData.noticePeriod) : undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        experience: formData.experiences.length > 0 ? formData.experiences : undefined,
        education: formData.educations.length > 0 ? formData.educations : undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        portfolio_url: formData.portfolioUrl.trim() || undefined,
        linkedin_url: formData.linkedinUrl.trim() || undefined,
        github_url: formData.githubUrl.trim() || undefined,
        resume_url: formData.resumeUrl || undefined,
        profile_picture_url: formData.profilePictureUrl || undefined,
        is_available_for_work: formData.isAvailableForWork,
      },
    };

    await onSubmit(profileData);
  };

  const steps = [
    { id: 0, label: "Basic Info", icon: "👤" },
    { id: 1, label: "Professional", icon: "💼" },
    { id: 2, label: "Skills", icon: "⚡" },
    { id: 3, label: "Experience", icon: "📊" },
    { id: 4, label: "Education", icon: "🎓" },
    { id: 5, label: "Additional", icon: "✨" },
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
      <div className="mb-8 p-6 md:p-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
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
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all duration-300 ${index <= currentStep ? 'bg-gray-300 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {step.icon}
              </button>
              <span className={`text-sm md:text-xs font-medium md:mt-2 transition-colors flex-1 md:flex-none text-left md:text-center ${index <= currentStep ? 'text-black-700' : 'text-gray-500'
                }`}>
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <div className="md:hidden flex-shrink-0 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-500 ${index < currentStep ? 'w-full' : 'w-0'
                    }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            {currentStep === 0 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-600">Let's start with your personal details</p>
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
                      {formData.profilePictureUrl ? (
                        <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl text-white">👤</span>
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
                        onChange={handleProfilePictureUpload}
                        disabled={uploadingProfilePicture}
                        className="hidden"
                      />
                    </label>
                    {formData.profilePictureUrl && (
                      <button
                        type="button"
                        onClick={handleProfilePictureDelete}
                        disabled={uploadingProfilePicture}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-all hover:scale-110 disabled:opacity-50"
                        title="Delete profile picture"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {uploadingProfilePicture && (
                    <span className="text-sm text-purple-600 mt-2 animate-pulse">Uploading...</span>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Max size: 5MB (JPG, PNG, GIF, WebP)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData({ firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData({ lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateFormData({ gender: e.target.value as Gender })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                    <option value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="123 Main Street, City, Country"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Professional Information</h2>
                  <p className="text-gray-600">Tell us about your career</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Summary</label>
                  <textarea
                    value={formData.professionalSummary}
                    onChange={(e) => updateFormData({ professionalSummary: e.target.value })}
                    rows={5}
                    placeholder="Experienced software engineer with 5+ years in full-stack development..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Experience (years)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.totalExperience}
                      onChange={(e) => updateFormData({ totalExperience: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Salary</label>
                    <input
                      type="number"
                      value={formData.currentSalary}
                      onChange={(e) => updateFormData({ currentSalary: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="80000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Salary</label>
                    <input
                      type="number"
                      value={formData.expectedSalary}
                      onChange={(e) => updateFormData({ expectedSalary: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="100000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Job Type</label>
                    <select
                      value={formData.preferredJobType}
                      onChange={(e) => updateFormData({ preferredJobType: e.target.value as JobType })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value={JobType.FULL_TIME}>Full Time</option>
                      <option value={JobType.PART_TIME}>Part Time</option>
                      <option value={JobType.CONTRACT}>Contract</option>
                      <option value={JobType.INTERNSHIP}>Internship</option>
                      <option value={JobType.FREELANCE}>Freelance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Work Mode</label>
                    <select
                      value={formData.preferredWorkMode}
                      onChange={(e) => updateFormData({ preferredWorkMode: e.target.value as WorkMode })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Mode</option>
                      <option value={WorkMode.REMOTE}>Remote</option>
                      <option value={WorkMode.ON_SITE}>On Site</option>
                      <option value={WorkMode.HYBRID}>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notice Period (days)</label>
                    <input
                      type="number"
                      value={formData.noticePeriod}
                      onChange={(e) => updateFormData({ noticePeriod: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Locations</label>
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
                    {formData.preferredLocations.map((loc) => (
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

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.isAvailableForWork}
                    onChange={(e) => updateFormData({ isAvailableForWork: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="available" className="text-sm font-semibold text-gray-700">
                    I'm currently available for work opportunities
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Resume / CV</label>
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 hover:border-purple-500 transition-colors">
                    {formData.resumeUrl ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Resume uploaded successfully</p>
                              <a
                                href={formData.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
                              >
                                View Resume →
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleResumeDelete}
                            disabled={uploadingResume}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete resume"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-center">
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Replace Resume
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              disabled={uploadingResume}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4">
                          <div className="inline-block p-4 bg-purple-50 rounded-full mb-3">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload your resume in PDF, DOC, or DOCX format
                        </p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer font-semibold">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            disabled={uploadingResume}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-3">Max size: 10MB</p>
                      </div>
                    )}
                    {uploadingResume && (
                      <div className="text-center mt-4">
                        <div className="inline-flex items-center gap-2 text-purple-600">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Skills</h2>
                  <p className="text-gray-600">What are you good at?</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name</label>
                      <input
                        type="text"
                        value={skillName}
                        onChange={(e) => setSkillName(e.target.value)}
                        placeholder="e.g., JavaScript, Project Management"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      >
                        <option value={SkillLevel.BEGINNER}>Beginner</option>
                        <option value={SkillLevel.INTERMEDIATE}>Intermediate</option>
                        <option value={SkillLevel.ADVANCED}>Advanced</option>
                        <option value={SkillLevel.EXPERT}>Expert</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    + Add Skill
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Your Skills ({formData.skills.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.skills.map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{skill.name}</p>
                            <p className="text-sm text-purple-600 capitalize font-medium">{skill.level}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.name)}
                            className="text-red-500 hover:text-red-700 font-bold text-xl"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.skills.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">⚡</div>
                    <p>No skills added yet. Add your first skill above!</p>
                  </div>
                )}
              </div>
            )} */}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Skills</h2>
                  <p className="text-gray-600">What are you good at?</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name</label>
                      <input
                        type="text"
                        value={skillName}
                        onChange={(e) => setSkillName(e.target.value)}
                        placeholder="e.g., JavaScript, Project Management"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      >
                        <option value={SkillLevel.BEGINNER}>Beginner</option>
                        <option value={SkillLevel.INTERMEDIATE}>Intermediate</option>
                        <option value={SkillLevel.ADVANCED}>Advanced</option>
                        <option value={SkillLevel.EXPERT}>Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Years (optional)</label>
                      <input
                        type="number"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(parseInt(e.target.value))}
                        placeholder="e.g., 3"
                        min="0"
                        max="50"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    + Add Skill
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Your Skills ({formData.skills.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.skills.map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{skill.name}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-purple-600 capitalize font-medium">{skill.level}</span>
                              {skill.years_experience && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600">{skill.years_experience} {skill.years_experience === 1 ? 'year' : 'years'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.name)}
                            className="text-red-500 hover:text-red-700 font-bold text-xl"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.skills.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">⚡</div>
                    <p>No skills added yet. Add your first skill above!</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Work Experience</h2>
                  <p className="text-gray-600">Share your professional journey</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={expCompany}
                        onChange={(e) => setExpCompany(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={expPosition}
                        onChange={(e) => setExpPosition(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="Senior Developer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={expStartDate}
                        onChange={(e) => setExpStartDate(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={expEndDate}
                        onChange={(e) => setExpEndDate(e.target.value)}
                        disabled={expIsCurrent}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <input
                      type="checkbox"
                      id="currentJob"
                      checked={expIsCurrent}
                      onChange={(e) => setExpIsCurrent(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="currentJob" className="text-sm font-semibold text-gray-700">
                      I currently work here
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe your responsibilities and achievements..."
                      className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addExperience}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    + Add Experience
                  </button>
                </div>

                {formData.experiences.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Experience ({formData.experiences.length})</h3>
                    {formData.experiences.map((exp, index) => (
                      <div key={index} className="p-6 bg-white border-2 border-purple-100 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900">{exp.position}</h4>
                            <p className="text-purple-600 font-semibold">{exp.company}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{" "}
                              {exp.is_current_job
                                ? "Present"
                                : exp.end_date
                                  ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : "N/A"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExperience(index)}
                            className="text-red-500 hover:text-red-700 font-bold text-xl ml-4"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {formData.experiences.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📊</div>
                    <p>No experience added yet. Add your first experience above!</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Education</h2>
                  <p className="text-gray-600">Your academic background</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        value={eduInstitution}
                        onChange={(e) => setEduInstitution(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Degree</label>
                      <input
                        type="text"
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="Bachelor's, Master's"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Field of Study</label>
                    <input
                      type="text"
                      value={eduField}
                      onChange={(e) => setEduField(e.target.value)}
                      placeholder="Computer Science, Business"
                      className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Year</label>
                      <input
                        type="number"
                        value={eduStartYear}
                        onChange={(e) => setEduStartYear(e.target.value)}
                        min="1950"
                        max="2100"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="2018"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Year</label>
                      <input
                        type="number"
                        value={eduEndYear}
                        onChange={(e) => setEduEndYear(e.target.value)}
                        min="1950"
                        max="2100"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="2022"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Grade/GPA</label>
                      <input
                        type="text"
                        value={eduGrade}
                        onChange={(e) => setEduGrade(e.target.value)}
                        placeholder="3.8, First Class"
                        className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addEducation}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    + Add Education
                  </button>
                </div>

                {formData.educations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Education ({formData.educations.length})</h3>
                    {formData.educations.map((edu, index) => (
                      <div key={index} className="p-6 bg-white border-2 border-purple-100 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900">
                              {edu.degree} in {edu.field_of_study}
                            </h4>
                            <p className="text-purple-600 font-semibold mt-1">{edu.institution}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {edu.start_year} - {edu.end_year || "Present"}
                            </p>
                            {edu.grade && (
                              <p className="text-sm text-gray-600 mt-2 font-medium">
                                Grade: {edu.grade}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="text-red-500 hover:text-red-700 font-bold text-xl ml-4"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.educations.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🎓</div>
                    <p>No education added yet. Add your first degree above!</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Additional Information</h2>
                  <p className="text-gray-600">Complete your profile</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>🌍</span> Languages
                  </h3>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                        <input
                          type="text"
                          value={langName}
                          onChange={(e) => setLangName(e.target.value)}
                          placeholder="e.g., English, Spanish"
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Proficiency</label>
                        <select
                          value={langProficiency}
                          onChange={(e) => setLangProficiency(e.target.value as LanguageProficiency)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                        >
                          {Object.values(LanguageProficiency).map((value) => (
                            <option key={value} value={value}>
                              {value.charAt(0) + value.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      + Add Language
                    </button>
                  </div>

                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {formData.languages.map((lang) => (<span
                        key={lang.name}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-md border-2 border-purple-100"
                      >
                        <span className="font-semibold text-gray-900">{lang.name}</span>
                        <span className="text-sm text-purple-600 capitalize font-medium">
                          ({lang.proficiency})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang.name)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>🏆</span> Certifications
                  </h3>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Certificate Name</label>
                        <input
                          type="text"
                          value={certName}
                          onChange={(e) => setCertName(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          placeholder="AWS Certified"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Issuing Organization</label>
                        <input
                          type="text"
                          value={certOrg}
                          onChange={(e) => setCertOrg(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          placeholder="Amazon"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
                        <input
                          type="date"
                          value={certIssueDate}
                          onChange={(e) => setCertIssueDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          value={certExpiryDate}
                          onChange={(e) => setCertExpiryDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Credential ID or URL</label>
                        <input
                          type="text"
                          value={certCredentialId}
                          onChange={(e) => setCertCredentialId(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                          placeholder="ABC123"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addCertification}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      + Add Certification
                    </button>
                  </div>

                  {formData.certifications.length > 0 && (
                    <div className="space-y-3">
                      {formData.certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="p-6 bg-white border-2 border-purple-100 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900">{cert.name}</h4>
                              <p className="text-purple-600 font-semibold">{cert.issuing_organization}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                {cert.expiry_date &&
                                  ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                              </p>
                              {cert.credential_id && (
                                <p className="text-sm text-gray-600 mt-1 font-mono">
                                  ID: {cert.credential_id}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="text-red-500 hover:text-red-700 font-bold text-xl ml-4"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>🔗</span> Social & Portfolio Links
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio URL</label>
                      <input
                        type="url"
                        value={formData.portfolioUrl}
                        onChange={(e) => updateFormData({ portfolioUrl: e.target.value })}
                        placeholder="https://yourportfolio.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => updateFormData({ linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault())}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => updateFormData({ githubUrl: e.target.value })}
                        placeholder="https://github.com/yourusername"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-6 md:pb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all ${currentStep === 0
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
                  className={`h-2 rounded-full transition-all ${index === currentStep
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