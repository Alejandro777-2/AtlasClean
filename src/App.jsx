import { useEffect, useState } from 'react';
import Portada from './pantallas/Portada.jsx';
import Plataforma from './pantallas/Plataforma.jsx';
import Login from './pantallas/Login.jsx';

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

  if (seccion === 'login') {
    return <Login alAutenticar={alAutenticar} />;
  }

  if (seccion === 'app') {
    if (!sesion) {
      return <Login alAutenticar={alAutenticar} />;
    }
    return <Plataforma pasoId={paso || 'requisitos'} sesion={sesion} alCerrarSesion={alCerrarSesion} />;
  }

  return <Portada sesion={sesion} />;
}
