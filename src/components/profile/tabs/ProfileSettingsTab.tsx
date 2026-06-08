"use client";

import { useMemo } from "react";
import { ChevronLeft, Database, Mail, Phone, Shield, UserRound, ChevronRight, Eye, EyeOff } from "lucide-react";
import Select from "react-select";
import DatePickerField from "@/components/DatePickerField";
import PhoneInputField from "@/components/PhoneInputField";
import { ToggleRow, RequirementRow, evaluatePassword } from "@/components/profile/profileUtils";
import ProfileSurfacePanel from "@/components/profile/ProfileSurfacePanel";
import {
  getMaxBirthDateForMinAge,
  MIN_PROGRAM_BOOKING_AGE_YEARS,
} from "@/helpers/programs-booking/formHelpers";

type SettingsSubView = "main" | "edit-info" | "change-password" | "privacy";

export default function ProfileSettingsTab({
  displayName,
  userEmail,
  userPhone,
  settingsSubView,
  setSettingsSubView,
  onEdit,
  onSave,
  isFetching,
  isSaving,
  editForm,
  setEditForm,
  countryOptions,
  selectStyles,
  passwordForm,
  setPasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordSubmitError,
  setPasswordSubmitError,
  privacySettings,
  setPrivacySettings,
}: {
  displayName: string;
  userEmail: string;
  userPhone: string;
  settingsSubView: SettingsSubView;
  setSettingsSubView: (v: SettingsSubView) => void;
  onEdit: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  isFetching: boolean;
  isSaving: boolean;
  editForm: {
    title: string;
    firstName: string;
    lastName: string;
    nationality: string;
    isNewsLetterSubscribed: boolean;
    dob: Date | null;
    gender: string;
    email: string;
    mobileNumber: string;
    address: string;
    country: string;
    city: string;
    zipCode: string;
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      firstName: string;
      lastName: string;
      nationality: string;
      isNewsLetterSubscribed: boolean;
      dob: Date | null;
      gender: string;
      email: string;
      mobileNumber: string;
      address: string;
      country: string;
      city: string;
      zipCode: string;
    }>
  >;
  countryOptions: Array<{ value: string; label: string }>;
  selectStyles: any;
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: React.Dispatch<
    React.SetStateAction<{ currentPassword: string; newPassword: string; confirmPassword: string }>
  >;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  passwordSubmitError: string;
  setPasswordSubmitError: (v: string) => void;
  privacySettings: { dataCollection: boolean; marketingCommunications: boolean };
  setPrivacySettings: React.Dispatch<
    React.SetStateAction<{ dataCollection: boolean; marketingCommunications: boolean }>
  >;
}) {
  const passwordChecks = useMemo(() => evaluatePassword(passwordForm.newPassword), [passwordForm.newPassword]);
  const allRequirementsMet =
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.special;

  const confirmTouched = passwordForm.confirmPassword.length > 0;
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  }, []);

  const dobMaxSelectableDate = useMemo(
    () => getMaxBirthDateForMinAge(MIN_PROGRAM_BOOKING_AGE_YEARS, today),
    [today],
  );

  const passwordsMatch =
    passwordForm.newPassword.length > 0 &&
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  return (
    <div className="max-w-[1048px] space-y-6">
      {settingsSubView === "main" && (
        <div className="space-y-6">
          <ProfileSurfacePanel>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-montserrat text-[20px] font-semibold text-white">Personal Information</h2>
              <button
                type="button"
                onClick={onEdit}
                disabled={isFetching || isSaving}
                className="text-[14px] font-semibold text-white/72 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetching ? "Loading..." : "Edit"}
              </button>
            </div>
            <div className="divide-y divide-white/8">
              {[
                { label: "Full Name", value: displayName, icon: UserRound },
                { label: "Email", value: userEmail, icon: Mail },
                { label: "Phone", value: userPhone, icon: Phone },
              ].map((item) => {
                const Icon = item.icon;
                const value = item.value as string;
                return (
                  <div key={item.label} className="flex items-center gap-4 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/80 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-montserrat text-[14px] text-white/42">{item.label}</p>
                      <p className="mt-1 font-montserrat text-[16px] font-medium text-white">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ProfileSurfacePanel>

          <ProfileSurfacePanel>
            <h2 className="font-montserrat text-[20px] font-semibold text-white mb-7">Account</h2>
            <div className="space-y-6">
              {/* <button
                type="button"
                onClick={() => setSettingsSubView("change-password")}
                className="w-full text-left font-montserrat text-[16px] font-medium text-white hover:text-white/75 transition-colors"
              >
                Change Password
              </button> */}
              <button
                type="button"
                onClick={() => setSettingsSubView("privacy")}
                className="w-full text-left font-montserrat text-[16px] font-medium text-white hover:text-white/75 transition-colors"
              >
                Privacy Settings
              </button>
            </div>
          </ProfileSurfacePanel>
        </div>
      )}

      {settingsSubView === "edit-info" && (
        <div className="space-y-6">
          {/* <button
            type="button"
            onClick={() => setSettingsSubView("main")}
            className="flex items-center gap-3 text-white hover:text-white/80 transition-colors mb-6"
          >
            <ChevronLeft size={24} />
            <span className="font-optima text-[24px] lg:text-[32px]">Edit Information</span>
          </button> */}

          <ProfileSurfacePanel className="p-6 lg:p-8">
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="font-montserrat text-[20px] font-semibold text-white">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Title</label>
                    <Select
                      options={[
                        { value: "Mr", label: "Mr" },
                        { value: "Ms", label: "Ms" },
                        { value: "Mrs", label: "Mrs" },
                      ]}
                      value={editForm.title ? { value: editForm.title, label: editForm.title } : null}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, title: val?.value || "" }))}
                      styles={selectStyles}
                      isSearchable={false}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[12px] leading-[100%] text-white mb-2">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Nationality</label>
                    <Select
                      options={countryOptions}
                      value={editForm.nationality ? { value: editForm.nationality, label: editForm.nationality } : null}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, nationality: val?.value || "" }))}
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                     <DatePickerField
                       value={editForm.dob}
                       onChange={(date) => setEditForm((prev) => ({ ...prev, dob: date ?? null }))}
                       labelClassName="mb-2 block font-montserrat text-[12px] font-normal leading-[100%] text-white"
                       maxDate={dobMaxSelectableDate}
                     />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[14px] text-white/70">Select Gender</label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 font-montserrat text-[14px] text-white cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        checked={editForm.gender === "male"}
                        onChange={() => setEditForm((prev) => ({ ...prev, gender: "male" }))}
                        className="peer sr-only"
                      />
                      <span className="relative h-4 w-4 rounded-full border border-white/40 bg-black peer-checked:border-[#792327] peer-checked:bg-[#792327]">
                        <span className="absolute left-1/2 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white peer-checked:block" />
                      </span>
                      Male
                    </label>
                    <label className="inline-flex items-center gap-2 font-montserrat text-[14px] text-white cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        checked={editForm.gender === "female"}
                        onChange={() => setEditForm((prev) => ({ ...prev, gender: "female" }))}
                        className="peer sr-only"
                      />
                      <span className="relative h-4 w-4 rounded-full border border-white/40 bg-black peer-checked:border-[#792327] peer-checked:bg-[#792327]">
                        <span className="absolute left-1/2 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white peer-checked:block" />
                      </span>
                      Female
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-montserrat text-[20px] font-semibold text-white">Contact details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      disabled={true}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white/80 focus:outline-none"
                    />
                  </div>
                  <div>
                    <PhoneInputField
                      value={editForm.mobileNumber}
                      disabled={true}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, mobileNumber: val }))}
                      label="Mobile Number"
                      labelClassName="block text-[12px] leading-[100%] text-white mb-2"
                      variant="login"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <div
                    className={`h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors ${editForm.isNewsLetterSubscribed
                      ? "border-[#792327] bg-[#792327]"
                      : "border-white/40 bg-transparent group-hover:border-white/70"
                      }`}
                  >
                    {editForm.isNewsLetterSubscribed && (
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={editForm.isNewsLetterSubscribed}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, isNewsLetterSubscribed: e.target.checked }));
                    }}
                  />
                  <span className="font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white/75 group-hover:text-white transition-colors">Subscribe to newsletter</span>
                </label>
              </div>

              <div className="space-y-6">
                <h3 className="font-montserrat text-[20px] font-semibold text-white">Saved Address</h3>
                <div>
                  <label className="block text-[12px] leading-[100%] text-white mb-2">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Country</label>
                    <Select
                      options={countryOptions}
                      value={editForm.country ? { value: editForm.country, label: editForm.country } : null}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, country: val?.value || "" }))}
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] leading-[100%] text-white mb-2">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] leading-[100%] text-white mb-2">Zip Code/Postal code</label>
                    <input
                      type="text"
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 font-montserrat text-[14px] text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ProfileSurfacePanel>

          <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:justify-end">
            <button
              type="button"
              disabled={isSaving || isFetching}
              onClick={() => setSettingsSubView("main")}
              className="px-12 py-3 rounded-[10px] border border-white/20 bg-[#222222] text-white font-semibold hover:bg-[#333333] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || isFetching}
              onClick={onSave}
              className="px-12 py-3 rounded-[10px] bg-[#792327] text-white font-semibold hover:bg-[#8e2b30] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {settingsSubView === "change-password" && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSettingsSubView("main")}
            className="flex items-center gap-3 text-white hover:text-white/80 transition-colors mb-6"
          >
            <ChevronLeft size={24} />
            <span className="font-optima text-[24px] lg:text-[32px]">Change Password</span>
          </button>

          <ProfileSurfacePanel className="p-6 lg:p-8">
            <div className="space-y-5">
              <p className="text-white/70 text-[14px]">
                Your new password must be different from previously used passwords.
              </p>

              <div className="bg-[#151515] border border-white/5 rounded-[12px] p-6 space-y-4">
                <p className="font-semibold text-white text-[15px]">Password must contain:</p>
                <div className="grid grid-cols-1 gap-3">
                  <RequirementRow protocol={passwordChecks.length}>At least 8 characters</RequirementRow>
                  <RequirementRow protocol={passwordChecks.upper}>Contains uppercase letter</RequirementRow>
                  <RequirementRow protocol={passwordChecks.lower}>Contains lowercase letter</RequirementRow>
                  <RequirementRow protocol={passwordChecks.number}>Contains number</RequirementRow>
                  <RequirementRow protocol={passwordChecks.special}>Contains special character</RequirementRow>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[12px] leading-[100%] text-white mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                        setPasswordSubmitError("");
                      }}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] leading-[100%] text-white mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                        setPasswordSubmitError("");
                      }}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] leading-[100%] text-white mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                        setPasswordSubmitError("");
                      }}
                      className="w-full h-[50px] bg-[#0000004D] border border-[#494949] rounded-[10px] px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmTouched && (
                    <p className={`mt-2 text-[12px] ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                      {passwordsMatch ? "Password match" : "Password doesn't match"}
                    </p>
                  )}
                </div>
              </div>

              {passwordSubmitError && (
                <p className="text-center text-[12px] text-red-500 font-medium">{passwordSubmitError}</p>
              )}

              <div className="flex justify-end">
                <button type="button" className="text-[14px] font-semibold text-white hover:text-white/80 transition-colors">
                  Forgot your password?
                </button>
              </div>
            </div>
          </ProfileSurfacePanel>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setSettingsSubView("main");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setPasswordSubmitError("");
              }}
              className="px-12 py-3 rounded-[10px] border border-white/20 bg-[#222222] text-white font-semibold hover:bg-[#333333] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!allRequirementsMet || !passwordsMatch || !passwordForm.currentPassword}
              className="px-12 py-3 rounded-[10px] bg-[#792327] text-white font-semibold hover:bg-[#8e2b30] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {settingsSubView === "privacy" && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSettingsSubView("main")}
            className="flex items-center gap-3 text-white hover:text-white/80 transition-colors mb-6"
          >
            <ChevronLeft size={24} />
            <span className="font-optima text-[24px] lg:text-[32px]">Privacy Settings</span>
          </button>

          <div className="space-y-6">
            <ProfileSurfacePanel>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-lg bg-[#792327]/10 flex items-center justify-center border border-[#792327]/20">
                  <Database size={18} className="text-[#a52c32]" />
                </div>
                <h2 className="font-montserrat text-[20px] font-semibold text-white">Data & Privacy</h2>
              </div>

              <div className="mt-6 space-y-3">
                <ToggleRow
                  label="Data Collection"
                  description="Allow us to collect analytics to improve your experience"
                  enabled={privacySettings.dataCollection}
                  onToggle={() => setPrivacySettings((prev) => ({ ...prev, dataCollection: !prev.dataCollection }))}
                />
                <ToggleRow
                  label="Marketing Communications"
                  description="Receive personalized event recommendations and offers"
                  enabled={privacySettings.marketingCommunications}
                  onToggle={() =>
                    setPrivacySettings((prev) => ({
                      ...prev,
                      marketingCommunications: !prev.marketingCommunications,
                    }))
                  }
                />
              </div>
            </ProfileSurfacePanel>

            <ProfileSurfacePanel>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-lg bg-[#792327]/10 flex items-center justify-center border border-[#792327]/20">
                  <Shield size={18} className="text-[#a52c32]" />
                </div>
                <h2 className="font-montserrat text-[20px] font-semibold text-white">Account Actions</h2>
              </div>

              <button type="button" className="w-full flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#494949] transition-colors">
                  <UserRound size={18} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-white text-[16px]">Request Account Deletion</h3>
                  <p className="text-[14px] text-white/50">Permanently delete your account and all associated data</p>
                </div>
                <ChevronRight size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
              </button>
            </ProfileSurfacePanel>
          </div>
        </div>
      )}
    </div>
  );
}

