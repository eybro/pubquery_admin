'use client'; // Ensures this is a Client Component, where you can use the hook

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; 

const IndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return; 
};

export default IndexPage;