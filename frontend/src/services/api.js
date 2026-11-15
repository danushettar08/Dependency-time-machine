import axios from "axios";

// Backend API configuration
const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
    timeout: 120000,
});


// Upload dependency file and analyze risks
export async function analyzeDependencies(file) {

    try {

        const formData = new FormData();

        formData.append("file", file);

        const response = await API.post(
            "/api/dependencies/analyze-risks",
            formData
        );

        return response.data;

    } catch (error) {

        console.error("Dependency Analysis Error:", error);

        if (error.response) {

            throw new Error(
                error.response.data.detail ||
                "Backend could not analyze the dependency file."
            );

        }

        if (error.request) {

            throw new Error(
                "Cannot connect to the backend. Check whether FastAPI is running."
            );

        }

        throw new Error(error.message || "Something went wrong.");

    }

}


// Check backend health
export async function checkBackendHealth() {

    try {

        const response = await API.get("/health");

        return response.data;

    } catch (error) {

        console.error("Backend Health Error:", error);

        throw new Error("Backend is not responding.");

    }

}


export default API;