"use client";

import { ProfileForm } from "@/components/profile/ProfileForm";

const Profile = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Profil Utilisateur</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Mettez à jour vos informations personnelles.
      </p>
      <div className="flex justify-center">
        <ProfileForm />
      </div>
    </div>
  );
};

export default Profile;