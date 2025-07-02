function PricingSection() {
  return (
    <div
      id="pricing"
      className="pric text-center text-white py-5"
      style={{
        backgroundImage:
          'linear-gradient(rgba(70, 68, 68, 0.5), rgba(31, 30, 30, 0.5)), url("/path/to/your/image.jpg")',
          
        

      }}
    >
      <h2 className="display-3 fw-bold text-info mb-4 animate__animated animate__fadeInDown">
        Pricing Plans
      </h2>
      <p className="lead mb-5 animate__animated animate__fadeInUp fs-4 text-light">
        Choose the plan that fits your needs.
      </p>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-4 mb-4">
            <div className="card bg-dark text-white h-100 animate__animated animate__fadeInUp">
              <div className="card-body">
                <h5 className="card-title ">Free</h5>
                <p className="card-text">Basic AI detection for small files.</p>
                <h3 className="text-warning">$0</h3>
                <a href="#" className="btn btn-warning mt-3">Get Started</a>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card bg-dark text-white h-100 animate__animated animate__fadeInUp">
              <div className="card-body">
                <h5 className="card-title">Pro</h5>
                <p className="card-text">Advanced detection, priority support.</p>
                <h3 className="text-warning">$19/mo</h3>
                <a href="#" className="btn btn-warning mt-3">Upgrade</a>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card bg-dark text-white h-100 animate__animated animate__fadeInUp">
              <div className="card-body">
                <h5 className="card-title">Enterprise</h5>
                <p className="card-text">Custom solutions for large businesses.</p>
                <h3 className="text-warning">Contact Us</h3>
                <a href="#" className="btn btn-warning mt-3">Contact Sales</a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default PricingSection;
