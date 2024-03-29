import axios from "axios";
import {NetworkType} from "./utils";

export let apiKey = "f01c3b182a077d89f75e12d0be947dd4b2e8bc9b1c6c3e933ffd173eb8803bb0";
let network = NetworkType.livenet;
// export let network = NetworkType.testnet;

function createApi(baseURL) {
    const api = axios.create({
        baseURL,
        timeout: 10000,
        headers: {
            "Content-Type": "application/json",
        },
    })

    api.interceptors.request.use((config) => {
        if (!apiKey) {
            throw new Error("input apiKey and reload page");
        }
        config.headers.Authorization = `Bearer ${apiKey}`;
        return config;
    });
    return api;
}

const mainnetApi = createApi("https://open-api.unisat.io");
const testnetApi = createApi("https://open-api-testnet.unisat.io");

function getApi() {
    return network===NetworkType.testnet ? testnetApi : mainnetApi;
}


export const get = async (url, params) => {
    const res = await getApi().get(url, {params});
    if (res.status !== 200) {
        throw new Error(res.statusText);
    }

    const responseData = res.data;

    if (responseData.code !== 0) {
        throw new Error(responseData.msg);
    }
    return responseData.data;
};

export const post = async (url, data) => {
    const res = await getApi().post(url, data,);
    if (res.status !== 200) {
        throw new Error(res.statusText);
    }

    const responseData = res.data;

    if (responseData.code !== 0) {
        throw new Error(responseData.msg);
    }

    return responseData.data;
}