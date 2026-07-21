export const AI_ERROR_MESSAGES = {
  AUTH_REQUIRED: "Vuelve a ingresar a la sesión.",
  TEACHER_REQUIRED: "Solo el docente de esta sesión puede solicitar este análisis.",
  FREE_MODEL_UNAVAILABLE: "No hay un modelo gratuito verificable disponible. La actividad continúa sin IA.",
  RATE_LIMITED: "Se alcanzó el límite de ayudas para esta etapa.",
  INVALID_MODEL_OUTPUT: "La IA no produjo un resultado verificable. No se aplicó ninguna recomendación.",
  ZEN_UNAVAILABLE: "El servicio de IA no está disponible. Continúa la clase y vuelve a intentarlo después.",
};

export function getOnlineSessionErrorMessage(error, action) {
  const details = `${error?.code || ""} ${error?.message || ""}`.toUpperCase();

  if (details.includes("COLLECTIVE_AI_ATTESTATION_REQUIRED")) {
    return "Se requiere atestación explícita de autorización docente para habilitar el análisis colectivo externo.";
  }

  if (details.includes("FREE_MODEL_UNAVAILABLE")) {
    return AI_ERROR_MESSAGES.FREE_MODEL_UNAVAILABLE;
  }

  if (details.includes("RATE_LIMIT")) {
    return AI_ERROR_MESSAGES.RATE_LIMITED;
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
