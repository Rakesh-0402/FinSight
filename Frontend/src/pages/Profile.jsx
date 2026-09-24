import { API_URL } from "@/lib/utils";
import {useEffect,useState} from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {useNavigate} from "react-router-dom";
import { authFetch } from "@/utils/authFetch";
import { changePasswordSchema } from "@/schemas/authSchema";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {useTheme} from "../context/ThemeContext";

import {Avatar,AvatarFallback} from "@/components/ui/avatar";

import {Badge} from "@/components/ui/badge";

import {Button} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {Skeleton} from "@/components/ui/skeleton";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function Profile() {
  const navigate = useNavigate();

  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [deletingAccount, setDeletingAccount] =useState(false);

  const {setTheme} = useTheme();

  const token =localStorage.getItem("token");

  const [profile,setProfile] = useState({
    name: "",
    email: "",
    currency: "INR",
    theme:localStorage.getItem("theme") || "system",
  });

  const [passwordData,setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading,setLoading] = useState(true);

  const [saving,setSaving] = useState(false);

  const [passwordSaving,setPasswordSaving] = useState(false);

  const [message,setMessage] = useState("");

  const [error,setError] = useState("");

  const [showCurrentPassword,setShowCurrentPassword] = useState(false);

  const [showNewPassword,setShowNewPassword] = useState(false);

  const [showConfirmPassword,setShowConfirmPassword] = useState(false);


  // LOAD PROFILE

  useEffect(() => {
    const fetchProfile =async () => {
        try {
          const response =await authFetch(`${API_URL}/api/auth/me`);

          if (!response) return;
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message);
          }

          const currentTheme =
            localStorage.getItem("theme") ||data.user.settings?.theme ||"system";

          setProfile({
            name:data.user.name ||"",
            email:data.user.email ||"",
            currency:data.user.settings?.currency ||"INR",
            theme:currentTheme,
          });
        } catch (error) {
          setError(error.message ||"Failed to load profile");
        } finally {
          setLoading(false);
        }
      };

    fetchProfile();
  }, [token]);

  // UPDATE PROFILE
  const handleProfileSubmit =
    async (e) => {
      e.preventDefault();

      setSaving(true);
      setError("");
      setMessage("");

      try {
        const response =
          await authFetch(`${API_URL}/api/auth/profile`,
            {
              method: "PUT",

              headers: {
                "Content-Type":"application/json",
              },

              body:
                JSON.stringify(profile),
            }
          );

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        localStorage.setItem("user",JSON.stringify(data.user)
        );

        const savedTheme = data.user.settings?.theme ||profile.theme;

        setTheme(savedTheme);

        setMessage("Profile updated successfully");
      } catch (error) {
        setError(error.message);
      } finally {
        setSaving(false);
      }
    };

  // CHANGE PASSWORD
  const handlePasswordSubmit = async (e) => {
      e.preventDefault();

      setError("");
      setMessage("");
      setPasswordSaving(true);

      try {
        const result =
          changePasswordSchema.safeParse({

            currentPassword: passwordData.currentPassword,

            newPassword: passwordData.newPassword,

            confirmPassword: passwordData.confirmPassword,
          });

        if (!result.success) {
          const firstError = result.error.issues[0]?.message;

          toast.error(firstError || "Please check your password fields");

          return;
        }
        const {confirmPassword,...validatedPasswordData} = result.data;

        const response = await authFetch(
            `${API_URL}/api/auth/password`,
            {
              method: "PUT",

              headers: {
                "Content-Type":"application/json",
              },

              body:
                JSON.stringify(validatedPasswordData),
            }
          );
          if (!response) return;

        const data =await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setMessage("Password changed successfully");
      } catch (error) {
        setError(error.message);
      } finally {
        setPasswordSaving(false);
      }
    };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user" );
    localStorage.removeItem("activeChatId");

    navigate("/login", {
      replace: true,
    });
  };
  //delete account
  const deleteAccount = async () => {
  if (deleteConfirmation !== "DELETE") {
    toast.error("Type DELETE to confirm account deletion");
    return;
  }

  try {
    setDeletingAccount(true);

    const token =localStorage.getItem("token");

    const response = await authFetch(
      `${API_URL}/api/auth/account`,
      {
        method: "DELETE",
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ||"Failed to delete account");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeChatId");

    toast.success("Account deleted successfully");

    navigate("/", {
      replace: true,
    });
  } catch (error) {
    console.error("Delete account error:",error.message
    );

    toast.error( error.message ||"Failed to delete account");
  } finally {
    setDeletingAccount(false);
  }
};

  const initial = profile.name?.charAt(0)?.toUpperCase() ||"U";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

          <Skeleton className="h-80 rounded-3xl" />

          <div className="space-y-6">
            <Skeleton className="h-96 rounded-3xl" />

            <Skeleton className="h-80 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/*HEADER */}

      <div>
        <Badge
          variant="secondary"
          className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
        >
          Account settings
        </Badge>

        <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
          Profile & Settings
        </h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Manage your identity, preferences and account security.
        </p>
      </div>

      {/*STATUS MESSAGES*/}

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">

          <CheckCircle2 size={18}className="mt-0.5 shrink-0"/>

          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/*
          MAIN PROFILE GRID */}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/*PROFILE SUMMARY */}

        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
            <CardContent className="flex flex-col items-center p-6 text-center">

              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-[#07111F] text-2xl font-black text-white dark:bg-white dark:text-[#07111F]">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-4 max-w-full truncate text-lg font-bold text-[#07111F] dark:text-white">
                {profile.name ||"User"}
              </h2>

              <p className="mt-1 max-w-full truncate text-sm text-slate-500 dark:text-slate-400">
                {profile.email}
              </p>

              <Badge
                variant="outline"
                className="mt-4 rounded-full"
              >
                FinSight account
              </Badge>

              <div className="mt-6 w-full border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500 dark:text-slate-400">
                    Currency
                  </span>

                  <span className="font-semibold text-[#07111F] dark:text-white">
                    {profile.currency}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Theme
                  </span>

                  <span className="font-semibold capitalize text-[#07111F] dark:text-white">
                    {profile.theme}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account action */}

          <Card className="rounded-3xl border-red-100 bg-white shadow-sm dark:border-red-950/60 dark:bg-[#081321]">

            <CardHeader>
              <CardTitle className="text-base font-bold text-[#07111F] dark:text-white">
                Account
              </CardTitle>

              <CardDescription>
                Manage your current session.
              </CardDescription>
            </CardHeader>

            <CardContent>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={17}/>

                      Sign out
                    </Button>
                  }
                />

                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Sign out of FinSight?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      You will need to log in again to access your financial workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>

                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Sign out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {/* SETTINGS COLUMN */}

        <div className="space-y-6">

          {/*PERSONAL + PREFERENCES */}

          <form
            onSubmit={handleProfileSubmit}
          >
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
              <CardHeader>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                    <UserRound size={20}/>
                  </div>

                  <div>
                    <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                      Personal Information
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Update your name,email and product preferences.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">

                {/* Personal details */}
                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Name */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Name
                    </label>

                    <div className="relative">
                      <UserRound
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={profile.name}
                        onChange={(e) =>setProfile({...profile, name:e.target.value})}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  {/* Email */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>setProfile({...profile,email:e.target.value})}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}

                <div className="border-t border-slate-100 pt-7 dark:border-slate-800">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Palette
                        size={17}
                      />
                    </div>

                    <div>
                      <p className="font-bold text-[#07111F] dark:text-white">
                        Preferences
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Customize how FinSight looks and displays money.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Currency */}

                    {/* Theme */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Theme
                      </label>

                      <Select
                        value={profile.theme}
                        onValueChange={(newTheme) => {setProfile({...profile,theme:newTheme});

                        setTheme(newTheme);
                        }}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>

                          <SelectItem value="dark">Dark</SelectItem>

                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#07111F] px-5 text-white hover:bg-[#07111F]/90 dark:bg-white dark:text-[#07111F] dark:hover:bg-slate-200"
                  >
                    <Save size={16}/>

                    {saving
                      ? "Saving..."
                      : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/*SECURITY */}

          <form
            onSubmit={handlePasswordSubmit}
          >
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
              <CardHeader>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ShieldCheck size={20}/>
                  </div>

                  <div>
                    <CardTitle className="text-lg font-bold text-[#07111F] dark:text-white">
                      Security
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Change the password used to access your FinSight account.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>

                <div className="grid gap-5 lg:grid-cols-3">

                  {/* Current password */}
                  <PasswordField
                    label="Current password"
                    placeholder="Current password"
                    value={passwordData.currentPassword}
                    show={showCurrentPassword}
                    onToggle={() =>setShowCurrentPassword(!showCurrentPassword)}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword:e.target.value})
                    }
                  />

                  {/* New password */}
                  <PasswordField
                    label="New password"
                    placeholder="New password"
                    value={passwordData.newPassword}
                    show={showNewPassword}
                    onToggle={() =>setShowNewPassword(!showNewPassword)}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword:e.target.value
                      })}
                  />

                  {/* Confirm */}
                  <PasswordField
                    label="Confirm password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    show={showConfirmPassword}
                    onToggle={() =>setShowConfirmPassword(!showConfirmPassword)}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword:e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">

                    <KeyRound size={14}/>
                    Use a strong,unique password.
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={passwordSaving}
                    className="rounded-xl"
                  >
                    <KeyRound size={16}/>

                    {passwordSaving ? "Updating..." : "Change password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-red-200/80 bg-white shadow-sm dark:border-red-950 dark:bg-[#081321] mt-6">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
                    <TriangleAlert className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
                      Danger zone
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Irreversible account actions
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 border-t border-red-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-red-950">
                  <div>
                    <h3 className="font-bold text-[#07111F] dark:text-white">
                      Delete account
                    </h3>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Permanently delete your account,transactions, uploaded statement history, conversations and notifications. This action cannot be undone.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className="shrink-0 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        />
                      }
                    >
                      <Trash2 className="size-4" />
                      Delete account
                    </AlertDialogTrigger>

                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Permanently delete your account?
                        </AlertDialogTitle>

                  <AlertDialogDescription>
                    This will permanently delete all financial data associated with your account, including transactions, statement history, chats and notifications. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Type{" "}
                    <span className="font-bold text-red-500">
                      DELETE
                    </span>{" "}
                    to confirm
                  </label>

                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) =>
                      setDeleteConfirmation(e.target.value)
                    }
                    placeholder="DELETE"
                    autoComplete="off"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() =>setDeleteConfirmation("")}
                  >
                    Cancel
                  </AlertDialogCancel>

                  <AlertDialogAction
                    disabled={ deleteConfirmation !== "DELETE" || deletingAccount}
                    onClick={deleteAccount}
                    className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {deletingAccount
                      ? "Deleting..."
                      : "Delete permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
            </form>
          </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  show,
  onToggle,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className="relative">

        <KeyRound
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={show? "text": "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {show ? (
            <EyeOff
              size={17}
            />
          ) : (
            <Eye
              size={17}
            />
          )}
        </button>
      </div>
    </div>
  );
}