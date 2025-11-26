import {useState} from "react";
import {ColorResult, CompactPicker} from "react-color";
import Button from "react-bootstrap/Button";

type ColorPickerProps = {
    selectedColor: string
    onColorChange: (color: ColorResult) => void
    className?: string
};

const ColorPicker = ({selectedColor, onColorChange, className}: ColorPickerProps) => {
    const [showPicker, setShowPicker] = useState(false);
    const toggleShowColourPicker = () => {
        setShowPicker(!showPicker);
    };

    return (
        <div className={className}>
            {(showPicker) && (
                <div style={{position: "absolute", top: "10px", right: "250px"}}>
                    <CompactPicker color={selectedColor}
                                   onChangeComplete={onColorChange}/>
                </div>
            )}
            <Button className="w-100"
                    onClick={toggleShowColourPicker}
                    size="sm"
                    variant="secondary">
                {(showPicker) ? "Hide colour" : "Select colour"}
            </Button>
        </div>
    );
};

export default ColorPicker;