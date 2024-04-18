import React, {useState} from "react";

import WelcomeHeader from "./WelcomeHeader";
import WelcomeFooter from "./WelcomeFooter";
import WelcomeButtons from "./WelcomeButtons";
import {DetailCarousel} from "./DetailCarousel";

const Welcome = () => {
    const [isDragging, setIsDragging] = useState(false);

    // Handle dragging files to upload
    const handleDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
        evt.preventDefault();
        setIsDragging(true);
    };

    return (
        <div className="over-container d-flex p-3 flex-column text-center"
             onDragOver={handleDragOver}
             id="bg">
            <WelcomeHeader/>
            <main role="main" className="inner cover">
                <DetailCarousel/>
                <WelcomeButtons isDragging={isDragging} setIsDragging={setIsDragging}/>
            </main>
            <WelcomeFooter destination="papers" name="Papers"/>
        </div>
    );
};

export default Welcome;
