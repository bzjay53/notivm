import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llytukvdaeeypqshqczo.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseXR1a3ZkYWVleXBxc2hxY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzkyNjQsImV4cCI6MjA2ODU1NTI2NH0.bfxl0pptEHJ3DypkWTUJw4Y2yYJ9gi3FLbIEk-D_QFs'
  }
};

export default nextConfig;
