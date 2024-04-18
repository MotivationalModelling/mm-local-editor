import { Link } from "react-router-dom";
import Footer from "./Footer";

type WelcomeFooterProps = {
  name: string;
  destination: string;
};

// Footer section in welcome page including copyrights, papers, user manual...
const WelcomeFooter = ({ name, destination }: WelcomeFooterProps) => {
  return (
    <footer className="mastfoot mt-auto">
      <div className="inner text-center">
        <p>
          <Link to={`/${destination}`} className="text-decoration-none">
            {name}
          </Link>
          &nbsp;|&nbsp;
          <Link
            to="https://motivationalmodelling.com/kb/"
            className="text-decoration-none"
            target="_kb"
          >
            Knowledge Base
          </Link>
          &nbsp;|&nbsp;
          <Link
            to="/papers/usermanual.pdf"
            target="_blank"
            className="text-decoration-none"
          >
            User Manual
          </Link>
        </p>
      </div>
      <Footer />
    </footer>
  );
};

export default WelcomeFooter;
