import { useState } from "react";
import { ColorResult, CompactPicker } from "react-color";

type ColorPickerProps = {
  selectedColor: string;
  onColorChange: (color: ColorResult) => void;
};

const ColorPicker = ({ selectedColor, onColorChange }: ColorPickerProps) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const handleButtonClick = () => {
    setShowPicker(!showPicker);
  };

  return (
    <div>
      {showPicker && (
        <div

          style={{ position: "absolute", top: "10px", right: "250px" }}
        >
          <CompactPicker color={selectedColor} onChangeComplete={onColorChange} />
        </div>
      )}
      <button onClick={handleButtonClick}>Select Colour</button>
    </div>
  );
};

export default ColorPicker;