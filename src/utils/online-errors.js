export function getOnlineSessionErrorMessage(error, action) {
  const details = `${error?.code || ""} ${error?.message || ""}`.toUpperCase();

  if (details.includes("COLLECTIVE_AI_ATTESTATION_REQUIRED")) {
    return "Se requiere atestación explícita de autorización docente para habilitar el análisis colectivo externo.";
  }

  if (details.includes("FREE_MODEL_UNAVAILABLE")) {
    return "No hay un modelo gratuito verificado disponible en este momento. La clase continuará sin IA.";
  }

  if (details.includes("SUPABASE ENVIRONMENT VARIABLES ARE MISSING")) {
    return "Supabase no está configurado en esta app. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.";
  }

  if (details.includes("ANONYMOUS") && details.includes("DISABLED")) {
    return "El acceso anónimo está deshabilitado en Supabase Auth. Activa Anonymous Sign-Ins en Authentication.";
  }

  if (details.includes("ROW-LEVEL SECURITY") || details.includes("POLICY")) {
    return "Supabase rechazó la operación por políticas RLS. Verifica tu membresía y permisos en la sesión.";
  }

  if (details.includes("RELATION") && details.includes("PS_")) {
    return "Las tablas ps_* de Paideia Sensemaking no existen aún en Supabase. Ejecuta las migraciones antes de continuar.";
  }

  return `No se pudo ${action}. ${error?.message || "Verifica la conexión e inténtalo de nuevo."}`;
}
