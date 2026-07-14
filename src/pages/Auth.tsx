import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Building, AlertCircle, Mail, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from '@/assets/logo.png'

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const inviteSyncRef = useRef<string | null>(null);

  // Phone auth states
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+232");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState("");
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [phonePasswordSetupMode, setPhonePasswordSetupMode] = useState(false);


  const countryCodes = [
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  ];

  const { signIn, signUp, user, resetPassword, updatePassword, signInWithPhone, verifyPhoneOtp, phoneSignUp, phoneSignIn } = useAuth();

  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Failsafe: ensures branch_id from invitation is correctly copied to the membership record
  const syncMemberBranchFromInvitation = async (userId: string) => {
    try {
      const userEmail = user?.email?.toLowerCase();
      if (!userEmail) return;

      // Get the member record
      const { data: member } = await supabase
        .from("organization_members")
        .select("id, business_id, branch_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!member) return;

      // Get the most recent accepted invitation for this email + business
      const { data: invitation } = await supabase
        .from("organization_invitations")
        .select("branch_id")
        .eq("email", userEmail)
        .eq("business_id", member.business_id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!invitation) return;

      // If the branch_id doesn't match, fix it
      if (member.branch_id !== invitation.branch_id) {
        console.log("Failsafe: syncing branch_id from invitation to member", {
          memberId: member.id,
          currentBranch: member.branch_id,
          expectedBranch: invitation.branch_id,
        });
        await supabase
          .from("organization_members")
          .update({ branch_id: invitation.branch_id })
          .eq("id", member.id);
      }
    } catch (err) {
      console.error("Failsafe branch sync error:", err);
    }
  };

  // Helper to parse auth type from URL hash (Supabase puts auth info in hash fragment)
  const getAuthTypeFromHash = () => {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    return params.get("type");
  };

  // Helper to check for error codes in URL
  const getErrorFromUrl = () => {
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const errorCode = searchParams.get("error_code") || hashParams.get("error_code");
    const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");
    return { errorCode, errorDescription };
  };

  // Check for invite mode, reset password mode, and redirect authenticated users
  useEffect(() => {
    const runAuthFlow = async () => {
      const mode = searchParams.get("mode");
      const queryType = searchParams.get("type");
      const hashType = getAuthTypeFromHash();
      const { errorCode, errorDescription } = getErrorFromUrl();

      // Check for expired/invalid link errors
      if (
        errorCode === "otp_expired" ||
        errorDescription?.toLowerCase().includes("expired") ||
        errorCode === "access_denied" ||
        errorDescription?.toLowerCase().includes("invalid")
      ) {
        setLinkExpired(true);
        return;
      }

      const isRecoveryFlow = hashType === "recovery" || mode === "reset";
      const isInviteFlow = queryType === "invite" || hashType === "invite" || hashType === "magiclink";
      const isInviteUserWithoutPassword =
        !!user?.user_metadata?.business_id && user.user_metadata?.password_set !== true;

      if (mode === "reset") {
        setActiveTab("reset");
      }

      if (user && isRecoveryFlow) {
        setShowPasswordReset(true);
        setShowPasswordSetup(false);
        return;
      }

      if (user && (isInviteFlow || isInviteUserWithoutPassword)) {
        if (isInviteUserWithoutPassword) {
          setShowPasswordSetup(true);
          setShowPasswordReset(false);
          return;
        }

        navigate("/");
        return;
      }

      if (user) {
        navigate("/");
      }
    };

    runAuthFlow();
  }, [user, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("message.error"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password, rememberMe);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: t("auth.signInFailed"),
            description: t("auth.invalidCredentials"),
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: t("auth.emailNotConfirmedTitle"),
            description: t("auth.emailNotConfirmed"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.signInFailed"),
            description: error.message || t("auth.unexpectedError"),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("auth.welcomeBack"),
          description: t("auth.signInSuccess"),
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Phone authentication handlers (temporary password-based flow while MSG91 verifies account)
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !phonePassword) {
      toast({
        title: t("message.error"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `${countryCode}${phone.replace(/^0/, "")}`;
    setLoading(true);
    try {
      const { error } = await phoneSignIn(formattedPhone, phonePassword, rememberMe);
      if (error) {
        toast({
          title: t("auth.signInFailed"),
          description: error.message || t("auth.invalidCredentials"),
          variant: "destructive",
        });
      } else {
        toast({ title: t("auth.welcomeBack"), description: t("auth.signInSuccess") });
        navigate("/");
      }
    } catch {
      toast({ title: t("message.error"), description: t("auth.unexpectedError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !phonePassword || !phoneConfirmPassword) {
      toast({ title: t("message.error"), description: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }
    if (phonePassword !== phoneConfirmPassword) {
      toast({ title: t("message.error"), description: t("auth.passwordsDontMatch"), variant: "destructive" });
      return;
    }
    if (phonePassword.length < 6) {
      toast({ title: t("message.error"), description: t("auth.weakPassword"), variant: "destructive" });
      return;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `${countryCode}${phone.replace(/^0/, "")}`;
    setLoading(true);
    try {
      const { error } = await phoneSignUp(formattedPhone, phonePassword);
      if (error) {
        toast({
          title: t("auth.signUpFailed"),
          description: error.message || t("auth.unexpectedError"),
          variant: "destructive",
        });
      } else {
        toast({ title: t("auth.accountCreated"), description: t("auth.signInSuccess") });
        navigate("/");
      }
    } catch {
      toast({ title: t("message.error"), description: t("auth.unexpectedError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: t("message.error"),
        description: t("auth.enterSixDigitCode"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await verifyPhoneOtp(phone, otp);

      if (error) {
        toast({
          title: t("auth.verificationFailed"),
          description: error.message || t("auth.invalidVerificationCode"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.welcomeBack"),
          description: t("auth.phoneVerificationSuccess"),
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithPhone(phone);
      if (error) {
        toast({
          title: t("auth.failedToResendOtp"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.otpResent"),
          description: t("auth.newCodeSent"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("message.error"),
        description: t("auth.weakPassword"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: t("auth.accountExists"),
            description: t("auth.userExists"),
            variant: "destructive",
          });
          setActiveTab("signin");
        } else if (error.message.includes("Password should be at least")) {
          toast({
            title: t("auth.weakPasswordTitle"),
            description: t("auth.weakPassword"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.signUpFailed"),
            description: error.message || t("auth.unexpectedError"),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("auth.accountCreated"),
          description: t("auth.checkEmail"),
        });
        setActiveTab("signin");
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: t("message.error"),
        description: t("auth.enterEmailAddress"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast({
          title: t("auth.resetFailed"),
          description: error.message || t("auth.failedToSendReset"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.resetEmailSentTitle"),
          description: t("auth.resetEmailSent"),
        });
        setShowForgotPassword(false);
        setActiveTab("signin");
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password setup for invited team members (new users)
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("message.error"),
        description: t("auth.weakPassword"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        toast({
          title: t("auth.passwordSetupFailed"),
          description: error.message || t("auth.failedToSetPassword"),
          variant: "destructive",
        });
      } else {
        // Mark password as set in user metadata to prevent re-prompting
        await supabase.auth.updateUser({
          data: { password_set: true },
        });

        // Ensure invitation is accepted and membership is created before redirect
        await supabase.functions.invoke("accept-team-invitation");

        const userId = user?.id;
        if (userId) {
          // Failsafe: verify branch_id was correctly synced from invitation to membership
          await syncMemberBranchFromInvitation(userId);

          const [businessResult, membershipResult] = await Promise.all([
            supabase.from("businesses").select("id").eq("owner_id", userId).maybeSingle(),
            supabase.from("organization_members").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle(),
          ]);

          const hasBusiness = businessResult.data !== null;
          const hasMembership = membershipResult.data !== null;

          toast({
            title: t("auth.passwordSetSuccessTitle"),
            description: t("auth.passwordSetSuccessDesc"),
          });

          setShowPasswordSetup(false);
          navigate(hasBusiness || hasMembership ? "/" : "/onboarding");
        } else {
          toast({
            title: t("auth.passwordSetSuccessTitle"),
            description: t("auth.passwordSetSuccessDesc"),
          });

          setShowPasswordSetup(false);
          setActiveTab("signin");
        }
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset for existing users (forgot password flow)
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: t("message.error"),
        description: t("auth.passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("message.error"),
        description: t("auth.weakPassword"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        toast({
          title: t("auth.passwordResetFailed"),
          description: error.message || t("auth.failedToResetPassword"),
          variant: "destructive",
        });
        return;
      }

      // Mark password as set
      await supabase.auth.updateUser({
        data: { password_set: true },
      });

      // Smart redirect: check if user has existing business/membership
      const userId = user?.id;
      if (userId) {
        const [businessResult, membershipResult] = await Promise.all([
          supabase.from("businesses").select("id").eq("owner_id", userId).maybeSingle(),
          supabase.from("organization_members").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle(),
        ]);

        const hasBusiness = businessResult.data !== null;
        const hasMembership = membershipResult.data !== null;

        toast({
          title: t("auth.passwordResetSuccessTitle"),
          description: t("auth.passwordUpdated"),
        });

        setShowPasswordReset(false);

        // Existing user with business or membership → go to dashboard
        if (hasBusiness || hasMembership) {
          navigate("/");
        } else {
          // No business yet → go to onboarding
          navigate("/onboarding");
        }
      } else {
        toast({
          title: t("auth.passwordResetSuccessTitle"),
          description: t("auth.signInWithNewPassword"),
        });
        setShowPasswordReset(false);
        setActiveTab("signin");
      }
    } catch (error: any) {
      toast({
        title: t("message.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auth method toggle - JSX variable instead of inline component to prevent focus loss
  const authMethodToggle = (
    <div className="flex items-center justify-center gap-2 mb-6">
      <Button
        type="button"
        variant={authMethod === "email" ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setAuthMethod("email");
          setShowOtpInput(false);
          setOtpSent(false);
          setOtp("");
        }}
        className={authMethod === "email" ? "bg-primary text-white" : ""}
      >
        <Mail className="h-4 w-4 mr-2" />
        {t("auth.emailMethod")}
      </Button>
      <Button
        type="button"
        variant={authMethod === "phone" ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setAuthMethod("phone");
          setShowOtpInput(false);
          setOtpSent(false);
          setOtp("");
        }}
        className={authMethod === "phone" ? "bg-primary text-white" : ""}
      >
        <Phone className="h-4 w-4 mr-2" />
        {t("auth.phoneMethod")}
      </Button>
    </div>
  );

  // Phone form (temporary password-based flow while MSG91 verifies account).
  // Renders differently for signin vs signup based on `activeTab`.
  // Signup tab or the "set/reset password" flow both use handlePhoneSignUp,
  // which upserts the user's password via the edge function and signs in.
  const isPhoneSignUpTab = activeTab === "signup";
  const isPhonePasswordSetup = !isPhoneSignUpTab && phonePasswordSetupMode;
  const isPhoneSignUp = isPhoneSignUpTab || isPhonePasswordSetup;

  const phoneSignInForm = (
    <div className="space-y-5">
      {isPhonePasswordSetup && (
        <div className="rounded-md border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
          {t("auth.phonePasswordSetupHint")}
        </div>
      )}
      <form onSubmit={isPhoneSignUp ? handlePhoneSignUp : handlePhoneSignIn} className="space-y-5">

        <div className="space-y-3">
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">
            {t("auth.phoneNumber")}
          </Label>
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="flex items-center gap-1 px-3 h-12 bg-muted rounded-md border border-border/50 text-sm text-foreground hover:bg-muted/80 transition-colors min-w-[100px]"
                disabled={loading}
              >
                <span>{countryCodes.find(c => c.code === countryCode)?.flag}</span>
                <span>{countryCode}</span>
                <svg className="w-2.5 h-2.5 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg>
              </button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg w-48">
                  <ul className="py-1">
                    {countryCodes.map((country) => (
                      <li key={country.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setCountryCode(country.code);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <span>{country.flag}</span>
                          <span>{country.country}</span>
                          <span className="text-muted-foreground ml-auto">{country.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="76 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              disabled={loading}
              required
              className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("auth.enterPhoneWithoutCode")}
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="phone-password" className="text-sm font-medium text-foreground">
            {t("auth.password")}
          </Label>
          <div className="relative">
            <Input
              id="phone-password"
              type={showPhonePassword ? "text" : "password"}
              placeholder={isPhoneSignUp ? t("auth.chooseStrongPassword") : t("auth.enterPassword")}
              value={phonePassword}
              onChange={(e) => setPhonePassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="h-12 pr-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-10 w-10 hover:bg-muted transition-colors"
              onClick={() => setShowPhonePassword(!showPhonePassword)}
              disabled={loading}
            >
              {showPhonePassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {isPhoneSignUp && (
          <div className="space-y-3">
            <Label htmlFor="phone-confirm-password" className="text-sm font-medium text-foreground">
              {t("auth.confirmPassword")}
            </Label>
            <Input
              id="phone-confirm-password"
              type={showPhonePassword ? "text" : "password"}
              placeholder={t("auth.confirmYourPasswordPlaceholder")}
              value={phoneConfirmPassword}
              onChange={(e) => setPhoneConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
          </div>
        )}

        {!isPhoneSignUp && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="phone-remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="phone-remember-me" className="text-sm font-normal cursor-pointer">
              {t("auth.rememberMe")}
            </Label>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPhonePasswordSetup
                ? t("auth.savingPassword")
                : isPhoneSignUp
                  ? t("auth.creatingAccount")
                  : t("auth.signingIn")}
            </div>
          ) : (
            isPhonePasswordSetup
              ? t("auth.setPasswordAndSignIn")
              : isPhoneSignUp
                ? t("auth.createAccount")
                : t("auth.signIn")
          )}
        </Button>

        {!isPhoneSignUpTab && (
          <div className="text-center text-sm">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary hover:text-primary-hover"
              onClick={() => {
                setPhonePasswordSetupMode((v) => !v);
                setPhonePassword("");
                setPhoneConfirmPassword("");
              }}
              disabled={loading}
            >
              {isPhonePasswordSetup
                ? t("auth.backToPhoneSignIn")
                : t("auth.setOrResetPhonePassword")}
            </Button>
          </div>
        )}
      </form>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-primary opacity-5"></div>
      <div className="absolute top-1/4 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 mb-6 hover-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.backToHome")}
          </Link>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <img src={logo} alt="MiBuks Logo" className="w-8 h-8" />

            <h1 className="text-2xl sm:text-3xl font-bold bg-primary dark:text-white bg-clip-text text-transparent">MiBuks</h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">{t("auth.tagline")}</p>
        </div>

        {/* Auth Card */}
        <Card className="professional-card animate-scale-in border-0 shadow-elegant">
          {/* Link Expired State */}
          {linkExpired ? (
            <>
              <CardHeader className="pb-6 pt-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">{t("auth.linkExpired")}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{t("auth.linkExpiredDesc")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                <Button
                  className="w-full h-12 bg-red-500 hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => {
                    setLinkExpired(false);
                    setShowForgotPassword(true);
                  }}
                >
                  {t("auth.requestNewLink")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => {
                    setLinkExpired(false);
                    setActiveTab("signin");
                  }}
                >
                  {t("auth.backToSignIn")}
                </Button>
              </CardContent>
            </>
          ) : showPasswordReset ? (
            // Password Reset for Existing Users (Forgot Password Flow)
            <>
              <CardHeader className="pb-6 pt-8">
                <div className="space-y-3 text-center">
                  <CardTitle className="text-xl sm:text-2xl text-foreground">{t("auth.resetPasswordTitle")}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{t("auth.resetPasswordDesc")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <form onSubmit={handlePasswordReset} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="reset-new-password" className="text-sm font-medium text-foreground">
                      {t("auth.newPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="reset-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.newPasswordPlaceholder")}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                        className="h-12 pr-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 hover:bg-muted transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reset-confirm-password" className="text-sm font-medium text-foreground">
                      {t("auth.confirmPassword")}
                    </Label>
                    <Input
                      id="reset-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t("auth.resettingPassword")}
                      </div>
                    ) : (
                      t("auth.resetPasswordButton")
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : showPasswordSetup ? (
            // Password Setup for Invited Users (New Team Members)
            <>
              <CardHeader className="pb-6 pt-8">
                <div className="space-y-3 text-center">
                  <CardTitle className="text-xl sm:text-2xl text-foreground">{t("auth.setPasswordTitle")}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{t("auth.setPasswordDesc")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <form onSubmit={handlePasswordSetup} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                      {t("auth.newPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.newPasswordPlaceholder")}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                        className="h-12 pr-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 hover:bg-muted transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
                      {t("auth.confirmPassword")}
                    </Label>
                    <Input
                      id="confirm-new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.confirmYourPasswordPlaceholder")}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t("auth.settingPassword")}
                      </div>
                    ) : (
                      t("auth.setPasswordAndContinue")
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : showForgotPassword ? (
            // Forgot Password Form (Request Reset Email)
            <>
              <CardHeader className="pb-6 pt-8">
                <div className="space-y-3 text-center">
                  <CardTitle className="text-2xl text-foreground">{t("auth.resetPasswordFormTitle")}</CardTitle>
                  <CardDescription className="text-base">
                    {t("auth.resetPasswordFormDesc")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                      {t("auth.emailAddress")}
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t("auth.enterEmailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t("auth.sendingResetEmail")}
                        </div>
                      ) : (
                        t("auth.sendResetEmail")
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setEmail("");
                      }}
                      disabled={loading}
                    >
                      {t("auth.backToSignIn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            // Sign In / Sign Up Tabs
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-6 pt-8">
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger
                    value="signin"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    {t("auth.signIn")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    {t("auth.signUp")}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="space-y-6 px-8 pb-8">
                <TabsContent value="signin" className="space-y-6 mt-0">
                  <div className="space-y-3 text-center">
                    <CardTitle className="text-2xl text-foreground">{t("auth.welcomeBackTitle")}</CardTitle>
                    <CardDescription className="text-base">{t("auth.signInContinue")}</CardDescription>
                  </div>

                  {authMethodToggle}

                  {authMethod === "email" ? (
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-3">
                        <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                          {t("auth.emailAddress")}
                        </Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder={t("auth.enterEmailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          required
                          className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                            {t("auth.password")}
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary hover:text-primary-hover text-sm"
                            onClick={() => setShowForgotPassword(true)}
                            disabled={loading}
                          >
                            {t("auth.forgotPasswordLink")}
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.enterPasswordPlaceholder")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="h-12 pr-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-10 w-10 hover:bg-muted transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                        <label
                          htmlFor="remember-me"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t("auth.rememberMe")}
                        </label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {t("auth.signingIn")}
                          </div>
                        ) : (
                          t("auth.signIn")
                        )}
                      </Button>
                    </form>
                  ) : (
                    phoneSignInForm
                  )}
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 mt-0">
                  <div className="space-y-3 text-center">
                    <CardTitle className="text-2xl text-foreground">{t("auth.createYourAccount")}</CardTitle>
                    <CardDescription className="text-base">
                      {t("auth.joinBusinesses")}
                    </CardDescription>
                  </div>

                  {authMethodToggle}

                  {authMethod === "email" ? (
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-3">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                          {t("auth.emailAddress")}
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t("auth.enterEmailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          required
                          className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                          {t("auth.password")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.chooseStrongPassword")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            minLength={6}
                            className="h-12 pr-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-10 w-10 hover:bg-muted transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                          {t("auth.confirmPassword")}
                        </Label>
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.confirmYourPasswordPlaceholder")}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          required
                          className="h-12 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {t("auth.creatingAccount")}
                          </div>
                        ) : (
                          t("auth.createAccount")
                        )}
                      </Button>
                    </form>
                  ) : (
                    phoneSignInForm
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {t("auth.termsAgreement")}{" "}
            <span className="text-primary hover:text-primary-hover cursor-pointer transition-colors">
              {t("auth.termsOfService")}
            </span>{" "}
            {t("auth.and")}{" "}
            <Link to="/privacy" className="text-primary hover:text-primary-hover transition-colors">
              {t("auth.privacyPolicy")}
            </Link>
            .
          </p>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-prosperity-green rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">{t("auth.trustedBy")}</span>
            </div>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("auth.privacyPolicy")}
            </Link>
            <Link to="/support" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t("auth.support")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}