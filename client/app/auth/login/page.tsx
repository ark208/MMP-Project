'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import {
  GraduationCap,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'University email is required')
    .email('Please enter a valid email address')
    .refine(
      (val) => {
        const lower = val.toLowerCase();
        return lower.endsWith('.edu') || lower.endsWith('.ac.in') || lower.includes('campus');
      },
      {
        message: 'Must be a valid college or university email (e.g. .edu or .ac.in)',
      }
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Please enter the complete 6-digit passcode')
    .regex(/^\d+$/, 'Passcode must contain digits only'),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { requestOtp, verifyOtp } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setValue: setEmailValue,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // OTP form
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    setValue: setOtpValue,
    formState: { errors: otpErrors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSendEmail = (data: EmailFormValues) => {
    startTransition(async () => {
      try {
        const res = await requestOtp(data.email);
        setCurrentEmail(data.email);
        setStep('otp');
        toast.success(res.message || 'Verification passcode sent!');
      } catch (err: any) {
        toast.error(err.message || 'Failed to send OTP. Please check your email.');
      }
    });
  };

  const onVerifyOtp = (data: OtpFormValues) => {
    startTransition(async () => {
      try {
        await verifyOtp(currentEmail, data.otp);
        toast.success('Welcome back to CampusLoop!');
        router.push(redirectUrl);
      } catch (err: any) {
        toast.error(err.message || 'Invalid or expired OTP passcode.');
      }
    });
  };

  const fillDemoEmail = () => {
    setEmailValue('email', '2025kucp1031@iiitkota.ac.in', { shouldValidate: true });
  };

  const fillDemoOtp = () => {
    setOtpValue('otp', '123456', { shouldValidate: true });
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-[#F5DDD6] dark:bg-[#2a1410]/80 text-[#B9573B] dark:text-[#d4795c] mb-4 shadow-xs">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {step === 'email' ? 'University Sign In' : 'Enter Passcode'}
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {step === 'email'
            ? 'Connect with verified campus members & access lost & found'
            : `We sent a 6-digit passcode to ${currentEmail}`}
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        {step === 'email' ? (
          <>
            {/* College Email Policy Notice */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <span className="font-bold">Campus Verification Policy:</span> Only active university email addresses (e.g., 2025kucp1031@iiitkota.ac.in or .ac.in) are permitted to safeguard campus safety and authenticity.
              </div>
            </div>

            <form onSubmit={handleEmailSubmit(onSendEmail)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Campus Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...registerEmail('email')}
                    type="email"
                    placeholder="2025kucp1031@iiitkota.ac.in"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#B9573B] transition-all text-sm font-medium"
                  />
                </div>
                {emailErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#B9573B] hover:bg-[#a34e34] text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                <span>{isPending ? 'Sending Passcode...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Helper */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <button
                type="button"
                onClick={fillDemoEmail}
                className="text-xs text-[#B9573B] dark:text-[#d4795c] hover:underline font-medium inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Demo Email (2025kucp1031@iiitkota.ac.in)
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    6-Digit Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-xs text-neutral-500 hover:text-[#B9573B] dark:hover:text-[#d4795c] font-medium"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    {...registerOtp('otp')}
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#B9573B] transition-all text-center tracking-widest text-lg font-bold"
                  />
                </div>
                {otpErrors.otp && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Test Mock OTP:</span>
                <button
                  type="button"
                  onClick={fillDemoOtp}
                  className="font-mono font-bold text-[#B9573B] dark:text-[#d4795c] bg-white dark:bg-neutral-900 px-2 py-1 rounded shadow-xs"
                >
                  123456
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#B9573B] hover:bg-[#a34e34] text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isPending ? 'Verifying...' : 'Verify & Enter CampusLoop'}</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => onSendEmail({ email: currentEmail })}
                  disabled={isPending}
                  className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Didn&apos;t receive it? Resend OTP
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
