import { convex } from "../convex";
import { api } from "../../convex/_generated/api";

export const getAllUsersForNewsEmail = async () => {
    try {
        // This would need to be implemented in Convex
        // For now, return empty array
        console.log('getAllUsersForNewsEmail: Not implemented with Convex yet');
        return [];
    } catch (e) {
        console.error('Error fetching users for news email:', e);
        return [];
    }
}
