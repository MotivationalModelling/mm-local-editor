import Stack from "react-bootstrap/Stack";
import {CollapsibleSidebarCard} from "./CollapsibleSidebarCard.tsx";
import {BsXCircle, BsZoomIn, BsZoomOut} from "react-icons/bs";

const ZoomPickerCard = () => {
    return (
        <CollapsibleSidebarCard title="Zoom">
            <Stack direction="horizontal" gap={3}>
                <BsZoomOut/>
                <BsXCircle/>
                <BsZoomIn/>
            </Stack>
        </CollapsibleSidebarCard>
    );
};

export default ZoomPickerCard;