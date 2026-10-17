import { useEffect, useState } from 'react';
import Portada from './pantallas/Portada.jsx';
import Plataforma from './pantallas/Plataforma.jsx';
import ProveedorSolicitud from './estado/ProveedorSolicitud.jsx';
import ErrorPantalla from './components/ErrorPantalla.jsx';

// Rutas por hash: "#/" portada, "#/app/<paso>" plataforma. Otros hashes (anclas como #como-funciona) caen en la portada.
const leerRuta = () => window.location.hash.replace(/^#\/?/, '');

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);

  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const [seccion, paso] = ruta.split('/');
  return (
    <ErrorPantalla>
      <ProveedorSolicitud>{seccion === 'app' ? <Plataforma pasoId={paso} /> : <Portada />}</ProveedorSolicitud>
    </ErrorPantalla>
  );
}
