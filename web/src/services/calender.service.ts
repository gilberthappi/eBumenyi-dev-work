/* eslint-disable @typescript-eslint/no-explicit-any */
import { IEvent, IResponse } from "@/types";
import api from "./api";

export const getAllEvents = async (): Promise<IResponse<IEvent[]>> => {
  return (await api.get("/calendar/events")).data;
};

export const getEventById = async (id: string): Promise<IResponse<IEvent>> => {
  return (await api.get(`/calendar/events/${id}`)).data;
};

export const createEvent = async (
  data: Partial<IEvent>
): Promise<IResponse<IEvent>> => {
  return (await api.post("/calendar/events", data)).data;
};

export const updateEvent = async (
  id: string,
  data: Partial<IEvent>
): Promise<IResponse<IEvent>> => {
  return (await api.put(`/calendar/events/${id}`, data)).data;
};

export const deleteEvent = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/calendar/events/${id}`)).data;
};

// Occurrence-level operations for recurring events
export const updateOccurrence = async (
  eventId: string,
  data: Partial<any>,
  mode: "single" | "all" | "future" = "single"
): Promise<IResponse<any>> => {
  // Update single, future, or all occurrences based on mode
  const params = new URLSearchParams();
  params.append("mode", mode);
  const queryString = params.toString();
  const url = `/calendar/events/${eventId}/occurrence?${queryString}`;
  return (await api.put(url, data)).data;
};

export const cancelOccurrence = async (
  eventId: string,
  mode: "single" | "all" | "future" = "single"
): Promise<IResponse<null>> => {
  // Delete single or all occurrences in series based on mode
  const params = new URLSearchParams();
  params.append("mode", mode);
  const queryString = params.toString();
  const url = `/calendar/events/${eventId}/occurrence?${queryString}`;
  return (await api.delete(url)).data;
};

