export function slug(title: string) {
  return title.toLowerCase().replace(/ /g, "-");
}

export const getUniqueRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Internal test user functionality
const INTERNAL_TEST_EMAILS = [
  "test@14trees.org",
  "internal@14trees.org", 
  "dev@14trees.org",
  "vivayush@gmail.com"
  // Add more internal test emails as needed
];

export const isInternalTestUser = (email: string): boolean => {
  return INTERNAL_TEST_EMAILS.includes(email?.toLowerCase()) || email?.toLowerCase().includes("test@14trees");
};

export const getRazorpayConfig = (email: string) => {
  if (isInternalTestUser(email)) {
    return {
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  }
  return {
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
};

export const addInternalTestPrefix = (value: string, email: string): string => {
  if (isInternalTestUser(email)) {
    return `[TEST] ${value}`;
  }
  return value;
};

export const addInternalTestComments = (comments: string, email: string): string => {
  if (isInternalTestUser(email)) {
    const testComment = "[INTERNAL TEST] This is a test transaction using test Razorpay account.";
    return comments ? `${testComment}\n\n${comments}` : testComment;
  }
  return comments;
};

export const addInternalTestTags = (tags: string[], email: string): string[] => {
  if (isInternalTestUser(email)) {
    return [...tags, "InternalTest", "TestTransaction"];
  }
  return tags;
};

export const getInternalTestMetadata = (email: string, originalAmount?: number) => {
  if (isInternalTestUser(email)) {
    return {
      is_internal_test: true,
      test_user_email: email,
      original_amount: originalAmount,
      test_timestamp: new Date().toISOString(),
    };
  }
  return {};
};