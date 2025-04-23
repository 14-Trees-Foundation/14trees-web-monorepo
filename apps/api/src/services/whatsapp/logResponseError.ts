
function logResponseError(error: any) {
    if (error?.response?.data) {
        console.log(JSON.stringify(error.response.data, null, 2));
    }
    else {
        console.log(error);
    }
}

export { logResponseError }