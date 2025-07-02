import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './navbar_style.css';
import Logo from '../assets/logo.jpg';


function Navbar(){
  

  return (
    <nav className="navbar fixed-top navbar-expand-lg navbar-light bg-transparent p-1">
      <a className="navbar-brand fw-bold d-flex flex-column align-items-center" href="#">
        <img src={Logo} alt="AI DETECTOR" width="40" height="40" />
        <span className='aiv mt-1'>AI DETECTOR</span> 
      </a>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavDropdown"
        aria-controls="navbarNavDropdown"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNavDropdown">
        <ul className="navbar-nav w-100 d-flex justify-content-evenly">
          <li className="nav-item">
            <a className=" nav-link fs-5" href="#hero">
            <span>Get Started</span>
            </a>
          </li>
          <li className="nav-item fs-5">
            <a className="nav-link feat" href="#Features">
              Features
            </a>
          </li>
          <li className="nav-item fs-5">
            <a className="nav-link pric" href="#pricing">
              Pricing
            </a>
          </li>
         
        </ul>
       
           <form className="d-flex align-items-center">
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
            style={{width:'300px'}}
          />
          
          <button className="btn btn-outline-light  " type="submit">
            Search
          </button>
        </form>
      </div>
    </nav>
  );
}

export default Navbar;
