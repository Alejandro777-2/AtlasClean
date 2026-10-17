import { useEffect, useState } from 'react';
import Portada from './pantallas/Portada.jsx';
import Plataforma from './pantallas/Plataforma.jsx';
import Login from './pantallas/Login.jsx';
import ProveedorSolicitud from './estado/ProveedorSolicitud.jsx';
import ErrorPantalla from './components/ErrorPantalla.jsx';

// Rutas por hash: "#/" portada, "#/login" autenticación, "#/app/<paso>" plataforma.
const leerRuta = () => window.location.hash.replace(/^#\/?/, '');

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [sesion, setSesion] = useState(() => {
    try {
      const guardada = localStorage.getItem('atlas_sesion');
      return guardada ? JSON.parse(guardada) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const alAutenticar = (datosSesion) => {
    setSesion(datosSesion);
    window.location.hash = '#/app/requisitos';
  };

  const alCerrarSesion = () => {
    localStorage.removeItem('atlas_sesion');
    setSesion(null);
    window.location.hash = '#/';
  };

  const [seccion, paso] = ruta.split('/');

  let pantalla;
  if (seccion === 'login') pantalla = <Login alAutenticar={alAutenticar} />;
  else if (seccion === 'app') pantalla = sesion ? <Plataforma pasoId={paso || 'requisitos'} sesion={sesion} alCerrarSesion={alCerrarSesion} /> : <Login alAutenticar={alAutenticar} />;
  else pantalla = <Portada sesion={sesion} />;

  // ProveedorSolicitud: estado del módulo del cliente (formulario, documento y ficha de visita).
  // ErrorPantalla: si una pantalla falla, muestra el error en vez de dejar la página en blanco.
  return (
    <ErrorPantalla>
      <ProveedorSolicitud>{pantalla}</ProveedorSolicitud>
    </ErrorPantalla>
  );
}
