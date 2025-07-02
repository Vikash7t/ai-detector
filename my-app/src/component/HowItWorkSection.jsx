// src/components/HowItWorksSection.jsx
import './HowItWorkSection.css';

function HowItWorksSection() {
  return (
    <div className="container  text-center my-5">
      <h2 className=" how1 fs-1 fw-bold  mb-4">How It Works</h2>
      <div className="row">
        <div className="col-md-4">
          <h5 className="upload fs-5">1. Upload</h5>
          <p className="select fs-5">Select an image, video, or document to scan.</p>
        </div>
        <div className="col-md-4">
          <h5 className="analyze fs-5">2. Analyze</h5>
          <p className=" we fs-5">We check your file for AI-generated patterns.</p>
        </div>
        <div className="col-md-4">
          <h5 className="get fs-5">3. Get Result</h5>
          <p className=" see fs-5">See instantly whether your file is authentic or AI-made.</p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksSection;
