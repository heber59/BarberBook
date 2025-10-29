export async function handleBookingIntent(
  parsedData: any,
  phone: string
): Promise<string> {
  if (!parsedData.fecha || !parsedData.hora) {
    return "Para reservar una cita, necesito saber:\n- Fecha (ej: 15/12/2024)\n- Hora (ej: 14:30)\n- ¿Qué barbero prefieres?";
  }
  return `Perfecto! Estoy procesando tu reserva para el ${parsedData.fecha} a las ${parsedData.hora}. Te confirmaré en breve.`;
}

export async function handleCancelIntent(
  parsedData: any,
  phone: string
): Promise<string> {
  return "Estoy procesando la cancelación de tu cita. Te enviaré una confirmación shortly.";
}

export async function handleQueryIntent(parsedData: any): Promise<string> {
  return "Puedo mostrarte los horarios disponibles. ¿Para qué fecha y barbero te interesa?";
}
