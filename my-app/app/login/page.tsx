import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Logo from "@/public/images/logo.svg";
import SignupForm from "@/components/signup-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center space-y-6">
        {/* SVG Logo */}
        <Image src={Logo} alt="Logo" />

        {/* Login Form */}
        <LoginForm />
        <SignupForm />
      </div>
    </div>
  );
}
