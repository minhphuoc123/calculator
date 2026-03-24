export class ApiError extends Error {
    status: number;
    details?: string[];

    constructor(message: string, status: number, details?: string[]) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

type ApiFetchOptions = RequestInit & {
    bodyJson?: unknown;
};

type ErrorResponseShape = {
    message?: string;
    errors?: string[];
};

function getErrorMessage(data: unknown, status: number) {
    let message = "Có lỗi xảy ra.";
    let details: string[] | undefined;

    if (typeof data === "object" && data !== null) {
        const errorData = data as ErrorResponseShape;

        if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            details = errorData.errors.map((item) => String(item));
        }

        if (typeof errorData.message === "string" && errorData.message.trim()) {
            message = errorData.message;
        } else if (status === 401) {
            message = "Bạn cần đăng nhập để thực hiện chức năng này.";
        } else if (status === 400 && details && details.length > 0) {
            message = details[0];
        }
    } else if (status === 401) {
        message = "Bạn cần đăng nhập để thực hiện chức năng này.";
    }

    return { message, details };
}

export async function apiFetch<T>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { bodyJson, headers, ...rest } = options;

    const response = await fetch(url, {
        ...rest,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: bodyJson ? JSON.stringify(bodyJson) : rest.body,
    });

    const contentType = response.headers.get("content-type");
    let data: unknown = null;

    if (contentType?.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const { message, details } = getErrorMessage(data, response.status);
        throw new ApiError(message, response.status, details);
    }

    return data as T;
}