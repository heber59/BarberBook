import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPOINTMENT_DURATION = 60; // 1 hora en minutos

// Obtener slots disponibles para un barbero en una fecha específica
export const getAvailableSlots = async (barberId: string, date: Date) => {
  // Obtener horario de trabajo del barbero para ese día
  const dayOfWeek = date.getDay();

  const workingHours = await prisma.barberWorkingHours.findFirst({
    where: {
      barberId,
      dayOfWeek,
      isActive: true,
    },
  });

  if (!workingHours) {
    return []; // No trabaja ese día
  }

  // Obtener citas existentes para esa fecha
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId,
      startAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "scheduled",
    },
    select: {
      startAt: true,
      endAt: true,
    },
  });

  // Generar slots disponibles basados en el horario de trabajo
  const availableSlots: { start: Date; end: Date }[] = [];

  const [startHour, startMinute] = workingHours.startTime
    .split(":")
    .map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  let currentSlot = new Date(startTime);

  while (currentSlot < endTime) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + APPOINTMENT_DURATION);

    // Verificar si el slot está disponible
    const isBooked = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startAt);
      const aptEnd = new Date(apt.endAt);
      return currentSlot < aptEnd && slotEnd > aptStart;
    });

    const isPast = currentSlot < new Date(); // No permitir citas en el pasado

    if (!isBooked && !isPast && slotEnd <= endTime) {
      availableSlots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
      });
    }

    currentSlot.setMinutes(currentSlot.getMinutes() + APPOINTMENT_DURATION);
  }

  return availableSlots;
};

export const getWeeklyAvailability = async (
  barberId: string,
  startDate: Date = new Date()
) => {
  const weekSlots: { [key: string]: { start: Date; end: Date }[] } = {};

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const dateKey = currentDate.toISOString().split("T")[0];
    weekSlots[dateKey] = await getAvailableSlots(barberId, currentDate);
  }

  return weekSlots;
};

export const isSlotAvailable = async (
  barberId: string,
  startAt: Date,
  endAt: Date
) => {
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      barberId,
      OR: [
        {
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      ],
      status: { not: "canceled" },
    },
  });

  return !conflictingAppointment;
};

export const getBarberWorkingHours = async (barberId: string) => {
  return await prisma.barberWorkingHours.findMany({
    where: {
      barberId,
      isActive: true,
    },
    orderBy: {
      dayOfWeek: "asc",
    },
  });
};

export const setBarberWorkingHours = async (
  barberId: string,
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[]
) => {
  await prisma.barberWorkingHours.deleteMany({
    where: { barberId },
  });

  return await prisma.barberWorkingHours.createMany({
    data: workingHours.map((wh) => ({
      ...wh,
      barberId,
    })),
  });
};

export default {
  getAvailableSlots,
  getWeeklyAvailability,
  isSlotAvailable,
  getBarberWorkingHours,
  setBarberWorkingHours,
};
