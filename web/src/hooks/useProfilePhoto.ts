import { getProfile } from "@/services/profile.api";
import { useState, useEffect } from "react";

export const useProfilePhoto = () => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        setLoading(true);
        const profileResponse = await getProfile();
        if (profileResponse?.data?.photo) {
          setPhotoUrl(profileResponse.data.photo);
        }
      } catch (error) {
        console.error("Failed to fetch profile photo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePhoto();
  }, []);

  const refreshPhoto = async () => {
    try {
      const profileResponse = await getProfile();
      if (profileResponse?.data?.photo) {
        setPhotoUrl(profileResponse.data.photo);
      }
    } catch (error) {
      console.error("Failed to refresh profile photo:", error);
    }
  };

  return {
    photoUrl,
    loading,
    refreshPhoto,
  };
};
