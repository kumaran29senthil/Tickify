"use client";
import { createRazorpayConnectAccountLink } from "@/app/actions/createRazorpayConnectAccoutLink";
import { createRazorpayConnectCustomer } from "@/app/actions/createRazorpayConnectCustomer";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { createRazorpayConnectLoginLink } from "@/app/actions/createRazorpayConnectLoginLink";
import { getRazorpayAccountStatus } from "@/app/actions/getRazorpayAccountStatus";
import type { AccountStatus } from "@/app/actions/getRazorpayAccountStatus";
import { CalendarDays, Cog, Plus, Check, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";
import { toast } from "sonner";

// Define onboarding steps
const ONBOARDING_STEPS = [
  {
    id: 'account_created',
    title: 'Account Created',
    description: 'Your Razorpay account has been initialized',
  },
  {
    id: 'kyc_started',
    title: 'KYC Started',
    description: 'You\'ve begun the verification process',
  },
  {
    id: 'kyc_submitted',
    title: 'KYC Submitted',
    description: 'Your documents are under review',
  },
  {
    id: 'kyc_verified',
    title: 'KYC Verified',
    description: 'Your identity has been verified',
  },
  {
    id: 'payments_enabled',
    title: 'Payments Enabled',
    description: 'You can now accept payments',
  },
  {
    id: 'payouts_enabled',
    title: 'Payouts Enabled',
    description: 'You can now receive money to your bank',
  },
];

export default function SellerDashboard() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const razorpayContactId = useQuery(api.users.getUsersRazorpayContactId, {
    userId: user?.id || "",
  });

  const isReadyToAcceptPayments = accountStatus?.isActive && accountStatus?.payoutsEnabled;

  // Start polling when account exists but isn't fully active
  useEffect(() => {
    if (razorpayContactId && (!accountStatus || !isReadyToAcceptPayments)) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [razorpayContactId, accountStatus, isReadyToAcceptPayments]);

  const startPolling = () => {
    stopPolling(); // Clear any existing interval
    const interval = setInterval(fetchAccountStatus, 30000); // Poll every 30 seconds
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const fetchAccountStatus = async () => {
    if (!razorpayContactId) return;
    
    try {
      const status = await getRazorpayAccountStatus(razorpayContactId);
      setAccountStatus(status);
      setError(null);
      
      // Stop polling if account is fully active
      if (status.isActive && status.payoutsEnabled) {
        stopPolling();
      }
    } catch (error) {
      console.error("Error fetching account status:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch account status");
    }
  };

  const handleManageAccount = async () => {
    try {
      if (!razorpayContactId) {
        throw new Error("No Razorpay account found");
      }
      
      const loginUrl = await createRazorpayConnectLoginLink(razorpayContactId);
      if (!loginUrl) {
        throw new Error("Failed to generate login URL");
      }
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Error accessing Razorpay dashboard:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error("Failed to access Razorpay dashboard");
    }
  };

  const handleCreateAccount = async () => {
    setAccountCreatePending(true);
    setError(null);
    try {
      const result = await createRazorpayConnectCustomer();
      if (!result?.contact) {
        throw new Error("Account creation failed");
      }
      toast.success("Razorpay account created successfully");
      await fetchAccountStatus();
    } catch (error) {
      console.error("Error creating Razorpay account:", error);
      setError(error instanceof Error ? error.message : "Account creation failed");
      toast.error("Failed to create Razorpay account");
    } finally {
      setAccountCreatePending(false);
    }
  };

  const handleCompleteRequirements = async () => {
    if (!razorpayContactId) return;
    
    setAccountLinkCreatePending(true);
    setError(null);
    try {
      const { url } = await createRazorpayConnectAccountLink(razorpayContactId);
      if (!url) {
        throw new Error("Failed to generate onboarding URL");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Error creating Razorpay account link:", error);
      setError(error instanceof Error ? error.message : "Failed to start onboarding");
      toast.error("Failed to complete requirements");
    } finally {
      setAccountLinkCreatePending(false);
    }
  };

  // Determine current onboarding step
  const getCurrentStep = () => {
    if (!accountStatus) return 0;
    
    if (accountStatus.payoutsEnabled) return 5; // Fully onboarded
    if (accountStatus.chargesEnabled) return 4;
    if (accountStatus.isActive) return 3; // KYC verified
    if (accountStatus.requiresInformation) return 2; // KYC submitted
    if (razorpayContactId) return 1; // Account created
    
    return 0; // Not started
  };

  const currentStep = getCurrentStep();

  if (!isLoaded || razorpayContactId === undefined) {
    return <Spinner />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Manage your seller profile and Razorpay payment settings
          </p>
        </div>

        {/* Onboarding Progress - Only show when account exists */}
        {razorpayContactId && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4">Onboarding Progress</h3>
            <div className="space-y-4">
              {ONBOARDING_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {index < currentStep ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    ) : index === currentStep ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        <span className="text-gray-500">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className={`${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm">{step.description}</p>
                    {index === currentStep && accountStatus?.requiresInformation && (
                      <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        <p>Action required: Please complete your KYC verification</p>
                        <button
                          onClick={handleCompleteRequirements}
                          disabled={accountLinkCreatePending}
                          className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                        >
                          {accountLinkCreatePending ? 'Processing...' : 'Continue Verification'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        {isReadyToAcceptPayments && (
          <>
            <div className="bg-white p-8 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Sell tickets for your events
              </h2>
              <p className="text-gray-600 mb-8">
                List your tickets for sale and manage your listings
              </p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex justify-center gap-4">
                  <Link
                    href="/seller/new-event"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Event
                  </Link>
                  <Link
                    href="/seller/events"
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <CalendarDays className="w-5 h-5" />
                    View My Events
                  </Link>
                </div>
              </div>
            </div>
            <hr className="my-8" />
          </>
        )}

        {/* Account Management Section */}
        <div className="p-6">
          {/* Account Creation Section */}
          {!razorpayContactId && !accountCreatePending && (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold mb-4">
                Start Accepting Payments with Razorpay
              </h3>
              <p className="text-gray-600 mb-6">
                Create your Razorpay seller account to start receiving payments securely
              </p>
              <button
                onClick={handleCreateAccount}
                disabled={accountCreatePending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Create Razorpay Account
              </button>
            </div>
          )}

          {/* Account Status Section */}
          {razorpayContactId && accountStatus && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Account Status
                  </h3>
                  <div className="mt-2 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        accountStatus.isActive ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-lg font-semibold">
                      {accountStatus.isActive ? "Active" : "Pending Setup"}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Payment Capability
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 ${
                          accountStatus.chargesEnabled
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2">
                        {accountStatus.chargesEnabled
                          ? "Can accept payments"
                          : "Cannot accept payments yet"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 ${
                          accountStatus.payoutsEnabled
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2">
                        {accountStatus.payoutsEnabled
                          ? "Can receive payouts"
                          : "Cannot receive payouts yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {accountStatus.requiresInformation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-3">
                    Required Information
                  </h3>
                  {accountStatus.requirements?.currently_due?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-yellow-800 font-medium mb-2">
                        Action Required:
                      </p>
                      <ul className="list-disc pl-5 text-yellow-700 text-sm">
                        {accountStatus.requirements.currently_due.map((req) => (
                          <li key={req}>{req.replace(/_/g, " ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accountStatus.requirements?.eventually_due?.length > 0 && (
                    <div>
                      <p className="text-yellow-800 font-medium mb-2">
                        Eventually Needed:
                      </p>
                      <ul className="list-disc pl-5 text-yellow-700 text-sm">
                        {accountStatus.requirements.eventually_due.map((req) => (
                          <li key={req}>{req.replace(/_/g, " ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={handleCompleteRequirements}
                    disabled={accountLinkCreatePending}
                    className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {accountLinkCreatePending ? "Processing..." : "Complete Requirements"}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={handleManageAccount}
                  disabled={!accountStatus.isActive}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Cog className="w-4 h-4 mr-2" />
                  Razorpay Dashboard
                </button>
                <button
                  onClick={fetchAccountStatus}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Refresh Status
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Loading States */}
          {accountCreatePending && (
           <div {...{ className: "text-center py-4 text-gray-600" } as React.HTMLAttributes<HTMLDivElement>}>
            <Spinner className="inline-block mr-2" />
              Creating your Razorpay account...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}