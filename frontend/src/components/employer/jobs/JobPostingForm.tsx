// components/employer/jobs/JobPostingForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Job,
  JobRequest,
  JobType,
  WorkMode,
  ExperienceLevel,
  JobStatus,
} from "@/types";

interface JobPostingFormProps {
  initialData?: Job | null;
  onSubmit: (data: JobRequest) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  mode: "create" | "edit";
}

interface FormState {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  vacancies: number;
  jobType: JobType | "";
  workMode: WorkMode | "";
  experienceLevel: ExperienceLevel | "";
  requiredSkills: string[];
  preferredSkills: string[];
  minimumYearsExperience: number;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  category: string;
  department: string;
  benefits: string[];
  applicationDeadline: string;
  applicationUrl: string;
  status: JobStatus;
  isFeatured: boolean;
}

export default function JobPostingForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Post Job",
  mode,
}: JobPostingFormProps) {
  const [formData, setFormData] = useState<FormState>({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    vacancies: 1,
    jobType: "",
    workMode: "",
    experienceLevel: "",
    requiredSkills: [],
    preferredSkills: [],
    minimumYearsExperience: 0,
    locationCity: "",
    locationState: "",
    locationCountry: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryPeriod: "yearly",
    category: "",
    department: "",
    benefits: [],
    applicationDeadline: "",
    applicationUrl: "",
    status: JobStatus.DRAFT,
    isFeatured: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        requirements: initialData.requirements || "",
        responsibilities: initialData.responsibilities || "",
        vacancies: initialData.vacancies || 1,
        jobType: initialData.job_type || "",
        workMode: initialData.work_mode || "",
        experienceLevel: initialData.experience_level || "",
        requiredSkills: initialData.required_skills || [],
        preferredSkills: initialData.preferred_skills || [],
        minimumYearsExperience: initialData.minimum_years_experience || 0,
        locationCity: initialData.location?.city || "",
        locationState: initialData.location?.state || "",
        locationCountry: initialData.location?.country || "",
        salaryMin: initialData.salary_min?.toString() || "",
        salaryMax: initialData.salary_max?.toString() || "",
        salaryCurrency: initialData.salary_currency || "USD",
        salaryPeriod: initialData.salary_period || "yearly",
        category: initialData.category || "",
        department: initialData.department || "",
        benefits: initialData.benefits || [],
        applicationDeadline: initialData.application_deadline || "",
        applicationUrl: initialData.application_url || "",
        status: initialData.status || JobStatus.DRAFT,
        isFeatured: initialData.is_featured || false,
      });
    }
  }, [initialData]);

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [preferredSkillInput, setPreferredSkillInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      updateFormData({ requiredSkills: [...formData.requiredSkills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    updateFormData({ requiredSkills: formData.requiredSkills.filter(s => s !== skill) });
  };

  const addPreferredSkill = () => {
    if (preferredSkillInput.trim() && !formData.preferredSkills.includes(preferredSkillInput.trim())) {
      updateFormData({ preferredSkills: [...formData.preferredSkills, preferredSkillInput.trim()] });
      setPreferredSkillInput("");
    }
  };

  const removePreferredSkill = (skill: string) => {
    updateFormData({ preferredSkills: formData.preferredSkills.filter(s => s !== skill) });
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      updateFormData({ benefits: [...formData.benefits, benefitInput.trim()] });
      setBenefitInput("");
    }
  };

  const removeBenefit = (benefit: string) => {
    updateFormData({ benefits: formData.benefits.filter(b => b !== benefit) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jobData: JobRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      responsibilities: formData.responsibilities.trim(),
      vacancies: formData.vacancies,
      job_type: formData.jobType as JobType,
      work_mode: formData.workMode as WorkMode,
      experience_level: formData.experienceLevel as ExperienceLevel,
      required_skills: formData.requiredSkills,
      preferred_skills: formData.preferredSkills.length > 0 ? formData.preferredSkills : [],
      minimum_years_experience: formData.minimumYearsExperience,
      location: {
        city: formData.locationCity.trim(),
        state: formData.locationState.trim(),
        country: formData.locationCountry.trim(),
      },
      salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
      salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
      salary_currency: formData.salaryCurrency || undefined,
      salary_period: formData.salaryPeriod || undefined,
      category: formData.category.trim(),
      department: formData.department.trim(),
      benefits: formData.benefits.length > 0 ? formData.benefits : [],
      application_deadline: formData.applicationDeadline || undefined,
      application_url: formData.applicationUrl.trim() || undefined,
      status: formData.status,
      is_featured: formData.isFeatured,
      metadata: {},
    };

    await onSubmit(jobData);
  };

  const steps = [
    { id: 0, label: "Basic Info", icon: "📋" },
    { id: 1, label: "Details", icon: "✍️" },
    { id: 2, label: "Skills", icon: "🎯" },
    { id: 3, label: "Compensation", icon: "💰" },
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 p-6 md:p-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          <div className="hidden md:block absolute top-8 left-0 w-full h-1 bg-gray-200">
            <div
              className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all duration-300 ${index <= currentStep ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {step.icon}
              </button>
              <span className={`text-sm md:text-xs font-medium md:mt-2 transition-colors flex-1 md:flex-none text-left md:text-center ${index <= currentStep ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <div className="md:hidden flex-shrink-0 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-indigo-600 transition-all duration-500 ${index < currentStep ? 'w-full' : 'w-0'
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
                  <p className="text-gray-600">Let's start with the job basics</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Senior Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type *</label>
                    <select
                      value={formData.jobType}
                      onChange={(e) => updateFormData({ jobType: e.target.value as JobType })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Work Mode *</label>
                    <select
                      value={formData.workMode}
                      onChange={(e) => updateFormData({ workMode: e.target.value as WorkMode })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Mode</option>
                      <option value={WorkMode.REMOTE}>Remote</option>
                      <option value={WorkMode.ON_SITE}>On-site</option>
                      <option value={WorkMode.HYBRID}>Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level *</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => updateFormData({ experienceLevel: e.target.value as ExperienceLevel })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Level</option>
                      <option value={ExperienceLevel.ENTRY}>Entry Level</option>
                      <option value={ExperienceLevel.JUNIOR}>Junior</option>
                      <option value={ExperienceLevel.MID}>Mid Level</option>
                      <option value={ExperienceLevel.SENIOR}>Senior</option>
                      <option value={ExperienceLevel.LEAD}>Lead</option>
                      <option value={ExperienceLevel.EXECUTIVE}>Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Years Experience *</label>
                    <input
                      type="number"
                      value={formData.minimumYearsExperience}
                      onChange={(e) => updateFormData({ minimumYearsExperience: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => updateFormData({ category: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Engineering, Marketing, Sales..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateFormData({ department: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Product Development"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Vacancies *</label>
                  <input
                    type="number"
                    value={formData.vacancies}
                    onChange={(e) => updateFormData({ vacancies: parseInt(e.target.value) || 1 })}
                    required
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.locationCity}
                      onChange={(e) => updateFormData({ locationCity: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={formData.locationState}
                      onChange={(e) => updateFormData({ locationState: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="California"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      value={formData.locationCountry}
                      onChange={(e) => updateFormData({ locationCountry: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="USA"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Details</h2>
                  <p className="text-gray-600">Describe the role and what you're looking for</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Provide a detailed description of the role..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 50 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Responsibilities *</label>
                  <textarea
                    value={formData.responsibilities}
                    onChange={(e) => updateFormData({ responsibilities: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="• Lead development of new features&#10;• Collaborate with cross-functional teams&#10;• Mentor junior developers"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 20 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements *</label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => updateFormData({ requirements: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="• Bachelor's degree in Computer Science&#10;• 5+ years of experience&#10;• Strong problem-solving skills"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 20 characters</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Skills & Benefits</h2>
                  <p className="text-gray-600">What skills are you looking for?</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Required Skills *</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="e.g., React, Node.js, Python"
                      className="w-full sm:flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      Add Skill
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 rounded-full font-medium shadow-sm"
                      >
                        🎯 {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Skills</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={preferredSkillInput}
                      onChange={(e) => setPreferredSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPreferredSkill())}
                      placeholder="Nice-to-have skills"
                      className="w-full sm:flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addPreferredSkill}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      Add Skill
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full font-medium shadow-sm"
                      >
                        ✨ {skill}
                        <button
                          type="button"
                          onClick={() => removePreferredSkill(skill)}
                          className="text-purple-600 hover:text-purple-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Benefits</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                      placeholder="e.g., Health Insurance, Remote Work"
                      className="w-full sm:flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      Add Benefit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-full font-medium shadow-sm"
                      >
                        💎 {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(benefit)}
                          className="text-green-600 hover:text-green-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Compensation & Details</h2>
                  <p className="text-gray-600">Salary and application settings</p>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Salary Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Salary</label>
                      <input
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => updateFormData({ salaryMin: e.target.value })}
                        placeholder="50000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Salary</label>
                      <input
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => updateFormData({ salaryMax: e.target.value })}
                        placeholder="80000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                      <select
                        value={formData.salaryCurrency}
                        onChange={(e) => updateFormData({ salaryCurrency: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
                      <select
                        value={formData.salaryPeriod}
                        onChange={(e) => updateFormData({ salaryPeriod: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => updateFormData({ applicationDeadline: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">External Application URL</label>
                  <input
                    type="url"
                    value={formData.applicationUrl}
                    onChange={(e) => updateFormData({ applicationUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="https://careers.company.com/apply"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use internal application system</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Job Settings</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateFormData({ status: e.target.value as JobStatus })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value={JobStatus.DRAFT}>Draft (Not visible to candidates)</option>
                      <option value={JobStatus.ACTIVE}>Active (Accepting applications)</option>
                      <option value={JobStatus.PAUSED}>Paused (Visible but not accepting)</option>
                      <option value={JobStatus.CLOSED}>Closed</option>
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => updateFormData({ isFeatured: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-all"></div>
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-md"></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                          ⭐ Featured Job
                        </span>
                        <p className="text-xs text-gray-500">Featured jobs appear at the top of search results</p>
                      </div>
                    </label>
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
                  : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 shadow-md hover:shadow-lg'
                }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${index === currentStep
                      ? 'w-8 bg-indigo-600'
                      : index < currentStep
                        ? 'w-2 bg-indigo-400'
                        : 'w-2 bg-gray-300'
                    }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}