import {useState} from "react";
import {ColorResult, CompactPicker} from "react-color";
import Button from "react-bootstrap/Button";

type ColorPickerProps = {
    selectedColor: string;
    onColorChange: (color: ColorResult) => void;
};

const ColorPicker = ({selectedColor, onColorChange}: ColorPickerProps) => {
    const [showPicker, setShowPicker] = useState<boolean>(false);

    const handleButtonClick = () => {
        setShowPicker(!showPicker);
    };

    return (
        <div>
            {(showPicker) && (
                <div style={{position: "absolute", top: "10px", right: "250px"}}>
                    <CompactPicker color={selectedColor}
                                   onChangeComplete={onColorChange}/>
                </div>
            )}
            <Button className="w-100"
                    onClick={handleButtonClick}>
                Select colour
            </Button>
        </div>
    );
};

export default ColorPicker;