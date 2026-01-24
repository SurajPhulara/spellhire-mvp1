// components/employer/profile/EmployerProfileForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  EmployerProfile,
  EmployerRequest,
  Gender,
  JobType,
  EmployerRole,
  SkillLevel,
  Skill,
} from "@/types";
import { FileService } from "@/lib/api/services/files";
import { useAuth } from "@/contexts/AuthContext";

interface EmployerProfileFormProps {
  initialData: EmployerProfile | null;
  organizationName?: string;
  onSubmit: (data: EmployerRequest) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  mode: "create" | "edit";
}

interface FormState {
  firstName: string;
  lastName: string;
  gender: Gender | "";
  bio: string;
  profilePictureUrl: string;
  phone: string;
  workPhone: string;
  workLocation: string;
  department: string;
  jobTitle: string;
  employmentType: JobType | "";
  hireDate: string;
  role: EmployerRole | "";
  canInterview: boolean;
  skills: Skill[];
}

export default function EmployerProfileForm({
  initialData,
  organizationName,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Profile",
  mode,
}: EmployerProfileFormProps) {
  const { user, isLoading } = useAuth()
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    gender: "",
    bio: "",
    profilePictureUrl: "",
    phone: "",
    workPhone: "",
    workLocation: "",
    department: "",
    jobTitle: "",
    employmentType: "",
    hireDate: "",
    role: "",
    canInterview: false,
    skills: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.first_name || "",
        lastName: initialData.last_name || "",
        gender: initialData.gender || "",
        bio: initialData.bio || "",
        profilePictureUrl: initialData.profile_picture_url || "",
        phone: initialData.phone || "",
        workPhone: initialData.work_phone || "",
        workLocation: initialData.work_location || "",
        department: initialData.department || "",
        jobTitle: initialData.job_title || "",
        employmentType: initialData.employment_type || "",
        hireDate: initialData.hire_date || "",
        role: initialData.role || "",
        canInterview: initialData.can_interview ?? false,
        skills: initialData.skills || [],
      });
    }
  }, [initialData]);

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE);
  const [yearsExperience, setYearsExperience] = useState<number>(0);

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
      if (user?.profile_picture_url) {
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
    if (!user?.profile_picture_url) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: EmployerRequest = {
      employer: {
        first_name: formData.firstName.trim() || undefined,
        last_name: formData.lastName.trim() || undefined,
        gender: formData.gender || undefined,
        bio: formData.bio.trim() || undefined,
        profile_picture_url: user?.profile_picture_url || undefined,
        phone: formData.phone.trim() || undefined,
        work_phone: formData.workPhone.trim() || undefined,
        work_location: formData.workLocation.trim() || undefined,
        department: formData.department.trim() || undefined,
        job_title: formData.jobTitle.trim() || undefined,
        employment_type: formData.employmentType || undefined,
        hire_date: formData.hireDate || undefined,
        role: formData.role || undefined,
        can_interview: formData.canInterview,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
      },
    };

    await onSubmit(profileData);
  };

  const steps = [
    { id: 0, label: "Basic Info", icon: "👤" },
    { id: 1, label: "Work Details", icon: "💼" },
    { id: 2, label: "Role & Skills", icon: "⚡" },
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
      {/* Organization Context Banner */}
      {organizationName && mode === "create" && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border-l-4 border-purple-500 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                {
                  (user?.organization_logo) ? (
                    <img src={user?.organization_logo} alt="organization logo" />
                  ) : (
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )
                }
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Setting up profile for</p>
              <p className="text-lg font-bold text-gray-900">{user?.organization_name}</p>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
                      {user?.profile_picture_url ? (
                        <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
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
                    {user?.profile_picture_url && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Work Phone</label>
                    <input
                      type="tel"
                      value={formData.workPhone}
                      onChange={(e) => updateFormData({ workPhone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => updateFormData({ bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Tell us a bit about yourself and your professional background..."
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Work Details</h2>
                  <p className="text-gray-600">Your role in the organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => updateFormData({ jobTitle: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="HR Manager, Recruiter, CEO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateFormData({ department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Human Resources, Engineering"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Work Location</label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={(e) => updateFormData({ workLocation: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="San Francisco Office, Remote"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => updateFormData({ employmentType: e.target.value as JobType })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value={JobType.FULL_TIME}>Full Time</option>
                      <option value={JobType.PART_TIME}>Part Time</option>
                      <option value={JobType.CONTRACT}>Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hire Date</label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => updateFormData({ hireDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Role & Skills</h2>
                  <p className="text-gray-600">Define your permissions and expertise</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-800 font-semibold flex items-center">
                    {formData.role === EmployerRole.ADMIN && (
                      <>
                        Admin (Full Access)
                      </>
                    )}
                    {formData.role === EmployerRole.HR && (
                      <>
                        HR (Manage Jobs & Candidates)
                      </>
                    )}
                    {formData.role === EmployerRole.EMPLOYER && (
                      <>
                        Employer (View & Interview)
                      </>
                    )}
                    {!formData.role && (
                      <>—</>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.role === EmployerRole.ADMIN && "Full access to all organization features"}
                    {formData.role === EmployerRole.HR && "Can post jobs, manage applications, and interview candidates"}
                    {formData.role === EmployerRole.EMPLOYER && "Can view applications and conduct interviews"}
                  </p>
                </div>

                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => updateFormData({ role: e.target.value as EmployerRole })}
                    // required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={true}
                  >
                    <option value="">Select Role</option>
                    <option value={EmployerRole.ADMIN}>Admin (Full Access)</option>
                    <option value={EmployerRole.HR}>HR (Manage Jobs & Candidates)</option>
                    <option value={EmployerRole.EMPLOYER}>Employer (View & Interview)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.role === EmployerRole.ADMIN && "Full access to all organization features"}
                    {formData.role === EmployerRole.HR && "Can post jobs, manage applications, and interview candidates"}
                    {formData.role === EmployerRole.EMPLOYER && "Can view applications and conduct interviews"}
                  </p>
                </div> */}


                {/* <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="canInterview"
                    checked={formData.canInterview}
                    onChange={(e) => updateFormData({ canInterview: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="canInterview" className="text-sm font-semibold text-gray-700">
                    I can conduct interviews with candidates
                  </label>
                </div> */}

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>⚡</span> Your Skills
                  </h3>
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