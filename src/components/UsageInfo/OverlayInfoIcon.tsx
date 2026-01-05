import { BsInfoCircleFill } from "react-icons/bs";

/**
 * Wraps an icon so it works with OverlayTrigger.
 * OverlayTrigger needs a ref to make it visible, and react-icons do not forward refs.
 */

export const OverlayInfoIcon = () => {
  return (
    <span className="ms-1">
      <BsInfoCircleFill />
    </span>
  );
};
