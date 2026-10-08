import React, {useMemo} from "react";

import generateAvatar from "animal-avatar-generator";

interface AvatarProps {
    seed: string;
    size: number;
    className?: string;
}

// Renders a deterministic animal avatar for the given seed (typically the
// author's name). The same seed always produces the same avatar.
const Avatar: React.FC<AvatarProps> = ({
    seed,
    size,
    className
}) => {
    const svg = useMemo(
        () =>
            generateAvatar(seed.trim() || "?", {
                size
            }),
        [seed, size]
    );

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{__html: svg}}
        />
    );
};

export default Avatar;
