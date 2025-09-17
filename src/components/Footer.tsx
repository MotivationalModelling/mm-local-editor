// Copyrights footer

import pkg from '../../package.json';

const Footer = () => {
  return (
    <div className="mt-auto">
      <p className="text-center">
        Version: {pkg.version}
        <br />
        &copy;<em>2018-2025 Queue Solutions Pty Ltd</em>
        <br />
        All rights reserved
        <br />
      </p>
    </div>
  );
};

export default Footer;
