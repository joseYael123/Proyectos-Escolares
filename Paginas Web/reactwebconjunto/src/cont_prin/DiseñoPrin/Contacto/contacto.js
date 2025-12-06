import React from "react";
import santanderLogo from "../../imagenes/santander_Logo.jpg";
import Footer from '../Footer/Footer';

function Contacto() {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger shadow-sm">
        <div className="container position-relative d-flex align-items-center">
          <img
            src={santanderLogo}
            alt="Logo Conjunto Santander"
            className="me-3 santander-logo"
            style={{ width: 100, height: 80, objectFit: "contain" }}
          />

          <a
            className="navbar-brand navbar-brand-centered"
            href="#"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Conjunto Santander
          </a>
        </div>
      </nav>

      <main className="container my-5">
        <div className="card shadow-lg border-0">
          <div className="card-body p-0">
            <div className="row g-0">
              <div className="col-lg-5 d-flex flex-column justify-content-center p-4 p-md-5 bg-black text-white rounded-start">
                <h2 className="fw-bold mb-3">Ponte en Contacto</h2>
                <p className="mb-4">
                  Nos encantaría saber de ti. Completa el formulario
                  o utiliza uno de los siguientes canales para comunicarte
                  con nuestro equipo.
                </p>

                <div className="mb-3">
                  <h5>
                    <i className="bi bi-envelope-fill me-2"></i>
                    Email
                  </h5>
                  <p className="mb-0">contacto@conjuntosantander.com</p>
                </div>

                <div className="mb-3">
                  <h5>
                    <i className="bi bi-telephone-fill me-2"></i>
                    Teléfono
                  </h5>
                  <p className="mb-0">+52 (33) 1234 5678</p>
                </div>

                <div>
                  <h5>
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Ubicación
                  </h5>
                  <p className="mb-0">
                    Av. Periférico Norte No. 1695
                    <br />
                    Col. Parque Industrial Belenes Norte
                    <br />
                    Zapopan, Jalisco C.P. 45145
                  </p>
                </div>
              </div>

              <div className="col-lg-7 p-4 p-md-5">
                <form method="post">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label htmlFor="nombre" className="form-label">
                        Nombre(s)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="correo" className="form-label">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="correo"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="texto-area" className="form-label">
                      Escribe tus dudas o sugerencias
                    </label>
                    <textarea
                      className="form-control"
                      id="texto-area"
                      rows="8"
                      required
                    ></textarea>
                  </div>

                  <button className="btn btn-danger btn-lg w-100 mt-3">
                    Enviar Mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Contacto;
