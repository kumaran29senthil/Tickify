"use server";

export type AccountStatus = {
  isActive: boolean;
  requiresInformation: boolean;
  kycStatus?: 'not_started' | 'started' | 'submitted' | 'verified' | 'failed';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
  };
};

export async function getRazorpayAccountStatus(
  razorpayAccountId: string
): Promise<AccountStatus> {
  if (!razorpayAccountId) {
    throw new Error("No Razorpay account ID provided");
  }

  try {
    // Fetch sub-account details from Razorpay
    const accountResponse = await fetch(`https://api.razorpay.com/v1/payments`,
      {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      throw new Error("Razorpay API Error: " + errorText);
    }

    const accountData = await accountResponse.json();

    const kycStatus: AccountStatus["kycStatus"] =
      accountData.verification?.status === "verified"
        ? "verified"
        : accountData.verification?.status === "failed"
        ? "failed"
        : accountData.verification?.status === "submitted"
        ? "submitted"
        : accountData.verification?.status === "under_review"
        ? "started"
        : "not_started";

        return {
          isActive: accountData.status === "activated",
          requiresInformation: accountData.status !== "activated",
          kycStatus,
          requirements: {
            currently_due: accountData.requirements?.currently_due || [],
            eventually_due: accountData.requirements?.eventually_due || [],
          },
          chargesEnabled: accountData.settings?.payments?.enabled || false,
          payoutsEnabled: accountData.settings?.payouts?.enabled || false,
        };
  } catch (error: any) {
    console.error("Error fetching Razorpay account status:", error?.message || error);
    throw new Error(`Failed to fetch Razorpay account status: ${error?.message || error}`);
  }
  
}
