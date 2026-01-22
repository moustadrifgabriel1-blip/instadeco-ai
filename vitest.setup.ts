// Vitest Setup File
// Global mocks and configuration

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.FAL_KEY = 'test-fal-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
