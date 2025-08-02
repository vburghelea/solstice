import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { updateUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { EmergencyContact, PrivacySettings, ProfileInput } from "../profile.types";

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function calculateAge(dateOfBirth: Date | undefined): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function ProfileView() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data
  const { data: profileResult, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => getUserProfile(),
  });

  const profile = profileResult?.success ? profileResult.data : null;

  // Form state for editing
  const [formData, setFormData] = useState<{
    dateOfBirth?: Date;
    gender?: string;
    pronouns?: string;
    phone?: string;
    emergencyContact?: EmergencyContact;
    privacySettings?: PrivacySettings;
  }>({});

  // Initialize form data when entering edit mode
  const startEditing = () => {
    if (!profile) return;

    const formState: {
      dateOfBirth?: Date;
      gender?: string;
      pronouns?: string;
      phone?: string;
      emergencyContact?: EmergencyContact;
      privacySettings?: PrivacySettings;
    } = {};

    if (profile.dateOfBirth) formState.dateOfBirth = profile.dateOfBirth;
    if (profile.gender) formState.gender = profile.gender;
    if (profile.pronouns) formState.pronouns = profile.pronouns;
    if (profile.phone) formState.phone = profile.phone;
    if (profile.emergencyContact) formState.emergencyContact = profile.emergencyContact;
    formState.privacySettings = profile.privacySettings || {
      showEmail: false,
      showPhone: false,
      showBirthYear: false,
      allowTeamInvitations: true,
    };

    setFormData(formState);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormData({});
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      // Build ProfileInput with required fields
      const dataToSubmit: Partial<ProfileInput> = {};

      if (formData.dateOfBirth) dataToSubmit.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) dataToSubmit.gender = formData.gender;
      if (formData.pronouns) dataToSubmit.pronouns = formData.pronouns;
      if (formData.phone) dataToSubmit.phone = formData.phone;
      if (formData.emergencyContact)
        dataToSubmit.emergencyContact = formData.emergencyContact;
      if (formData.privacySettings)
        dataToSubmit.privacySettings = formData.privacySettings;

      const result = await updateUserProfile({ data: dataToSubmit });

      if (result.success) {
        toast.success("Profile updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        setIsEditing(false);
        setFormData({});
      } else {
        const error = result.errors?.[0]?.message || "Failed to update profile";
        toast.error(error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const age = calculateAge(profile.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={saveProfile} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <p className="text-base">{profile.name || "Not set"}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-base">{profile.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth ? formatDate(formData.dateOfBirth) : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: new Date(e.target.value),
                      }));
                    } else {
                      const newFormData = { ...formData };
                      delete newFormData.dateOfBirth;
                      setFormData(newFormData);
                    }
                  }}
                  max={new Date().toISOString().split("T")[0]}
                />
              ) : (
                <p className="text-base">
                  {profile.dateOfBirth
                    ? `${new Date(profile.dateOfBirth).toLocaleDateString()} (Age: ${age})`
                    : "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 000-0000"
                />
              ) : (
                <p className="text-base">{profile.phone || "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData((prev) => ({ ...prev, gender: value }));
                    } else {
                      const newFormData = { ...formData };
                      delete newFormData.gender;
                      setFormData(newFormData);
                    }
                  }}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base">{profile.gender || "Not set"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronouns">Pronouns</Label>
              {isEditing ? (
                <Input
                  id="pronouns"
                  value={formData.pronouns || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pronouns: e.target.value }))
                  }
                  placeholder="e.g., they/them, she/her, he/him"
                />
              ) : (
                <p className="text-base">{profile.pronouns || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Who should we contact in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency-name">Contact Name</Label>
                <Input
                  id="emergency-name"
                  value={formData.emergencyContact?.name || ""}
                  onChange={(e) => {
                    const newContact: EmergencyContact = {
                      name: e.target.value,
                      relationship: formData.emergencyContact?.relationship || "",
                    };
                    if (formData.emergencyContact?.phone)
                      newContact.phone = formData.emergencyContact.phone;
                    if (formData.emergencyContact?.email)
                      newContact.email = formData.emergencyContact.email;
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: newContact,
                    }));
                  }}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-relationship">Relationship</Label>
                <Input
                  id="emergency-relationship"
                  value={formData.emergencyContact?.relationship || ""}
                  onChange={(e) => {
                    const newContact: EmergencyContact = {
                      name: formData.emergencyContact?.name || "",
                      relationship: e.target.value,
                    };
                    if (formData.emergencyContact?.phone)
                      newContact.phone = formData.emergencyContact.phone;
                    if (formData.emergencyContact?.email)
                      newContact.email = formData.emergencyContact.email;
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: newContact,
                    }));
                  }}
                  placeholder="e.g., Parent, Spouse, Friend"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-phone">Contact Phone</Label>
                <Input
                  id="emergency-phone"
                  type="tel"
                  value={formData.emergencyContact?.phone || ""}
                  onChange={(e) => {
                    const newContact: EmergencyContact = {
                      name: formData.emergencyContact?.name || "",
                      relationship: formData.emergencyContact?.relationship || "",
                    };
                    if (e.target.value) newContact.phone = e.target.value;
                    if (formData.emergencyContact?.email)
                      newContact.email = formData.emergencyContact.email;
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: newContact,
                    }));
                  }}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-email">Contact Email</Label>
                <Input
                  id="emergency-email"
                  type="email"
                  value={formData.emergencyContact?.email || ""}
                  onChange={(e) => {
                    const newContact: EmergencyContact = {
                      name: formData.emergencyContact?.name || "",
                      relationship: formData.emergencyContact?.relationship || "",
                    };
                    if (formData.emergencyContact?.phone)
                      newContact.phone = formData.emergencyContact.phone;
                    if (e.target.value) newContact.email = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: newContact,
                    }));
                  }}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <p className="text-base">{profile.emergencyContact?.name || "Not set"}</p>
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <p className="text-base">
                  {profile.emergencyContact?.relationship || "Not set"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <p className="text-base">
                  {profile.emergencyContact?.phone || "Not set"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <p className="text-base">
                  {profile.emergencyContact?.email || "Not set"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control what information is visible to others</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-email"
                  checked={formData.privacySettings?.showEmail || false}
                  onCheckedChange={(checked) => {
                    const newSettings: PrivacySettings = {
                      ...formData.privacySettings!,
                      showEmail: !!checked,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: newSettings,
                    }));
                  }}
                />
                <Label htmlFor="show-email" className="cursor-pointer">
                  Show my email address to team members
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-phone"
                  checked={formData.privacySettings?.showPhone || false}
                  onCheckedChange={(checked) => {
                    const newSettings: PrivacySettings = {
                      ...formData.privacySettings!,
                      showPhone: !!checked,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: newSettings,
                    }));
                  }}
                />
                <Label htmlFor="show-phone" className="cursor-pointer">
                  Show my phone number to team members
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-birth-year"
                  checked={formData.privacySettings?.showBirthYear || false}
                  onCheckedChange={(checked) => {
                    const newSettings: PrivacySettings = {
                      ...formData.privacySettings!,
                      showBirthYear: !!checked,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: newSettings,
                    }));
                  }}
                />
                <Label htmlFor="show-birth-year" className="cursor-pointer">
                  Show my birth year on my profile
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-invitations"
                  checked={formData.privacySettings?.allowTeamInvitations !== false}
                  onCheckedChange={(checked) => {
                    const newSettings: PrivacySettings = {
                      ...formData.privacySettings!,
                      allowTeamInvitations: !!checked,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: newSettings,
                    }));
                  }}
                />
                <Label htmlFor="allow-invitations" className="cursor-pointer">
                  Allow team captains to send me invitations
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email visibility:</span>{" "}
                {profile.privacySettings?.showEmail
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone visibility:</span>{" "}
                {profile.privacySettings?.showPhone
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Birth year visibility:</span>{" "}
                {profile.privacySettings?.showBirthYear ? "Visible on profile" : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Team invitations:</span>{" "}
                {profile.privacySettings?.allowTeamInvitations !== false
                  ? "Allowed"
                  : "Not allowed"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Technical details about your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Profile Status:</span>{" "}
            {profile.profileComplete ? "Complete" : "Incomplete"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Profile Version:</span> {profile.profileVersion}
          </p>
          <p className="text-sm">
            <span className="font-medium">Last Updated:</span>{" "}
            {profile.profileUpdatedAt
              ? new Date(profile.profileUpdatedAt).toLocaleString()
              : "Never"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
