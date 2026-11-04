import {ColorResult, CompactPicker} from "react-color";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

type ColorPickerProps = {
    selectedColor: string
    onColorChange: (color: ColorResult) => void
    className?: string
};

const ColorPicker = ({selectedColor, onColorChange, className}: ColorPickerProps) => {
    return (
        <div className={className}>
            <OverlayTrigger trigger="click" placement="left" rootClose overlay={
                <Popover id="colour-picker">
                    <Popover.Body className="p-0">
                        <CompactPicker color={selectedColor} onChangeComplete={onColorChange}/>
                    </Popover.Body>
                </Popover>
            }>
                <Button className="w-100" size="sm" variant="secondary">
                    Custom…
                </Button>
            </OverlayTrigger>
        </div>
    );
};

export default ColorPicker;
