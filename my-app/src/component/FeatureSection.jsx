import { FaBolt, FaCheck, FaFile } from "react-icons/fa";
import './FeatureSection.css';

function FeatureSection() {
  return (
    <div id="Features"
     className="container text-center   my-5">
      <h2 className="feat1 fw-bold fs-1  mb-4">Features</h2>
      <div className="row">
        <div className="col-md-4">
          <FaBolt size={40} className="text-warning  mb-3" />
          <h5 className="text-warning fs-5">Fast Analysis</h5>
          <p className="text-warning fs-5">Detect AI content in seconds.</p>
        </div>
        <div className="col-md-4">
          <FaCheck size={40} className="text-success   mb-3" />
          <h5  className="text-success fs-5" >High Accuracy</h5>
          <p className="text-success fs-5">Reliable detection algorithms.</p>
        </div>
        <div className="col-md-4">
          <FaFile size={40} className="text-primary  mb-3" />
          <h5 className="text-primary fs-5">Multi-Format</h5>
          <p className="text-primary fs-5">Analyze images, videos, and files.</p>
        </div>
      </div>
    </div>
  );
};
export default FeatureSection;
