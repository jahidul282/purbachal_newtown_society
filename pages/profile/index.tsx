import React from "react";
import dynamic from "next/dynamic";

const Profile = dynamic(() => import("@/components/Profile"), { ssr: false });

export default function ProfilePage() {
  return <Profile />;
}

