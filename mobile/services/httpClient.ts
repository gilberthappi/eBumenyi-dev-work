import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/constants";

const httpClient = axios.create({
	baseURL: API_BASE_URL,
});

httpClient.interceptors.request.use((request) => {
	// ensure headers object exists
	request.headers = request.headers ?? {};
	// AsyncStorage is asynchronous; return a promise that resolves with the request
	return AsyncStorage.getItem("accessToken").then((accessToken) => {
		if (accessToken) {
			request.headers!.Authorization = accessToken;
		}
		if (request.data instanceof FormData) {
			request.headers!["Content-Type"] = "multipart/form-data";
		} else {
			request.headers!["Content-Type"] = "application/json";
		}
		return request;
	}) as any;
});

httpClient.interceptors.response.use(
	(response) => response,
	(error) => {
		return Promise.reject(error);
	},
);

export default httpClient;