// Contexto compartido entre la Portada y la Plataforma (formulario, documento y ficha de visita).
import { createContext, useContext } from 'react';

export const ContextoSolicitud = createContext(null);

export function useSolicitud() {
  const valor = useContext(ContextoSolicitud);
  if (!valor) throw new Error('useSolicitud debe usarse dentro de <ProveedorSolicitud>.');
  return valor;
}
