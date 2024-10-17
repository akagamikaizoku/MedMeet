'use server'

import { ID, Query } from "node-appwrite";
import { APPOINTMENT_COLLECTION_ID, DATABASE_ID, databases, messaging } from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";
import App from "next/app";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";

export const createAppointment = async (appointment: CreateAppointmentParams) => {
    try {
        const newAppoitment = await databases.createDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            ID.unique(),
            appointment
        );

        return parseStringify(newAppoitment);
    } catch (error) {
        console.log(error);
    }
}

export const getAppointment = async (appointmentId: string) => {
    try {
        const appointment = await databases.getDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointmentId,
        );

        revalidatePath('/admin');
        return parseStringify(appointment);
    } catch (error) {
        console.log(error);
    }
}

export const getRecentAppointmentList = async () => {
    try {
        const appointments = await databases.listDocuments(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            [Query.orderDesc('$createdAt')]
        );

        const initialCounts = {
            scheduledCount: 0,
            pendingCount: 0,
            cancelledCount: 0,
        }

        const counts = (appointments.documents as Appointment[]).reduce((acc, appointment) => {
            if (appointment.status === 'scheduled') {
                acc.scheduledCount +=1;
            } else if (appointment.status === 'pending') {
                acc.pendingCount +=1;
            } else if (appointment.status === 'cancelled') {
                acc.cancelledCount +=1;
            }

            return acc;
        }, initialCounts);

        const data = {
            totalCount: appointments.total,
            ...counts,
            documents: appointments.documents
        }
        revalidatePath('/admin');

        return parseStringify(data);
    } catch (error) {
        console.log(error);
    }
}

export const updateAppointment = async ({ appointmentId, userId, appointment, type }:
    UpdateAppointmentParams) => {
    try {
        const updatedAppointment = await databases.updateDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointmentId,
            appointment
        );

        if(!updatedAppointment) {
            throw new Error('Appointment not found');
        }

        // const smsMessage = `
        //     Hi, it's MedMeet team.
        //     ${type === 'schedule' 
        //         ? `Your appointment has been scheduled ${formatDateTime(appointment.schedule!).dateTime} with Dr. ${appointment.primaryPhysician}.`
        //         : `We regret to inform you that your appointment has been cancelled. Reason for the cancellation: ${appointment.cancellationReason}`}.
        // `;

        // await sendSMSNotification(userId, smsMessage);
        
        revalidatePath('/admin');
        return parseStringify(updatedAppointment);
    } catch (error) {
        console.log(error);
    }
}

// export const sendSMSNotification = async (userId: string, content: string) => {
//     try {
//         const message = await messaging.createSms(
//             ID.unique(),
//             content,
//             [],
//             [userId]
//         );

//         return parseStringify(message);
//     } catch (error) {
//         console.log(error);
//     }
// }