import React from "react";

import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";

import ColourPickerCard from "./ColourPickerCard.tsx";
import ZoomPickerCard from "./ZoomPickerCard.tsx";
import ResetGraphButton from "../../ResetGraphButton.tsx";

interface Props {
    recentreView: () => void
    className?: string
}

const Sidebar: React.FC<Props> = ({recentreView, className}) => {
    return (
        <Stack gap={1} className={className}>
            <Button size="sm" variant="secondary">
                Show section 1
            </Button>
            <ResetGraphButton/>

            <ColourPickerCard/>
            <ZoomPickerCard/>
        </Stack>
    );
};

export default Sidebar;
