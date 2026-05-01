"use client";

import { EmployerProfile } from "@/types";

interface EmployerProfileViewProps {
  profile: EmployerProfile;
  organizationName?: string;
  isSelf?: boolean;
  onEditClick?: () => void;
}

export default function EmployerProfileView({
  profile,
  organizationName,
  isSelf = false,
  onEditClick,
}: EmployerProfileViewProps) {
  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <div className="mb-8 space-y-6">
      {/* Header / identity card */}
      <div className="p-8 bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 animate-fadeIn">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={fullName || "Profile picture"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl md:text-5xl text-white">👤</span>
            )}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold mb-1"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {fullName || "Unnamed Employer"}
              </h1>
              <p className="text-gray-700 text-lg font-semibold">
                {profile.job_title || "Job title not set"}
              </p>
              <p className="text-gray-500 text-sm">
                {profile.department && <span>{profile.department}</span>}
                {profile.department && organizationName && <span className="mx-1">•</span>}
                {organizationName && <span>{organizationName}</span>}
              </p>
            </div>

            {isSelf && onEditClick && (
              <button
                type="button"
                onClick={onEditClick}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 text-gray-600 text-sm md:text-base max-w-3xl">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="p-6 md:p-8 bg-white rounded-3xl shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Contact
            </h2>
            <div className="space-y-2 text-sm">
              <DetailRow label="Personal Phone" value={profile.phone} />
              <DetailRow label="Work Phone" value={profile.work_phone} />
              <DetailRow label="Work Location" value={profile.work_location} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Work
            </h2>
            <div className="space-y-2 text-sm">
              <DetailRow label="Employment Type" value={profile.employment_type} />
              <DetailRow label="Hire Date" value={profile.hire_date} />
              <DetailRow label="Role" value={profile.role} />
            </div>
          </div>
        </div>

        {profile.skills && profile.skills.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {skill.name}
                    </p>
                    <p className="text-xs text-purple-700 capitalize">
                      {skill.level}
                      {skill.years_experience !== undefined &&
                        skill.years_experience !== null && (
                          <span className="text-gray-400 ml-1">
                            • {skill.years_experience}{" "}
                            {skill.years_experience === 1 ? "year" : "years"}
                          </span>
                        )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | null;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">
        {value || "—"}
      </span>
    </div>
  );
}


