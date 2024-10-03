import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import {CollapsibleSidebarCard} from "./CollapsibleSidebarCard.tsx";

const ColourPickerCard = () => {
    const colours = ["danger", "success", "warning"];

    return (
        <CollapsibleSidebarCard title="Colour">
            <Stack gap={1}>
                {colours.map((colour) => (
                    <Button variant={colour}
                            style={{height: "30px"}}/>
                ))}
            </Stack>
        </CollapsibleSidebarCard>
    );
};

export default ColourPickerCard;