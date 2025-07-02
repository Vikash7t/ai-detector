function HeroSection() {
  return (
    <div id="hero"
      className="text-center d-flex flex-column justify-content-center align-items-center"
      style={{
        backgroundImage:
          'linear-gradient(rgba(70, 68, 68, 0.5), rgba(31, 30, 30, 0.5)), url("/path/to/your/image.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '70vh',
        
      }}
    >
      <div className="heroupload ">
        <h1 className="display-3 fw-bold animate__animated animate__fadeInDown text-info mb-5">
          Detect AI-Generated Content
        </h1>
        <p className=" fs-2 lead animate__animated animate__fadeInUp text-center text-warning">
          Upload your media and know the truth instantly.
        </p>
      </div>
      <a
        href="#"
        className="btn btn-success btn-lg mt-3 animate__animated animate__fadeInUp"
      >
        Upload Now
      </a>
    </div>
  );
}

export default HeroSection;
