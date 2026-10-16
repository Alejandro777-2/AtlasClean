import { useState } from 'react';
import { Boton, Campo, Insignia, Marca } from '../components/ui.jsx';

export default function Login({ alAutenticar }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    setTimeout(() => {
      // Validación con credenciales oficiales de demostración para el jurado
      if (usuario.trim().toLowerCase() === 'admin@expoclean.com' && clave === 'admin2026') {
        const sesion = {
          usuario: 'admin@expoclean.com',
          nombre: 'Auditor Expo Clean',
          rol: 'Evaluador Jurado - Reto 2',
          token: 'token-expo-clean-2026',
          fecha: new Date().toISOString()
        };
        localStorage.setItem('atlas_sesion', JSON.stringify(sesion));
        setCargando(false);
        if (alAutenticar) {
          alAutenticar(sesion);
        } else {
          window.location.hash = '#/app/requisitos';
        }
      } else {
        setCargando(false);
        setError('Credenciales no válidas. Usa las credenciales demo: admin@expoclean.com / admin2026');
      }
    }, 300);
  };

  const usarDemo = () => {
    setUsuario('admin@expoclean.com');
    setClave('admin2026');
    setError('');
  };

  return (
    <div className="login-pantalla">
      <header className="portada-nav">
        <div className="portada-nav__interior">
          <a href="#/" className="lateral__marca" aria-label="Volver a inicio">
            <Marca />
          </a>
          <a href="#/" className="boton boton--fantasma">
            ← Volver al portal
          </a>
        </div>
      </header>

      <main className="login-contenedor">
        <div className="login-tarjeta panel">
          <div className="login-tarjeta__cab">
            <div className="login-logo-circulo">
              <span className="marca__simbolo" aria-hidden="true">A</span>
            </div>
            <Insignia tono="info">Expo Clean Ecuador 2026</Insignia>
            <h1>Acceso a la Plataforma</h1>
            <p className="texto-suave">Ingresa tus credenciales para gestionar el levantamiento y cotizaciones del Reto 2.</p>
          </div>

          {error && (
            <div className="alerta-error">
              <Insignia tono="error">Error</Insignia>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={manejarSubmit} className="login-form">
            <Campo etiqueta="Usuario / Correo Electrónico">
              {(id) => (
                <input
                  id={id}
                  type="email"
                  className="entrada"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin@expoclean.com"
                  required
                />
              )}
            </Campo>

            <Campo etiqueta="Contraseña">
              {(id) => (
                <input
                  id={id}
                  type="password"
                  className="entrada"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              )}
            </Campo>

            <div className="login-credenciales-demo">
              <div className="login-credenciales-demo__texto">
                <strong>Credenciales de evaluación para el Jurado:</strong>
                <p>Usuario: <code>admin@expoclean.com</code></p>
                <p>Contraseña: <code>admin2026</code></p>
              </div>
              <button type="button" onClick={usarDemo} className="boton boton--secundario boton--pequeno">
                Autocompletar Demo
              </button>
            </div>

            <Boton variante="destacado" type="submit" disabled={cargando} className="boton-ancho-total">
              {cargando ? 'Validando...' : 'Iniciar Sesión y Entrar al Sistema'}
            </Boton>
          </form>

          <div className="login-pie">
            <span className="texto-suave">Sistema oficial de cotización técnica diferenciada · Reto 2</span>
          </div>
        </div>
      </main>
    </div>
  );
}
