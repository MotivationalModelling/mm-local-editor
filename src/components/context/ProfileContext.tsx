import React, {
    createContext,
    useContext
} from "react";

import useLocalStorage from "../utils/useLocalStorage";

type ProfileContextType = {
    authorName: string;
    avatarSeed: string;
    updateProfile: (name: string) => void;
    updateAvatarSeed: (seed: string) => void;
};

const ProfileContext =
    createContext<ProfileContextType | undefined>(
        undefined
    );

type ProfileProviderProps = {
    children: React.ReactNode;
};

export const ProfileProvider: React.FC<
    ProfileProviderProps
> = ({children}) => {
    const [authorName, setAuthorName] =
        useLocalStorage<string>(
            "ammber/authorName",
            ""
        );

    const [avatarSeed, setAvatarSeed] =
        useLocalStorage<string>(
            "ammber/avatarSeed",
            ""
        );

    const updateProfile = (name: string) => {
        setAuthorName(name);
    };

    const updateAvatarSeed = (seed: string) => {
        setAvatarSeed(seed);
    };

    const value = {
        authorName,
        avatarSeed,
        updateProfile,
        updateAvatarSeed
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfileContext = () => {
    const context =
        useContext(ProfileContext);

    if (!context) {
        throw new Error(
            "useProfileContext must be used within ProfileProvider"
        );
    }

    return context;
};
