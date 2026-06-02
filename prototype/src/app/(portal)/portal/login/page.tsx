"use client";

/**
 * Supplier portal login (mock email + OTP). The model specifies email-OTP auth;
 * here it is faked (any 6 digits) — the auth mechanism is mocked, the portal
 * itself is real. Demonstrates the external two-sided access without real auth.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PortalLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("ap@synthex-ingredients.com");
  const [otp, setOtp] = useState("");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Supplier Portal</CardTitle>
          <CardDescription>Sign in to respond to Harvest Foods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <>
              <div>
                <Label className="text-xs">Work email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" data-testid="login-email" />
              </div>
              <Button className="w-full" data-testid="login-send-otp" onClick={() => { setStep("otp"); toast.success("OTP sent (demo: any 6 digits)"); }}>
                Send one-time code
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs">One-time code</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 font-mono" placeholder="••••••" data-testid="login-otp" />
              </div>
              <Button
                className="w-full"
                data-testid="login-verify"
                onClick={() => {
                  if (otp.length < 4) { toast.error("Enter the code"); return; }
                  router.push("/portal");
                }}
              >
                Verify & enter portal
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
